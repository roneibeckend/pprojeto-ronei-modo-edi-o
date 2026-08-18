
-- Adicionar chave estrangeira correta para profiles
ALTER TABLE public.system_logs 
DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.system_logs 
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
