import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SEED_TASKS } from "@/data/seeds";
import { SetupDraftPerson } from "@/hooks/use-setup-draft";

type Props = {
  person: SetupDraftPerson;
  onUpdate: (updates: Partial<SetupDraftPerson>) => void;
};

const CATEGORIES = {
  kitchen: { name: "Kitchen", description: "cooking, dishes, cleanup" },
  cleaning: { name: "Cleaning", description: "laundry, vacuum, bathrooms" },
  childcare: { name: "Childcare", description: "drop-offs, bedtime, bathtime" },
  errands: { name: "Errands", description: "groceries, bills, pharmacy" },
  seasonal: { name: "Seasonal", description: "garden, recycling, holiday prep" },
  other: { name: "Other", description: "misc. household tasks" }
};

export default function DislikedTasksSelector({ person, onUpdate }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTaskDislike = (taskId: string) => {
    const currentDislikes = person.disliked_tags || [];
    const newDislikes = currentDislikes.includes(taskId)
      ? currentDislikes.filter(id => id !== taskId)
      : [...currentDislikes, taskId];
    
    onUpdate({ disliked_tags: newDislikes });
  };

  const getTasksForCategory = (category: string) => {
    if (category === "other") {
      return SEED_TASKS.filter(task => !["kitchen", "cleaning", "childcare", "errands", "seasonal"].includes(task.category));
    }
    return SEED_TASKS.filter(task => task.category === category);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Pick tasks you don't enjoy</Label>
        <p className="text-xs text-muted-foreground mt-1">
          We'll try to avoid assigning them to you unless necessary.
        </p>
      </div>
      
      <div className="space-y-2">
        {Object.entries(CATEGORIES).map(([categoryKey, categoryInfo]) => {
          const isExpanded = expandedCategories.includes(categoryKey);
          const tasksInCategory = getTasksForCategory(categoryKey);
          const dislikedCount = tasksInCategory.filter(task => 
            (person.disliked_tags || []).includes(task.id)
          ).length;
          
          return (
            <div key={categoryKey} className="border rounded-lg">
              <Button
                variant="ghost"
                className="w-full p-3 h-auto justify-start"
                onClick={() => toggleCategory(categoryKey)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {isExpanded ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <div className="text-left">
                      <div className="font-medium">{categoryInfo.name}</div>
                      <div className="text-xs text-muted-foreground">{categoryInfo.description}</div>
                    </div>
                  </div>
                  {dislikedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dislikedCount} disliked
                    </Badge>
                  )}
                </div>
              </Button>
              
              {isExpanded && (
                <div className="p-3 pt-0 border-t">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tasksInCategory.map(task => {
                      const isDisliked = (person.disliked_tags || []).includes(task.id);
                      return (
                        <Button
                          key={task.id}
                          variant={isDisliked ? "default" : "outline"}
                          size="sm"
                          className="justify-start h-auto p-2 text-left"
                          onClick={() => toggleTaskDislike(task.id)}
                        >
                          <span className="text-xs">{task.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}