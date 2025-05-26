import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, JobStatus } from "@shared/schema";
import { createClient, createNote, createFollowup } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { LightbulbIcon, PhoneIcon, MapPinIcon, CalendarIcon, FileIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Define form steps
const STEPS = {
  BASIC_INFO: 0,
  CONTACT_INFO: 1,
  ADDRESS: 2,
  JOB_DETAILS: 3,
  FOLLOWUP: 4,
};

// Extend the client schema with additional fields for the form
const clientFormSchema = insertClientSchema.extend({
  initialNotes: z.string().optional(),
  followupAction: z.string().optional(),
  followupDate: z.string().optional(),
  followupTime: z.string().optional(),
  reminder: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddClientModal({ open, onOpenChange }: AddClientModalProps) {
  const [step, setStep] = useState(STEPS.BASIC_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with default values
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
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

  // Reset form and step when modal is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setStep(STEPS.BASIC_INFO);
      setPhotoFile(null);
    }
    onOpenChange(open);
  };

  // Navigate to next step
  const nextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  // Navigate to previous step
  const prevStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  // Handle form submission
  const onSubmit = async (values: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Starting client creation with values:", values);
      console.log("Photo file selected:", photoFile);
      
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
      
      // Create a client object with required fields
      const clientData = {
        name: values.name,
        phone: values.phone,
        email: values.email || "",
        addressLine1: values.addressLine1 || "",
        city: values.city || "",
        state: values.state || "",
        zipCode: values.zipCode || "",
        status: values.status || "lead",
      };
      
      console.log("Sending client data to API:", clientData);
      
      // Create client - userId will be added by the server
      const client = await createClient(clientData);
      
      // Create initial note if provided
      if (values.initialNotes) {
        let photoUrl = null;
        
        // Upload photo if one was selected
        if (photoFile) {
          try {
            console.log("Uploading photo...");
            const formData = new FormData();
            formData.append("photo", photoFile);
            
            const response = await fetch("/api/uploads/photos", {
              method: "POST",
              body: formData,
            });
            
            if (response.ok) {
              const uploadResult = await response.json();
              photoUrl = uploadResult.url;
              console.log("Photo uploaded successfully:", photoUrl);
            } else {
              console.error("Failed to upload photo");
            }
          } catch (error) {
            console.error("Error uploading photo:", error);
          }
        }
        
        await createNote({
          clientId: client.id,
          text: values.initialNotes,
          photoUrl,
        });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/counts"] });
      
      // Show success toast and close modal
      toast({
        title: "Client created",
        description: `${values.name} has been added successfully`,
      });
      
      handleOpenChange(false);
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

  // Get tips based on current step
  const getTip = () => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return "Start with the client's name. This will help you quickly identify them in your list.";
      case STEPS.CONTACT_INFO:
        return "Adding both phone and email gives you multiple ways to reach your client.";
      case STEPS.ADDRESS:
        return "Adding the job location will help you plan your day and route efficiently.";
      case STEPS.JOB_DETAILS:
        return "Keep track of where you are in the sales process with status updates.";
      case STEPS.FOLLOWUP:
        return "Setting a follow-up reminder helps ensure no client falls through the cracks.";
      default:
        return "";
    }
  };

  // Determine if the current step is valid and can proceed
  const isStepValid = () => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return !!form.getValues("name");
      case STEPS.CONTACT_INFO:
        return !!form.getValues("phone");
      case STEPS.ADDRESS:
        return true; // Address is optional
      case STEPS.JOB_DETAILS:
        return !!form.getValues("status");
      case STEPS.FOLLOWUP:
        // Either all follow-up fields are filled or none
        const { followupAction, followupDate, followupTime } = form.getValues();
        return (
          (!!followupAction && !!followupDate && !!followupTime) ||
          (!followupAction && !followupDate && !followupTime)
        );
      default:
        return false;
    }
  };

  // Animations for step transitions
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  // Determine which form fields to show based on current step
  const renderFormStep = () => {
    const direction = step > STEPS.BASIC_INFO ? 1 : -1;

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {step === STEPS.BASIC_INFO && (
            <div className="space-y-4">
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
            </div>
          )}

          {step === STEPS.CONTACT_INFO && (
            <div className="space-y-4">
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
          )}

          {step === STEPS.ADDRESS && (
            <div className="space-y-4">
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
          )}

          {step === STEPS.JOB_DETAILS && (
            <div className="space-y-4">
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
                  {photoFile ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img 
                        src={URL.createObjectURL(photoFile)} 
                        alt="Selected photo" 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                console.log("Photo selected:", file.name, file.size);
                                setPhotoFile(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPhotoFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="flex flex-col items-center text-gray-500"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            console.log("Photo selected:", file.name, file.size);
                            setPhotoFile(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">Take or Upload Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === STEPS.FOLLOWUP && (
            <div className="space-y-4">
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
        </motion.div>
      </AnimatePresence>
    );
  };

  // Render tip section with animation
  const renderTip = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-md"
        >
          <LightbulbIcon className="h-5 w-5 text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">{getTip()}</p>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const icons = [
      <LightbulbIcon key="basic" className="h-4 w-4" />,
      <PhoneIcon key="contact" className="h-4 w-4" />,
      <MapPinIcon key="address" className="h-4 w-4" />,
      <FileIcon key="job" className="h-4 w-4" />,
      <CalendarIcon key="followup" className="h-4 w-4" />,
    ];

    return (
      <div className="flex justify-center gap-2 my-6">
        {Object.values(STEPS).filter(value => typeof value === 'number').map((stepValue) => (
          <div
            key={stepValue}
            className={`flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 ${
              stepValue === step
                ? "bg-primary text-white scale-110"
                : stepValue < step
                ? "bg-green-100 text-green-600 border border-green-300"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {icons[stepValue as number]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === STEPS.BASIC_INFO && "Let's add a new client"}
            {step === STEPS.CONTACT_INFO && "How can you reach them?"}
            {step === STEPS.ADDRESS && "Where's the job located?"}
            {step === STEPS.JOB_DETAILS && "What's the job about?"}
            {step === STEPS.FOLLOWUP && "Plan your follow-up"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === STEPS.BASIC_INFO && "Start with the basic information"}
            {step === STEPS.CONTACT_INFO && "Add contact details to stay in touch"}
            {step === STEPS.ADDRESS && "Add the job location for easier planning"}
            {step === STEPS.JOB_DETAILS && "Keep track of job details and progress"}
            {step === STEPS.FOLLOWUP && "Never miss a follow-up with reminders"}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderFormStep()}
            {renderTip()}

            <DialogFooter className="gap-2 mt-6">
              {step > STEPS.BASIC_INFO && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Back
                </Button>
              )}
              
              {step < STEPS.FOLLOWUP ? (
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={!isStepValid() || isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => {
                    console.log("Create client button clicked");
                    const formValues = form.getValues();
                    console.log("Form values:", formValues);
                    onSubmit(formValues);
                  }}
                  disabled={isSubmitting || !isStepValid()}
                  className="flex-1 sm:flex-none"
                >
                  {isSubmitting ? "Creating..." : "Create Client"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}