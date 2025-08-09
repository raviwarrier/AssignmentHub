import { useState } from "react";
import { FileText, Image, FileSpreadsheet, Presentation, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FilePreview from "@/components/file-preview";
import type { File } from "@shared/schema";

interface AssignmentSetting {
  id: string;
  assignment: string;
  isOpenView: string;
  updatedAt: string;
}

export default function OtherTeamFiles() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  // Query for all files (backend will filter based on permissions)
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

  // Query assignment settings to determine open view assignments
  const { data: assignmentSettings = [] } = useQuery<AssignmentSetting[]>({
    queryKey: ["/api/assignment-settings"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch('/api/assignment-settings', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignment settings');
      }
      
      return response.json();
    },
  });

  // Filter to show other team's files from open view assignments AND visible admin files
  const otherTeamFiles = allFiles.filter(file => {
    const openAssignments = assignmentSettings
      .filter(setting => setting.isOpenView === "true")
      .map(setting => setting.assignment);
    
    return (
      file.teamNumber !== user?.teamNumber && openAssignments.includes(file.assignment)
    ) || (
      file.teamNumber === 0 && file.isVisible === "true" // Include visible admin files
    );
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

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('.pdf')) return 'bg-red-100 text-red-700 border-red-200';
    if (type.includes('.jpg') || type.includes('.jpeg') || type.includes('.png')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type.includes('.docx')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type.includes('.pptx')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (type.includes('.xlsx')) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Other Team Files</h2>
        <p className="text-muted-foreground">
          Files from other teams that are available for viewing ({otherTeamFiles.length} files)
        </p>
      </div>

      {otherTeamFiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileText className="text-3xl text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No shared files available
          </h3>
          <p className="text-muted-foreground">
            When other teams upload files to assignments marked as "open view", they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {otherTeamFiles.map((file) => (
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
                      <Badge variant="outline">{file.teamNumber === 0 ? "Warrier" : `Team ${file.teamNumber}`}</Badge>
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
    </div>
  );
}