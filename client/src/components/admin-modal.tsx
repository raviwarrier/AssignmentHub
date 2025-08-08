import { useState } from "react";
import { Shield, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { File } from "@shared/schema";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminModal({ open, onOpenChange }: AdminModalProps) {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files"],
    enabled: isAuthenticated && open,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ fileId, adminPassword }: { fileId: string, adminPassword: string }) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`, { adminPassword });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "File deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setFileToDelete(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete file. Please check your password.",
      });
    },
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter the admin password",
      });
      return;
    }

    // Test password by attempting to delete a non-existent file
    // This is a simple way to validate the password without exposing it
    try {
      await apiRequest("DELETE", "/api/files/test-password", { adminPassword: password });
    } catch (error: any) {
      if (error.message.includes("401")) {
        toast({
          variant: "destructive",
          title: "Invalid Password",
          description: "The admin password is incorrect",
        });
        return;
      }
      // If we get 404 (file not found), the password was valid
      if (error.message.includes("404")) {
        setIsAuthenticated(true);
        toast({
          title: "Access Granted",
          description: "Welcome to admin mode",
        });
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      deleteMutation.mutate({ fileId: fileToDelete.id, adminPassword: password });
    }
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const resetModal = () => {
    setPassword("");
    setIsAuthenticated(false);
    setFileToDelete(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mr-4">
              <Shield className="text-xl text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Admin Access</h3>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated ? "Manage uploaded files" : "Enter admin password to manage files"}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto">
          {!isAuthenticated ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="focus:ring-destructive focus:border-destructive"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Access Admin
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are in admin mode. You can delete any file from the system.
                </AlertDescription>
              </Alert>

              {/* File List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">All Files ({files.length})</h4>
                
                {files.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No files uploaded yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                      <Card key={file.id} className="hover:bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h5 className="font-medium text-foreground truncate">
                                    {file.originalName}
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    {file.label} • Team {file.teamNumber} • {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {file.assignment}
                                  </p>
                                </div>
                              </div>
                              
                              {file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {file.tags.map((tag, index) => (
                                    <Badge key={index} className={`text-xs tag-color-${(index % 8) + 1}`}>
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFileToDelete(file)}
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete "<strong>{fileToDelete?.originalName}</strong>"? 
                This action cannot be undone.
              </p>
              
              <Alert className="border-destructive/20 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  This will permanently delete the file from the system.
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setFileToDelete(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete File"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
