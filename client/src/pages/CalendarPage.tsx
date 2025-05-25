import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useFollowups } from "@/hooks/useFollowups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayClickEventHandler } from "react-day-picker";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data: followups } = useFollowups();
  const [followupDates, setFollowupDates] = useState<Date[]>([]);
  
  // Process followups to identify dates with scheduled activities
  useEffect(() => {
    if (followups && followups.length > 0) {
      const dates = followups.map(followup => new Date(followup.scheduledDate));
      setFollowupDates(dates);
    } else {
      setFollowupDates([]);
    }
  }, [followups]);
  
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
  
  // Function to check if a date has follow-ups
  const isFollowupDate = (day: Date): boolean => {
    return followupDates.some(followupDate => 
      followupDate.getDate() === day.getDate() &&
      followupDate.getMonth() === day.getMonth() &&
      followupDate.getFullYear() === day.getFullYear()
    );
  };

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
            modifiers={{
              highlighted: (day) => isFollowupDate(day)
            }}
            modifiersStyles={{
              highlighted: {
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fontWeight: "bold",
                border: "1px solid rgba(59, 130, 246, 0.5)",
                borderRadius: "0.25rem"
              }
            }}
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