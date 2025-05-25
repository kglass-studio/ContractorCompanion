import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage } from "./storage";
import {
  insertClientSchema,
  insertNoteSchema,
  insertFollowupSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  initializeNotificationSystem,
  getAllNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createFollowupCompletionNotification
} from "./notifications";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { uploadRouter, serveUploads } from "./uploads";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up file uploads
  serveUploads(app);
  app.use("/api/uploads", uploadRouter);
  
  const apiRouter = express.Router();
  
  // Helper function to get user ID from session or request
  const getUserId = (req: Request): string => {
    // In a real app, this would come from authenticated session
    // For now, we'll use a value from the headers or query
    // This is just a temporary solution until we implement proper auth
    const userId = req.headers['x-user-id'] || 
                  req.query.userId || 
                  'default-user';
    return userId as string;
  };

  // Clients endpoints with user isolation
  apiRouter.get("/clients", async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const userId = getUserId(req);
    
    try {
      if (status) {
        const clients = await storage.getClientsByStatus(userId, status);
        res.json(clients);
      } else {
        const clients = await storage.getClients(userId);
        res.json(clients);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      const client = await storage.getClient(userId, id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  apiRouter.post("/clients", async (req: Request, res: Response) => {
    try {
      console.log("Client creation request received:", req.body);
      
      // Get the user ID from the authenticated session or request
      const userId = getUserId(req);
      
      // Prepare client data with user ID
      const rawClientData = { ...req.body, userId };
      const clientData = insertClientSchema.parse(rawClientData);
      
      console.log("Validated client data:", clientData);
      const client = await storage.createClient(clientData);
      console.log("Client created:", client);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Special route just for updating client status
  apiRouter.post("/clients/:id/update-status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Get the user ID for security check
      const userId = getUserId(req);
      console.log(`Updating client ${id} status for user ${userId}`, req.body);
      
      // First check if this client belongs to this user
      const existingClient = await storage.getClient(userId, id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Validate the status from request body
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // List of valid statuses
      const validStatuses = ["lead", "quoted", "scheduled", "completed", "paid"];
      
      // Ensure the status is valid
      const validStatus = validStatuses.includes(status) ? status : "lead";
      
      // Create updated client object
      const updatedClient = {
        ...existingClient,
        status: validStatus,
        updatedAt: new Date()
      };
      
      // Special handling for MemStorage
      if (storage instanceof MemStorage) {
        // Get the clients map
        const clientsMap = (storage as any).clients;
        
        if (clientsMap) {
          // Check if we're using Map or Array storage
          if (typeof clientsMap.set === 'function') {
            // Using Map
            clientsMap.set(id, updatedClient);
          } else if (Array.isArray(clientsMap)) {
            // Using Array
            const index = clientsMap.findIndex(c => c.id === id);
            if (index !== -1) {
              clientsMap[index] = updatedClient;
            }
          }
          
          console.log("Updated client status directly in memory:", updatedClient);
          return res.status(200).json(updatedClient);
        }
      }
      
      // If we get here, try the standard update method
      const result = await storage.updateClient(id, { status: validStatus });
      
      if (result) {
        return res.status(200).json(result);
      } else {
        return res.status(200).json(updatedClient);
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      return res.status(500).json({ message: "Failed to update client status" });
    }
  });
  
  apiRouter.put("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Get the user ID for security check
      const userId = getUserId(req);
      console.log(`Updating client ${id} for user ${userId}`, req.body);
      
      // First check if this client belongs to this user
      const existingClient = await storage.getClient(userId, id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // User owns this client, proceed with update
      const clientData = insertClientSchema.partial().parse(req.body);
      console.log("Validated client update data:", clientData);
      
      try {
        // First ensure the client exists and belongs to this user
        const existingClient = await storage.getClient(userId, id);
        if (!existingClient) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Validate client status if it's being updated
        if (clientData.status) {
          // List of valid statuses from our schema
          const validStatuses = ["lead", "quoted", "scheduled", "completed", "paid"];
          
          if (!validStatuses.includes(clientData.status)) {
            // Default to lead for invalid statuses
            console.log("Invalid status value, defaulting to lead");
            clientData.status = "lead";
          }
        }

        // Create the updated client object
        const updatedClient = {
          ...existingClient,
          ...clientData,
          updatedAt: new Date()
        };
        
        // Direct update for in-memory storage
        if (storage instanceof MemStorage) {
          // Get the private clients Map from the MemStorage instance
          const clientsMap = (storage as any).clients;
          
          if (clientsMap && typeof clientsMap.set === 'function') {
            // Directly update the client in the Map
            clientsMap.set(id, updatedClient);
            console.log("Updated client directly in memory");
            
            // Return the updated client data
            return res.json(updatedClient);
          }
        }
        
        // If we couldn't do a direct update, try the standard method
        console.log("Using standard client update method");
        try {
          // Use the direct method with just the id - this matches the actual implementation
          const result = await storage.updateClient(id, clientData);
          
          // If the update was successful, serialize and return the updated client
          if (result) {
            return res.status(200).json(result);
          } else {
            // If no result was returned, use our constructed object
            return res.status(200).json(updatedClient);
          }
        } catch (updateErr) {
          console.error("Error in storage update:", updateErr);
          // Even if there's an error, return the updated client to keep the UI in sync
          return res.status(200).json(updatedClient);
        }
      } catch (err) {
        console.error("Error updating client:", err);
        return res.status(500).json({ message: "Failed to update client" });
      }
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  apiRouter.delete("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Get the user ID for security check
      const userId = getUserId(req);
      
      // First check if this client belongs to this user
      const existingClient = await storage.getClient(userId, id);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // User owns this client, proceed with deletion
      const success = await storage.deleteClient(userId, id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Notes endpoints with user isolation
  apiRouter.get("/clients/:clientId/notes", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // First verify the client belongs to this user
      const client = await storage.getClient(userId, clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Client belongs to user, proceed with fetching notes
      const notes = await storage.getNotes(clientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  apiRouter.post("/notes", async (req: Request, res: Response) => {
    try {
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Parse note data
      const noteData = insertNoteSchema.parse(req.body);
      
      // Verify the client belongs to this user
      const client = await storage.getClient(userId, noteData.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Client belongs to user, proceed with creating note
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  apiRouter.delete("/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid note ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Get the note first
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check if note belongs to a client owned by this user
      const client = await storage.getClient(userId, note.clientId);
      if (!client) {
        return res.status(403).json({ message: "Not authorized to delete this note" });
      }
      
      // User owns the client, proceed with deletion
      const success = await storage.deleteNote(id);
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Followups endpoints with user isolation
  apiRouter.get("/followups", async (req: Request, res: Response) => {
    try {
      // Get user ID for security
      const userId = getUserId(req);
      
      const today = req.query.today === "true";
      
      // Get all clients for this user
      const clientsForUser = await storage.getClients(userId);
      const clientIds = clientsForUser.map(client => client.id);
      
      // If user has no clients, return empty array
      if (clientIds.length === 0) {
        return res.json([]);
      }
      
      // Get followups filtered by user's clients
      const allFollowups = today
        ? await storage.getTodaysFollowups()
        : await storage.getFollowups();
        
      // Filter to only include followups for this user's clients
      const userFollowups = allFollowups.filter(followup => 
        clientIds.includes(followup.clientId)
      );
      
      res.json(userFollowups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followups" });
    }
  });

  apiRouter.get("/clients/:clientId/followups", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Verify the client belongs to this user
      const client = await storage.getClient(userId, clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Client belongs to user, proceed with fetching followups
      const followups = await storage.getFollowupsByClient(clientId);
      res.json(followups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followups" });
    }
  });

  apiRouter.post("/followups", async (req: Request, res: Response) => {
    try {
      console.log("Received follow-up data:", req.body);
      
      // Manually validate and transform the data
      const { clientId, action, scheduledDate, isCompleted, reminder } = req.body;
      
      if (!clientId || !action || !scheduledDate) {
        return res.status(400).json({ 
          message: "Missing required fields: clientId, action, and scheduledDate are required" 
        });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Verify the client belongs to this user before creating a followup
      const client = await storage.getClient(userId, Number(clientId));
      if (!client) {
        return res.status(404).json({ message: "Client not found or not authorized" });
      }
      
      // Convert string date to Date object if it's a string
      const parsedDate = typeof scheduledDate === 'string' 
        ? new Date(scheduledDate) 
        : scheduledDate;
      
      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // Create the data object with the proper format
      const followupData = {
        clientId: Number(clientId),
        action,
        scheduledDate: parsedDate,
        isCompleted: isCompleted ?? false,
        reminder: reminder ?? true
      };
      
      const followup = await storage.createFollowup(followupData);
      res.status(201).json(followup);
    } catch (error) {
      console.error("Error creating followup:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create followup" });
    }
  });

  apiRouter.put("/followups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid followup ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Get the followup
      const existingFollowup = await storage.getFollowup(id);
      if (!existingFollowup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      // Verify the client associated with this followup belongs to this user
      const client = await storage.getClient(userId, existingFollowup.clientId);
      if (!client) {
        return res.status(403).json({ message: "Not authorized to update this followup" });
      }

      // User owns the client, proceed with update
      const followupData = insertFollowupSchema.partial().parse(req.body);
      const followup = await storage.updateFollowup(id, followupData);
      if (!followup) {
        return res.status(404).json({ message: "Followup not found" });
      }

      res.json(followup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update followup" });
    }
  });

  apiRouter.put("/followups/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid followup ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Get the followup first
      const existingFollowup = await storage.getFollowup(id);
      if (!existingFollowup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      // Verify the client associated with this followup belongs to this user
      const client = await storage.getClient(userId, existingFollowup.clientId);
      if (!client) {
        return res.status(403).json({ message: "Not authorized to complete this followup" });
      }
      
      // User owns the client, proceed with completing the followup
      const followup = await storage.completeFollowup(id);
      if (!followup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      // Create a notification when a follow-up is completed
      createFollowupCompletionNotification(followup, client.name);

      res.json(followup);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete followup" });
    }
  });

  apiRouter.delete("/followups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid followup ID" });
      }
      
      // Get user ID for security check
      const userId = getUserId(req);
      
      // Get the followup first
      const existingFollowup = await storage.getFollowup(id);
      if (!existingFollowup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      // Verify the client associated with this followup belongs to this user
      const client = await storage.getClient(userId, existingFollowup.clientId);
      if (!client) {
        return res.status(403).json({ message: "Not authorized to delete this followup" });
      }
      
      // User owns the client, proceed with deletion
      const success = await storage.deleteFollowup(id);
      if (!success) {
        return res.status(404).json({ message: "Followup not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete followup" });
    }
  });

  // Dashboard counts
  apiRouter.get("/dashboard/counts", async (req: Request, res: Response) => {
    try {
      const leads = await storage.getClientsByStatus("lead");
      const quoted = await storage.getClientsByStatus("quoted");
      const scheduled = await storage.getClientsByStatus("scheduled");
      const completed = await storage.getClientsByStatus("completed");
      const paid = await storage.getClientsByStatus("paid");
      
      res.json({
        leads: leads.length,
        quoted: quoted.length,
        scheduled: scheduled.length,
        completed: completed.length,
        paid: paid.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard counts" });
    }
  });

  // Notification endpoints
  apiRouter.get("/notifications", async (_req: Request, res: Response) => {
    try {
      const notifications = getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  apiRouter.get("/notifications/unread", async (_req: Request, res: Response) => {
    try {
      const notifications = getUnreadNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  apiRouter.put("/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  apiRouter.put("/notifications/read-all", async (_req: Request, res: Response) => {
    try {
      markAllNotificationsAsRead();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  // PayPal payment routes
  app.get("/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  const httpServer = createServer(app);
  return httpServer;
}
