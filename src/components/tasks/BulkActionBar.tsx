import { useState } from 'react';
import { Check, X, MoreHorizontal, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScopeMenu, ScopeOptions } from './ScopeMenu';
import { Badge } from '@/components/ui/badge';

interface BulkActionBarProps {
  selectedCount: number;
  onInclude: (options: ScopeOptions) => void;
  onExclude: (options: ScopeOptions) => void;
  onChangeFrequency?: (options: ScopeOptions) => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  onInclude,
  onExclude,
  onChangeFrequency,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-background shadow-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          <ScopeMenu
            trigger={
              <Button variant="default" size="sm">
                <Check className="mr-1 h-4 w-4" />
                Include
              </Button>
            }
            onSelect={onInclude}
          />
          
          <ScopeMenu
            trigger={
              <Button variant="outline" size="sm">
                <X className="mr-1 h-4 w-4" />
                Exclude
              </Button>
            }
            onSelect={onExclude}
          />
          
          {onChangeFrequency && (
            <ScopeMenu
              trigger={
                <Button variant="outline" size="sm">
                  <Repeat className="mr-1 h-4 w-4" />
                  Change Frequency
                </Button>
              }
              onSelect={onChangeFrequency}
            />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}