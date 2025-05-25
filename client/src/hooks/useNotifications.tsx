import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Notification type that matches the server
export interface Notification {
  id: string;
  type: 'followup' | 'jobStatus' | 'system';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  data?: any;
}

export function useNotifications() {
  const { toast } = useToast();
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
  
  // Fetch all notifications
  const { 
    data: notifications = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiRequest('/api/notifications');
      // Convert string dates to Date objects
      return (response as any[]).map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
    },
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['/api/notifications/unread'],
    queryFn: async () => {
      const response = await apiRequest('/api/notifications/unread');
      // Convert string dates to Date objects
      return (response as any[]).map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Mark a notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      } as RequestInit);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }
  });
  
  // Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/notifications/read-all', {
        method: 'PUT'
      } as RequestInit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }
  });
  
  // Show toast notifications for new unread notifications
  useEffect(() => {
    if (unreadNotifications.length > 0) {
      // Find notifications that we haven't shown toasts for yet
      const notShownNotifications = unreadNotifications.filter(
        (notification: Notification) => !newNotifications.find(n => n.id === notification.id)
      );
      
      // Show toast for each new notification
      notShownNotifications.forEach((notification: Notification) => {
        toast({
          title: notification.title,
          description: notification.message,
          action: (
            <div 
              className="cursor-pointer flex items-center" 
              onClick={() => markAsRead(notification.id)}
            >
              <span>Mark as Read</span>
            </div>
          ),
        });
      });
      
      // Update the list of notifications we've shown toasts for
      if (notShownNotifications.length > 0) {
        setNewNotifications(prev => [...prev, ...notShownNotifications]);
      }
    }
  }, [unreadNotifications, toast, markAsRead]);
  
  return {
    notifications,
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
    refetch
  };
}