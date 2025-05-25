import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { getPendingActionsCount, syncOfflineActions, initOfflineSync } from "../lib/offlineSync";
import { useToast } from "./use-toast";

interface OnlineStatusContextType {
  isOnline: boolean;
  hasPendingChanges: boolean;
  syncChanges: () => Promise<boolean>;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: true,
  hasPendingChanges: false,
  syncChanges: async () => false
});

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize offline sync
  useEffect(() => {
    initOfflineSync();
    
    // Check for pending changes
    checkPendingChanges();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Auto-sync when coming online
      syncOfflineActions().then(didSync => {
        if (didSync) {
          toast({
            title: "Changes synchronized",
            description: "Your offline changes have been synchronized to the server.",
          });
          checkPendingChanges();
        }
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You are offline",
        description: "Changes will be saved locally and synchronized when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for changes periodically
    const intervalId = setInterval(checkPendingChanges, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [toast]);

  // Check for pending changes
  const checkPendingChanges = () => {
    const pendingCount = getPendingActionsCount();
    setHasPendingChanges(pendingCount > 0);
  };

  // Manually sync changes
  const syncChanges = async (): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Can't sync while offline",
        description: "Please connect to the internet to synchronize your changes.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const didSync = await syncOfflineActions();
      
      if (didSync) {
        toast({
          title: "Changes synchronized",
          description: "Your offline changes have been synchronized to the server.",
        });
        checkPendingChanges();
      } else if (hasPendingChanges) {
        toast({
          title: "Sync failed",
          description: "Some changes couldn't be synchronized. We'll try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No changes to sync",
          description: "All your data is already up to date.",
        });
      }
      
      return didSync;
    } catch (error) {
      toast({
        title: "Sync error",
        description: "An error occurred while synchronizing your changes.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <OnlineStatusContext.Provider value={{ isOnline, hasPendingChanges, syncChanges }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}