CREATE TABLE IF NOT EXISTS public.ranking_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    prize_description TEXT NOT NULL,
    rewarded_positions INTEGER[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.ranking_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    points_at_time INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ranking_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_winners ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.ranking_campaigns TO authenticated;
GRANT ALL ON public.ranking_campaigns TO service_role;

GRANT SELECT ON public.campaign_winners TO authenticated;
GRANT ALL ON public.campaign_winners TO service_role;

CREATE POLICY "Allow read access to all authenticated users for campaigns"
ON public.ranking_campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to all authenticated users for winners"
ON public.campaign_winners FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage campaigns"
ON public.ranking_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow admins to manage winners"
ON public.campaign_winners FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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
BEGIN
    SELECT start_date, end_date, rewarded_positions INTO v_start_date, v_end_date, v_positions
    FROM ranking_campaigns WHERE id = _campaign_id;

    INSERT INTO campaign_winners (campaign_id, user_id, position, points_at_time)
    SELECT 
        _campaign_id, 
        r.user_id, 
        r.global_rank, 
        r.total_points
    FROM get_student_ranking_v2(100, v_start_date, v_end_date) r
    WHERE r.global_rank = ANY(v_positions);

    UPDATE ranking_campaigns SET is_active = false WHERE id = _campaign_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finish_ranking_campaign(UUID) TO authenticated;