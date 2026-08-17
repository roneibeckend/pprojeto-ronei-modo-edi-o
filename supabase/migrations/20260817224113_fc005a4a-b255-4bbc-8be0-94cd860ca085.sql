-- Final cleanup of QA users and related data
-- This is part of the "VALIDAÇÃO FINAL PÓS-LIMPEZA"

-- 1. Remove QA enrollments first to avoid foreign key issues
DELETE FROM public.course_enrollments 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

DELETE FROM public.ebook_enrollments 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

-- 2. Remove QA progress
DELETE FROM public.lesson_progress 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

-- 3. Remove QA roles
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

-- 4. Remove QA profiles
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

-- 5. Remove auth users
DELETE FROM auth.users 
WHERE email ILIKE '%qa%' OR email ILIKE '%test%';

-- 6. Remove orphaned pending checkouts (QA)
DELETE FROM public.pending_checkouts 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');

-- 7. Remove QA tickets
DELETE FROM public.support_tickets 
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%qa%' OR email ILIKE '%test%');