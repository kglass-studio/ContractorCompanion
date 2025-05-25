import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  className?: string;
  accept?: string;
  preview?: string | null;
  loading?: boolean;
  maxSize?: number; // in MB
  label?: string;
}

export function FileUpload({
  onFileSelect,
  onClear,
  className,
  accept = "image/*",
  preview,
  loading = false,
  maxSize = 5, // Default 5MB
  label = "Upload photo"
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Check file type if accept is specified
    if (accept !== "*" && !file.type.match(accept.replace(/\*/g, ".*"))) {
      setError(`Invalid file type. Please upload ${accept.replace("image/*", "an image")}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      // Create a preview URL for the file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear?.();
    setError(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {!previewUrl ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-gray-50",
            dragging ? "border-primary bg-primary/5" : "border-gray-300",
            error ? "border-red-500 bg-red-50" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium mb-1">{label}</p>
            <p className="text-xs text-gray-500">
              Drag and drop or click to upload
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2Icon className="h-8 w-8 text-white animate-spin" />
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0 rounded-full opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
        </div>
      )}
    </div>
  );
}