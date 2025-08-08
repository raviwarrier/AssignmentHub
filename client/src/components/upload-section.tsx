import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUploadIcon, FileIcon, CheckIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadSectionProps {
  onUploadSuccess: () => void;
}

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

export default function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [label, setLabel] = useState("");
  const [assignment, setAssignment] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/files/upload", null);
      return fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Files uploaded successfully",
      });
      // Reset form
      setFiles([]);
      setLabel("");
      setAssignment("");
      setTags("");
      setDescription("");
      setTagList([]);
      // Invalidate cache and switch to gallery
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      onUploadSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.pptx'];
    const validFiles = acceptedFiles.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(ext);
    });

    if (validFiles.length !== acceptedFiles.length) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Only JPG, PNG, PDF, DOCX, and PPTX files are allowed.",
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleTagsChange = (value: string) => {
    setTags(value);
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
      setTagList(prev => Array.from(new Set([...prev, ...newTags])));
      setTags('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagList(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
      });
      return;
    }

    if (!label || !assignment) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('label', label);
    formData.append('assignment', assignment);
    formData.append('tags', [...tagList, ...tags.split(',').map(t => t.trim()).filter(t => t)].join(','));
    formData.append('description', description);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Upload Area */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Your Files</h2>
          <p className="text-muted-foreground">
            Share presentations, documents, and images {user ? `(Team ${user.teamNumber})` : ""}
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <Card 
          {...getRootProps()} 
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'drag-over' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <CardContent className="p-0">
            <input {...getInputProps()} />
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CloudUploadIcon className="text-2xl text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {isDragActive ? "Drop files here..." : "Drop files here or click to browse"}
            </h3>
            <p className="text-muted-foreground mb-4">Supports JPG, PNG, PDF, DOCX, PPTX (Max 50MB)</p>
            <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Choose Files
            </Button>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium text-foreground mb-4">Selected Files ({files.length})</h4>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center text-sm text-foreground">
                    <FileIcon className="w-4 h-4 mr-2 text-primary" />
                    <span className="flex-1">{file.name}</span>
                    <span className="text-muted-foreground mr-2">{formatFileSize(file.size)}</span>
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Form */}
      <Card className="h-fit">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">File Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File Label */}
            <div className="space-y-2">
              <Label htmlFor="label">File Label *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Project Presentation, Research Notes"
                required
              />
            </div>

            {/* Team Number Display */}
            {user && (
              <div className="space-y-2">
                <Label>Your Team</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                  Team {user.teamNumber}
                </div>
              </div>
            )}

            {/* Assignment */}
            <div className="space-y-2">
              <Label htmlFor="assignment">Assignment *</Label>
              <Select value={assignment} onValueChange={setAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment, index) => (
                    <SelectItem key={index} value={assignment}>
                      {assignment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tagList.map((tag, index) => (
                    <Badge key={index} className={`tag-color-${(index % 8) + 1}`}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:opacity-70"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                id="tags"
                value={tags}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="Add tags (comma-separated)"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the file content..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploadMutation.isPending ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudUploadIcon className="w-4 h-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
