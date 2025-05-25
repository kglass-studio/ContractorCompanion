import { Note } from "@shared/schema";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NoteWithPhotoProps {
  note: Note;
  onDelete?: (id: number) => void;
}

export function NoteWithPhoto({ note, onDelete }: NoteWithPhotoProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  
  const formattedDate = note.createdAt 
    ? format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a") 
    : "Unknown date";

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formattedDate}
        </div>
        
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full text-gray-500 hover:text-red-500"
            onClick={() => onDelete(note.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap mb-3">
        {note.text}
      </div>
      
      {note.photoUrl && (
        <div className="mt-2">
          <div 
            className="cursor-pointer"
            onClick={() => setIsImageOpen(true)}
          >
            <div className="relative w-full h-32 overflow-hidden rounded-md">
              <img 
                src={note.photoUrl} 
                alt="Note attachment" 
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white p-1 rounded-tl-md">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-none">
              <DialogClose className="absolute right-2 top-2 z-10 bg-black bg-opacity-50 rounded-full p-1">
                <X className="h-4 w-4 text-white" />
              </DialogClose>
              <div className="w-full max-h-[80vh] overflow-auto">
                <img 
                  src={note.photoUrl} 
                  alt="Note attachment" 
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}