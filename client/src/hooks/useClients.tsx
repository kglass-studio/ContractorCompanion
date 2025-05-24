import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, getClient, createClient, updateClient, deleteClient, getDashboardCounts } from "@/lib/api";
import type { Client, InsertClient } from "@shared/schema";

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
