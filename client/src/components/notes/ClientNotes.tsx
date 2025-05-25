import { useNotesByClient, useDeleteNote } from "@/hooks/useNotes";
import { NoteWithPhoto } from "./NoteWithPhoto";
import { AddNoteWithPhoto } from "./AddNoteWithPhoto";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesProps {
  clientId: number;
}

export function ClientNotes({ clientId }: ClientNotesProps) {
  const { data: notes, isLoading, isError } = useNotesByClient(clientId);
  const { toast } = useToast();
  const deleteNote = useDeleteNote();
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);

  const handleDelete = async () => {
    if (noteToDelete !== null) {
      try {
        await deleteNote.mutateAsync({ id: noteToDelete, clientId });
        toast({
          title: "Note Deleted",
          description: "The note has been deleted successfully."
        });
      } catch (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive"
        });
      } finally {
        setNoteToDelete(null);
      }
    }
  };

  const confirmDelete = (id: number) => {
    setNoteToDelete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notes & Photos</h2>
        <Button 
          size="sm" 
          variant={showAddNote ? "outline" : "default"}
          onClick={() => setShowAddNote(!showAddNote)}
        >
          {showAddNote ? (
            "Cancel"
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Note
            </>
          )}
        </Button>
      </div>

      {showAddNote && (
        <AddNoteWithPhoto clientId={clientId} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : isError ? (
        <div className="py-6 text-center text-gray-500">
          Error loading notes. Please try again.
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteWithPhoto 
              key={note.id} 
              note={note} 
              onDelete={confirmDelete}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500 border rounded-lg">
          No notes yet. Add a note to get started.
        </div>
      )}

      <AlertDialog open={noteToDelete !== null} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this note and any attached photos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {deleteNote.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}