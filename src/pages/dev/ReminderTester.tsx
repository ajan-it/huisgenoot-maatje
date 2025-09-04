import { useState } from "react";
import { Navigate } from "react-router-dom";
import { isReminderTesterEnabled } from "@/lib/featureFlags";
import { useReminderTester } from "@/hooks/useReminderTester";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { HouseholdSelector } from "@/components/reminder-tester/HouseholdSelector";
import { OccurrenceSearch } from "@/components/reminder-tester/OccurrenceSearch";
import { TestConfigurator } from "@/components/reminder-tester/TestConfigurator";
import { RunAndLogs } from "@/components/reminder-tester/RunAndLogs";
import { BadgePreview } from "@/components/reminder-tester/BadgePreview";

const ReminderTesterPage = () => {
  const {
    selectedHousehold,
    setSelectedHousehold,
    selectedOccurrence,
    setSelectedOccurrence,
    testConfig,
    setTestConfig,
    originalValues,
    applyTestConfig,
    revertChanges,
    canRevert,
    isOwner,
    loading
  } = useReminderTester();

  // Feature flag check
  if (!isReminderTesterEnabled()) {
    return <Navigate to="/" replace />;
  }

  // Role check
  if (!loading && !isOwner) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminder Tester</h1>
          <p className="text-muted-foreground mt-1">
            Use presets to simulate deadlines. This is a safe, reversible test for the reminder engine.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          Admin Only
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This tool modifies task occurrences for testing. Always use the Revert button to restore original values after testing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Step 1: Select Household */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
              Household & Settings
            </CardTitle>
            <CardDescription>
              Choose a household and view reminder configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HouseholdSelector
              selectedHousehold={selectedHousehold}
              onHouseholdChange={setSelectedHousehold}
            />
          </CardContent>
        </Card>

        {/* Step 2: Select Occurrence */}
        {selectedHousehold && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Pick an Occurrence
              </CardTitle>
              <CardDescription>
                Search and filter task occurrences to test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OccurrenceSearch
                householdId={selectedHousehold.id}
                selectedOccurrence={selectedOccurrence}
                onOccurrenceSelect={setSelectedOccurrence}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Configure Test */}
        {selectedOccurrence && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Set Test Values
              </CardTitle>
              <CardDescription>
                Configure reminder timing and critical status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestConfigurator
                testConfig={testConfig}
                onConfigChange={setTestConfig}
                onApply={applyTestConfig}
                onRevert={revertChanges}
                canRevert={canRevert}
                originalValues={originalValues}
                selectedOccurrence={selectedOccurrence}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Run & Observe */}
        {selectedOccurrence && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                Run & Observe
              </CardTitle>
              <CardDescription>
                Execute reminder function and view results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RunAndLogs householdId={selectedHousehold?.id} />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Badge Preview */}
        {selectedOccurrence && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">5</span>
                Badge Preview
              </CardTitle>
              <CardDescription>
                View current status badges and links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgePreview 
                occurrence={selectedOccurrence}
                householdId={selectedHousehold?.id}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReminderTesterPage;