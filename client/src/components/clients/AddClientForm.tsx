import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, JobStatus } from "@shared/schema";
import { createClient, createNote, createFollowup } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export default function AddClientForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(insertClientSchema.extend({
      initialNotes: z.string().optional(),
      followupAction: z.string().optional(),
      followupDate: z.string().optional(),
      followupTime: z.string().optional(),
      reminder: z.boolean().default(true),
    })),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      addressLine1: "",
      city: "",
      state: "",
      zipCode: "",
      status: JobStatus.LEAD,
      initialNotes: "",
      followupAction: "",
      followupDate: "",
      followupTime: "",
      reminder: true,
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      console.log("Submitting client:", values);
      
      // Validate required fields
      if (!values.name || !values.phone) {
        toast({
          title: "Missing information",
          description: "Name and phone number are required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create client with empty strings for optional text fields
      const client = await createClient({
        name: values.name,
        phone: values.phone,
        email: values.email || "",
        addressLine1: values.addressLine1 || "",
        city: values.city || "",
        state: values.state || "",
        zipCode: values.zipCode || "",
        status: values.status || "lead",
      });
      
      console.log("Client created:", client);
      
      // Create initial note if provided or if there's a photo
      if (values.initialNotes || selectedFile) {
        try {
          // Create a FormData object for the file upload
          const formData = new FormData();
          
          // Add the note text
          const noteText = values.initialNotes || `Initial photo for ${client.name}`;
          formData.append('text', noteText);
          formData.append('clientId', client.id.toString());
          
          // Add the file if available
          if (selectedFile) {
            formData.append('photo', selectedFile);
          }
          
          // Create the note with the photo
          await fetch('/api/notes', {
            method: 'POST',
            body: formData,
          });
          
          console.log("Note created with photo");
        } catch (error) {
          console.error("Error creating initial note:", error);
          toast({
            title: "Error",
            description: "Failed to create initial note, but client was created",
            variant: "destructive",
          });
        }
      }
      
      // Create followup if provided
      if (values.followupAction && values.followupDate && values.followupTime) {
        const scheduledDate = new Date(`${values.followupDate}T${values.followupTime}`);
        
        await createFollowup({
          clientId: client.id,
          action: values.followupAction,
          scheduledDate,
          reminder: values.reminder,
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "Client created",
        description: `${values.name} has been added successfully`,
      });
      
      navigate(`/clients/${client.id}`);
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header with back button */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="p-1" onClick={() => navigate("/")}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Add New Client</h1>
          </div>
          <Button 
            type="submit" 
            variant="outline" 
            size="sm" 
            className="bg-white text-primary font-medium hover:bg-gray-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="p-4">
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted directly");
            const formValues = form.getValues();
            onSubmit(formValues);
          }} className="space-y-4">
            {/* Basic Info Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Client Information</h2>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Address Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Job Address</h2>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="ZIP code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Job Details Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Job Details</h2>
              
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                
                <FormField
                  control={form.control}
                  name="initialNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about the job..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Add Photo</FormLabel>
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
                    <label htmlFor="photo-upload-full" className="flex flex-col items-center text-gray-500 cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">Take or Upload Photo</span>
                      <input 
                        id="photo-upload-full"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            toast({
                              title: "Photo selected",
                              description: `File "${file.name}" will be attached to the initial note`,
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Follow-up Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Follow-up</h2>
              
              <div className="space-y-3">
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
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
