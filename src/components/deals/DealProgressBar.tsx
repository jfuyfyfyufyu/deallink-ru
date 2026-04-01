import { DEAL_STEPS, getStepIndex } from './deal-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  status: string;
  statusHistory?: Array<{ status: string; at: string }>;
}

const DealProgressBar = ({ status, statusHistory }: Props) => {
  const currentIdx = getStepIndex(status);
  if (currentIdx < 0) return null;

  const historyMap = new Map<string, string>();
  (statusHistory || []).forEach(e => historyMap.set(e.status, e.at));

  return (
    <div className="flex items-center gap-0.5">
      <TooltipProvider delayDuration={200}>
        {DEAL_STEPS.map((step, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const timestamp = historyMap.get(step.key);
          const dateStr = timestamp ? new Date(timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

          return (
            <div key={step.key} className="flex items-center gap-0.5 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <div className={`
                      flex items-center justify-center text-[10px] rounded-full w-6 h-6 shrink-0 transition-all cursor-default
                      ${isCurrent ? 'bg-primary text-primary-foreground scale-110 shadow-md' : isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                    `}>
                      {step.label[0]}
                    </div>
                    <span className={`text-[8px] leading-tight text-center whitespace-nowrap ${isCurrent ? 'text-primary font-semibold' : isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{step.label}</p>
                  {dateStr && <p className="text-muted-foreground">{dateStr}</p>}
                  {!dateStr && !isActive && <p className="text-muted-foreground">Ещё не достигнут</p>}
                </TooltipContent>
              </Tooltip>
              {i < DEAL_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-colors mt-[-12px] ${i < currentIdx ? 'bg-primary/40' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default DealProgressBar;
