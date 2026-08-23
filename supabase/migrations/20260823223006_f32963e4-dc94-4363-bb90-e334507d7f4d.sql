ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS phone_required_check;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, name, email, phone)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      NULLIF(new.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user falhou para %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$function$;