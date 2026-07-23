import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Download } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { ebooks } from "@/lib/platform-data";

export const Route = createFileRoute("/app/ebooks")({
  head: () => ({ meta: [{ title: "Biblioteca de e-books — Espetinho na Veia" }] }),
  component: EbooksPage,
});

function EbooksPage() {
  return (
    <div>
      <PageHeader title="Biblioteca de e-books" subtitle="Sua estante digital com todo o material didático." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ebooks.map((b) => (
          <article key={b.id} className="glass card-tilt flex flex-col overflow-hidden rounded-2xl">
            <div className="relative aspect-[3/4]">
              <img src={b.cover} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
                {b.category}
              </div>
              {b.progress > 0 && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full bg-fire" style={{ width: `${b.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="font-display text-base font-bold leading-tight">{b.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">{b.pages} páginas</div>
              <div className="mt-auto flex gap-2 pt-4">
                <Link to="/app/ebooks/$ebookId" params={{ ebookId: b.id }} className="btn-fire flex-1 text-xs">
                  <BookOpen className="h-3.5 w-3.5" /> Ler agora
                </Link>
                <button className="btn-ghost-fire text-xs" aria-label="Baixar PDF">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
