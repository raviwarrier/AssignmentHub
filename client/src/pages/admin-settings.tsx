import { useState } from "react";
import { useLocation } from "wouter";
import { Settings, Users, Database, Trash2, AlertTriangle, Shield, FileX, UserX, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Team {
  teamNumber: number;
  teamName: string;
  hasPassword: boolean;
  lastLogin?: string;
  createdAt?: string;
  isActive: boolean;
}

interface AssignmentSetting {
  id?: string;
  assignment: string;
  isOpenView: string;
  updatedAt?: string;
}

export default function AdminSettings() {
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [activeSection, setActiveSection] = useState("assignments");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/teams");
        console.log("Teams API response:", response);
        if (!Array.isArray(response)) {
          console.error("Teams response is not an array:", response);
          return [];
        }
        return response as Team[];
      } catch (error) {
        console.error("Teams API error:", error);
        return [];
      }
    }
  });

  // Fetch assignment settings
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignment-settings"],
    queryFn: async () => {
      try {
        console.log("Making assignment settings API request...");
        const response = await apiRequest("GET", "/api/assignment-settings");
        console.log("Assignments API response:", response);
        console.log("Response type:", typeof response, "Is array:", Array.isArray(response));
        if (!Array.isArray(response)) {
          console.error("Assignment settings response is not an array:", response);
          return [];
        }
        console.log("Returning assignments:", response.length, "items");
        return response as AssignmentSetting[];
      } catch (error) {
        console.error("Assignment settings API error:", error);
        return [];
      }
    }
  });

  console.log("Current assignments state:", assignments, "Loading:", assignmentsLoading);

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
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset server",
      });
    },
  });

  // Assignment setting toggle mutation
  const toggleAssignmentMutation = useMutation({
    mutationFn: async ({ assignment, isOpenView }: { assignment: string; isOpenView: boolean }) => {
      return await apiRequest("PUT", "/api/assignment-settings", { assignment, isOpenView });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-settings"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update assignment setting",
      });
    },
  });

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

  const sidebarItems = [
    { id: "assignments", label: "Assignment Settings", icon: Settings },
    { id: "teams", label: "Team Management", icon: Users },
    { id: "maintenance", label: "System Info", icon: Database },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="flex items-center h-14 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="mr-4 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Settings className="h-5 w-5 mr-2 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border">
          <div className="p-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="p-8 max-w-4xl">
            {activeSection === "assignments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">Assignment Visibility</h2>
                  <p className="text-muted-foreground mb-6">
                    Control which assignments are open for teams to view each other's files. Admin file visibility is controlled separately.
                  </p>
                </div>

                {assignmentsLoading ? (
                  <div className="text-muted-foreground">Loading assignments...</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">No assignments found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((setting) => (
                      <div key={setting.assignment} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{setting.assignment}</h3>
                          <p className="text-sm text-muted-foreground">
                            {setting.isOpenView === "true" ? "Teams can see each other's files" : "Teams can only see their own files"}
                          </p>
                        </div>
                        <Switch
                          checked={setting.isOpenView === "true"}
                          onCheckedChange={(checked) =>
                            toggleAssignmentMutation.mutate({
                              assignment: setting.assignment,
                              isOpenView: checked
                            })
                          }
                        />
                      </div>
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
                      <div key={team.teamNumber} className="p-4 bg-card rounded-lg border border-border">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "maintenance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-foreground">System Information</h2>
                  <p className="text-muted-foreground mb-6">
                    Information about the current system configuration and status.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Database</h3>
                    <p className="text-sm text-muted-foreground">
                      Uses PostgreSQL in production and memory storage in development. 
                      All team passwords are securely hashed using bcrypt.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">Migration Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Teams can still login with environment variable passwords (TEAM_X_PASSWORD) 
                      and register to upgrade to the database authentication system.
                    </p>
                  </div>

                  <div className="p-4 bg-card border border-border rounded-lg">
                    <h3 className="font-medium text-foreground mb-2">File Storage</h3>
                    <p className="text-sm text-muted-foreground">
                      Files are stored in the uploads/ directory. Admin file visibility is 
                      independent of assignment open/close settings.
                    </p>
                  </div>
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

                <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-2">Reset Server for New Semester</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will permanently delete ALL data:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                        <li>All uploaded files (from all teams and admin)</li>
                        <li>All team accounts and registrations</li>
                        <li>Reset all assignment settings to closed</li>
                        <li>Clear all login sessions</li>
                      </ul>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Reset Server
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-destructive">Reset Server for New Semester</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
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
                              <Label htmlFor="confirmText">Type "RESET ALL DATA" to confirm</Label>
                              <Input
                                id="confirmText"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="RESET ALL DATA"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setAdminPassword("");
                              setConfirmText("");
                            }}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleResetServer}
                              disabled={resetServerMutation.isPending}
                            >
                              {resetServerMutation.isPending ? "Resetting..." : "Reset Server"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}