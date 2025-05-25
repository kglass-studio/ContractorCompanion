import { useState, useEffect } from "react";
import { CloudOffIcon, CloudIcon, RefreshCwIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineIndicator() {
  const { isOnline, hasPendingChanges, syncChanges } = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Auto-collapse after a delay
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (expanded) {
      timeout = setTimeout(() => {
        setExpanded(false);
      }, 5000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [expanded]);
  
  // Handle sync button click
  const handleSync = async () => {
    if (syncing || !isOnline) return;
    
    setSyncing(true);
    try {
      await syncChanges();
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && !hasPendingChanges) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={`fixed bottom-4 left-4 rounded-lg shadow-lg overflow-hidden z-50 cursor-pointer ${
          isOnline ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-red-50 text-red-900 border border-red-200"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="px-4 py-3 flex items-center">
          {isOnline ? (
            <CloudIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          ) : (
            <CloudOffIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          )}
          
          <div className="flex-grow">
            {isOnline ? (
              <span className="font-medium">Online with pending changes</span>
            ) : (
              <span className="font-medium">You're offline</span>
            )}
          </div>
          
          {isOnline && hasPendingChanges && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-2 h-8 px-2" 
              onClick={(e) => {
                e.stopPropagation();
                handleSync();
              }}
              disabled={syncing}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync now"}
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-2 bg-white/50 border-t border-gray-100 text-sm"
            >
              {isOnline ? (
                <div>
                  <p>You have changes that need to be synchronized to the server.</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Click "Sync now" to upload your changes or they'll sync automatically when the connection is stable.
                  </p>
                </div>
              ) : (
                <div>
                  <p>Your changes are being saved locally and will sync when you're back online.</p>
                  <p className="mt-1 text-xs text-gray-500">
                    You can continue working as normal. All your data is safely stored on your device.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}