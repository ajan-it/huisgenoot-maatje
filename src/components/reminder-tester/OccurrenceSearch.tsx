import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OccurrenceData } from "@/hooks/useReminderTester";
import { Loader2, Calendar, User, Clock } from "lucide-react";
import { format, subDays, addDays } from "date-fns";

interface OccurrenceSearchProps {
  householdId: string;
  selectedOccurrence: OccurrenceData | null;
  onOccurrenceSelect: (occurrence: OccurrenceData | null) => void;
}

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  assignedPerson: string;
  status: string[];
  criticalOnly: boolean;
}

export function OccurrenceSearch({ householdId, selectedOccurrence, onOccurrenceSelect }: OccurrenceSearchProps) {
  const [occurrences, setOccurrences] = useState<OccurrenceData[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    assignedPerson: '',
    status: [],
    criticalOnly: false,
  });

  useEffect(() => {
    if (householdId) {
      fetchInitialData();
    }
  }, [householdId]);

  useEffect(() => {
    if (householdId) {
      searchOccurrences();
    }
  }, [filters, householdId]);

  const fetchInitialData = async () => {
    try {
      // Fetch people in household
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, first_name')
        .eq('household_id', householdId);

      if (peopleError) throw peopleError;
      setPeople(peopleData || []);

      // Fetch available statuses using the same function as the edge function
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_occurrence_status_labels');

      if (statusError) throw statusError;
      setAvailableStatuses(statusData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const searchOccurrences = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('occurrences')
        .select(`
          id,
          date,
          start_time,
          due_at,
          reminder_level,
          last_reminded_at,
          is_critical,
          status,
          plan_id,
          tasks(name),
          people(first_name)
        `)
        .gte('date', filters.dateFrom)
        .lte('date', filters.dateTo);

      // Join with plans to filter by household
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('id')
        .eq('household_id', householdId);

      if (plansError) throw plansError;

      const planIds = plans?.map(p => p.id) || [];
      if (planIds.length === 0) {
        setOccurrences([]);
        setLoading(false);
        return;
      }

      query = query.in('plan_id', planIds);

      if (filters.assignedPerson) {
        query = query.eq('assigned_person', filters.assignedPerson);
      }

      if (filters.status.length > 0) {
        query = query.in('status', filters.status as any);
      }

      if (filters.criticalOnly) {
        query = query.eq('is_critical', true);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // Transform data for display
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        task_name: item.tasks?.name || 'Unknown Task',
        assigned_person: item.people?.first_name || 'Unassigned',
        status: item.status,
        is_critical: item.is_critical,
        due_at: item.due_at,
        reminder_level: item.reminder_level,
        last_reminded_at: item.last_reminded_at,
        start_time: item.start_time,
        plan_id: item.plan_id,
      }));

      setOccurrences(transformedData);
    } catch (error) {
      console.error('Error searching occurrences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const isOverdue = (occurrence: OccurrenceData) => {
    if (!occurrence.due_at) return false;
    return new Date(occurrence.due_at) < new Date() && occurrence.status !== 'completed';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
        <div>
          <label className="text-sm font-medium mb-1 block">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Assigned Person</label>
          <Select 
            value={filters.assignedPerson} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, assignedPerson: value === 'all' ? '' : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All people" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="critical-only"
            checked={filters.criticalOnly}
            onCheckedChange={(checked) => setFilters(prev => ({ ...prev, criticalOnly: checked === true }))}
          />
          <label htmlFor="critical-only" className="text-sm font-medium">
            Critical only
          </label>
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <label className="text-sm font-medium mb-2 block">Status Filters</label>
        <div className="flex gap-2 flex-wrap">
          {availableStatuses.map((status) => (
            <Badge
              key={status}
              variant={filters.status.includes(status) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleStatusToggle(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Search Results</h4>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Found {occurrences.length} occurrences
          </p>
        </div>

        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Reminder Level</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occurrences.map((occurrence) => (
                <TableRow 
                  key={occurrence.id}
                  className={selectedOccurrence?.id === occurrence.id ? "bg-accent" : ""}
                >
                  <TableCell className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(occurrence.date), 'MMM dd')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {occurrence.task_name}
                      {occurrence.is_critical && (
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {occurrence.assigned_person}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={occurrence.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {occurrence.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {occurrence.due_at ? (
                        <div className={`text-sm ${isOverdue(occurrence) ? 'text-destructive font-medium' : ''}`}>
                          {format(new Date(occurrence.due_at), 'MMM dd HH:mm')}
                          {isOverdue(occurrence) && <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={occurrence.reminder_level > 0 ? "default" : "outline"}>
                        {occurrence.reminder_level}
                      </Badge>
                      {occurrence.reminder_level > 0 && (
                        <Badge variant="secondary" className="text-xs">Reminded</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={selectedOccurrence?.id === occurrence.id ? "default" : "outline"}
                      onClick={() => onOccurrenceSelect(occurrence)}
                    >
                      {selectedOccurrence?.id === occurrence.id ? "Selected" : "Select"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}