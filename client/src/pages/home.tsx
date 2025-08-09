import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Upload, Grid3X3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import UploadSection from "@/components/upload-section";
import FileGallery from "@/components/file-gallery";
import OtherTeamFiles from "@/components/other-team-files";
import AdminFilesManager from "@/components/admin-files-manager";
import AdminSettingsModal from "@/components/admin-settings-modal";
import UserMenu from "@/components/user-menu";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [currentView, setCurrentView] = useState<"upload" | "team-files" | "other-files" | "admin-files">("upload");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: user } = useQuery<{ teamNumber: number; isAdmin: boolean }>({
    queryKey: ["/api/user"]
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      queryClient.clear();
      window.location.reload();
    },
    onError: () => {
      // Force reload on error too
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="bg-background min-h-screen font-inter">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Product Marketing</h1>
                <p className="text-sm text-muted-foreground">
                  Assignment Hub {user && `- ${user.isAdmin ? 'Admin' : `Team ${user.teamNumber}`}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("upload")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    currentView === "upload" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("team-files")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    currentView === "team-files" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  {user?.isAdmin ? "Team Files" : "Your Files"}
                </Button>
                {user?.isAdmin ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("admin-files")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      currentView === "admin-files" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    W.'s Files
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("other-files")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md opacity-75 ${
                      currentView === "other-files" 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Other Team Files
                  </Button>
                )}
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Controls */}
              {user?.isAdmin ? (
                <>
                  {/* Admin: Show logout button and settings gear */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdminModal(true)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                    title="Admin Settings"
                  >
                    <Settings className="text-lg" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Team Members: Show hamburger menu */}
                  <UserMenu />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "upload" && (
          <div className="animate-fade-in">
            <UploadSection onUploadSuccess={() => setCurrentView(user?.isAdmin ? "admin-files" : "team-files")} />
          </div>
        )}
        
        {currentView === "team-files" && (
          <div className="animate-fade-in">
            <FileGallery onUploadClick={() => setCurrentView("upload")} />
          </div>
        )}
        
        {currentView === "other-files" && (
          <div className="animate-fade-in">
            <OtherTeamFiles />
          </div>
        )}
        
        {currentView === "admin-files" && (
          <div className="animate-fade-in">
            <AdminFilesManager />
          </div>
        )}
      </main>

      <AdminSettingsModal 
        open={showAdminModal}
        onOpenChange={setShowAdminModal}
      />
      
    </div>
  );
}
