import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, createNote, deleteNote } from "@/lib/api";
import type { InsertNote } from "@shared/schema";

export function useNotesByClient(clientId: number) {
  return useQuery({
    queryKey: [`/api/clients/${clientId}/notes`],
    queryFn: async () => {
      return getNotes(clientId);
    },
    enabled: !!clientId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (note: InsertNote) => createNote(note),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${data.clientId}/notes`] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, clientId }: { id: number, clientId: number }) => deleteNote(id).then(() => clientId),
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
    },
  });
}
