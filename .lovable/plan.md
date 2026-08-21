# Plan for Mobile/PWA Certificate Printing and Sharing

Implement native printing and sharing capabilities for certificates in `src/routes/app.certificados.tsx` to ensure full usability on mobile devices and within PWA environments.

## Proposed Changes

### 1. Unified Sharing Logic
- Implement a `handleShare` function using the `navigator.share` API.
- Fallback to copying the verification link to the clipboard if `navigator.share` is unavailable.

### 2. Native Printing Enhancements
- Improve the `window.print()` flow for mobile browsers.
- Ensure the certificate modal correctly triggers the system print dialog.

### 3. UI Integration
- Update the `CertCard` component buttons to trigger sharing.
- Update the `CertificateModal` toolbar to include functional "Imprimir" and "Compartilhar" buttons for mobile.

## Technical Details

### `src/routes/app.certificados.tsx`
- **Sharing**:
  - Add `handleShare` logic inside `CertCard` and `CertificateModal`.
  - Use `navigator.share` with the course title and the verification URL (`verifica.ronneinaveia.com/{code}`).
- **Printing**:
  - The existing `printStyles` and `window.print()` call are mostly correct but need to ensure the modal content is correctly isolated for mobile print engines.
- **Dependencies**:
  - `lucide-react` for icons (already present).
  - `html2canvas` and `jspdf` (already present for PDF download).

## Implementation Steps

1.  **Refactor sharing logic**: Create a reusable `shareCertificate` utility function or include it in the components.
2.  **Update `CertCard`**: Connect the share button to the new logic.
3.  **Update `CertificateModal`**: 
    - Connect the "Imprimir" button to `window.print()`.
    - Connect the "Compartilhar" button to the sharing logic.
4.  **Verification**: Test in mobile simulation to ensure `navigator.share` prompts correctly.
