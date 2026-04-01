import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onStart: () => void;
}

const WelcomeDialog = ({ open, onStart }: WelcomeDialogProps) => (
  <Dialog open={open}>
    <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
      <DialogHeader className="text-center">
        <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <DialogTitle className="text-xl">Рады видеть тебя! 🎉</DialogTitle>
        <DialogDescription className="text-base mt-2">
          Заполни, пожалуйста, свои данные — это поможет селлерам находить тебя
          и предлагать подходящие товары для бартера.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>📋 Анкета займёт 5–7 минут</p>
        <p>🎯 Чем подробнее — тем больше предложений</p>
        <p>🔒 Данные видны только селлерам</p>
      </div>
      <Button onClick={onStart} className="w-full mt-2" size="lg">
        Заполнить анкету
      </Button>
    </DialogContent>
  </Dialog>
);

export default WelcomeDialog;
