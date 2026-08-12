import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Onboarding } from "../components/platform/Onboarding";
import { useAffiliateTracking } from "../hooks/use-affiliate-tracking";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initPixel, trackEvent } from "../lib/pixel";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-fire">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-fire">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const handleReset = async () => {
    // Reseta o cache do queryClient para garantir que dados corrompidos/falhos sejam limpos
    await queryClient.resetQueries();
    router.invalidate();
    reset();
  };

  const handleGoHome = async () => {
    const { data } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getSession());
    if (data.session) {
      navigate({ to: "/inicio" });
    } else {
      navigate({ to: "/" });
    }
    reset();
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente em instantes.</p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-left">
            <p className="text-[10px] font-mono text-red-400 break-all">{error.message}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={handleReset} className="btn-fire">
            Tentar novamente
          </button>
          <button onClick={handleGoHome} className="btn-ghost-fire">
            Ir para o início
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Espetinho na Veia — Do Zero aos 10k | eBook Ronnei" },
      {
        name: "description",
        content:
          "eBook prático com 14 capítulos + bônus para montar, temperar, precificar e vender espetinhos com alto lucro. Comece do zero e chegue aos 10k/mês.",
      },
      { name: "theme-color", content: "#1a0d08" },
      { property: "og:title", content: "Espetinho na Veia — Do Zero aos 10k | eBook Ronnei" },
      {
        property: "og:description",
        content:
          "eBook prático com 14 capítulos + bônus para montar, temperar, precificar e vender espetinhos com alto lucro. Comece do zero e chegue aos 10k/mês.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Espetinho na Veia" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Espetinho na Veia — Do Zero aos 10k | eBook Ronnei" },
      { name: "twitter:description", content: "eBook prático com 14 capítulos + bônus para montar, temperar, precificar e vender espetinhos com alto lucro. Comece do zero e chegue aos 10k/mês." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a3ab4b2-697e-4265-9cc2-26c31eb5da7c/id-preview-97f464f3--28d3c13e-4c7d-45b5-8d3d-fa05057ac015.lovable.app-1784863120206.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4a3ab4b2-697e-4265-9cc2-26c31eb5da7c/id-preview-97f464f3--28d3c13e-4c7d-45b5-8d3d-fa05057ac015.lovable.app-1784863120206.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "eBook Espetinho na Veia — Do Zero aos 10k",
          description:
            "Guia completo para montar, temperar, precificar e vender espetinhos com alto lucro.",
          brand: { "@type": "Brand", name: "Espetinho na Veia" },
          offers: {
            "@type": "Offer",
            price: "47.90",
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useAffiliateTracking();

  useEffect(() => {
    initPixel();
    // Rastreia mudanças de rota SPA como PageView.
    const unsub = router.subscribe("onResolved", () => {
      trackEvent("PageView");
    });
    return () => unsub();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Onboarding />
      <Toaster position="top-center" theme="dark" richColors closeButton />
    </QueryClientProvider>
  );
}
