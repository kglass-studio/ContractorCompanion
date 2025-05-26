import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import FollowupCard from "./FollowupCard";
import StatusSummary from "./StatusSummary";
import ClientCard from "./ClientCard";
import { useFollowups } from "@/hooks/useFollowups";
import { useClients } from "@/hooks/useClients";
import { useDashboardCounts } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { 
  PlusIcon, 
  User, 
  Settings, 
  LogOut, 
  Search, 
  CreditCard, 
  Crown,
  AlertCircle
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: todayFollowups, isLoading: isLoadingFollowups } = useFollowups({ today: true });
  const { data: clients, isLoading: isLoadingClients } = useClients({ limit: 3 });
  const { data: counts, isLoading: isLoadingCounts } = useDashboardCounts();
  const [showSearch, setShowSearch] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free'|'paid'>('free');
  const [clientCount, setClientCount] = useState(0);
  const { toast } = useToast();

  // Load subscription status from localStorage
  useEffect(() => {
    const userPlan = localStorage.getItem('userPlan');
    if (userPlan === 'paid') {
      setSubscriptionPlan('paid');
    }
    
    // Update client count for plan restriction notifications
    if (clients && clients.length) {
      setClientCount(clients.length);
    }
  }, [clients]);

  // Show warnings if approaching free plan limits
  useEffect(() => {
    if (subscriptionPlan === 'free' && clientCount >= 4) {
      toast({
        title: "Approaching Client Limit",
        description: "You're approaching the 5-client limit on the free plan. Upgrade to unlimited for more clients!",
        variant: "destructive",
      });
    }
  }, [clientCount, subscriptionPlan, toast]);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    // You can implement search functionality in the future
    alert("Search functionality will be available in a future update");
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">JobTrack</h1>
            
            {/* Subscription badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center ${
                    subscriptionPlan === 'paid' 
                      ? 'bg-amber-400 text-amber-900' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {subscriptionPlan === 'paid' ? (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        <span>PRO</span>
                      </>
                    ) : (
                      <>
                        <span>FREE</span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{subscriptionPlan === 'paid' 
                    ? 'Unlimited Pro Plan - No client limits!' 
                    : 'Free Plan - Limited to 5 clients'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex gap-3">
            {/* Only show subscription button for free tier */}
            {subscriptionPlan === 'free' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="p-2 rounded-full hover:bg-blue-600 transition" 
                      aria-label="Upgrade to Pro"
                      onClick={() => navigate("/payment")}
                    >
                      <CreditCard className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Pro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <button 
              className="p-2 rounded-full hover:bg-blue-600 transition" 
              aria-label="Search"
              onClick={handleSearchClick}
            >
              <Search className="h-5 w-5" />
            </button>
            
            <div className="p-1">
              <NotificationBell />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-blue-600 transition" aria-label="Account">
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                
                {/* Subscription Management */}
                <DropdownMenuItem onClick={() => {
                  const userPlan = localStorage.getItem('userPlan');
                  if (userPlan === 'unlimited' || userPlan === 'paid') {
                    navigate("/subscription");
                  } else {
                    navigate("/payment");
                  }
                }}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  localStorage.removeItem('isLoggedIn');
                  localStorage.removeItem('userPlan');
                  navigate("/");
                  window.location.reload(); // Force a refresh to clear any cached state
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Today's Follow-ups Section */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Today's Follow-ups</h2>
            <Link href="/followups" className="text-primary text-sm">View All</Link>
          </div>
          
          <div className="space-y-3">
            {isLoadingFollowups ? (
              <div className="bg-white rounded-lg shadow p-3 border-l-4 border-primary animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ) : todayFollowups && todayFollowups.length > 0 ? (
              todayFollowups.map((followup) => (
                <FollowupCard key={followup.id} followup={followup} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-3 text-center text-gray-500">
                No follow-ups scheduled for today
              </div>
            )}
          </div>
        </section>

        {/* Quick Status Filters */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Job Status</h2>
          {isLoadingCounts ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center rounded-lg bg-white shadow p-3 border-t-4 border-gray-300 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                  <div className="h-4 bg-gray-100 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : (
            <StatusSummary counts={counts || {}} />
          )}
        </section>

        {/* Recent Clients Section */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Clients</h2>
            <Link href="/clients" className="text-primary text-sm">View All</Link>
          </div>
          
          <div className="space-y-3">
            {isLoadingClients ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-3 animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-100 rounded w-8"></div>
                    <div className="h-8 bg-gray-100 rounded w-8"></div>
                    <div className="h-8 bg-gray-100 rounded w-8"></div>
                  </div>
                </div>
              ))
            ) : clients && clients.length > 0 ? (
              clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-3 text-center text-gray-500">
                No clients yet. Add your first client!
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <Button 
        size="icon"
        className="fixed bottom-20 right-4 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-10 text-2xl"
        onClick={() => navigate("/clients/add")}
      >
        <PlusIcon size={24} />
      </Button>
    </div>
  );
}
