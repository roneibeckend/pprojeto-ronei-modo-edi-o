---
name: Admin Enhancements (Non-IA Uploads & Live Classes)
description: Plan to add manual course/ebook upload capabilities and a "Live Classes" management section to the admin area.
type: feature
---

# Plan - Admin Enhancements

Enable manual content uploads (non-IA) and a live class management system in the admin dashboard.

## 1. Database Schema
- Create `public.live_classes` table:
    - `id` (uuid, primary key)
    - `title` (text)
    - `description` (text)
    - `scheduled_at` (timestamp)
    - `link` (text)
    - `materials_url` (text)
    - `status` (enum: 'scheduled', 'live', 'completed')
- Add `is_ai_generated` (boolean, default false) and `content_url` (text) to `public.courses` and `public.ebooks` (if they exist as tables, otherwise we'll work with `platform-data.ts` or new tables).
- Apply RLS and GRANTS for admins.

## 2. Routes & Navigation
- Create `src/routes/app.admin.conteudo.tsx`: Main hub for managing courses and ebooks (Non-IA).
- Create `src/routes/app.admin.ao-vivo.tsx`: Management for "Aulas ao Vivo".
- Update `src/routes/app.admin.tsx` and `src/components/platform/Shell.tsx` to include new menu items.

## 3. Implementation Details
- **Non-IA Content**:
    - Build a form for manual metadata entry (Title, Desc, Teacher, Price).
    - Add file/image upload support (simulated or using Supabase Storage if enabled).
    - Keep "IA Generator" as a distinct alternative.
- **Live Classes**:
    - CRUD interface in the admin panel.
    - Status management (Scheduled/Live/Completed).
    - Integration with the student view (new "Ao Vivo" section for students).

## 4. Verification
- Verify navigation to new admin routes.
- Mock data persistence or real Supabase writes.
- UI responsiveness and consistency.
