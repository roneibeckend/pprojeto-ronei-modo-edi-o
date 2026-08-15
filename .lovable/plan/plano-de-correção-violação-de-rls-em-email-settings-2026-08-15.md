# Plano de Correção: Violação de RLS em email_settings

Este plano visa resolver o erro "`new row violates row-level security policy for table "email_settings"`" que ocorre durante a atualização ou inserção de configurações de e-mail por administradores.

## Análise do Problema
1.  **Causa Raiz:** A política RLS atual (`Admins can manage email settings`) utiliza a função `has_role(auth.uid(), 'admin')`.
2.  **Conflito de Recursividade/Performance:** Embora a função `has_role` seja `SECURITY DEFINER`, o uso direto de `auth.uid()` e a verificação de permissão durante uma operação de escrita (`ALL`) podem estar causando falhas se o contexto da transação ou a política não permitir a verificação correta da "nova linha" (WITH CHECK).
3.  **Lógica da Aplicação:** O código em `src/lib/resend.functions.ts` usa o cliente `supabase` (padrão do navegador/RLS), o que é correto para a interface administrativa, mas exige que as políticas RLS estejam 100% funcionais.

## Alterações Propostas

### 1. Refatoração da Política RLS
- Remover a política atual que usa `ALL`.
- Criar políticas específicas para `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- Usar uma abordagem mais robusta para a verificação de admin que evite recursividade ou falhas de contexto.

### 2. Garantia de Acesso ao Schema
- Re-executar os `GRANT`s necessários para os papéis `authenticated` e `service_role` na tabela `email_settings`.

### 3. Ajuste na Função de Servidor (Opcional, se RLS persistir)
- Se a correção da RLS via SQL não for suficiente devido a limitações de ambiente, a função `updateEmailSettings` em `src/lib/resend.functions.ts` será modificada para usar `supabaseAdmin` após validar explicitamente o papel de admin do usuário chamador.

## Detalhes Técnicos (SQL)
```sql
-- Remover política problemática
DROP POLICY IF EXISTS "Admins can manage email settings" ON public.email_settings;

-- Criar políticas granulares
CREATE POLICY "Admins can select email settings" 
ON public.email_settings FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email settings" 
ON public.email_settings FOR INSERT 
TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email settings" 
ON public.email_settings FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Garantir privilégios
GRANT ALL ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;
```

## Validação
- Tentar salvar as configurações de e-mail através da interface administrativa `/admin/integracoes`.
- Verificar logs do Supabase para confirmar a ausência de erros de RLS.
