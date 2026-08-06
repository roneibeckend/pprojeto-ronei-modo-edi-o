---
name: Integration Center Transformation
description: Comprehensive plan to transform the Integrations screen into a robust, centralized management panel with webhooks, manual credential editing, step-by-step guides, and detailed connection testing.
type: feature
---

# Plan: Integration Center Transformation

Transform `src/routes/admin.integracoes.tsx` into a high-end management panel (inspired by Supabase/Stripe) that centralizes all operations, documentation, and monitoring.

## 1. Database & Backend Enhancements
- **Schema Update**: Ensure the `integrations` table supports all required credential fields (API Key, Secret, Tokens, IDs, etc.) in its JSONB columns.
- **Webhook Registry**: While webhooks are often static routes, we'll display them dynamically.
- **Server Functions**:
  - Enhance `testAIConnection` and add `testPaymentConnection` to return detailed metadata (Response code, Response body, latency, etc.).
  - Implement a `getIntegrationHistory` server function to fetch audit logs from `integration_logs`.

## 2. UI/UX Overhaul (`src/routes/admin.integracoes.tsx`)
- **Structure**:
  - Use a sidebar or top-level tabs to navigate between Integration Categories (AI, Payments, Notifications).
  - Individual Detail View for each integration (no hidden info).
- **Manual Configuration Interface**:
  - Replace the simple modal with a dedicated "Settings" section for each integration.
  - Implement "Edit", "Save", "Cancel", and "Restore" (reset to default) actions for all fields.
  - Support a wide range of fields: API Key, Secret Key, Client ID, Org ID, Project ID, Environment (Sandbox/Prod), Base URL, etc.
- **Webhook Section**:
  - Dedicated "Webhooks" tab displaying system endpoints (MercadoPago, Asaas, Stripe, OpenAI, etc.).
  - "Copy" button for individual URLs and a "Copy All" button.
- **Step-by-Step Documentation ("Como configurar")**:
  - Integrated "How-to" guide for every provider directly inside its configuration area.
- **Status Indicators**:
  - Clear visual badges: ✅ Configured, ⚠ Incomplete, ❌ Not Configured.
  - Automatic validation logic on page load/render.
- **Advanced Connection Testing**:
  - Expand the test UI to show HTTP code, authentication status, endpoint, environment, timestamp, and raw API response.

## 3. Implementation Steps
- **Step 1: Database Migration**: Add necessary default integrations and ensure the `integration_logs` table has the required audit fields (user_id, etc.).
- **Step 2: Component Refactoring**:
  - Create a new `IntegrationCard` and `IntegrationDetail` component.
  - Implement the Webhook list component.
- **Step 3: Logic Implementation**:
  - Update `testAIConnection` and add payment testing logic.
  - Implement the "status validation" logic (checking for required keys in JSONB).
- **Step 4: Audit & Verification**:
  - Run Playwright tests to ensure credential saving and testing works.
  - Verify webhook copying functionality.

## 4. Documentation Strategy
- Create a data structure for guides (Step 1, Step 2...) for each provider (OpenAI, Stripe, Asaas, etc.).
