import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const generateYearPlan = async (params: GenerateYearPlanParams) => {
    setIsGenerating(true);
    
    try {
      console.log('Starting year plan generation...', params);
      
      const { data, error } = await supabase.functions.invoke('plan-generate-year', {
        body: params,
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