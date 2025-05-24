import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema, JobStatus } from "@shared/schema";
import { createNote, updateClient, createFollowup } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useClientById } from "@/hooks/useClients";
import { z } from "zod";

interface AddNoteFormProps {
  clientId: number;
}

export default function AddNoteForm({ clientId }: AddNoteFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: client } = useClientById(clientId);
  const [enableFollowup, setEnableFollowup] = useState(false);

  const formSchema = z.object({
    text: z.string().min(1, "Note text is required"),
    statusChange: z.string().default("no-change"),
    followupAction: z.string().optional(),
    followupDate: z.string().optional(),
    followupTime: z.string().optional(),
    reminder: z.boolean().default(true),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      statusChange: "no-change",
      followupAction: "",
      followupDate: "",
      followupTime: "",
      reminder: true,
    },
  });

  const onSubmit = async (values) => {
    if (!client) return;
    
    try {
      setIsSubmitting(true);
      
      // Create note
      await createNote({
        clientId,
        text: values.text,
      });
      
      // Update client status if changed
      if (values.statusChange !== "no-change") {
        await updateClient(clientId, {
          status: values.statusChange,
        });
      }
      
      // Create followup if enabled
      if (enableFollowup && values.followupAction && values.followupDate && values.followupTime) {
        const scheduledDate = new Date(`${values.followupDate}T${values.followupTime}`);
        
        await createFollowup({
          clientId,
          action: values.followupAction,
          scheduledDate,
          reminder: values.reminder,
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
      
      toast({
        title: "Note added",
        description: "Your note has been added successfully",
      });
      
      navigate(`/clients/${clientId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header with back button */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="p-1" onClick={() => navigate(`/clients/${clientId}`)}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Add Note</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white text-primary font-medium hover:bg-gray-100"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            Save
          </Button>
        </div>
      </header>

      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter note details..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-4 flex gap-4">
                <button type="button" className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-3 flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Photo</span>
                </button>
                
                <button type="button" className="flex flex-col items-center justify-center bg-gray-100 rounded-md p-3 flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-sm">Voice</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Update Job Status</h3>
                <FormField
                  control={form.control}
                  name="statusChange"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="No change" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-change">No change</SelectItem>
                          <SelectItem value={JobStatus.LEAD}>Lead</SelectItem>
                          <SelectItem value={JobStatus.QUOTED}>Quoted</SelectItem>
                          <SelectItem value={JobStatus.SCHEDULED}>Scheduled</SelectItem>
                          <SelectItem value={JobStatus.COMPLETED}>Completed</SelectItem>
                          <SelectItem value={JobStatus.PAID}>Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Set Follow-up</h3>
                <div className="form-check form-switch">
                  <Checkbox
                    id="enable-followup"
                    checked={enableFollowup}
                    onCheckedChange={(checked) => setEnableFollowup(!!checked)}
                  />
                  <label htmlFor="enable-followup" className="ml-2 text-sm">
                    Enable
                  </label>
                </div>
              </div>
              
              {enableFollowup && (
                <div className="space-y-3 mt-3">
                  <FormField
                    control={form.control}
                    name="followupAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Step</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Call to confirm, Send quote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="followupDate"
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
                      name="followupTime"
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
                  
                  <FormField
                    control={form.control}
                    name="reminder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Send reminder notification
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
