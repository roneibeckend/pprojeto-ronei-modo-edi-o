import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { PageHeader } from "@/components/platform/Shell";
import { ebooks } from "@/lib/platform-data";

export const Route = createFileRoute("/app/ebooks/$ebookId")({
  head: ({ params }) => {
    const b = ebooks.find((x) => x.id === params.ebookId);
    return { meta: [{ title: b ? `${b.title} — Espetinho na Veia` : "E-book — Espetinho na Veia" }] };
  },
  loader: ({ params }) => {
    const book = ebooks.find((b) => b.id === params.ebookId);
    if (!book) throw notFound();
    return { book };
  },
  component: EbookReader,
  notFoundComponent: () => (
    <div className="glass rounded-2xl p-10 text-center">
      <h2 className="font-display text-2xl font-bold">E-book não encontrado</h2>
      <Link to="/app/ebooks" className="btn-fire mt-4 inline-flex">Voltar à biblioteca</Link>
    </div>
  ),
});

const demoPages = [
  { title: "Introdução", body: "Bem-vindo. Este e-book vai te guiar em cada etapa para transformar espetinhos em uma fonte real de renda. Prepare-se para colocar a mão na massa desde a primeira página." },
  { title: "Capítulo 1 — Escolhendo as carnes", body: "A escolha da carne define 60% do sucesso do seu espetinho. Priorize alcatra, coxão mole e patinho para bovinos. Para frango, use peito e coxa desossada. Sempre inspecione cor, cheiro e textura antes da compra." },
  { title: "Capítulo 2 — Tempero perfeito", body: "Sal grosso, alho, cebola em pó e uma pitada de páprica defumada formam a base. Deixe descansar por no mínimo 4 horas. Nunca tempere com muita antecedência para não desidratar a carne." },
  { title: "Capítulo 3 — Precificação e lucro", body: "Some custo direto + indireto + embalagem + palito. Multiplique por 3 para ter margem saudável. Combos aumentam ticket médio em até 40% se você posicionar bem no cardápio." },
  { title: "Capítulo 4 — Vendas todos os dias", body: "Post diário no Instagram, WhatsApp organizado e o mesmo horário todo dia. Consistência gera confiança e a confiança gera venda recorrente." },
];

function EbookReader() {
  const { book } = Route.useLoaderData() as { book: typeof ebooks[0] };
  const [page, setPage] = useState(0);
  const current = demoPages[page];

  return (
    <div>
      <PageHeader
        title={book.title}
        subtitle={`${book.category} · ${book.pages} páginas`}
        action={
          <div className="flex gap-2">
            <Link to="/app/ebooks" className="btn-ghost-fire text-sm">← Biblioteca</Link>
            <button className="btn-fire text-sm"><Download className="h-4 w-4" /> PDF</button>
          </div>
        }
      />

      <div className="mx-auto grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
        <article className="glass mx-auto w-full max-w-3xl rounded-2xl p-8 sm:p-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Página {page + 1} de {demoPages.length}
          </div>
          <h2 className="font-display text-3xl font-bold">{current.title}</h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{current.body}</p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Este é um conteúdo demonstrativo para a pré-visualização da plataforma. Na versão final, o texto real de cada capítulo será renderizado aqui com imagens, listas e destaques.
          </p>

          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost-fire text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(demoPages.length - 1, p + 1))}
              disabled={page === demoPages.length - 1}
              className="btn-fire text-sm disabled:opacity-40"
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <aside className="glass rounded-2xl p-4 lg:sticky lg:top-24">
          <div className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Sumário</div>
          <ul className="space-y-1">
            {demoPages.map((p, i) => (
              <li key={i}>
                <button
                  onClick={() => setPage(i)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${i === page ? "bg-fire/20" : "hover:bg-white/5"}`}
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
