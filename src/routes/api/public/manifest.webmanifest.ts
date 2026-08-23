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
              src: "/favicon.png",
              sizes: "64x64",
              type: "image/png"
            },
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icons/maskable-icon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
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
