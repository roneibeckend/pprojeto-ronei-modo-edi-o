import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Espetinho na Veia" },
      { name: "description", content: "Saiba como coletamos, usamos e protegemos seus dados ao acessar o eBook Espetinho na Veia — Do Zero aos 10k." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Política de Privacidade — Espetinho na Veia" },
      { property: "og:description", content: "Como tratamos seus dados no site do eBook Espetinho na Veia." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para o início
      </Link>
      <div className="mt-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-fire shadow-fire">
          <Shield className="h-5 w-5 text-white" />
        </span>
        <h1 className="font-display text-3xl sm:text-5xl">Política de Privacidade</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">1. Quem somos</h2>
          <p className="mt-2">
            Esta página é mantida pela equipe do eBook <strong className="text-foreground">Espetinho na Veia — Do Zero aos 10k</strong>. Aqui explicamos, de forma simples,
            quais dados coletamos e o que fazemos com eles.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Quais dados coletamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-foreground">Nome e WhatsApp</strong> quando você preenche nosso formulário voluntariamente.</li>
            <li><strong className="text-foreground">Dados de compra</strong> (nome, e-mail, endereço de cobrança) fornecidos ao checkout — processados pela plataforma de pagamento.</li>
            <li><strong className="text-foreground">Dados de navegação</strong> básicos, como páginas visitadas, para melhorar a experiência.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Como usamos seus dados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Entregar o eBook e os bônus prometidos.</li>
            <li>Enviar avisos, materiais complementares e novidades do método.</li>
            <li>Dar suporte via WhatsApp ou e-mail quando você precisar.</li>
            <li>Cumprir obrigações legais e fiscais.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Compartilhamento</h2>
          <p className="mt-2">
            Não vendemos seus dados. Compartilhamos apenas com parceiros essenciais para a operação (plataforma de pagamento, envio de mensagens, hospedagem)
            e sempre no mínimo necessário.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Seus direitos (LGPD)</h2>
          <p className="mt-2">
            Você pode a qualquer momento solicitar acesso, correção ou exclusão dos seus dados, bem como cancelar o recebimento de mensagens.
            Basta escrever para <span className="text-foreground">contato@espetinhonaveia.com</span>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Segurança</h2>
          <p className="mt-2">
            Adotamos medidas técnicas razoáveis para proteger seus dados. Nenhum sistema é 100% imune, mas trabalhamos para manter tudo seguro.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Contato</h2>
          <p className="mt-2">
            Dúvidas sobre esta política? Fale com a gente em <span className="text-foreground">contato@espetinhonaveia.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
