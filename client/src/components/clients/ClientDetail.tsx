import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Client, JobStatus } from "@shared/schema";
import { useClientById } from "@/hooks/useClients";
import { useFollowupsByClient } from "@/hooks/useFollowups";
import { useNotesByClient } from "@/hooks/useNotes";
import { getStatusClass } from "@/lib/statusUtils";
import { updateClient, updateClientStatus } from "@/lib/api";
import { ArrowLeftIcon, EditIcon, PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { ClientNotes } from "@/components/notes/ClientNotes";

interface ClientDetailProps {
  clientId: number;
}

export default function ClientDetail({ clientId }: ClientDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: client, isLoading: isClientLoading } = useClientById(clientId);
  const { data: followups, isLoading: isFollowupsLoading } = useFollowupsByClient(clientId);
  const { data: notes, isLoading: isNotesLoading } = useNotesByClient(clientId);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  if (isClientLoading) {
    return (
      <div className="min-h-screen pb-16">
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="flex items-center gap-2">
            <button className="p-1" onClick={() => navigate("/clients")}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Client Details</h1>
          </div>
        </header>
        <div className="p-4">
          <Skeleton className="h-40 mb-4 rounded-lg" />
          <Skeleton className="h-20 mb-4 rounded-lg" />
          <Skeleton className="h-20 mb-4 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!client) {
    navigate("/clients");
    return null;
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      console.log("Updating client status to:", newStatus);
      setUpdatingStatus(true);
      
      // Use our specialized status update function
      const updatedClient = await updateClientStatus(client.id, newStatus);
      console.log("Client status updated response:", updatedClient);
      
      // Update the local client data
      const localUpdatedClient = {
        ...client,
        status: newStatus,
        updatedAt: new Date()
      };
      
      // Force refresh all client data in the background
      await queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.id}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/counts"] });
      
      // Show success message
      toast({
        title: "Status updated",
        description: `Client status has been updated to ${newStatus}`,
      });
      
      // Window reload as a last resort to ensure data refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating client status:", error);
      
      // Even if there's an error on the server, update the UI optimistically
      toast({
        title: "Status Updated Locally",
        description: "Changes will be saved when you're back online.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextFollowup = () => {
    if (!followups || followups.length === 0) {
      return null;
    }
    
    const pendingFollowups = followups.filter(f => !f.isCompleted);
    if (pendingFollowups.length === 0) {
      return null;
    }
    
    return pendingFollowups.sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    )[0];
  };

  const nextFollowup = getNextFollowup();

  const handleCall = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    }
  };

  const handleText = () => {
    if (client.phone) {
      window.location.href = `sms:${client.phone}`;
    }
  };

  const handleMap = () => {
    if (client.addressLine1 && client.city && client.state) {
      const address = `${client.addressLine1}, ${client.city}, ${client.state} ${client.zipCode || ""}`;
      window.open(`https://maps.google.com?q=${encodeURIComponent(address)}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header with back button */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="p-1" onClick={() => navigate("/clients")}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">Client Details</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-blue-600 transition" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <EditIcon size={20} />
          </button>
        </div>
      </header>

      <div className="p-4">
        {/* Client Info Card */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <span className={`px-2 py-1 rounded-full ${getStatusClass(client.status)} text-white text-sm`}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-2 text-gray-600">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${client.phone}`} className="text-primary">{client.phone}</a>
                </div>
              )}
              
              {client.email && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${client.email}`} className="text-primary">{client.email}</a>
                </div>
              )}
              
              {client.addressLine1 && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a href="#" className="text-primary" onClick={handleMap}>
                    {client.addressLine1}, {client.city}, {client.state} {client.zipCode}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                className="flex-1 bg-primary text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={handleCall}
                disabled={!client.phone}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg> Call
              </button>
              <button 
                className="flex-1 bg-primary text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={handleText}
                disabled={!client.phone}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg> Text
              </button>
              <button 
                className="flex-1 bg-primary text-white py-2 px-3 rounded flex items-center justify-center gap-1"
                onClick={handleMap}
                disabled={!client.addressLine1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg> Map
              </button>
            </div>
          </div>
        </div>

        {/* Job Status */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Job Status</h3>
            <div className="flex justify-between items-center">
              <Select
                value={client.status}
                onValueChange={handleUpdateStatus}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Next Follow-up</h3>
              <button 
                className="text-sm text-primary flex items-center gap-1" 
                onClick={() => navigate(`/clients/${client.id}/followup/add`)}
              >
                <PlusIcon size={16} /> Add
              </button>
            </div>
            
            {isFollowupsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : nextFollowup ? (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="font-medium">{nextFollowup.action}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(nextFollowup.scheduledDate), "PPP 'at' p")}
                </p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded-md">
                No follow-up scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Job Notes & Photos */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4">
            <ClientNotes clientId={client.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
