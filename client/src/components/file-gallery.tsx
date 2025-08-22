import { useState } from "react";
import { Search, Upload, Eye, Download, FileText, Image, FileSpreadsheet, Presentation, FolderOpen, Users, BookOpen, MoreHorizontal, Trash2, ChevronDown, ChevronRight, SortAsc, SortDesc } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FilePreview from "@/components/file-preview";
import type { File } from "@shared/schema";

interface AssignmentSetting {
  id: string;
  assignment: string;
  isOpenView: string;
  updatedAt: string;
}

interface FileGalleryProps {
  onUploadClick: () => void;
}

export default function FileGallery({ onUploadClick }: FileGalleryProps) {
  const [viewMode, setViewMode] = useState<"teams" | "assignments">("teams");
  const [selectedPrimary, setSelectedPrimary] = useState<string>(""); // Team number or Assignment
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc">("date-desc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ type: 'assignment' | 'team', value: string, files: File[] } | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ files, adminPassword }: { files: File[]; adminPassword: string }) => {
      const deletePromises = files.map(file =>
        fetch(`/api/files/${file.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminPassword }),
          credentials: 'include',
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if any failed
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete some files');
        }
      }
      
      return responses;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Successfully deleted ${bulkDeleteTarget?.files.length} file(s)`,
      });
      // Refresh files list
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setShowBulkDeleteDialog(false);
      setBulkDeleteTarget(null);
      setAdminPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete files. Please check your password.",
      });
      setAdminPassword("");
    },
  });

  const assignments = [
    "Assignment 1 - Segmentation and Personas",
    "Assignment 2 - Positioning",
    "Assignment 3 - Journey Mapping",
    "Assignment 4 - Marketing Channels",
    "Assignment 5 - Pricing",
    "Assignment 6 - Distribution Channels",
    "Assignment 7 - Acquisition",
    "Assignment 8 - Customer Discovery",
    "Assignment 9 - Product Validation",
  ];

  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  // Query for all files (already filtered by backend based on permissions)
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
    enabled: !!user, // Fetch for all authenticated users
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

  // Get available teams based on permissions
  const getAvailableTeams = () => {
    if (!user) return [];
    
    if (user.isAdmin) {
      // Admin can see all teams that have files
      const teamsWithFiles = new Set(allFiles.map(file => file.teamNumber));
      return Array.from(teamsWithFiles).sort((a, b) => a - b);
    } else {
      // Students can only see their own team for "Team Files"
      const userFiles = allFiles.filter(file => file.teamNumber === user.teamNumber);
      return userFiles.length > 0 ? [user.teamNumber] : [];
    }
  };

  // Get available assignments based on permissions
  const getAvailableAssignments = () => {
    if (!user) return [];
    
    if (user.isAdmin) {
      // Admin can see all assignments that have files
      const assignmentsWithFiles = new Set(allFiles.map(file => file.assignment));
      return assignments.filter(assignment => assignmentsWithFiles.has(assignment));
    } else {
      // Students can only see assignments they have files for in "Team Files"
      const studentAssignments = new Set(
        allFiles
          .filter(file => file.teamNumber === user.teamNumber)
          .map(file => file.assignment)
      );
      return assignments.filter(assignment => studentAssignments.has(assignment));
    }
  };

  // Get box data based on current selections
  const getBoxData = () => {
    if (!selectedPrimary || !user) return [];
    
    if (viewMode === "teams") {
      // Show assignments for the selected team
      const teamNumber = parseInt(selectedPrimary);
      const availableAssignments = getAvailableAssignments();
      
      return availableAssignments.map(assignment => {
        const files = allFiles.filter(file => 
          file.teamNumber === teamNumber && file.assignment === assignment
        );
        return {
          id: assignment,
          title: assignment.split(' - ')[0],
          subtitle: assignment.split(' - ')[1],
          files,
          icon: <BookOpen className="text-2xl text-primary" />
        };
      });
    } else {
      // Show teams for the selected assignment - only available teams
      const availableTeams = getAvailableTeams();
      
      return availableTeams.map(teamNum => {
        const files = allFiles.filter(file => 
          file.teamNumber === teamNum && file.assignment === selectedPrimary
        );
        return {
          id: `team-${teamNum}`,
          title: teamNum === 0 ? "Warrier" : `Team ${teamNum}`,
          subtitle: '',
          files,
          icon: <Users className="text-2xl text-primary" />
        };
      });
    }
  };

  const boxData = getBoxData();

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

  const handleBulkDeleteClick = (box: any) => {
    setBulkDeleteTarget({
      type: viewMode === "teams" ? "assignment" : "team",
      value: box.id,
      files: box.files
    });
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDelete = () => {
    if (!adminPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your admin password to delete files.",
      });
      return;
    }
    
    if (!bulkDeleteTarget || bulkDeleteTarget.files.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files",
        description: "No files to delete.",
      });
      return;
    }
    
    bulkDeleteMutation.mutate({ 
      files: bulkDeleteTarget.files, 
      adminPassword: adminPassword.trim() 
    });
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

  // Get files grouped by assignment for simple student view
  const getStudentFilesByAssignment = () => {
    if (!user || user.isAdmin) return [];
    
    const studentFiles = allFiles.filter(file => file.teamNumber === user.teamNumber);
    const assignmentGroups = new Map();
    
    studentFiles.forEach(file => {
      if (!assignmentGroups.has(file.assignment)) {
        assignmentGroups.set(file.assignment, []);
      }
      assignmentGroups.get(file.assignment).push(file);
    });
    
    return Array.from(assignmentGroups.entries()).map(([assignment, files]) => ({
      id: assignment,
      title: assignment.split(' - ')[0],
      subtitle: assignment.split(' - ')[1] || '',
      files: files.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
      icon: <BookOpen className="text-2xl text-primary" />
    }));
  };

  const studentAssignmentGroups = getStudentFilesByAssignment();

  return (
    <div>
      {user?.isAdmin ? (
        <>
          {/* Admin View - Original complex interface */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* View Mode Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewMode("teams");
                      setSelectedPrimary("");
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      viewMode === "teams" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Teams
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewMode("assignments");
                      setSelectedPrimary("");
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      viewMode === "assignments" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Assignments
                  </Button>
                </div>
                
                {/* Primary Selection Dropdown */}
                <Select value={selectedPrimary} onValueChange={setSelectedPrimary}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={
                      viewMode === "teams" 
                        ? "Select a team" 
                        : "Select an assignment"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {viewMode === "teams" ? (
                      getAvailableTeams().map(teamNum => (
                        <SelectItem key={teamNum} value={teamNum.toString()}>
                          {teamNum === 0 ? "Warrier" : `Team ${teamNum}`}
                        </SelectItem>
                      ))
                    ) : (
                      getAvailableAssignments().map((assignment, index) => (
                        <SelectItem key={assignment} value={assignment}>
                          Assignment {index + 1} - {assignment.split(' - ')[1]}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Upload Button */}
                <Button onClick={onUploadClick} className="ml-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Simplified Student View - Just header with upload */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Your Files</h2>
                  <p className="text-muted-foreground">Files you've uploaded, organized by assignment</p>
                </div>
                <Button onClick={onUploadClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Content Area */}
      {user?.isAdmin ? (
        /* Admin View - Complex interface with selections */
        !selectedPrimary ? (
          /* Selection Required */
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <BookOpen className="text-3xl text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Select {viewMode === "teams" ? "a team" : "an assignment"} to continue
            </h3>
            <p className="text-muted-foreground">
              Choose from the dropdown above to see files organized by {viewMode === "teams" ? "assignments" : "teams"}
            </p>
          </div>
        ) : (
          /* Admin Boxes Grid */
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {viewMode === "teams" 
                ? `${selectedPrimary === "0" ? "Warrier" : `Team ${selectedPrimary}`} - Files by Assignment`
                : `${selectedPrimary.split(' - ')[0]} - Files by Team`
              }
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {boxData.map((box) => (
              <Card 
                key={box.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {box.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">
                        {box.files.length} files
                      </div>
                      {user?.isAdmin && box.files.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-accent"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleBulkDeleteClick(box)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete All Files
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {box.title}
                  </h3>
                  {box.subtitle && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {box.subtitle}
                    </p>
                  )}
                  
                  {/* Files Grid */}
                  {box.files.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {box.files.slice(0, 4).map((file: any) => (
                        <Card 
                          key={file.id}
                          className={`p-2 cursor-pointer hover:shadow-sm transition-shadow border ${getFileTypeColor(file.fileType)}`}
                          onClick={() => setSelectedFile(file)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-8 h-8 flex items-center justify-center mb-1">
                              {getFileIcon(file.fileType)}
                            </div>
                            <p className="text-xs font-medium text-foreground truncate w-full">
                              {file.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                        </Card>
                      ))}
                      {box.files.length > 4 && (
                        <Card className="p-2 border-dashed border-2 border-muted-foreground/30">
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <FolderOpen className="w-6 h-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">
                              +{box.files.length - 4} more
                            </p>
                          </div>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground text-sm">
                        No files uploaded
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )
      ) : (
        /* Student View - Simple assignment grouping */
        studentAssignmentGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <BookOpen className="text-3xl text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No files uploaded yet
            </h3>
            <p className="text-muted-foreground">
              Upload files to see them organized by assignment here.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentAssignmentGroups.map((box) => (
              <Card 
                key={box.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {box.icon}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {box.files.length} files
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {box.title}
                  </h3>
                  {box.subtitle && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {box.subtitle}
                    </p>
                  )}
                  
                  {/* Files Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {box.files.slice(0, 4).map((file: any) => (
                      <Card 
                        key={file.id}
                        className={`p-2 cursor-pointer hover:shadow-sm transition-shadow border ${getFileTypeColor(file.fileType)}`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-8 h-8 flex items-center justify-center mb-1">
                            {getFileIcon(file.fileType)}
                          </div>
                          <p className="text-xs font-medium text-foreground truncate w-full">
                            {file.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </Card>
                    ))}
                    {box.files.length > 4 && (
                      <Card className="p-2 border-dashed border-2 border-muted-foreground/30">
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <FolderOpen className="w-6 h-6 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">
                            +{box.files.length - 4} more
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDownload={() => downloadFile(selectedFile)}
        />
      )}

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {bulkDeleteTarget?.files.length} file(s) from{" "}
              {bulkDeleteTarget?.type === 'assignment' ? 
                `${bulkDeleteTarget.value}` : 
                `Team ${bulkDeleteTarget?.value?.replace('team-', '')}`
              }? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="adminPasswordBulk">Admin Password</Label>
            <Input
              id="adminPasswordBulk"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter your admin password"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setAdminPassword("");
              setBulkDeleteTarget(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${bulkDeleteTarget?.files.length} File(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}