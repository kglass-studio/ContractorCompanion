import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFollowups, getFollowupsByClient, createFollowup, updateFollowup, completeFollowup, deleteFollowup } from "@/lib/api";
import type { Followup, InsertFollowup } from "@shared/schema";

interface UseFollowupsOptions {
  today?: boolean;
}

export function useFollowups(options: UseFollowupsOptions = {}) {
  const queryKey = options.today 
    ? ["/api/followups", { today: true }]
    : ["/api/followups"];

  return useQuery({
    queryKey,
    queryFn: async () => {
      return getFollowups(options.today);
    },
  });
}

export function useFollowupsByClient(clientId: number) {
  return useQuery({
    queryKey: [`/api/clients/${clientId}/followups`],
    queryFn: async () => {
      return getFollowupsByClient(clientId);
    },
    enabled: !!clientId,
  });
}

export function useCreateFollowup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (followup: InsertFollowup) => createFollowup(followup),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ["/api/followups"] });
    },
  });
}

export function useUpdateFollowup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Followup> }) => updateFollowup(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ["/api/followups"] });
    },
  });
}

export function useCompleteFollowup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => completeFollowup(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ["/api/followups"] });
    },
  });
}

export function useDeleteFollowup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteFollowup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followups"] });
    },
  });
}
