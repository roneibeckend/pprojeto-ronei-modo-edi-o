import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  Sparkles, 
  CreditCard, 
  Settings2, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Wallet,
  Plus
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute('/app/admin/integracoes')({
  head: () => ({ meta: [{ title: "Hub de Integrações — Painel Admin" }] }),
  component: IntegrationsPage,
});

const ORANGE = "#ff6a00";

type IntegrationStatus = 'connected' | 'error' | 'disconnected' | 'loading';

interface IntegrationCardProps {
  title: string;
  category: string;
  icon: any;
  status: IntegrationStatus;
  description: string;
}

function IntegrationCard({ title, category, icon: Icon, status, description }: IntegrationCardProps) {
  return (
    <div className="group relative overflow-hidden border border-white/5 bg-[#111] p-5 transition hover:border-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/5 text-[color:var(--orange)] transition group-hover:bg-[color:var(--orange)] group-hover:text-black">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          {status === 'connected' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Online</span>}
          {status === 'error' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-400"><XCircle className="h-3 w-3" /> Erro</span>}
          {status === 'disconnected' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-white/20">Desativado</span>}
          {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
        </div>
      </div>
      
      <h3 className="font-display text-base font-bold text-white mb-1 uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-white/40 mb-6 line-clamp-2">{description}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">{category}</span>
        <button className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--orange)] hover:brightness-125 flex items-center gap-1 transition">
          Configurar <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'ia' | 'pagamentos'>('ia');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-4 w-4" style={{ color: ORANGE }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Sistema & Conexões</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white">
            Hub de <span style={{ color: ORANGE }}>Integrações</span>
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-2xl">
            Centralize e gerencie todas as conexões externas do seu ecossistema SaaS, desde modelos de inteligência artificial até gateways de pagamento.
          </p>
        </div>
        
        <div className="flex items-center gap-1 rounded-sm border border-white/5 bg-black/40 p-1 self-start sm:self-auto">
          <button 
            onClick={() => setActiveTab('ia')}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'ia' ? 'bg-[#ff6a00] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <BrainCircuit className="h-3.5 w-3.5" /> IA
          </button>
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition ${activeTab === 'pagamentos' ? 'bg-[#ff6a00] text-black shadow-[0_0_20px_rgba(255,106,0,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <Wallet className="h-3.5 w-3.5" /> Pagamentos
          </button>
        </div>
      </div>

      {activeTab === 'ia' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard 
            title="OpenAI" 
            category="Inteligência Artificial" 
            icon={Sparkles} 
            status="connected" 
            description="Integração com GPT-4o, GPT-3.5 e modelos de embeddings para geração de conteúdo."
          />
          <IntegrationCard 
            title="Google Gemini" 
            category="Inteligência Artificial" 
            icon={BrainCircuit} 
            status="disconnected" 
            description="Acesso aos modelos Pro e Ultra do Gemini para processamento multimodal."
          />
          <IntegrationCard 
            title="Anthropic Claude" 
            category="Inteligência Artificial" 
            icon={Activity} 
            status="disconnected" 
            description="Conexão com Claude 3 Opus/Sonnet/Haiku para raciocínio avançado."
          />
          <div className="border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer group">
            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center mb-3 group-hover:border-[color:var(--orange)] transition" style={{ ["--orange" as any]: ORANGE }}>
              <Plus className="h-5 w-5 text-white/20 group-hover:text-[color:var(--orange)]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Adicionar Provedor IA</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard 
            title="Mercado Pago" 
            category="Gateway de Pagamento" 
            icon={CreditCard} 
            status="connected" 
            description="Processamento de PIX, Cartão de Crédito e Boleto com liquidação imediata."
          />
          <IntegrationCard 
            title="Stripe" 
            category="Gateway de Pagamento" 
            icon={Wallet} 
            status="disconnected" 
            description="Infraestrutura global para pagamentos recorrentes e checkout otimizado."
          />
          <IntegrationCard 
            title="Asaas" 
            category="Gateway de Pagamento" 
            icon={Activity} 
            status="disconnected" 
            description="Focado em automação de cobranças, antecipação e gestão financeira."
          />
          <div className="border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer group">
            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center mb-3 group-hover:border-[color:var(--orange)] transition" style={{ ["--orange" as any]: ORANGE }}>
              <Plus className="h-5 w-5 text-white/20 group-hover:text-[color:var(--orange)]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Adicionar Gateway</span>
          </div>
        </div>
      )}

      {/* Security Info Card */}
      <div className="mt-12 flex items-center gap-4 border border-white/5 bg-white/[0.02] p-6 rounded-sm">
        <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-sm bg-[#ff6a00]/10 text-[color:var(--orange)]" style={{ ["--orange" as any]: ORANGE }}>
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-white">Segurança de Dados</h4>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">
            Todas as API Keys e credenciais são criptografadas em nível de banco de dados e nunca são expostas em logs ou na interface pública. 
            Apenas usuários com privilégios administrativos podem gerenciar estas configurações.
          </p>
        </div>
      </div>
    </div>
  );
}
