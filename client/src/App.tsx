import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import Login from "@/pages/login";
import AdminSettings from "@/pages/admin-settings";
import NotFound from "@/pages/not-found";
import { LoaderIcon } from "lucide-react";

interface User {
  teamNumber: number;
  isAdmin: boolean;
}

function AuthenticatedApp() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: 0,
    gcTime: 0
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (error) {
      setIsAuthenticated(false);
    }
  }, [user, error]);
  
  // Show loading only on initial load
  if (isLoading && !isAuthenticated) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <LoaderIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show login if not authenticated or if we have an error (like 401)
  if (!user || error) {
    return (
      <Login 
        onLoginSuccess={(newUser) => {
          setIsAuthenticated(true);
          queryClient.setQueryData(["/api/user"], newUser);
          refetch(); // Force refetch to ensure fresh data
        }} 
      />
    );
  }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return <AuthenticatedApp />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="student-hub-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
