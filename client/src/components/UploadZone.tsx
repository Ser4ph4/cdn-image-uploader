import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  preview?: string;
  onClearPreview?: () => void;
}

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadZone({ onFileSelect, isLoading, preview, onClearPreview }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError("Formato de arquivo não suportado. Use: JPG, PNG, GIF, WebP ou SVG");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Arquivo muito grande. Máximo: 10MB");
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative w-full max-w-md mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg border border-border shadow-md"
          />
          <button
            onClick={onClearPreview}
            disabled={isLoading}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative w-full border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 bg-background"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(",")}
          onChange={handleFileInput}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center">
            <p className="font-semibold text-foreground">
              {isDragActive ? "Solte a imagem aqui" : "Arraste a imagem aqui ou clique para selecionar"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, GIF, WebP ou SVG (máx. 10MB)
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            variant="outline"
            className="mt-2"
          >
            Selecionar Arquivo
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
