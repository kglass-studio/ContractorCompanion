import { useState } from "react";
import { BellIcon } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { 
    unreadNotifications, 
    notifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const [, navigate] = useLocation();

  const handleNotificationClick = (notification: any) => {
    // Mark the notification as read
    markAsRead(notification.id);
    setOpen(false);

    // Navigate based on notification type and data
    if (notification.type === 'followup' && notification.data?.clientId) {
      navigate(`/clients/${notification.data.clientId}`);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadNotifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "px-4 py-3 cursor-pointer flex flex-col items-start gap-1",
                  !notification.read && "bg-gray-50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(notification.createdAt), 'h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-3 right-3" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}