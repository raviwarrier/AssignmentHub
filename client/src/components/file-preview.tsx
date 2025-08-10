import { useState, useRef, useEffect } from "react";
import { X, Download, Maximize, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Move, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { File } from "@shared/schema";

interface FilePreviewProps {
  file: File | null;
  onClose: () => void;
  onDownload: () => void;
}

export default function FilePreview({ file, onClose, onDownload }: FilePreviewProps) {
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [adminPassword, setAdminPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  if (!file) return null;

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ fileId, adminPassword }: { fileId: string; adminPassword: string }) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminPassword }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "File deleted successfully",
      });
      // Refresh files list
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      onClose(); // Close the preview modal
      setAdminPassword("");
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete file. Please check your password.",
      });
      setAdminPassword("");
    },
  });

  // Reset image controls when file changes
  useEffect(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
    setAdminPassword("");
    setShowDeleteDialog(false);
    setIsPanelCollapsed(true);
  }, [file?.id]);

  // Add keyboard support for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imageScale > 1) {
        const step = 50;
        switch (e.key) {
          case 'ArrowLeft':
            setImagePosition(prev => ({ ...prev, x: prev.x + step }));
            e.preventDefault();
            break;
          case 'ArrowRight':
            setImagePosition(prev => ({ ...prev, x: prev.x - step }));
            e.preventDefault();
            break;
          case 'ArrowUp':
            setImagePosition(prev => ({ ...prev, y: prev.y + step }));
            e.preventDefault();
            break;
          case 'ArrowDown':
            setImagePosition(prev => ({ ...prev, y: prev.y - step }));
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageScale]);

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleResetView = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageScale > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDelete = () => {
    if (!adminPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your admin password to delete this file.",
      });
      return;
    }
    
    deleteMutation.mutate({ 
      fileId: file.id, 
      adminPassword: adminPassword.trim() 
    });
  };


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
    const downloadUrl = `/api/files/${file.id}/download`;
    
    // Image preview with controls
    if (type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png')) {
      return (
        <div className="bg-muted rounded-lg h-full flex flex-col">
          {/* Image Controls */}
          <div className="px-4 py-2 bg-background border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="flex items-center space-x-1"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Zoom In</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="flex items-center space-x-1"
              >
                <ZoomOut className="w-4 h-4" />
                <span>Zoom Out</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex items-center space-x-2">
              <Move className="w-4 h-4" />
              <span>{Math.round(imageScale * 100)}% • Scroll to zoom, drag to pan</span>
            </div>
          </div>

          {/* Image Container */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            tabIndex={0}
          >
            <img 
              ref={imageRef}
              src={downloadUrl}
              alt={file.originalName}
              className="rounded shadow-lg transition-transform select-none"
              style={{
                transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                maxWidth: imageScale > 1 ? 'none' : '100%',
                maxHeight: imageScale > 1 ? 'none' : '100%'
              }}
              onError={(e) => {
                // Fallback to generic preview if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
              draggable={false}
            />
            <div className="text-center hidden">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-foreground">Image Preview</p>
              <p className="text-sm text-muted-foreground mt-2">Click download to view full image</p>
            </div>

          </div>
        </div>
      );
    }

    // PDF preview with inline viewer
    if (type.includes('.pdf')) {
      return (
        <div className="bg-muted rounded-lg h-full flex flex-col">
          <div className="flex-1 p-4">
            <iframe
              src={`${downloadUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded border"
              title={`PDF Preview: ${file.originalName}`}
              onError={() => {
                console.log('PDF preview failed, showing fallback');
              }}
            />
          </div>
          <div className="p-4 bg-background rounded-b-lg border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                📄 PDF Document - Click download for full-screen view
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Open Full Screen</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Enhanced preview for presentations and documents
    const fileTypeConfig: { [key: string]: { icon: string; title: string; description: string; action: string } } = {
      '.pptx': { 
        icon: '📊', 
        title: 'PowerPoint Presentation', 
        description: 'Perfect for class presentations',
        action: 'Open Presentation'
      },
      '.docx': { 
        icon: '📝', 
        title: 'Word Document', 
        description: 'Text document with formatting',
        action: 'Open Document'
      },
    };

    const config = Object.entries(fileTypeConfig).find(([ext]) => type.includes(ext));
    const { icon, title, description, action } = config ? config[1] : 
      { icon: '📁', title: getFileTypeDisplay(file.fileType), description: 'Click to download and view', action: 'Download File' };
    
    return (
      <div className="bg-muted rounded-lg h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">{icon}</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6">{description}</p>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Button
                onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open in Browser
              </Button>
              <Button
                onClick={onDownload}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {type.includes('.pptx') 
                ? 'PowerPoint presentations work best when downloaded and opened in PowerPoint' 
                : 'File will open in your default application'
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[98vw] max-h-[96vh] w-full h-full overflow-hidden p-0">
        <div className="flex h-full">
          {/* Main Preview Area */}
          <div className="flex-1 flex flex-col">
            {/* Simplified Header */}
            <div className="flex items-center justify-between p-4 pr-16 border-b bg-background">
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {file.label}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {file.originalName} • {getFileTypeDisplay(file.fileType)} • {formatFileSize(file.fileSize)}
                </p>
              </div>
              <div className="flex items-center space-x-2 mr-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {user?.isAdmin && (
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file.originalName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="adminPasswordDelete">Admin Password</Label>
                        <Input
                          id="adminPasswordDelete"
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter your admin password"
                          className="mt-2"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAdminPassword("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete File"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-hidden p-2">
              {getPreviewContent()}
            </div>
          </div>

          {/* Right Details Panel */}
          <div className={`bg-muted/30 transition-all duration-300 relative ${
            isPanelCollapsed ? 'w-0' : 'w-80 border-l'
          }`}>
            {/* Toggle Button - positioned on the left edge */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 h-16 w-8 rounded-l-md rounded-r-none border border-r-0 bg-background hover:bg-accent flex items-center justify-center shadow-sm z-10"
              title={isPanelCollapsed ? "Expand details panel" : "Collapse details panel"}
            >
              {isPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            
            {/* Panel Content */}
            {!isPanelCollapsed && (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Team:</span>
                    <span className="text-foreground font-medium">Team {file.teamNumber}</span>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground block mb-1">Assignment:</span>
                    <span className="text-foreground text-xs leading-relaxed">{file.assignment}</span>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground block mb-1">Tags:</span>
                    {file.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">N/A</span>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground block mb-1">Description:</span>
                    {file.description ? (
                      <p className="text-foreground text-xs leading-relaxed">{file.description}</p>
                    ) : (
                      <span className="text-muted-foreground italic">N/A</span>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-1">Uploaded:</span>
                    <span className="text-foreground text-xs">{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
