import { createFileRoute } from '@tanstack/react-router';
import { MIGRACAO_ZIP_BASE64 } from '@/lib/migracao-export.data';

// ROTA TEMPORÁRIA DE DOWNLOAD — remover após confirmação do usuário.
export const Route = createFileRoute('/api/public/download-migracao-temp')({
  server: {
    handlers: {
      GET: async () => {
        const binary = atob(MIGRACAO_ZIP_BASE64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        return new Response(bytes, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition':
              'attachment; filename="export_migracao_supabase_completo.zip"',
            'Content-Length': String(bytes.byteLength),
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        });
      },
    },
  },
});
