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
  const lastUpdate = "14/08/2026";
  const companyName = "RONNEI";
  const dpoName = "Ronnei";
  const contactEmail = "ronneivml122@gmail.com";

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Voltar para o início
      </Link>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-fire shadow-fire">
            <Shield className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground tracking-tight">POLÍTICA DE PRIVACIDADE</h1>
            <p className="font-medium text-lg text-[color:var(--gold)] mt-1">Transparência e proteção de seus dados (LGPD)</p>
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
          <h2 className="font-display text-2xl text-foreground mb-4">1. Introdução</h2>
          <p>
            A plataforma <strong className="text-foreground">Espetinho na Veia</strong>, operada por {companyName}, está comprometida com a proteção de sua privacidade. Esta política descreve como tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">2. Dados que Coletamos</h2>
          <div className="space-y-4">
            <p>Coletamos apenas os dados necessários para a prestação de nossos serviços, divididos em:</p>
            
            <div className="grid gap-6 sm:grid-cols-2 mt-4">
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-fire"></div>
                  Dados da Conta
                </h3>
                <ul className="text-sm space-y-1 list-none pl-0">
                  <li>• Nome completo</li>
                  <li>• E-mail e Senha</li>
                  <li>• WhatsApp/Telefone</li>
                  <li>• Foto de perfil (opcional)</li>
                </ul>
              </div>
              
              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-fire"></div>
                  Dados de Navegação
                </h3>
                <ul className="text-sm space-y-1 list-none pl-0">
                  <li>• Endereço IP</li>
                  <li>• Tipo de navegador e dispositivo</li>
                  <li>• Páginas acessadas e erros</li>
                  <li>• Retomada de progresso</li>
                </ul>
              </div>
            </div>
            
            <p className="mt-4 text-sm bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-lg">
              <strong className="text-yellow-500">Importante:</strong> Dados financeiros e de cartão de crédito são processados diretamente por gateways seguros (Asaas) e não são armazenados em nossos servidores.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">3. Finalidades do Tratamento</h2>
          <p>Utilizamos seus dados para as seguintes bases legais da LGPD:</p>
          <ul className="mt-4 space-y-3 pl-2">
            <li className="flex gap-3">
              <span className="font-bold text-foreground min-w-[140px]">Execução de Contrato:</span>
              <span>Entregar o acesso ao curso/ebook, gerenciar sua conta e fornecer suporte técnico.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-foreground min-w-[140px]">Legítimo Interesse:</span>
              <span>Melhorar a experiência do usuário, prevenir fraudes e realizar marketing direto (quando autorizado).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-foreground min-w-[140px]">Obrigações Legais:</span>
              <span>Emissão de notas fiscais e manutenção de registros de acesso conforme o Marco Civil.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">4. Compartilhamento com Terceiros</h2>
          <p>Para operar a plataforma, compartilhamos dados mínimos necessários com:</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-foreground font-bold">Parceiro</th>
                  <th className="py-2 text-foreground font-bold">Finalidade</th>
                  <th className="py-2 text-foreground font-bold">Localização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 pr-4">Supabase (Lovable Cloud)</td>
                  <td className="py-3 pr-4">Hospedagem, Banco de Dados e Auth</td>
                  <td className="py-3">EUA/Global</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Asaas</td>
                  <td className="py-3 pr-4">Processamento de Pagamentos</td>
                  <td className="py-3">Brasil</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Resend</td>
                  <td className="py-3 pr-4">Envio de e-mails transacionais</td>
                  <td className="py-3">Global</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Meta (Pixel)</td>
                  <td className="py-3 pr-4">Analytics e Otimização de Anúncios</td>
                  <td className="py-3">Global</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">5. Política de Cookies</h2>
          <p>Utilizamos cookies para o funcionamento técnico e análise de uso da plataforma:</p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-foreground font-bold mb-1">Necessários (Sempre ativos)</h3>
              <p className="text-sm">Essenciais para autenticação, segurança e manutenção da sessão do usuário.</p>
            </div>
            <div>
              <h3 className="text-foreground font-bold mb-1">Preferências</h3>
              <p className="text-sm">Utilizados para lembrar suas escolhas (como volume do player, progresso em aulas e filtros de data).</p>
            </div>
            <div>
              <h3 className="text-foreground font-bold mb-1">Marketing e Analytics</h3>
              <p className="text-sm">Pixels e scripts que nos ajudam a entender o comportamento do usuário e medir a eficácia de nossas campanhas.</p>
            </div>
            <p className="text-xs text-muted-foreground italic mt-2">Você pode gerenciar as preferências de cookies através das configurações do seu navegador.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">6. Seus Direitos</h2>
          <p>
            Sob a LGPD, você tem o direito de solicitar a confirmação da existência de tratamento, o acesso aos seus dados, a correção de dados incompletos, a portabilidade e a exclusão definitiva, <strong className="text-foreground">nos limites permitidos pela legislação aplicável</strong> (ex: quando dados precisam ser mantidos por obrigação fiscal).
          </p>
          <p className="mt-4">Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) através do e-mail: <span className="text-foreground">{contactEmail}</span>.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 border-l-4 border-fire pl-4">7. Segurança e Retenção</h2>
          <p>
            Adotamos práticas de segurança de padrão de mercado para proteger seus dados contra acessos não autorizados. Seus dados são mantidos enquanto sua conta estiver ativa ou pelo período necessário para cumprir obrigações legais de guarda de registros.
          </p>
        </section>

        <section className="border-t border-white/10 pt-12">
          <div className="bg-fire/5 border border-fire/20 rounded-2xl p-6">
            <h2 className="font-display text-2xl text-foreground mb-2 text-gradient-fire">Contato Jurídico</h2>
            <ul className="space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-[color:var(--gold)]">Responsável:</span>
                <span className="text-foreground">{companyName}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[color:var(--gold)]">Encarregado (DPO):</span>
                <span className="text-foreground">{dpoName}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[color:var(--gold)]">Email:</span>
                <span className="text-foreground">{contactEmail}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
