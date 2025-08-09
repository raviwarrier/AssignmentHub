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
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [existingTeamName, setExistingTeamName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const teamLoginMutation = useMutation({
    mutationFn: async ({ teamNumber, password }: { teamNumber: string; password: string }) => {
      console.log('Attempting login with team:', teamNumber, 'password length:', password.length);
      const response = await apiRequest("POST", "/api/login", { 
        teamNumber: parseInt(teamNumber), 
        password 
      });
      console.log('Login response:', response);
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
        description: error.message || "Invalid credentials",
      });
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async ({ teamNumber, teamName, password }: { teamNumber: string; teamName?: string; password: string }) => {
      const response = await apiRequest("POST", "/api/register", { 
        teamNumber: parseInt(teamNumber), 
        teamName: teamName?.trim() || "", 
        password 
      });
      return response;
    },
    onSuccess: (data: any) => {
      const regTeamNumber = data?.team?.teamNumber || teamNumber;
      const regTeamName = data?.team?.teamName;
      toast({
        title: "Registration Successful!",
        description: `Team ${regTeamNumber}${regTeamName ? ` (${regTeamName})` : ''} has been registered. You can now log in.`,
      });
      setIsRegistering(false);
      // Clear registration form
      setTeamName("");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to register team",
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

  // Function to check existing team name when team number changes
  const checkExistingTeamName = async (teamNum: string) => {
    if (!teamNum || isNaN(parseInt(teamNum))) {
      setExistingTeamName("");
      return;
    }
    
    try {
      // This would need a new API endpoint to check team names
      // For now, we'll just clear it
      setExistingTeamName("");
    } catch (error) {
      setExistingTeamName("");
    }
  };

  // Handle team number change
  const handleTeamNumberChange = (value: string) => {
    setTeamNumber(value);
    if (!isRegistering) {
      checkExistingTeamName(value);
    }
  };

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your password",
      });
      return;
    }

    if (!teamNumber) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your team number",
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

  const handleTeamRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamNumber || !password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in team number, password, and confirm password",
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

    if (teamName && teamName.trim().length > 0 && teamName.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Invalid Team Name",
        description: "Team name must be at least 3 characters long (or leave empty)",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Password and confirm password must match",
      });
      return;
    }

    if (password.length < 12) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 12 characters long",
      });
      return;
    }

    registrationMutation.mutate({ teamNumber, teamName: teamName?.trim() || "", password });
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
              <TabsTrigger value="admin">W.'s Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team" className="mt-6">
              <div className="space-y-4">
                {/* Toggle between Login and Registration */}
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    type="button"
                    variant={!isRegistering ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRegistering(false)}
                  >
                    Login
                  </Button>
                  <Button
                    type="button"
                    variant={isRegistering ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRegistering(true)}
                  >
                    Register Team
                  </Button>
                </div>

                {!isRegistering ? (
                  // Login Form
                  <form onSubmit={handleTeamLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamNumber">Team Number</Label>
                      <Input
                        id="teamNumber"
                        type="number"
                        min="1"
                        max="9"
                        value={teamNumber}
                        onChange={(e) => handleTeamNumberChange(e.target.value)}
                        placeholder="Team number (1-9)"
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
                        placeholder="Enter your password"
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
                          Login
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  // Registration Form
                  <form onSubmit={handleTeamRegistration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="regTeamNumber">Team Number *</Label>
                      <Input
                        id="regTeamNumber"
                        type="number"
                        min="1"
                        max="9"
                        value={teamNumber}
                        onChange={(e) => handleTeamNumberChange(e.target.value)}
                        placeholder="Choose team number (1-9)"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regTeamName">Team Name (optional)</Label>
                      <Input
                        id="regTeamName"
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Choose your team name (optional)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password *</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password (12+ chars)"
                        required
                      />
                      <div className="text-xs text-muted-foreground">
                        Must include: uppercase, lowercase, number, special character
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registrationMutation.isPending}
                    >
                      {registrationMutation.isPending ? (
                        <>
                          <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Register Team
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="mt-6">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">W.'s Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter W.'s password"
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
                      Login as W.
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