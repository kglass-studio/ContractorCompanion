import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/DashboardPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import AddClientPage from "@/pages/AddClientPage";
import AddNotePage from "@/pages/AddNotePage";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import SignupPage from "@/pages/SignupPage";
import PaymentPage from "@/pages/PaymentPage";
import MobileLayout from "@/components/layout/MobileLayout";
import { useState, useEffect } from "react";
import { OnlineStatusProvider } from "@/hooks/useOnlineStatus";

// Simple auth check (this would be replaced with a real auth system)
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in (in a real app, this would verify a token)
    const checkAuth = async () => {
      try {
        // Simulate checking auth status
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading };
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // If still loading auth status, show nothing (or a loading spinner)
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Switch>
      {/* Public routes - accessible to all users */}
      <Route path="/" component={isAuthenticated ? DashboardPage : LandingPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/payment" component={PaymentPage} />
      
      {/* Protected routes - only for authenticated users */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/clients" component={ClientsPage} />
          <Route path="/clients/add" component={AddClientPage} />
          <Route path="/clients/:id/notes/add" component={AddNotePage} />
          <Route path="/clients/:id" component={ClientDetailPage} />
        </>
      ) : (
        // Redirect to landing page if not authenticated and trying to access protected routes
        <Route path="/:rest*">
          {() => {
            navigate("/");
            return null;
          }}
        </Route>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <OnlineStatusProvider>
          <MobileLayout>
            <Router />
          </MobileLayout>
        </OnlineStatusProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
