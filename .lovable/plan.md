# Plan: Automated Financial Management and Asaas Tax Integration

Objective: Make "Receita Bruta" (Gross Revenue) read-only and automatically calculated based on real transaction data, deducting Asaas taxes to ensure data integrity.

## User Review Required

> [!IMPORTANT]
> To calculate the **net revenue** automatically, I need to know the exact Asaas fee percentage or fixed value per transaction you use (e.g., 2.99% + R$ 0,50). 
> 
> Also, I will be creating a `payments` table to store all transaction history. This table will be populated via the Asaas webhook.

## Proposed Changes

### 1. Database Schema
- Create a `payments` table to store detailed transaction records (amount, net_amount, fee, status, Asaas ID).
- Add a `total_revenue` column to `financial_settings` (optional, or we calculate on the fly).
- Add Asaas fee configuration to the `integrations` settings for the `asaas` category.

### 2. Backend (TanStack Start + Supabase)
- **Webhook Update (`src/routes/api/public/webhooks/asaas.ts`):** Modify the webhook to record every confirmed payment in the new `payments` table, calculating the `net_amount` based on the configured Asaas fees.
- **Server Function:** Create a `getFinancialSummary` function to calculate the total net revenue from the `payments` table.

### 3. Frontend (Admin Panel)
- **Finance Page (`src/routes/admin.financeiro.tsx`):**
    - Change the "Receita Bruta" field to be **read-only**.
    - Implement a loader to fetch the automatically calculated revenue from the backend.
    - Add a visual indicator that this value is synced with Asaas.
    - Update the summary cards to reflect real-time data.

## Technical Details

- **Table Creation:**
```sql
CREATE TABLE public.payments (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    user_id uuid references auth.users(id),
    amount numeric(12,2) not null,
    net_amount numeric(12,2) not null,
    fee numeric(12,2) not null,
    status text not null,
    created_at timestamp with time zone default now()
);
```
- **Tax Logic:** The `net_amount` will be `amount - (amount * fee_percent) - fixed_fee`.
- **Integrations:** I will use the existing `asaas` integration credentials to fetch and validate data.

## Verification Plan

- **Automated Tests:** Verify the `payments` insertion logic via a simulated webhook call.
- **Manual Verification:** 
    - Check if the "Receita Bruta" field in `/admin/financeiro` is non-editable.
    - Verify if new "confirmed" payments in the database reflect in the UI total.
