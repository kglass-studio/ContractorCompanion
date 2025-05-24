import { useLocation } from "wouter";
import { Client } from "@shared/schema";
import { getStatusClass } from "@/lib/statusUtils";
import { getNotes } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MapPinIcon, PhoneIcon, MessageSquareIcon } from "lucide-react";

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: notes } = useQuery({
    queryKey: [`/api/clients/${client.id}/notes`],
    enabled: !!client.id,
  });

  const getLatestNote = () => {
    if (!notes || notes.length === 0) {
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
            <PhoneIcon size={16} />
          </button>
          <button className="p-1 text-primary" aria-label="Message" onClick={handleMessage}>
            <MessageSquareIcon size={16} />
          </button>
          <button className="p-1 text-primary" aria-label="Map" onClick={handleMap}>
            <MapPinIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
