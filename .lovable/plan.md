---
name: WhatsApp QR Code Connection
description: Infrastructure for connecting WhatsApp via QR Code for report sending.
type: feature
---

## Implementation Plan: WhatsApp QR Code for Reports

### 1. Database & Security (Supabase)
- **Table `whatsapp_instances`**:
  - `id`: uuid (primary key)
  - `status`: text ('disconnected', 'connecting', 'connected')
  - `qr_code`: text (base64 or string)
  - `session_data`: jsonb (to store credentials if needed)
  - `last_connected_at`: timestamptz
- **RLS**: Policies to ensure only `admin` role can manage instances.

### 2. Backend Logic (TanStack Server Routes)
- **`/api/public/whatsapp/connector`**:
  - A server route to handle WhatsApp connection logic.
  - Generates QR code using a compatible library (like `whatsapp-web.js` or a mock for this environment if native binaries are restricted).
  - *Correction*: Cloudflare Workers have restrictions on native binaries (puppeteer/sharp). We should use a Web API-based approach or a managed service if available. Since this is a Lovable project, we will implement a simulated/mockable connector that stores the QR in the DB for the UI to pick up, or use a pure JS implementation if possible.
  - *Refined Approach*: Create a server function `getWhatsAppQRCode` that triggers the session generation and returns a status/QR.

### 3. Frontend UI (`src/routes/admin.relatorios.tsx`)
- Add a "Conexão WhatsApp" section.
- Display status (Connected/Disconnected).
- "Conectar Novo WhatsApp" button to trigger QR generation.
- QR Code display with auto-refresh/polling.

### 4. Integration
- Update the report sending logic to use the connected WhatsApp instance instead of a generic simulated sender.
