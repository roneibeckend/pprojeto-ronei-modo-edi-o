-- Create user_stats table to store points and calculated fields
CREATE TABLE public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0 NOT NULL,
    rank INTEGER,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all stats" ON public.user_stats
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own stats" ON public.user_stats
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Record module/course start and completion times
CREATE TABLE public.progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('module', 'course', 'ebook_module', 'ebook')),
    item_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    points_awarded INTEGER DEFAULT 0,
    UNIQUE (user_id, item_type, item_id)
);

GRANT SELECT, INSERT, UPDATE ON public.progress_tracking TO authenticated;
GRANT ALL ON public.progress_tracking TO service_role;

ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracking" ON public.progress_tracking
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to award points
CREATE OR REPLACE FUNCTION public.award_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, total_points)
    VALUES (p_user_id, p_points)
    ON CONFLICT (user_id) DO UPDATE
    SET total_points = public.user_stats.total_points + p_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle module completion points
CREATE OR REPLACE FUNCTION public.handle_item_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTERVAL;
    v_points INTEGER := 0;
    v_base_points INTEGER := 0;
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        v_duration := NEW.completed_at - NEW.started_at;
        
        CASE NEW.item_type
            WHEN 'module' THEN v_base_points := 10;
            WHEN 'ebook_module' THEN v_base_points := 10;
            WHEN 'course' THEN v_base_points := 50;
            WHEN 'ebook' THEN v_base_points := 50;
        END CASE;

        v_points := v_base_points;

        -- Speed bonus
        IF v_duration < INTERVAL '24 hours' THEN
            v_points := v_points + (v_base_points / 2);
        ELSIF v_duration < INTERVAL '48 hours' THEN
            v_points := v_points + (v_base_points / 4);
        END IF;

        NEW.points_awarded := v_points;
        PERFORM public.award_points(NEW.user_id, v_points);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_item_completion
    BEFORE UPDATE ON public.progress_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_item_completion();

-- View for Global Ranking
CREATE OR REPLACE VIEW public.student_ranking AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    us.total_points,
    DENSE_RANK() OVER (ORDER BY us.total_points DESC) as global_rank
FROM public.profiles p
JOIN public.user_stats us ON p.id = us.user_id
ORDER BY us.total_points DESC;

GRANT SELECT ON public.student_ranking TO authenticated;
