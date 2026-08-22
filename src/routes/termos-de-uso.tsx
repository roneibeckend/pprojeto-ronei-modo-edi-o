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
  const lastUpdate = "14/08/2026";
  const companyName = "Ronnei Da Silva";
  const cnpj = "45.680.415/0001-91";
  

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Voltar para o início
      </Link>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-fire shadow-fire">
            <FileText className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground tracking-tight">TERMOS DE USO</h1>
            <p className="font-medium text-lg text-[color:var(--gold)] mt-1">Regras para utilização da plataforma</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-6">
          <span>Versão: 2.0</span>
          <span className="text-white/20">|</span>
          <span>Última atualização: {lastUpdate}</span>
        </div>
      </div>

      <div className="mt-10 space-y-12 text-[15px] leading-relaxed text-muted-foreground">
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-2xl text-foreground mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma <strong className="text-foreground">Espetinho na Veia</strong>, de propriedade de {companyName}, inscrita no CNPJ sob o nº {cnpj}, você concorda integralmente com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deverá utilizar nossos serviços.
          </p>
          <p className="mt-4 italic">
            Estes termos podem ser atualizados periodicamente para refletir mudanças legais ou melhorias operacionais, sempre com a data da última atualização visível no topo da página.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">2. Objeto e Acesso</h2>
          <div className="space-y-4">
            <p>
              A plataforma consiste em um ambiente de aprendizado digital (LMS) que oferece cursos e e-books especializados no mercado de espetinhos, incluindo, mas não se limitando ao e-book "Do Zero aos 10k".
            </p>
            <p>
              <strong className="text-foreground">Cadastro:</strong> O acesso a conteúdos adquiridos exige a criação de uma conta pessoal. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorram em sua conta.
            </p>
            <p>
              <strong className="text-foreground">Uso Pessoal:</strong> O acesso é individual, exclusivo e intransferível. O compartilhamento de credenciais de acesso ou a distribuição não autorizada do conteúdo é estritamente proibida e sujeita a bloqueio imediato da conta sem direito a reembolso.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">3. Pagamentos, Assinaturas e Reembolso</h2>
          <div className="space-y-4">
            <p>
              Os pagamentos são processados via parceiros especializados (como Asaas). A plataforma não armazena dados de cartão de crédito.
            </p>
            <p>
              <strong className="text-foreground">Direito de Arrependimento:</strong> Em conformidade com o Código de Defesa do Consumidor (CDC), você tem o direito de desistir da compra e solicitar o reembolso integral no prazo de <strong className="text-foreground">7 (sete) dias corridos</strong> após a confirmação do pagamento, independente do motivo.
            </p>
            <p>
              <strong className="text-foreground">Procedimento:</strong> Para solicitar o reembolso dentro do prazo legal, entre em contato através do nosso canal de suporte.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">4. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo disponibilizado (vídeos, textos, receitas, planilhas, designs e logotipos) é de propriedade exclusiva da {companyName} ou de seus licenciantes e está protegido pelas leis de direitos autorais e propriedade intelectual.
          </p>
          <p className="mt-4">
            A reprodução, cópia, alteração, venda ou distribuição de qualquer material da plataforma, no todo ou em parte, é proibida nos termos da legislação brasileira vigente.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">5. Programa de Afiliados</h2>
          <p>
            Caso você participe do nosso programa de afiliados, concorda em utilizar práticas de divulgação éticas e transparentes. É proibido o uso de spam, promessas falsas de ganhos ou práticas que lesem a imagem da marca. A plataforma reserva-se o direito de auditar e suspender contas de afiliados em caso de suspeita de fraude ou violação destes termos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">6. Isenção de Resultados e Responsabilidade</h2>
          <p>
            Os métodos ensinados são baseados em experiências reais, porém, <strong className="text-foreground">não garantimos resultados financeiros específicos</strong>. O sucesso do seu negócio depende da sua execução, dedicação e fatores externos de mercado.
          </p>
          <p className="mt-4">
            A plataforma e seus autores não serão responsáveis por danos indiretos, lucros cessantes ou qualquer perda decorrente da utilização das informações, <strong className="text-foreground">nos limites permitidos pela legislação aplicável</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">7. Conduta do Usuário</h2>
          <p>
            Você concorda em não utilizar a plataforma para fins ilícitos, não tentar burlar sistemas de segurança, não realizar engenharia reversa e não proferir ofensas ou discursos de ódio em áreas de feedback ou suporte.
          </p>
        </section>

        <section className="border-t border-white/10 pt-12">
          <div className="bg-fire/5 border border-fire/20 rounded-2xl p-6">
            <h2 className="font-display text-2xl text-foreground mb-2 text-gradient-fire">Dúvidas ou Suporte?</h2>
            <p className="mb-4">Se você tiver qualquer dúvida sobre estes termos, entre em contato conosco:</p>
            <ul className="space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-[color:var(--gold)]">Suporte:</span>
                <span className="text-foreground">Canal de tickets e suporte integrado</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[color:var(--gold)]">WhatsApp:</span>
                <span className="text-foreground">Suporte integrado na plataforma</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
