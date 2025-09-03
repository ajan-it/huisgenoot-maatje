import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { SEED_TASKS } from "@/data/seeds";
import { SetupDraftPerson } from "@/hooks/use-setup-draft";

type Props = {
  person: SetupDraftPerson;
  onUpdate: (updates: Partial<SetupDraftPerson>) => void;
  allPeople: SetupDraftPerson[];
};

export default function CantDoTasksSelector({ person, onUpdate, allPeople }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const toggleTaskCantDo = (taskId: string) => {
    const currentCantDo = person.no_go_tasks || [];
    const newCantDo = currentCantDo.includes(taskId)
      ? currentCantDo.filter(id => id !== taskId)
      : [...currentCantDo, taskId];
    
    onUpdate({ no_go_tasks: newCantDo });
  };

  const addNewTask = () => {
    if (newTaskName.trim()) {
      // For now, just add to the current person's no_go_tasks
      // In a real implementation, this might create a new task in the system
      const newId = `custom_${Date.now()}`;
      toggleTaskCantDo(newId);
      setNewTaskName("");
      setShowAddNew(false);
    }
  };

  const filteredTasks = SEED_TASKS.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if task is marked as "can't do" by both partners
  const getBothPartnersCantDo = () => {
    const adults = allPeople.filter(p => p.role === "adult");
    if (adults.length < 2) return [];
    
    const tasks = SEED_TASKS.filter(task => 
      adults.every(adult => (adult.no_go_tasks || []).includes(task.id))
    );
    return tasks;
  };

  const bothPartnersCantDo = getBothPartnersCantDo();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Tasks I can't do</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Some tasks may not be possible for you due to skills, health, or other reasons. Mark them here so we don't assign them to you.
        </p>
      </div>

      {bothPartnersCantDo.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm text-amber-800 font-medium mb-2">
            ⚠️ Tasks both partners can't do
          </div>
          <div className="text-xs text-amber-700 mb-2">
            These tasks will stay unassigned or go to the backlog until you decide who can handle them:
          </div>
          <div className="flex flex-wrap gap-1">
            {bothPartnersCantDo.map(task => (
              <Badge key={task.id} variant="outline" className="text-xs">
                {task.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddNew(!showAddNew)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showAddNew && (
          <div className="flex gap-2">
            <Input
              placeholder="Add custom task..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNewTask()}
            />
            <Button size="sm" onClick={addNewTask}>
              Add
            </Button>
          </div>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredTasks.map(task => {
          const cantDo = (person.no_go_tasks || []).includes(task.id);
          return (
            <div key={task.id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex-1">
                <div className="text-sm font-medium">{task.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {task.category} • {task.frequency} • {task.default_duration} min
                </div>
              </div>
              <Switch
                checked={cantDo}
                onCheckedChange={() => toggleTaskCantDo(task.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}