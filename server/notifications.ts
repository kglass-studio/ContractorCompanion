import { Followup } from "@shared/schema";
import { storage } from "./storage";
import { format, isSameDay, isToday, isTomorrow, addDays } from "date-fns";

// Types for notification system
export interface Notification {
  id: string;
  type: 'followup' | 'jobStatus' | 'system';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  data?: any;
}

// In-memory storage for notifications (in a real app, this would be in the database)
const notifications: Map<string, Notification> = new Map();

/**
 * Generate notifications for upcoming follow-ups
 */
export async function generateFollowupNotifications(): Promise<Notification[]> {
  try {
    // Get all active follow-ups
    const allFollowups = await storage.getFollowups();
    const activeFollowups = allFollowups.filter(f => !f.isCompleted);
    
    // Get followups due today or tomorrow
    const upcomingFollowups = activeFollowups.filter(followup => {
      const date = new Date(followup.scheduledDate);
      return isToday(date) || isTomorrow(date);
    });
    
    const newNotifications: Notification[] = [];
    
    // Create notifications for each upcoming followup
    for (const followup of upcomingFollowups) {
      const notificationId = `followup-${followup.id}`;
      
      // Check if we already created this notification
      if (notifications.has(notificationId)) {
        continue;
      }
      
      const date = new Date(followup.scheduledDate);
      const isForToday = isToday(date);
      
      // Get client info for better notification context
      const client = await storage.getClient(followup.clientId);
      if (!client) continue;
      
      const notification: Notification = {
        id: notificationId,
        type: 'followup',
        title: isForToday ? 'Follow-up Due Today' : 'Follow-up Due Tomorrow',
        message: `${client.name}: ${followup.action} - ${format(date, 'MMM d, yyyy')}`,
        createdAt: new Date(),
        read: false,
        data: {
          followupId: followup.id,
          clientId: followup.clientId,
          clientName: client.name,
          action: followup.action,
          scheduledDate: followup.scheduledDate,
        }
      };
      
      notifications.set(notificationId, notification);
      newNotifications.push(notification);
    }
    
    return newNotifications;
  } catch (error) {
    console.error('Error generating followup notifications:', error);
    return [];
  }
}

/**
 * Get all unread notifications
 */
export function getUnreadNotifications(): Notification[] {
  return Array.from(notifications.values())
    .filter(notification => !notification.read)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get all notifications
 */
export function getAllNotifications(): Notification[] {
  return Array.from(notifications.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(id: string): boolean {
  const notification = notifications.get(id);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  for (const notification of notifications.values()) {
    notification.read = true;
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  notifications.clear();
}

/**
 * Create a follow-up completion notification
 */
export function createFollowupCompletionNotification(followup: Followup, clientName: string): Notification {
  const notificationId = `followup-complete-${followup.id}`;
  
  const notification: Notification = {
    id: notificationId,
    type: 'followup',
    title: 'Follow-up Completed',
    message: `You completed a follow-up with ${clientName}: ${followup.action}`,
    createdAt: new Date(),
    read: false,
    data: {
      followupId: followup.id,
      clientId: followup.clientId,
      clientName,
      action: followup.action
    }
  };
  
  notifications.set(notificationId, notification);
  return notification;
}

/**
 * Initialize background notification checking
 * In a real app, this would be handled by a scheduled job/cron
 */
export function initializeNotificationSystem(): void {
  // Check for notifications on startup
  generateFollowupNotifications();
  
  // Check for new notifications every hour
  // In a production app, this would be a scheduled job rather than setInterval
  setInterval(async () => {
    await generateFollowupNotifications();
  }, 60 * 60 * 1000); // Every hour
}