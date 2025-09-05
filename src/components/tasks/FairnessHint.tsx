import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FairnessHintProps {
  shiftedPoints: number;
  threshold?: number;
  onRebalance?: () => void;
  className?: string;
}

export function FairnessHint({ 
  shiftedPoints, 
  threshold = 30, 
  onRebalance,
  className 
}: FairnessHintProps) {
  if (Math.abs(shiftedPoints) < threshold) {
    return null;
  }

  const isNegative = shiftedPoints < 0;
  const absolutePoints = Math.abs(shiftedPoints);

  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-amber-800 dark:text-amber-200">
          This {isNegative ? 'removes' : 'adds'} ~{absolutePoints} points. Make it fairer?
        </span>
        {onRebalance && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRebalance}
            className="ml-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            Rebalance
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}