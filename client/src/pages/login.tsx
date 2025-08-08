import { useState } from "react";
import { GraduationCap, LogIn, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LoginProps {
  onLoginSuccess: (user: { teamNumber: number; isAdmin: boolean }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [teamNumber, setTeamNumber] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const teamLoginMutation = useMutation({
    mutationFn: async ({ teamNumber, password }: { teamNumber: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", { teamNumber: parseInt(teamNumber), password });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: "Login successful",
      });
      onLoginSuccess(data.user);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid team number or password",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const response = await apiRequest("POST", "/api/admin-login", { password });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: "Admin login successful",
      });
      onLoginSuccess(data.user);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Admin Login Failed",
        description: error.message || "Invalid admin password",
      });
    },
  });

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamNumber || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both team number and password",
      });
      return;
    }

    const teamNum = parseInt(teamNumber);
    if (isNaN(teamNum) || teamNum < 1 || teamNum > 9) {
      toast({
        variant: "destructive",
        title: "Invalid Team Number",
        description: "Team number must be between 1 and 9",
      });
      return;
    }

    teamLoginMutation.mutate({ teamNumber, password });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPassword) {
      toast({
        variant: "destructive",
        title: "Missing Password",
        description: "Please enter the admin password",
      });
      return;
    }

    adminLoginMutation.mutate({ password: adminPassword });
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center font-inter p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <GraduationCap className="text-primary-foreground text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Product Marketing</CardTitle>
          <p className="text-muted-foreground">Assignment Hub</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="team">Team Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team" className="mt-6">
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamNumber">Team Number</Label>
                  <Input
                    id="teamNumber"
                    type="number"
                    min="1"
                    max="9"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    placeholder="Enter your team number (1-9)"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your team password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={teamLoginMutation.isPending}
                >
                  {teamLoginMutation.isPending ? (
                    <>
                      <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login as Team {teamNumber || 'X'}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="admin" className="mt-6">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={adminLoginMutation.isPending}
                >
                  {adminLoginMutation.isPending ? (
                    <>
                      <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login as Admin
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}