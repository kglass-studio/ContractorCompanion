import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { insertNoteSchema } from "@shared/schema";
import { z } from "zod";
import { FileUpload } from "@/components/ui/file-upload";
import { ImageIcon, Loader2, SendIcon } from "lucide-react";
import { useCreateNote } from "@/hooks/useNotes";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const noteFormSchema = insertNoteSchema.extend({
  text: z.string().min(1, "Note text is required"),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface AddNoteWithPhotoProps {
  clientId: number;
}

export function AddNoteWithPhoto({ clientId }: AddNoteWithPhotoProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { isOnline } = useOnlineStatus();
  const { toast } = useToast();
  const createNote = useCreateNote();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      clientId,
      text: "",
    },
  });

  const handleFileSelect = (file: File) => {
    setPhotoFile(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // If offline, we can't upload photos
      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Photos can't be uploaded while offline. Your note will be saved without the photo.",
          variant: "destructive",
        });
        return null;
      }

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/uploads/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: NoteFormValues) => {
    try {
      let photoUrl = null;
      
      // Upload photo if one was selected
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Submit note with photo URL if upload was successful
      await createNote.mutateAsync({
        ...values,
        photoUrl,
      });

      // Reset form
      form.reset();
      setPhotoFile(null);
      
      toast({
        title: "Note Added",
        description: "Your note has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isPending = form.formState.isSubmitting || createNote.isPending || isUploading;

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-medium">Add Note</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Enter your note here..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FileUpload
              onFileSelect={handleFileSelect}
              onClear={clearPhoto}
              accept="image/*"
              loading={isUploading}
              preview={photoFile ? URL.createObjectURL(photoFile) : null}
              label="Add Photo"
              maxSize={5} // 5MB
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center space-x-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}