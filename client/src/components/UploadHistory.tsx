import { useState } from "react";
import { Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Upload {
  id: number;
  originalFilename: string;
  fileSize: number;
  cdnLink: string;
  uploadedAt: Date;
  mimeType: string;
}

interface UploadHistoryProps {
  uploads: Upload[];
  isLoading?: boolean;
}

export function UploadHistory({ uploads, isLoading }: UploadHistoryProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma imagem enviada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-medium truncate text-sm">{upload.originalFilename}</p>
              <Badge variant="outline" className="text-xs">
                {formatFileSize(upload.fileSize)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(upload.uploadedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={() => copyToClipboard(upload.cdnLink, upload.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Copiar link CDN"
            >
              {copiedId === upload.id ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>

            <Button
              onClick={() => window.open(upload.cdnLink, "_blank")}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Abrir imagem"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
