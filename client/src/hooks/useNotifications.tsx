import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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

// Helper function to parse notification data from API responses
const parseNotifications = (data: any[]): Notification[] => {
  return data.map(notification => ({
    ...notification,
    createdAt: new Date(notification.createdAt)
  }));
};

export function useNotifications() {
  const { toast } = useToast();
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
  
  // Fetch all notifications
  const { 
    data: notifications = [], 
    isLoading,
    refetch 
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      return parseNotifications(data);
    },
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications/unread'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread');
      if (!response.ok) {
        throw new Error('Failed to fetch unread notifications');
      }
      const data = await response.json();
      return parseNotifications(data);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Mark a notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
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
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    }
  });
  
  // Show toast notifications for new unread notifications
  useEffect(() => {
    if (unreadNotifications && unreadNotifications.length > 0) {
      // Find notifications that we haven't shown toasts for yet
      const notShownNotifications = unreadNotifications.filter(
        (notification) => !newNotifications.find(n => n.id === notification.id)
      );
      
      // Show toast for each new notification
      notShownNotifications.forEach((notification) => {
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