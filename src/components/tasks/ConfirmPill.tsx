import { useState, useEffect } from 'react';
import { X, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ConfirmPillProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  autoHideMs?: number;
}

export function ConfirmPill({ 
  message, 
  onUndo, 
  onDismiss, 
  autoHideMs = 30000 
}: ConfirmPillProps) {
  const [timeLeft, setTimeLeft] = useState(autoHideMs / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-lg border-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium">{message}</span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Undo2 className="mr-1 h-4 w-4" />
            Undo ({Math.ceil(timeLeft)}s)
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-primary-foreground hover:bg-primary-foreground/20 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}