import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useFollowups } from "@/hooks/useFollowups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data: followups } = useFollowups();
  
  // Get followups for the selected date if we have a date selected
  const selectedDateFollowups = followups?.filter(followup => {
    if (!date) return false;
    
    const followupDate = new Date(followup.scheduledDate);
    return (
      followupDate.getDate() === date.getDate() &&
      followupDate.getMonth() === date.getMonth() &&
      followupDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Calendar</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>

        {date && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">
              Follow-ups for {date.toLocaleDateString()}
            </h2>
            
            {selectedDateFollowups && selectedDateFollowups.length > 0 ? (
              <div className="space-y-3">
                {selectedDateFollowups.map(followup => (
                  <Card key={followup.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-medium">
                        {followup.clientName || "Client"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{followup.action}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>
                          {new Date(followup.scheduledDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span className={followup.isCompleted ? "text-green-500" : "text-blue-500"}>
                          {followup.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-3 text-center text-gray-500">
                No follow-ups scheduled for this date
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}