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
import AddFollowupPage from "@/pages/AddFollowupPage";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import SignupPage from "@/pages/SignupPage";
import LoginPage from "@/pages/LoginPage";
import PaymentPage from "@/pages/PaymentPage";
import CalendarPage from "@/pages/CalendarPage";
import ProfilePage from "@/pages/ProfilePage";
import MobileLayout from "@/components/layout/MobileLayout";
import { useState, useEffect, createContext, useContext } from "react";
import { OnlineStatusProvider } from "@/hooks/useOnlineStatus";

// Create authentication context to share auth state throughout the app
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string;
  login: (specificUserId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to access the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// Authentication hook with user ID management and login/logout functionality
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');

  // Function to log user out - clear auth state and user ID
  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId('');
    
    // Reset all queries to ensure data is reloaded after login
    queryClient.clear();
  };

  // Function to log user in with a specific ID or generate a new one
  const login = (specificUserId?: string) => {
    // Generate a unique ID for this user or use the one provided
    const newUserId = specificUserId || 
                      `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', newUserId);
    setIsAuthenticated(true);
    setUserId(newUserId);
    
    // Reset all queries to ensure data is loaded fresh
    queryClient.clear();
  };

  useEffect(() => {
    // Check if user is logged in and get user ID
    const checkAuth = async () => {
      try {
        // Check auth status
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        // Get user ID from local storage
        const currentUserId = localStorage.getItem('userId');
        
        if (loggedIn && currentUserId) {
          setUserId(currentUserId);
          setIsAuthenticated(true);
        } else if (loggedIn && !currentUserId) {
          // User is logged in but no ID - set one
          login();
        } else {
          // Not logged in
          setIsAuthenticated(false);
          setUserId('');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading, userId, login, logout };
}

function Router() {
  const { isAuthenticated, isLoading, userId, login, logout } = useAuthContext();
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
      <Route path="/login" component={LoginPage} />
      <Route path="/payment" component={PaymentPage} />
      
      {/* Protected routes - only for authenticated users */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/clients" component={ClientsPage} />
          <Route path="/clients/add" component={AddClientPage} />
          <Route path="/clients/:id/notes/add" component={AddNotePage} />
          <Route path="/clients/:id/followup/add" component={AddFollowupPage} />
          <Route path="/clients/:id" component={ClientDetailPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/profile" component={ProfilePage} />
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

// AuthProvider component to provide auth context to the entire app
function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <OnlineStatusProvider>
            <MobileLayout>
              <Router />
            </MobileLayout>
          </OnlineStatusProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
