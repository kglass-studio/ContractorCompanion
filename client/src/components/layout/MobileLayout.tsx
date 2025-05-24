import { ReactNode } from "react";
import NavigationBar from "./NavigationBar";
import OfflineIndicator from "./OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="app-container bg-white min-h-screen relative">
      {!isOnline && <OfflineIndicator />}
      <div className="pb-16">
        {children}
      </div>
      <NavigationBar />
    </div>
  );
}
