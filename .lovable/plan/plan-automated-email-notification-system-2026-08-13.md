# Plan: Automated Email Notification System

Implement a comprehensive automated email system using Resend for administrative and user lifecycle events.

## User Review Required

> [!IMPORTANT]
> The system requires a Resend API Key to be configured in **Admin > Integrations > Email**. 

- Should we use the platform's default sender or require the user to configure their own domain in Resend immediately? (Default: Fallback to platform sender).
- Do you have specific branding requirements for the HTML templates beyond the "Fire/Gold" theme already in use?

## Proposed Changes

### Database & Security
- Add `email_templates` table to store customizable templates.
- Update RLS on `integrations` to ensure Resend credentials are secure.
- Ensure `email_logs` exists for tracking.

### Backend (Server Functions)
- **`src/lib/resend.server.ts`**:
    - Enhance `sendResendEmail` to support template-based rendering using Handlebars-style variable replacement.
    - Implement a centralized `triggerEmailEvent(event: string, recipient: string, data: any)` helper.
- **Webhook Integration**:
    - Update `src/routes/api/public/webhooks/asaas.ts` to use the new template system for "Payment Confirmed" and "Content Delivery" notifications.
- **Auth Integration**:
    - Implement a server-side trigger (or Supabase Auth Hook if applicable) for "New Account" welcome emails.

### Frontend (Admin Panel)
- **`src/routes/admin.integracoes.tsx`**:
    - Complete the "Email Templates" tab functionality (Create, Edit, Delete).
    - Add a "Test Email" feature to send a preview to the admin's address.

### Email Templates to be Created
1. `welcome`: Sent on account creation.
2. `password_reset`: Mapped to auth reset requests.
3. `payment_confirmed`: General payment success.
4. `course_access`: Specific to course enrollment.
5. `ebook_access`: Specific to ebook enrollment.

## technical Details
- Use `mustache` or a simple regex-based replacement for template variables.
- Standardize on a responsive HTML layout with the project's signature orange/black aesthetic.
- Ensure all emails have a plain-text fallback.
- Implement idempotency keys for transaction-critical emails (e.g., access delivery).
