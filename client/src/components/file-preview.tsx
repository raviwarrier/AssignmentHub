import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { File } from "@shared/schema";

interface FilePreviewProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: File) => void;
}

export default function FilePreview({ file, open, onOpenChange, onDownload }: FilePreviewProps) {
  if (!file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileTypeDisplay = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('.pdf')) return 'PDF Document';
    if (type.includes('.jpg') || type.includes('.jpeg')) return 'JPEG Image';
    if (type.includes('.png')) return 'PNG Image';
    if (type.includes('.docx')) return 'Word Document';
    if (type.includes('.pptx')) return 'PowerPoint Presentation';
    return 'Document';
  };

  const getPreviewContent = () => {
    const type = file.fileType.toLowerCase();
    
    if (type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png')) {
      return (
        <div className="bg-muted rounded-lg h-[70vh] flex items-center justify-center">
          <img 
            src={`/api/files/${file.id}/download`}
            alt={file.originalName}
            className="max-w-full max-h-full object-contain rounded"
            onError={(e) => {
              // Fallback to generic preview if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="text-center hidden">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-foreground">Image Preview</p>
            <p className="text-sm text-muted-foreground mt-2">Click download to view full image</p>
          </div>
        </div>
      );
    }

    // Generic preview for other file types
    const iconMap: { [key: string]: string } = {
      '.pdf': '📄',
      '.docx': '📝',
      '.pptx': '📊',
    };

    const icon = Object.keys(iconMap).find(ext => type.includes(ext));
    
    return (
      <div className="bg-muted rounded-lg h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon ? iconMap[icon] : '📁'}</div>
          <p className="text-foreground">{getFileTypeDisplay(file.fileType)}</p>
          <p className="text-sm text-muted-foreground mt-2">Click download to view full document</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[96vh] w-full h-full overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {file.originalName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Team {file.teamNumber} • {formatFileSize(file.fileSize)} • Uploaded {formatDate(file.uploadedAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              {file.assignment}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(file)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto">
          {/* File Preview */}
          {getPreviewContent()}
          
          {/* File Details */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Details</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex">
                  <dt className="text-muted-foreground w-20">Label:</dt>
                  <dd className="text-foreground">{file.label}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted-foreground w-20">Team:</dt>
                  <dd className="text-foreground">Team {file.teamNumber}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted-foreground w-20">Assignment:</dt>
                  <dd className="text-foreground">{file.assignment}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted-foreground w-20">Type:</dt>
                  <dd className="text-foreground">{getFileTypeDisplay(file.fileType)}</dd>
                </div>
                <div className="flex">
                  <dt className="text-muted-foreground w-20">Size:</dt>
                  <dd className="text-foreground">{formatFileSize(file.fileSize)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Tags & Description</h4>
              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {file.tags.map((tag, index) => (
                    <Badge key={index} className={`text-sm tag-color-${(index % 8) + 1}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {file.description ? (
                <p className="text-sm text-foreground">{file.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
