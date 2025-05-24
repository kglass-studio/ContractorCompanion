import { useState } from "react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Followup } from "@shared/schema";
import { useClientById } from "@/hooks/useClients";
import { useCompleteFollowup } from "@/hooks/useFollowups";
import { getStatusClass } from "@/lib/statusUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckIcon, ClockIcon } from "lucide-react";

interface FollowupCardProps {
  followup: Followup;
}

export default function FollowupCard({ followup }: FollowupCardProps) {
  const [, navigate] = useLocation();
  const { data: client, isLoading } = useClientById(followup.clientId);
  const completeFollowupMutation = useCompleteFollowup();
  const [isCompleting, setIsCompleting] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-3 border-l-4 border-primary">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const formattedTime = format(new Date(followup.scheduledDate), "h:mm a");
  const formattedAction = followup.action.length > 30 
    ? followup.action.substring(0, 30) + "..." 
    : followup.action;

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await completeFollowupMutation.mutateAsync(followup.id);
      toast({
        title: "Followup completed",
        description: "The followup has been marked as complete",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete the followup",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const navigateToClient = () => {
    navigate(`/clients/${client.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 border-l-4 border-primary">
      <div className="flex justify-between items-start">
        <div onClick={navigateToClient} className="cursor-pointer">
          <p className="font-medium">{formattedAction}</p>
          <p className="text-sm text-gray-600">{formattedTime} - Re: {client.name}</p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`p-2 text-primary ${isCompleting ? 'opacity-50' : ''}`} 
            onClick={handleComplete}
            disabled={isCompleting}
          >
            <CheckIcon size={16} />
          </button>
          <button className="p-2 text-gray-500" onClick={() => navigate(`/followups/${followup.id}/edit`)}>
            <ClockIcon size={16} />
          </button>
        </div>
      </div>
      <div className="mt-1 flex items-center">
        <span className="text-sm text-gray-600 truncate mr-2">{client.name}</span>
        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(client.status)} text-white`}>
          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
        </span>
      </div>
    </div>
  );
}
