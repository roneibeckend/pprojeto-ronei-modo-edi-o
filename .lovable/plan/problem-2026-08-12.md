---
name: Fix Asaas Connection Refused
description: Investigate and fix connection refused error when loading Asaas payment links in a modal iframe.
type: feature
---

## Problem
Users report "Connection Refused" when opening the Asaas payment modal. This usually happens due to:
1. Environment mismatch (Production API key used with Sandbox URL or vice versa).
2. Domain mismatch (Asaas production is `www.asaas.com`, sandbox is `sandbox.asaas.com`).
3. Missing or incorrect headers.

## Proposed Changes

### 1. Robust Environment Detection
- Enhance `src/lib/asaas.functions.ts` to strictly validate the API key prefix.
- Asaas keys starting with `$aact_prod_` MUST use `https://www.asaas.com/api/v3`.
- Asaas keys starting with `$aact_test_` or similar sandbox prefixes MUST use `https://sandbox.asaas.com/api/v3`.

### 2. Header and URL Audit
- Ensure `User-Agent` is present in all requests (already implemented, but worth double-checking).
- Verify the generated `paymentLink` URL returned by the server function. If the server function successfully creates the link, "Connection Refused" in the iframe usually means the browser is blocking the request or the URL itself is invalid/wrong domain.

### 3. Error Logging and Diagnostic UI
- Add more granular logging in `src/lib/asaas.functions.ts` to capture the exact URL being called and the response from Asaas.
- Update the `AsaasPaymentModal` to show a descriptive error if the `paymentUrl` is missing or fails to load.

## Technical Details
- File: `src/lib/asaas.functions.ts`
- File: `src/components/platform/AsaasPaymentModal.tsx`
- File: `src/lib/integrations.functions.ts` (for the test connection logic)
