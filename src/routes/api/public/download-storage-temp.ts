import { createFileRoute } from '@tanstack/react-router';
import fs from 'fs';
import path from 'path';

export const Route = createFileRoute('/api/public/download-storage-temp')({
  server: {
    handlers: {
      GET: async () => {
        const filePath = path.join(process.cwd(), 'export_storage_supabase_completo.zip');
        
        if (!fs.existsSync(filePath)) {
          return new Response('File not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="export_storage_supabase_completo.zip"',
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      },
    },
  },
});
