
CREATE OR REPLACE FUNCTION public.get_student_ranking_v2(
  p_limit integer DEFAULT 50,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(user_id uuid, name text, avatar_url text, total_points integer, global_rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH scored AS (
    SELECT
      p.id AS user_id,
      COALESCE(
        p.name, 
        'Aluno #' || substring(p.id::text, 1, 4)
      ) AS name,
      p.avatar_url,
      CASE
        WHEN p_start_date IS NULL AND p_end_date IS NULL
          THEN COALESCE(us.total_points, 0)
        ELSE COALESCE((
          SELECT SUM(pt.points_awarded)
          FROM public.progress_tracking pt
          WHERE pt.user_id = p.id
            AND pt.completed_at IS NOT NULL
            AND (p_start_date IS NULL OR pt.completed_at >= p_start_date)
            AND (p_end_date IS NULL OR pt.completed_at <= p_end_date)
        ), 0)
      END::integer AS total_points
    FROM public.profiles p
    LEFT JOIN public.user_stats us ON us.user_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role
    )
  )
  SELECT
    s.user_id,
    s.name,
    s.avatar_url,
    s.total_points,
    dense_rank() OVER (ORDER BY s.total_points DESC) AS global_rank
  FROM scored s
  ORDER BY s.total_points DESC
  LIMIT COALESCE(p_limit, 50)
$$;

GRANT EXECUTE ON FUNCTION public.get_student_ranking_v2(integer, timestamptz, timestamptz) TO authenticated, service_role;
