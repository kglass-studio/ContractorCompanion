import { useLocation, Link } from "wouter";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function NavigationBar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="flex justify-around items-center p-2">
          <Link href="/">
            <div className={`flex flex-col items-center justify-center p-2 cursor-pointer ${isActive("/") && !isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          <Link href="/clients">
            <div className={`flex flex-col items-center justify-center p-2 cursor-pointer ${isActive("/clients") ? "text-primary" : "text-gray-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs mt-1">Clients</span>
            </div>
          </Link>
          <Link href="/calendar">
            <div className={`flex flex-col items-center justify-center p-2 cursor-pointer ${isActive("/calendar") ? "text-primary" : "text-gray-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs mt-1">Calendar</span>
            </div>
          </Link>
          <div className="relative flex flex-col items-center justify-center">
            <NotificationBell />
            <span className="text-xs mt-1 text-gray-500">Alerts</span>
          </div>
          <Link href="/profile">
            <div className={`flex flex-col items-center justify-center p-2 cursor-pointer ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}
