import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Clear the auth state
    localStorage.removeItem('isLoggedIn');
    
    // Show success message
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    
    // Redirect to landing page
    setTimeout(() => {
      navigate("/");
      window.location.reload(); // Force a refresh to clear any cached state
    }, 500);
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center gap-2">
          <button 
            className="p-1" 
            onClick={() => navigate("/")}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">User Settings</p>
              <Button 
                variant="outline" 
                className="w-full mt-2 justify-start"
                onClick={() => {
                  toast({
                    title: "Coming soon",
                    description: "This feature will be available in a future update",
                  });
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                Settings
              </Button>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Account</p>
              <Button 
                variant="outline" 
                className="w-full mt-2 justify-start text-orange-500"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">App Information</p>
              <div className="mt-2 text-sm text-gray-700">
                <p>Version: 1.0.0</p>
                <p>Made with ❤️ for solo contractors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}