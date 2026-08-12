import { Flame, CheckCircle2, PlayCircle, Calendar } from "lucide-react";

interface ProgressSummaryProps {
  totalProgress: number;
  startedCount: number;
  finishedCount: number;
  streak: number;
}

export function ProgressSummary({ totalProgress, startedCount, finishedCount, streak }: ProgressSummaryProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progresso Total</div>
        <div className="font-display text-xl sm:text-2xl font-black text-gold">{totalProgress}%</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>

      <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Iniciados</div>
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-fire" />
          <span className="font-display text-xl sm:text-2xl font-black">{startedCount}</span>
        </div>
      </div>

      <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Finalizados</div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-display text-xl sm:text-2xl font-black">{finishedCount}</span>
        </div>
      </div>

      <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sequência</div>
        <div className="flex items-center gap-2 text-fire">
          <Flame className="h-5 w-5 animate-pulse" />
          <span className="font-display text-xl sm:text-2xl font-black">{streak} dias</span>
        </div>
      </div>
    </div>
  );
}
