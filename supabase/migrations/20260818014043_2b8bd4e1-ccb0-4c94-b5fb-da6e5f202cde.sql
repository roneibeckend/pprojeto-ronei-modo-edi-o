-- 1. Atualizar o gatilho para incluir o telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$function$;

-- 2. Garantir que registros futuros exijam telefone
-- Nota: Não aplicamos NOT NULL imediatamente para evitar quebrar usuários existentes sem telefone.
-- Em vez disso, validamos no frontend e podemos aplicar uma constraint para registros futuros se necessário.
-- Mas a instrução diz "Tornar o campo de número de telefone obrigatório", então vamos aplicar a regra.

-- Primeiro, limpamos ou preenchemos o que for necessário para não quebrar a migração em bases existentes
-- Se houver perfis sem telefone, eles poderiam bloquear a constraint NOT NULL.
-- Como é um projeto em desenvolvimento/produção, seremos cautelosos.

-- ALTER TABLE public.profiles ALTER COLUMN phone SET NOT NULL; -- Seria o ideal, mas arriscado.
-- Vamos usar um CHECK para garantir que novos inserts tenham telefone.
ALTER TABLE public.profiles ADD CONSTRAINT phone_required_check CHECK (phone IS NOT NULL OR created_at < '2026-08-18 00:00:00');
