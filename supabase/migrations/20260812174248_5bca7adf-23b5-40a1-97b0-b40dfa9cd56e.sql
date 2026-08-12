-- Seed points for existing profiles to test the ranking
DO $$ 
DECLARE
    v_user1_id UUID := 'ec84815b-72c1-469d-a642-acc1ee16473f'; -- Admin Sócio
    v_user2_id UUID := 'b68a98bc-e586-421d-a4f1-c5fb1606bf2a'; -- newdroidsk88@gmail.com
BEGIN
    -- Award points to User 1
    PERFORM public.award_points(v_user1_id, 150);
    
    -- Award points to User 2
    PERFORM public.award_points(v_user2_id, 85);
END $$;