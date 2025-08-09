import { useState } from "react";
import { FileText, Image, FileSpreadsheet, Presentation, Download, Eye, Edit2, Trash2, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FilePreview from "@/components/file-preview";
import type { File } from "@shared/schema";

export default function AdminFilesManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  // Query for admin files (team 0)
  const { data: allFiles = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const response = await fetch('/api/files', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      
      return response.json();
    },
  });

  // Filter to only admin files (team 0)
  const adminFiles = allFiles.filter(file => file.teamNumber === 0);

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ fileId, isVisible }: { fileId: string; isVisible: boolean }) => {
      const response = await fetch(`/api/files/${fileId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVisible: isVisible.toString() }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update visibility');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "File visibility updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update visibility",
      });
    },
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, updates }: { fileId: string; updates: any }) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "File details updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setEditingFile(null);
      setEditLabel("");
      setEditDescription("");
      setEditTags("");
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update file",
      });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setAdminPassword("");
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

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('.pdf')) return <FileText className="text-4xl text-red-500" />;
    if (type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png')) return <Image className="text-4xl text-blue-500" />;
    if (type.includes('.docx')) return <FileText className="text-4xl text-blue-600" />;
    if (type.includes('.pptx')) return <Presentation className="text-4xl text-orange-500" />;
    if (type.includes('.xlsx')) return <FileSpreadsheet className="text-4xl text-green-600" />;
    return <FileText className="text-4xl text-gray-500" />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadFile = async (file: File) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success!",
        description: "File downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
      });
    }
  };

  const handleEdit = (file: File) => {
    setEditingFile(file);
    setEditLabel(file.label);
    setEditDescription(file.description || "");
    setEditTags(file.tags.join(", "));
    setIsEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditLabel("");
    setEditDescription("");
    setEditTags("");
    setIsEditDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingFile) return;
    
    const updates = {
      label: editLabel,
      description: editDescription,
      tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    updateFileMutation.mutate({ fileId: editingFile.id, updates });
  };

  const handleDelete = (fileId: string) => {
    if (!adminPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your admin password to delete this file.",
      });
      return;
    }
    
    deleteMutation.mutate({ fileId, adminPassword: adminPassword.trim() });
  };

  const handleToggleVisibility = (file: File) => {
    const newVisibility = file.isVisible !== "true";
    toggleVisibilityMutation.mutate({ 
      fileId: file.id, 
      isVisible: newVisibility 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">W.'s Files</h2>
        <p className="text-muted-foreground">
          Manage your uploaded files for class presentations ({adminFiles.length} files)
        </p>
      </div>

      {adminFiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileText className="text-3xl text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No files uploaded yet
          </h3>
          <p className="text-muted-foreground">
            Upload files from the Upload section to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {adminFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-foreground truncate">
                        {file.label}
                      </h3>
                      <Badge variant={file.isVisible === "true" ? "default" : "secondary"}>
                        {file.isVisible === "true" ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {file.originalName} • {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {file.assignment.split(' - ')[0]}
                      </Badge>
                      {file.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {file.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(file)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(file)}
                      className="flex items-center space-x-1"
                      disabled={toggleVisibilityMutation.isPending}
                    >
                      {file.isVisible === "true" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{file.isVisible === "true" ? "Hide" : "Show"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(file)}
                      className="flex items-center space-x-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
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
                            onClick={() => handleDelete(file.id)}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete File"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDownload={() => downloadFile(selectedFile)}
        />
      )}

      {/* Edit File Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit File Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editLabel">File Label</Label>
              <Input
                id="editLabel"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Enter file label"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editTags">Tags (comma-separated)</Label>
              <Input
                id="editTags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateFileMutation.isPending}
              >
                {updateFileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}