import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInvalidateOccurrences } from '@/hooks/useOccurrences';

interface GenerateYearPlanParams {
  household_id: string;
  year: number;
  selected_tasks: string[];
  people: Array<{
    id: string;
    weekly_time_budget: number;
    disliked_tasks: string[];
    no_go_tasks: string[];
  }>;
}

export function useYearPlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const invalidateOccurrences = useInvalidateOccurrences();

  const generateYearPlan = async (params: GenerateYearPlanParams) => {
    setIsGenerating(true);
    
    try {
      console.log('Starting year plan generation...', params);
      
      const { data, error } = await supabase.functions.invoke('plan-generate-with-overrides', {
        body: {
          household_id: params.household_id,
          date_range: {
            start: `${params.year}-01-01`,
            end: `${params.year}-12-31`
          },
          context: 'year',
          selected_tasks: params.selected_tasks
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate year plan');
      }

      toast({
        title: "Year Plan Generated",
        description: `Successfully created ${data.occurrences_count} tasks for ${params.year}`,
      });

      // Invalidate cache to refresh all views
      invalidateOccurrences(params.household_id);

      return data;
    } catch (error: any) {
      console.error('Year plan generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate year plan',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateYearPlan,
    isGenerating,
  };
}