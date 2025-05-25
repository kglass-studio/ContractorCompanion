import React, { useState } from "react";
import { useLocation } from "wouter";
import { JobStatus } from "@shared/schema";
import { createClient, createNote, createFollowup } from "@/lib/api";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

export default function AddClientForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [status, setStatus] = useState(JobStatus.LEAD);
  const [initialNotes, setInitialNotes] = useState("");
  const [followupAction, setFollowupAction] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");
  const [reminder, setReminder] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("Starting client submission process");
      setIsSubmitting(true);
      
      // Validate required fields
      if (!name || !phone) {
        console.log("Validation failed: missing required fields");
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
        name,
        phone,
        email: email || "",
        addressLine1: addressLine1 || "",
        city: city || "",
        state: state || "",
        zipCode: zipCode || "",
        status: status || "lead",
      });
      
      console.log("Client created:", client);
      
      // Create initial note if provided or if there's a photo
      if (initialNotes || selectedFile) {
        try {
          if (selectedFile) {
            // Create a FormData object for the file upload
            const formData = new FormData();
            
            // Add the note text
            const noteText = initialNotes || `Initial photo for ${name}`;
            formData.append('text', noteText);
            formData.append('clientId', client.id.toString());
            
            // Add the file
            formData.append('photo', selectedFile);
            
            // Create the note with the photo
            await fetch('/api/notes', {
              method: 'POST',
              body: formData,
            });
            
            console.log("Note created with photo");
          } else {
            // If no photo, use the regular API
            await createNote({
              clientId: client.id,
              text: initialNotes || '',
            });
            console.log("Regular note created");
          }
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
      if (followupAction && followupDate && followupTime) {
        const scheduledDate = new Date(`${followupDate}T${followupTime}`);
        
        await createFollowup({
          clientId: client.id,
          action: followupAction,
          scheduledDate,
          reminder,
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "Client created",
        description: `${name} has been added successfully`,
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
    <div className="min-h-screen pb-16 bg-gray-50">
      {/* Header with back button */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button type="button" className="p-1" onClick={() => navigate("/")}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Add New Client</h1>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="bg-white text-primary font-medium hover:bg-gray-100"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Client Information</h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name" 
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input 
                  id="phone"
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number" 
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address" 
                />
              </div>
            </div>
          </div>
          
          {/* Address Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Job Address</h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="addressLine1">Street Address</Label>
                <Input 
                  id="addressLine1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input 
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="ZIP code" 
                />
              </div>
            </div>
          </div>
          
          {/* Job Details Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Job Details</h2>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as any)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JobStatus.LEAD}>Lead</SelectItem>
                    <SelectItem value={JobStatus.QUOTED}>Quoted</SelectItem>
                    <SelectItem value={JobStatus.SCHEDULED}>Scheduled</SelectItem>
                    <SelectItem value={JobStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={JobStatus.PAID}>Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="initialNotes">Initial Notes</Label>
                <Textarea
                  id="initialNotes"
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  placeholder="Add notes about the job..."
                  className="resize-none"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Add Photo</Label>
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
                  <label htmlFor="photo-upload" className="flex flex-col items-center text-gray-500 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Take or Upload Photo</span>
                    <input 
                      id="photo-upload"
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
              <div>
                <Label htmlFor="followupAction">Next Step</Label>
                <Input 
                  id="followupAction"
                  value={followupAction}
                  onChange={(e) => setFollowupAction(e.target.value)}
                  placeholder="e.g., Call to confirm, Send quote" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="followupDate">Date</Label>
                  <Input 
                    id="followupDate"
                    type="date" 
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="followupTime">Time</Label>
                  <Input 
                    id="followupTime"
                    type="time" 
                    value={followupTime}
                    onChange={(e) => setFollowupTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reminder" 
                  checked={reminder}
                  onCheckedChange={(checked) => setReminder(checked as boolean)} 
                />
                <Label 
                  htmlFor="reminder"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send reminder notification
                </Label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
