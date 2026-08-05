
-- 1. Revogar permissão pública de todas as funções security definer
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_ticket_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) FROM PUBLIC;

-- 2. Garantir permissões apenas para service_role (e authenticated onde necessário)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_ticket_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.save_assistant_response(uuid, text) TO authenticated, service_role;

-- 3. Adicionar uma nova restrição à função save_assistant_response para garantir que o usuário só salve para o próprio ticket
CREATE OR REPLACE FUNCTION public.save_assistant_response(p_ticket_id UUID, p_content TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o ticket pertence ao usuário atual (ou se é service_role)
    IF NOT EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = p_ticket_id 
        AND (user_id = auth.uid() OR auth.role() = 'service_role')
    ) THEN
        RAISE EXCEPTION 'Acesso negado ao ticket';
    END IF;

    INSERT INTO public.support_messages (ticket_id, content, sender_type)
    VALUES (p_ticket_id, p_content, 'assistant');
END;
$$;
