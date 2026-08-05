import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { CoverImage } from "@/components/platform/CoverImage";
import { useEbooks } from "@/hooks/use-queries";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: () => ({
    meta: [
      { title: "E-book — Espetinho na Veia" },
      { name: "description", content: "Leia os e-books da plataforma Espetinho na Veia." },
      { property: "og:title", content: "E-book — Espetinho na Veia" },
      { property: "og:description", content: "Leia os e-books da plataforma Espetinho na Veia." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EbookReader,
});

function EbookReader() {
  const { ebookId } = Route.useParams();
  const { data: ebooks, isLoading } = useEbooks();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const book = ebooks?.find((b: { id: string }) => b.id === ebookId);

  if (!book) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <h2 className="font-display text-2xl font-bold">E-book não encontrado</h2>
        <Link to="/app/ebooks" className="btn-fire mt-4 inline-flex">Voltar à biblioteca</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={book.title}
        subtitle={[book.category, book.pages_count ? `${book.pages_count} páginas` : null]
          .filter(Boolean)
          .join(" · ")}
        action={<Link to="/app/ebooks" className="btn-ghost-fire text-sm">← Biblioteca</Link>}
      />

      <div className="mx-auto grid max-w-3xl gap-4">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="aspect-[16/7]">
            <CoverImage src={book.cover_url} alt={book.title} />
          </div>
          <div className="p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {book.description || "Sem descrição cadastrada."}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-fire/20 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            O arquivo de leitura deste e-book ainda não foi enviado.
          </p>
        </div>
      </div>
    </div>
  );
}
