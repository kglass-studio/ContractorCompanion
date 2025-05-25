import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function TestNotification() {
  const [title, setTitle] = useState("Follow-up Reminder");
  const [message, setMessage] = useState("You have a client follow-up due today");
  const { toast } = useToast();

  const createTestNotification = async () => {
    try {
      // Create a notification using the toast system directly
      toast({
        title: title,
        description: message,
        variant: "default"
      });

      // Try to create a server notification
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, message })
      });

      if (!response.ok) {
        // If server notification fails, we'll just use the toast one
        console.log("Server notification creation failed - using toast only");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Notification</CardTitle>
        <CardDescription>
          Create a test notification to see how the system works
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Notification Message</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={createTestNotification}>
          Create Test Notification
        </Button>
      </CardFooter>
    </Card>
  );
}