import { useState } from "react";
import { Settings, LoaderIcon, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AssignmentSetting {
  id: string;
  assignment: string;
  isOpenView: string;
  updatedAt: string;
}

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery<AssignmentSetting[]>({
    queryKey: ["/api/assignment-settings"],
    enabled: open,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ assignment, isOpenView }: { assignment: string; isOpenView: boolean }) => {
      const response = await apiRequest("PUT", "/api/assignment-settings", { assignment, isOpenView });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Assignment setting updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignment-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update assignment setting",
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/files/all", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "All files have been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setShowDeleteConfirm(false);
      setConfirmText("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete all files",
      });
    },
  });

  const handleToggle = (assignment: string, currentValue: boolean) => {
    updateSettingMutation.mutate({ assignment, isOpenView: !currentValue });
  };

  const handleDeleteAll = () => {
    if (confirmText === "yes, the course is over") {
      deleteAllMutation.mutate();
    } else {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: "Please type exactly: yes, the course is over",
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Assignment Visibility Settings
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Assignment Visibility Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground flex-shrink-0">
            Control which assignments students can view in the gallery. When an assignment is "open view", 
            students can see files from all teams for that assignment.
          </p>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {settings.map((setting) => (
              <Card key={setting.id} className="border border-border flex-shrink-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{setting.assignment}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {setting.isOpenView === "true" ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye className="w-4 h-4" />
                            Students can view all teams files
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <EyeOff className="w-4 h-4" />
                            Students can only view their own team files
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${setting.isOpenView === "true" ? "text-green-600" : "text-muted-foreground"}`}>
                        {setting.isOpenView === "true" ? "Open" : "Closed"}
                      </span>
                      <Switch
                        checked={setting.isOpenView === "true"}
                        onCheckedChange={() => handleToggle(setting.assignment, setting.isOpenView === "true")}
                        disabled={updateSettingMutation.isPending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {settings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assignments found
              </div>
            )}
          </div>
          
          <Separator className="flex-shrink-0" />
          
          <div className="flex-shrink-0 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-medium text-foreground">Danger Zone</h3>
            </div>
            
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Uploads
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will permanently delete all uploaded files from all teams. This action cannot be undone.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirmText" className="text-sm font-medium">
                    Type "yes, the course is over" to confirm:
                  </Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="yes, the course is over"
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAll}
                    disabled={confirmText !== "yes, the course is over" || deleteAllMutation.isPending}
                    className="flex-1"
                  >
                    {deleteAllMutation.isPending ? (
                      <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {deleteAllMutation.isPending ? "Deleting..." : "Delete All Files"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText("");
                    }}
                    disabled={deleteAllMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}