import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Users, AlertTriangle } from "lucide-react";
import { useBoostTrigger } from "@/hooks/useBoostTrigger";
import { useI18n } from "@/i18n/I18nProvider";

interface BoostInteractionButtonsProps {
  occurrenceId: string;
  onInteraction?: (type: string) => void;
}

export const BoostInteractionButtons = ({ 
  occurrenceId, 
  onInteraction 
}: BoostInteractionButtonsProps) => {
  const { respondToBoost, loading } = useBoostTrigger();
  const { lang } = useI18n();
  const L = lang === "en";

  const handleResponse = async (type: string, options: any = {}) => {
    try {
      await respondToBoost(occurrenceId, type, options);
      onInteraction?.(type);
    } catch (error) {
      console.error('Error handling boost response:', error);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse('acknowledged')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        {L ? "Acknowledged" : "Bevestigd"}
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={() => handleResponse('completed')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        {L ? "Mark Complete" : "Markeer Voltooid"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse('rescheduled')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Clock className="h-4 w-4" />
        {L ? "Reschedule" : "Herplannen"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse('backup_requested')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        {L ? "Request Backup" : "Vraag Backup"}
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleResponse('missed')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        {L ? "Mark Missed" : "Markeer Gemist"}
      </Button>
    </div>
  );
};