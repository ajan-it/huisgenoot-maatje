import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratePlanParams {
  household_id: string;
  date_range: {
    start: string;
    end: string;
  };
  context: string;
  selected_tasks?: string[];
}

export function usePlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePlan = async (params: GeneratePlanParams) => {
    setIsGenerating(true);
    
    try {
      console.log('Starting plan generation with overrides...', params);
      
      const { data, error } = await supabase.functions.invoke('plan-generate-with-overrides', {
        body: params,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      toast({
        title: "Plan Generated",
        description: `Successfully created ${data.occurrences_count} tasks`,
      });

      return data;
    } catch (error: any) {
      console.error('Plan generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate plan',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePlan,
    isGenerating,
  };
}