import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/I18nProvider";

interface CalendarFiltersProps {
  filters: {
    persons: string[];
    categories: string[];
    status: string;
    showBoosts: boolean;
  };
  onFiltersChange: (filters: {
    persons: string[];
    categories: string[];
    status: string;
    showBoosts: boolean;
  }) => void;
}

export function CalendarFilters({ filters, onFiltersChange }: CalendarFiltersProps) {
  const { t } = useI18n();

  // Mock data - in real app this would come from API
  const availablePersons = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
  ];

  const availableCategories = [
    'cleaning',
    'maintenance', 
    'childcare',
    'admin',
    'errands',
    'safety'
  ];

  const statusOptions = [
    { value: 'all', label: t('all') },
    { value: 'scheduled', label: t('scheduled') },
    { value: 'completed', label: t('completed') },
    { value: 'missed', label: t('missed') }
  ];

  const togglePerson = (personId: string) => {
    const newPersons = filters.persons.includes(personId)
      ? filters.persons.filter(id => id !== personId)
      : [...filters.persons, personId];
    
    onFiltersChange({ ...filters, persons: newPersons });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(cat => cat !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      persons: [],
      categories: [],
      status: 'all',
      showBoosts: false
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('filters')}</h3>
        <Button variant="outline" size="sm" onClick={clearAllFilters}>
          {t('clear_all')}
        </Button>
      </div>

      {/* Persons */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('people')}</h4>
        <div className="flex flex-wrap gap-2">
          {availablePersons.map(person => (
            <Badge
              key={person.id}
              variant={filters.persons.includes(person.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => togglePerson(person.id)}
            >
              {person.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('categories')}</h4>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(category => (
            <Badge
              key={category}
              variant={filters.categories.includes(category) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              {t(category)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{t('status')}</h4>
        <Select 
          value={filters.status} 
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show Boosts */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-boosts"
          checked={filters.showBoosts}
          onCheckedChange={(checked) => 
            onFiltersChange({ ...filters, showBoosts: !!checked })
          }
        />
        <label htmlFor="show-boosts" className="text-sm font-medium">
          {t('show_boosts')}
        </label>
      </div>
    </div>
  );
}