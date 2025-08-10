import { useState } from "react";
import { Settings, LoaderIcon, Eye, EyeOff, Trash2, AlertTriangle, Users, Database, Shield, FileX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AssignmentSetting {
  id: string;
  assignment: string;
  isOpenView: string;
  updatedAt: string;
}

interface Team {
  teamNumber: number;
  teamName: string;
  hasPassword: boolean;
  lastLogin?: string;
  createdAt?: string;
  isActive: boolean;
}

interface AdminSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [activeSection, setActiveSection] = useState("assignments");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignment settings (no admin auth needed - user is already admin)
  const { data: settings = [], isLoading: settingsLoading } = useQuery<AssignmentSetting[]>({
    queryKey: ["/api/assignment-settings"],
    enabled: open,
  });

  // Fetch teams (no admin auth needed - user is already admin)
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/teams");
      if (!Array.isArray(response)) {
        console.error("Teams response is not an array:", response);
        return [];
      }
      return response as Team[];
    },
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

  // Delete team files mutation
  const deleteTeamFilesMutation = useMutation({
    mutationFn: async ({ teamNumber, adminPassword }: { teamNumber: number; adminPassword: string }) => {
      return await apiRequest("DELETE", `/api/admin/teams/${teamNumber}/files`, { adminPassword });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      setAdminPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete team files",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async ({ teamNumber, adminPassword }: { teamNumber: number; adminPassword: string }) => {
      return await apiRequest("DELETE", `/api/admin/teams/${teamNumber}`, { adminPassword });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      setAdminPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete team",
      });
    },
  });

  // Reset server mutation
  const resetServerMutation = useMutation({
    mutationFn: async ({ adminPassword, confirmText }: { adminPassword: string; confirmText: string }) => {
      return await apiRequest("POST", "/api/admin/reset-server", { adminPassword, confirmText });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Server Reset Complete!",
        description: data.message,
      });
      queryClient.invalidateQueries();
      setAdminPassword("");
      setConfirmText("");
      setShowResetConfirm(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset server",
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

  const handleDeleteTeamFiles = (teamNumber: number) => {
    if (!adminPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter admin password",
      });
      return;
    }
    deleteTeamFilesMutation.mutate({ teamNumber, adminPassword });
  };

  const handleDeleteTeam = (teamNumber: number) => {
    if (!adminPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter admin password",
      });
      return;
    }
    deleteTeamMutation.mutate({ teamNumber, adminPassword });
  };

  const handleResetServer = () => {
    if (!adminPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter admin password",
      });
      return;
    }
    if (confirmText !== "RESET ALL DATA") {
      toast({
        variant: "destructive",
        title: "Confirmation Required",
        description: 'Please type "RESET ALL DATA" to confirm',
      });
      return;
    }
    resetServerMutation.mutate({ adminPassword, confirmText });
  };

  if (settingsLoading) {
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

  const sidebarItems = [
    { id: "assignments", label: "Assignment Settings", icon: Settings, description: "Control assignment visibility" },
    { id: "teams", label: "Team Management", icon: Users, description: "Manage registered teams" },
    { id: "info", label: "System Info", icon: Database, description: "View system information" },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, description: "Destructive actions" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 bg-card border-r border-border p-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6" style={{ height: '888px' }}>
            {activeSection === "assignments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">Assignment Visibility</h2>
                  <p className="text-muted-foreground mb-6">
                    Control which assignments are open for teams to view each other's files. Admin file visibility is controlled separately.
                  </p>
                </div>

                {settingsLoading ? (
                  <div className="text-muted-foreground">Loading assignments...</div>
                ) : settings.length === 0 ? (
                  <div className="text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No assignments found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.map((setting) => (
                      <Card key={setting.assignment}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{setting.assignment}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {setting.isOpenView === "true" ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Eye className="w-4 h-4" />
                                    Teams can see each other's files
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-orange-600">
                                    <EyeOff className="w-4 h-4" />
                                    Teams can only see their own files
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
                  </div>
                )}
              </div>
            )}

            {activeSection === "teams" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">Team Management</h2>
                  <p className="text-muted-foreground mb-6">
                    Manage registered teams. Delete team files or entire teams as needed.
                  </p>
                </div>

                {teamsLoading ? (
                  <div className="text-muted-foreground">Loading teams...</div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No teams registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <Card key={team.teamNumber}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant="outline">Team {team.teamNumber}</Badge>
                                <span className="font-medium">{team.teamName}</span>
                                {team.hasPassword && <Badge variant="secondary">Registered</Badge>}
                                {!team.isActive && <Badge variant="destructive">Inactive</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {team.lastLogin ? `Last login: ${new Date(team.lastLogin).toLocaleDateString()}` : "Never logged in"}
                                {team.createdAt && ` • Registered: ${new Date(team.createdAt).toLocaleDateString()}`}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileX className="h-4 w-4 mr-1" />
                                    Delete Files
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete All Files for {team.teamName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                      This will permanently delete all files uploaded by {team.teamName}. This action cannot be undone.
                                    </p>
                                    <div className="space-y-2">
                                      <Label htmlFor="adminPassword">Admin Password</Label>
                                      <Input
                                        id="adminPassword"
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="Enter admin password"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setAdminPassword("")}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleDeleteTeamFiles(team.teamNumber)}
                                      disabled={deleteTeamFilesMutation.isPending}
                                    >
                                      {deleteTeamFilesMutation.isPending ? "Deleting..." : "Delete Files"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Delete Team
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Team {team.teamName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded border border-destructive/20">
                                      <AlertTriangle className="h-4 w-4 text-destructive" />
                                      <p className="text-sm text-destructive font-medium">
                                        This will permanently delete the team, all their files, and their account. This action cannot be undone.
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="adminPassword">Admin Password</Label>
                                      <Input
                                        id="adminPassword"
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="Enter admin password"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setAdminPassword("")}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleDeleteTeam(team.teamNumber)}
                                      disabled={deleteTeamMutation.isPending}
                                    >
                                      {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "info" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">System Information</h2>
                  <p className="text-muted-foreground mb-6">
                    Information about the current system configuration and status.
                  </p>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground mb-2">Database</h3>
                      <p className="text-sm text-muted-foreground">
                        Uses PostgreSQL in production and memory storage in development. 
                        All team passwords are securely hashed using bcrypt.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground mb-2">Migration Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Teams can still login with environment variable passwords (TEAM_X_PASSWORD) 
                        and register to upgrade to the database authentication system.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground mb-2">File Storage</h3>
                      <p className="text-sm text-muted-foreground">
                        Files are stored in the uploads/ directory. Admin file visibility is 
                        independent of assignment open/close settings.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === "danger" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-destructive">Danger Zone</h2>
                  <p className="text-muted-foreground mb-6">
                    Irreversible and destructive actions.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <h3 className="font-medium text-foreground">Delete All Files</h3>
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
                      <div className="space-y-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <p className="text-sm text-destructive">
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

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 w-5 text-destructive" />
                      <h3 className="font-medium text-foreground">Reset Server for New Semester</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently delete ALL data:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                      <li>All uploaded files (from all teams and admin)</li>
                      <li>All team accounts and registrations</li>
                      <li>Reset all assignment settings to closed</li>
                      <li>Clear all login sessions</li>
                    </ul>
                    
                    {!showResetConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowResetConfirm(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Server
                      </Button>
                    ) : (
                      <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded border border-destructive/20">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <p className="text-sm text-destructive font-medium">
                            This action cannot be undone!
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="resetAdminPassword">Admin Password</Label>
                          <Input
                            id="resetAdminPassword"
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter admin password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resetConfirmText">Type "RESET ALL DATA" to confirm</Label>
                          <Input
                            id="resetConfirmText"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RESET ALL DATA"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            onClick={handleResetServer}
                            disabled={resetServerMutation.isPending}
                            className="flex-1"
                          >
                            {resetServerMutation.isPending ? "Resetting..." : "Reset Server"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowResetConfirm(false);
                              setAdminPassword("");
                              setConfirmText("");
                            }}
                            disabled={resetServerMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
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