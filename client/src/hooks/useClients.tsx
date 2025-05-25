import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, getClient, createClient, updateClient, deleteClient, getDashboardCounts, updateClientStatus } from "@/lib/api";
import type { Client, InsertClient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface UseClientsOptions {
  status?: string;
  limit?: number;
}

export function useClients(options: UseClientsOptions = {}) {
  const queryKey = options.status 
    ? ["/api/clients", { status: options.status }]
    : ["/api/clients"];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const clients = await getClients(options.status);
      return options.limit ? clients.slice(0, options.limit) : clients;
    },
  });
}

export function useClientById(id: number) {
  return useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: async () => {
      return getClient(id);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (client: InsertClient) => createClient(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Client> }) => updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
  });
}

export function useDashboardCounts() {
  return useQuery({
    queryKey: ["/api/dashboard/counts"],
    queryFn: getDashboardCounts,
  });
}

// New dedicated hook for status updates
export function useUpdateClientStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      try {
        // Use direct fetch instead of the API function
        const response = await fetch(`/api/clients/${id}/update-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update status: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error updating client status:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Force immediate update of client data in query cache
      queryClient.setQueryData([`/api/clients/${variables.id}`], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            status: variables.status,
            updatedAt: new Date()
          };
        }
        return oldData;
      });
      
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/counts"] });
      
      // Show success message
      toast({
        title: "Status updated",
        description: `Client status has been updated to ${variables.status}`,
      });
    },
    onError: (error) => {
      console.error('Error during status update mutation:', error);
      toast({
        title: "Error updating status",
        description: "Please try again or check your connection.",
        variant: "destructive"
      });
    }
  });
}
