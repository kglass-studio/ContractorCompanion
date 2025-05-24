import { useState } from "react";
import { useLocation } from "wouter";
import { useClients } from "@/hooks/useClients";
import { PlusIcon, ArrowLeftIcon, SearchIcon, FilterIcon, MapPin, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusClass } from "@/lib/statusUtils";
import { Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getNotes } from "@/lib/api";

// Create a local ClientCard component for the list view
interface ClientCardProps {
  client: Client;
}

function ClientCard({ client }: ClientCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: notes } = useQuery({
    queryKey: [`/api/clients/${client.id}/notes`],
    enabled: !!client.id,
  });

  const getLatestNote = () => {
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return "No notes yet";
    }
    
    const latestNote = notes[0];
    const text = latestNote.text.length > 35 
      ? latestNote.text.substring(0, 35) + "..." 
      : latestNote.text;
    
    return text;
  };

  const handleClientClick = () => {
    navigate(`/clients/${client.id}`);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    } else {
      toast({
        title: "No phone number",
        description: "This client doesn't have a phone number",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.phone) {
      window.location.href = `sms:${client.phone}`;
    } else {
      toast({
        title: "No phone number",
        description: "This client doesn't have a phone number",
        variant: "destructive",
      });
    }
  };

  const handleMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.addressLine1 && client.city && client.state) {
      const address = `${client.addressLine1}, ${client.city}, ${client.state} ${client.zipCode || ""}`;
      window.open(`https://maps.google.com?q=${encodeURIComponent(address)}`, "_blank");
    } else {
      toast({
        title: "No address",
        description: "This client doesn't have a complete address",
        variant: "destructive",
      });
    }
  };

  const statusName = client.status.charAt(0).toUpperCase() + client.status.slice(1);

  return (
    <div className="bg-white rounded-lg shadow cursor-pointer" onClick={handleClientClick}>
      <div className="p-3">
        <div className="flex justify-between">
          <h3 className="font-semibold">{client.name}</h3>
          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(client.status)} text-white`}>
            {statusName}
          </span>
        </div>
        <p className="text-sm text-gray-600">{getLatestNote()}</p>
        <div className="mt-2 flex gap-3">
          <button className="p-1 text-primary" aria-label="Call" onClick={handleCall}>
            <Phone size={16} />
          </button>
          <button className="p-1 text-primary" aria-label="Message" onClick={handleMessage}>
            <MessageSquare size={16} />
          </button>
          <button className="p-1 text-primary" aria-label="Map" onClick={handleMap}>
            <MapPin size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClientListProps {
  statusFilter?: string;
}

export default function ClientList({ statusFilter }: ClientListProps) {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState(statusFilter || "all");
  const { data: clients, isLoading } = useClients({ status: activeFilter !== "all" ? activeFilter : undefined });

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      navigate("/clients");
    } else {
      navigate(`/clients?status=${filter}`);
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
            <h1 className="text-xl font-bold">All Clients</h1>
          </div>
          <div>
            <button className="p-2 rounded-full hover:bg-blue-600 transition" aria-label="Search">
              <SearchIcon size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-blue-600 transition" aria-label="Filter">
              <FilterIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Options */}
      <div className="px-4 py-2 bg-white border-b flex gap-2 overflow-x-auto">
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("all")}
        >
          All Clients
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "lead" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("lead")}
        >
          Leads
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "quoted" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("quoted")}
        >
          Quoted
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "scheduled" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("scheduled")}
        >
          Scheduled
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "completed" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("completed")}
        >
          Completed
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "paid" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("paid")}
        >
          Paid
        </button>
      </div>

      {/* Client List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-3 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded w-8"></div>
                <div className="h-8 bg-gray-100 rounded w-8"></div>
                <div className="h-8 bg-gray-100 rounded w-8"></div>
              </div>
            </div>
          ))
        ) : clients && clients.length > 0 ? (
          clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-3 text-center text-gray-500">
            No clients found. Add your first client!
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button 
        size="icon"
        className="fixed bottom-20 right-4 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-10 text-2xl"
        onClick={() => navigate("/clients/add")}
      >
        <PlusIcon size={24} />
      </Button>
    </div>
  );
}
