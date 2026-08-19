-- 1. Reforçar RLS para ranking_campaigns
DO $$ 
BEGIN
    -- Remover políticas antigas se existirem para evitar conflitos
    DROP POLICY IF EXISTS "Allow read access to all authenticated users for campaigns" ON public.ranking_campaigns;
    DROP POLICY IF EXISTS "Allow admins to manage campaigns" ON public.ranking_campaigns;
END $$;

ALTER TABLE public.ranking_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_campaigns_read_policy" 
ON public.ranking_campaigns FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "ranking_campaigns_admin_policy" 
ON public.ranking_campaigns FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Reforçar RLS para campaign_winners
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow read access to all authenticated users for winners" ON public.campaign_winners;
    DROP POLICY IF EXISTS "Allow admins to manage winners" ON public.campaign_winners;
END $$;

ALTER TABLE public.campaign_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_winners_read_policy" 
ON public.campaign_winners FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "campaign_winners_admin_policy" 
ON public.campaign_winners FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Garantir GRANTs para tabelas de ranking
GRANT SELECT ON public.ranking_campaigns TO authenticated;
GRANT ALL ON public.ranking_campaigns TO service_role;
GRANT SELECT ON public.campaign_winners TO authenticated;
GRANT ALL ON public.campaign_winners TO service_role;

-- 4. Refinar get_student_ranking_v2 para lidar com privacidade e filtros
CREATE OR REPLACE FUNCTION public.get_student_ranking_v2(
  p_limit integer DEFAULT 50,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(user_id uuid, name text, avatar_url text, total_points integer, global_rank bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      p.id AS u_id,
      CASE 
        WHEN public.has_role(auth.uid(), 'admin') THEN COALESCE(p.name, 'Aluno #' || substring(p.id::text, 1, 4))
        ELSE COALESCE(p.name, 'Aluno #' || substring(p.id::text, 1, 4))
      END AS u_name,
      p.avatar_url AS u_avatar,
      CASE
        WHEN p_start_date IS NULL AND p_end_date IS NULL
          THEN COALESCE(us.total_points, 0)
        ELSE COALESCE((
          SELECT SUM(pt.points_awarded)::integer
          FROM public.progress_tracking pt
          WHERE pt.user_id = p.id
            AND pt.completed_at IS NOT NULL
            AND (p_start_date IS NULL OR pt.completed_at >= p_start_date)
            AND (p_end_date IS NULL OR pt.completed_at <= p_end_date)
        ), 0)
      END AS u_points
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON us.user_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
    )
  )
  SELECT
    s.u_id,
    s.u_name,
    s.u_avatar,
    s.u_points,
    dense_rank() OVER (ORDER BY s.u_points DESC) AS g_rank
  FROM scored s
  ORDER BY s.u_points DESC
  LIMIT COALESCE(p_limit, 50);
END;
$$;

-- 5. Garantir que a função finish_ranking_campaign seja robusta
CREATE OR REPLACE FUNCTION public.finish_ranking_campaign(_campaign_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
    v_positions INTEGER[];
    v_is_active BOOLEAN;
BEGIN
    -- Validar se o chamador é admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT start_date, end_date, rewarded_positions, is_active 
    INTO v_start_date, v_end_date, v_positions, v_is_active
    FROM ranking_campaigns WHERE id = _campaign_id;

    IF v_is_active IS NULL OR NOT v_is_active THEN
        RAISE EXCEPTION 'Campanha já encerrada ou inexistente';
    END IF;

    -- Registrar vencedores
    INSERT INTO campaign_winners (campaign_id, user_id, position, points_at_time)
    SELECT 
        _campaign_id, 
        r.user_id, 
        r.global_rank::integer, 
        r.total_points
    FROM get_student_ranking_v2(100, v_start_date, v_end_date) r
    WHERE r.global_rank = ANY(v_positions);

    -- Desativar campanha
    UPDATE ranking_campaigns SET is_active = false, updated_at = now() WHERE id = _campaign_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finish_ranking_campaign(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) TO authenticated, service_role;
