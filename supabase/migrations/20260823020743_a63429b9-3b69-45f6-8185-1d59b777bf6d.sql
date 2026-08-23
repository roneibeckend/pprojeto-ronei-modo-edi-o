-- 1. Novo status 'cancelled'
ALTER TYPE public.payout_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Novas colunas de compliance em payout_requests
ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS document_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.payout_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.payout_requests(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payout_audit_log TO authenticated;
GRANT ALL ON public.payout_audit_log TO service_role;

ALTER TABLE public.payout_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payout audit log"
  ON public.payout_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- 4. Proteção: usuário comum não consegue injetar status/campos privilegiados no insert direto
CREATE OR REPLACE FUNCTION public.protect_payout_insert_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin')) THEN
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.admin_notes := NULL;
    NEW.asaas_payment_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_payout_insert ON public.payout_requests;
CREATE TRIGGER trg_protect_payout_insert
  BEFORE INSERT ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_payout_insert_fields();

-- 5. Policies do bucket privado identity-documents
DROP POLICY IF EXISTS "Users upload own identity documents" ON storage.objects;
CREATE POLICY "Users upload own identity documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users read own identity documents" ON storage.objects;
CREATE POLICY "Users read own identity documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins read all identity documents" ON storage.objects;
CREATE POLICY "Admins read all identity documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-documents' AND public.has_role(auth.uid(), 'admin'));

-- 6. Solicitação de saque atômica (trava saldo, anti-concorrência, exige documento no 1º saque)
CREATE OR REPLACE FUNCTION public.request_payout_atomic(
  p_amount numeric,
  p_method text,
  p_pix_key text,
  p_user_type text,
  p_document_url text DEFAULT NULL,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance numeric;
  v_payout_id uuid;
  v_has_prior_doc boolean;
  v_open_count int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido.'; END IF;
  IF p_amount < 50 THEN RAISE EXCEPTION 'O valor mínimo para saque é R$ 50,00.'; END IF;
  IF p_pix_key IS NULL OR length(trim(p_pix_key)) < 5 THEN RAISE EXCEPTION 'Informe uma chave PIX válida.'; END IF;
  IF p_user_type NOT IN ('affiliate','partner') THEN RAISE EXCEPTION 'Tipo de usuário inválido.'; END IF;

  SELECT count(*) INTO v_open_count FROM public.payout_requests
   WHERE user_id = v_user AND status IN ('pending','analyzing','approved');
  IF v_open_count > 0 THEN
    RAISE EXCEPTION 'Você já possui uma solicitação de saque em andamento. Aguarde a conclusão antes de solicitar outro.';
  END IF;

  IF p_user_type = 'partner' THEN
    SELECT balance INTO v_balance FROM public.partner_balances WHERE user_id = v_user FOR UPDATE;
    IF v_balance IS NULL THEN RAISE EXCEPTION 'Saldo de sócio não encontrado.'; END IF;
    IF v_balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente para este saque.'; END IF;
    UPDATE public.partner_balances SET balance = balance - p_amount, updated_at = now() WHERE user_id = v_user;
  ELSE
    SELECT balance INTO v_balance FROM public.affiliates WHERE id = v_user FOR UPDATE;
    IF v_balance IS NULL THEN RAISE EXCEPTION 'Conta de afiliado não encontrada.'; END IF;
    IF v_balance < p_amount THEN RAISE EXCEPTION 'Saldo insuficiente para este saque.'; END IF;
    UPDATE public.affiliates SET balance = balance - p_amount, updated_at = now() WHERE id = v_user;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.payout_requests
    WHERE user_id = v_user AND document_url IS NOT NULL
  ) INTO v_has_prior_doc;

  IF NOT v_has_prior_doc AND p_document_url IS NULL THEN
    RAISE EXCEPTION 'Para o primeiro saque é obrigatório enviar um documento de identidade com foto (RG, CNH ou CIN).';
  END IF;

  INSERT INTO public.payout_requests (
    user_id, amount, method, pix_key, status, metadata,
    document_url, document_status, document_uploaded_at, ip_address, user_agent
  ) VALUES (
    v_user, p_amount, p_method, trim(p_pix_key), 'pending',
    jsonb_build_object('user_type', p_user_type),
    p_document_url,
    CASE WHEN p_document_url IS NOT NULL THEN 'pending' ELSE 'none' END,
    CASE WHEN p_document_url IS NOT NULL THEN now() ELSE NULL END,
    p_ip, p_user_agent
  ) RETURNING id INTO v_payout_id;

  INSERT INTO public.payout_audit_log (payout_id, actor_id, action, details)
  VALUES (v_payout_id, v_user, 'created', jsonb_build_object(
    'amount', p_amount, 'method', p_method, 'user_type', p_user_type,
    'ip', p_ip, 'user_agent', p_user_agent, 'document_uploaded', p_document_url IS NOT NULL
  ));

  RETURN v_payout_id;
END;
$$;

-- 7. Cancelamento pelo próprio usuário (somente enquanto pendente) com estorno
CREATE OR REPLACE FUNCTION public.cancel_payout(p_payout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_payout public.payout_requests%rowtype;
  v_user_type text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT * INTO v_payout FROM public.payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;
  IF v_payout.user_id <> v_user THEN RAISE EXCEPTION 'Você só pode cancelar suas próprias solicitações.'; END IF;
  IF v_payout.status <> 'pending' THEN RAISE EXCEPTION 'Somente saques pendentes podem ser cancelados.'; END IF;

  v_user_type := coalesce(v_payout.metadata->>'user_type', 'affiliate');
  IF v_user_type = 'partner' THEN
    UPDATE public.partner_balances SET balance = balance + v_payout.amount, updated_at = now() WHERE user_id = v_user;
  ELSE
    UPDATE public.affiliates SET balance = balance + v_payout.amount, updated_at = now() WHERE id = v_user;
  END IF;

  UPDATE public.payout_requests SET status = 'cancelled', updated_at = now() WHERE id = p_payout_id;

  INSERT INTO public.payout_audit_log (payout_id, actor_id, action, details)
  VALUES (p_payout_id, v_user, 'cancelled_by_user', jsonb_build_object('amount', v_payout.amount));
END;
$$;

-- 8. Mudança de status pelo admin (com estorno em recusa/cancelamento)
CREATE OR REPLACE FUNCTION public.admin_set_payout_status(
  p_payout_id uuid,
  p_status public.payout_status,
  p_notes text DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_payout public.payout_requests%rowtype;
  v_user_type text;
BEGIN
  IF v_admin IS NULL OR NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  SELECT * INTO v_payout FROM public.payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;
  IF v_payout.status = 'paid' THEN RAISE EXCEPTION 'Este saque já foi pago e não pode ser alterado.'; END IF;

  IF v_payout.status = p_status THEN
    RETURN jsonb_build_object('success', true, 'unchanged', true, 'user_id', v_payout.user_id, 'amount', v_payout.amount);
  END IF;

  v_user_type := coalesce(v_payout.metadata->>'user_type', 'affiliate');

  IF p_status IN ('rejected','cancelled') AND v_payout.status NOT IN ('rejected','cancelled') THEN
    IF v_user_type = 'partner' THEN
      UPDATE public.partner_balances SET balance = balance + v_payout.amount, updated_at = now() WHERE user_id = v_payout.user_id;
    ELSE
      UPDATE public.affiliates SET balance = balance + v_payout.amount, updated_at = now() WHERE id = v_payout.user_id;
    END IF;
  END IF;

  UPDATE public.payout_requests SET
    status = p_status,
    reviewed_by = v_admin,
    reviewed_at = now(),
    admin_notes = coalesce(p_notes, admin_notes),
    rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE rejection_reason END,
    updated_at = now()
  WHERE id = p_payout_id;

  INSERT INTO public.payout_audit_log (payout_id, actor_id, action, details)
  VALUES (p_payout_id, v_admin, 'status_changed', jsonb_build_object(
    'from', v_payout.status, 'to', p_status, 'notes', p_notes, 'rejection_reason', p_rejection_reason
  ));

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_payout.user_id,
    'amount', v_payout.amount,
    'pix_key', v_payout.pix_key,
    'user_type', v_user_type,
    'previous_status', v_payout.status
  );
END;
$$;

-- 9. Solicitar nova documentação (admin)
CREATE OR REPLACE FUNCTION public.admin_request_payout_document(p_payout_id uuid, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL OR NOT public.has_role(v_admin, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  UPDATE public.payout_requests SET
    document_status = 'rerequested',
    admin_notes = coalesce(p_notes, admin_notes),
    updated_at = now()
  WHERE id = p_payout_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;

  INSERT INTO public.payout_audit_log (payout_id, actor_id, action, details)
  VALUES (p_payout_id, v_admin, 'document_rerequested', jsonb_build_object('notes', p_notes));
END;
$$;

-- 10. Templates de e-mail do fluxo de saques
INSERT INTO public.email_templates (name, subject, content_html, content_text, description, variables) VALUES
('saque_solicitado',
 'Recebemos sua solicitação de saque',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#ff6a00;font-size:22px">Solicitação de saque recebida</h1>
  <p>Olá, <strong>{{name}}</strong>!</p>
  <p>Recebemos sua solicitação de saque e ela já está na fila de análise da nossa equipe.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#999">Valor solicitado</td><td style="padding:8px 0;text-align:right;font-weight:bold">R$ {{amount}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Chave PIX</td><td style="padding:8px 0;text-align:right">{{pix_key}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Data da solicitação</td><td style="padding:8px 0;text-align:right">{{date}}</td></tr>
  </table>
  <p style="color:#999;font-size:13px">Por segurança e conformidade financeira, os saques são analisados manualmente. Após a aprovação, o pagamento é realizado em até 4 horas úteis para a chave PIX cadastrada.</p>
  <p style="margin-top:24px">Obrigado por fazer parte da nossa plataforma!</p>
</div>',
 'Olá {{name}}, recebemos sua solicitação de saque de R$ {{amount}} para a chave PIX {{pix_key}} em {{date}}. Após aprovação, o pagamento é feito em até 4 horas úteis.',
 'Enviado ao afiliado/sócio quando um saque é solicitado',
 '{"name": "Nome do usuário", "amount": "Valor do saque", "pix_key": "Chave PIX", "date": "Data da solicitação"}'::jsonb),
('saque_em_analise',
 'Seu saque está em análise',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#ff6a00;font-size:22px">Saque em análise</h1>
  <p>Olá, <strong>{{name}}</strong>!</p>
  <p>Sua solicitação de saque de <strong>R$ {{amount}}</strong> está sendo verificada pela nossa equipe. Você será avisado assim que houver uma atualização.</p>
  <p style="color:#999;font-size:13px">Este processo existe para proteger sua conta e garantir a conformidade financeira da plataforma.</p>
</div>',
 'Olá {{name}}, seu saque de R$ {{amount}} está em análise pela nossa equipe.',
 'Enviado quando o saque entra em análise',
 '{"name": "Nome do usuário", "amount": "Valor do saque"}'::jsonb),
('saque_aprovado',
 'Seu saque foi aprovado!',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#22c55e;font-size:22px">Saque aprovado</h1>
  <p>Olá, <strong>{{name}}</strong>!</p>
  <p>Sua solicitação de saque de <strong>R$ {{amount}}</strong> foi aprovada. O pagamento será enviado em até 4 horas úteis para a chave PIX <strong>{{pix_key}}</strong>.</p>
  <p style="margin-top:24px">Obrigado pela confiança!</p>
</div>',
 'Olá {{name}}, seu saque de R$ {{amount}} foi aprovado e será enviado em até 4 horas úteis para a chave PIX {{pix_key}}.',
 'Enviado quando o saque é aprovado',
 '{"name": "Nome do usuário", "amount": "Valor do saque", "pix_key": "Chave PIX"}'::jsonb),
('saque_pago',
 'Seu saque foi enviado',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#22c55e;font-size:22px">Pagamento enviado</h1>
  <p>Olá, <strong>{{name}}</strong>!</p>
  <p>Seu saque foi processado com sucesso e o valor foi enviado para sua chave PIX cadastrada.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#999">Valor pago</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#22c55e">R$ {{amount}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Chave PIX utilizada</td><td style="padding:8px 0;text-align:right">{{pix_key}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Data do envio</td><td style="padding:8px 0;text-align:right">{{date}}</td></tr>
  </table>
  <p style="color:#999;font-size:13px">O prazo de compensação depende da sua instituição bancária e geralmente é imediato para PIX.</p>
  <p style="margin-top:24px">Obrigado por fazer parte da nossa plataforma. Conte sempre com a gente!</p>
</div>',
 'Olá {{name}}, seu saque de R$ {{amount}} foi enviado para a chave PIX {{pix_key}} em {{date}}. Obrigado!',
 'Enviado quando o pagamento do saque é confirmado',
 '{"name": "Nome do usuário", "amount": "Valor pago", "pix_key": "Chave PIX", "date": "Data do envio"}'::jsonb),
('saque_recusado',
 'Atualização sobre sua solicitação de saque',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#ef4444;font-size:22px">Saque não aprovado</h1>
  <p>Olá, <strong>{{name}}</strong>!</p>
  <p>Após análise, sua solicitação de saque de <strong>R$ {{amount}}</strong> não pôde ser aprovada neste momento.</p>
  <p style="background:#1a1a1a;padding:16px;border-radius:12px;border-left:3px solid #ef4444"><strong>Motivo:</strong> {{reason}}</p>
  <p style="color:#999;font-size:13px">O valor já foi estornado para o seu saldo na plataforma. Se tiver dúvidas, fale com nosso suporte.</p>
</div>',
 'Olá {{name}}, seu saque de R$ {{amount}} não foi aprovado. Motivo: {{reason}}. O valor foi estornado para seu saldo.',
 'Enviado quando o saque é recusado (motivo configurável pelo admin)',
 '{"name": "Nome do usuário", "amount": "Valor do saque", "reason": "Motivo da recusa"}'::jsonb),
('saque_admin_novo',
 'Novo pedido de saque pendente',
 '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0e0e0e;color:#ffffff;padding:32px;border-radius:16px">
  <h1 style="color:#ff6a00;font-size:22px">Novo pedido de saque</h1>
  <p>Uma nova solicitação de saque aguarda análise:</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#999">Usuário</td><td style="padding:8px 0;text-align:right">{{name}} ({{email}})</td></tr>
    <tr><td style="padding:8px 0;color:#999">Valor</td><td style="padding:8px 0;text-align:right;font-weight:bold">R$ {{amount}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Chave PIX</td><td style="padding:8px 0;text-align:right">{{pix_key}}</td></tr>
    <tr><td style="padding:8px 0;color:#999">Data</td><td style="padding:8px 0;text-align:right">{{date}}</td></tr>
  </table>
  <p><a href="{{link}}" style="display:inline-block;background:#ff6a00;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Analisar solicitação</a></p>
</div>',
 'Novo pedido de saque de {{name}} ({{email}}) no valor de R$ {{amount}}. Acesse {{link}} para analisar.',
 'Alerta enviado aos administradores quando um saque é solicitado',
 '{"name": "Nome do usuário", "email": "E-mail do usuário", "amount": "Valor", "pix_key": "Chave PIX", "date": "Data", "link": "Link para análise"}'::jsonb)
ON CONFLICT (name) DO NOTHING;