CREATE OR REPLACE VIEW public.student_ranking AS
SELECT 
    p.id AS user_id,
    p.name,
    p.avatar_url,
    us.total_points,
    DENSE_RANK() OVER (ORDER BY us.total_points DESC) AS global_rank
FROM public.profiles p
JOIN public.user_stats us ON p.id = us.user_id
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE (ur.role IS NULL OR ur.role != 'admin')
ORDER BY us.total_points DESC;

GRANT SELECT ON public.student_ranking TO authenticated;
GRANT SELECT ON public.student_ranking TO service_role;
GRANT SELECT ON public.student_ranking TO anon;
