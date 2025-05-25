import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useClientById } from "@/hooks/useClients";
import { useCreateFollowup } from "@/hooks/useFollowups";
import { insertFollowupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AddFollowupPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const clientId = parseInt(params.id || "0");
  const { data: client } = useClientById(clientId);
  const createFollowup = useCreateFollowup();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    action: z.string().min(1, "Action is required"),
    scheduledDate: z.string().min(1, "Date is required"),
    scheduledTime: z.string().min(1, "Time is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      action: "",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      scheduledTime: format(new Date(), "HH:mm"),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!client) return;
    
    try {
      setIsSubmitting(true);
      
      // Combine date and time into a single Date object
      const { scheduledDate, scheduledTime, action } = values;
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Create the followup with stringified date that the server expects
      await createFollowup.mutateAsync({
        clientId: client.id,
        action,
        scheduledDate: dateTime.toISOString(),
        isCompleted: false,
        reminder: true,
      });
      
      toast({
        title: "Follow-up added",
        description: "Your follow-up has been scheduled",
      });
      
      navigate(`/clients/${client.id}`);
    } catch (error) {
      console.error("Failed to create follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to add follow-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen pb-16">
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <button 
              className="p-1" 
              onClick={() => navigate("/clients")}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Add Follow-up</h1>
          </div>
        </header>
        <div className="p-4 text-center">Client not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center gap-2">
          <button 
            className="p-1" 
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-bold">Add Follow-up</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">
            New Follow-up for {client.name}
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Call to confirm, Send quote" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Follow-up"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}