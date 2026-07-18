import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Espetinho na Veia" },
      { name: "description", content: "Termos e condições de uso do site e do eBook Espetinho na Veia — Do Zero aos 10k." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Termos de Uso — Espetinho na Veia" },
      { property: "og:description", content: "Condições de compra, acesso ao eBook e garantia." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para o início
      </Link>
      <div className="mt-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-fire shadow-fire">
          <FileText className="h-5 w-5 text-white" />
        </span>
        <h1 className="font-display text-3xl sm:text-5xl">Termos de Uso</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">1. Sobre o produto</h2>
          <p className="mt-2">
            O <strong className="text-foreground">Espetinho na Veia — Do Zero aos 10k</strong> é um eBook digital com conteúdo educacional sobre montagem, produção,
            venda e crescimento de um negócio de espetinhos. Ao comprar, você concorda com estes Termos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Acesso ao conteúdo</h2>
          <p className="mt-2">
            Após a confirmação do pagamento, você recebe por e-mail o acesso ao eBook e aos bônus. O acesso é pessoal e intransferível.
            Você não deve compartilhar, revender ou redistribuir o material.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Pagamento</h2>
          <p className="mt-2">
            O pagamento é processado por plataforma parceira e pode ser feito à vista ou parcelado, conforme as opções exibidas no checkout.
            O preço vigente é o exibido no momento da compra.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Garantia de 7 dias</h2>
          <p className="mt-2">
            Você tem <strong className="text-foreground">7 dias corridos</strong> a partir da compra para pedir reembolso integral, sem burocracia.
            Basta enviar um e-mail para <span className="text-foreground">contato@espetinhonaveia.com</span>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Propriedade intelectual</h2>
          <p className="mt-2">
            Todo o conteúdo do eBook, textos, imagens e materiais complementares são protegidos por direitos autorais.
            É proibida a reprodução total ou parcial sem autorização.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Isenção de resultados</h2>
          <p className="mt-2">
            O eBook oferece um método com base em experiência real, mas os resultados dependem da aplicação, dedicação e contexto de cada aluno.
            Não garantimos ganhos financeiros específicos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Alterações</h2>
          <p className="mt-2">
            Estes Termos podem ser atualizados a qualquer momento para refletir melhorias no produto ou obrigações legais. A versão vigente é sempre a publicada nesta página.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">8. Contato</h2>
          <p className="mt-2">
            Dúvidas? Escreva para <span className="text-foreground">contato@espetinhonaveia.com</span> ou fale com o suporte via WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
