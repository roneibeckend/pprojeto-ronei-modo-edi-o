
CREATE OR REPLACE FUNCTION public.on_profile_created_send_welcome()
RETURNS trigger AS $$
BEGIN
  -- Esta função é apenas um marcador. O disparo real é feito via aplicação (login.tsx)
  -- para garantir que o Resend SDK tenha acesso às chaves de API injetadas no runtime.
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
