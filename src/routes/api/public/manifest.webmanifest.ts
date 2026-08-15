import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/manifest/webmanifest')({
  server: {
    handlers: {
      GET: async () => {
        const manifest = {
          name: "Espetinho na Veia — Comunidade Ronnei",
          short_name: "Espetinho na Veia",
          description: "Acesse seus cursos, e-books e materiais da comunidade Espetinho na Veia diretamente da tela inicial do seu celular.",
          start_url: "/app",
          display: "standalone",
          background_color: "#0a0a0a",
          theme_color: "#e11d48",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "32x32",
              type: "image/x-icon"
            },
            {
              src: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a3ab4b2-697e-4265-9cc2-26c31eb5da7c/id-preview-97f464f3--28d3c13e-4c7d-45b5-8d3d-fa05057ac015.lovable.app-1784863120206.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          id: "/app",
          scope: "/"
        };

        return new Response(JSON.stringify(manifest), {
          headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600'
          },
        });
      }
    }
  }
})
