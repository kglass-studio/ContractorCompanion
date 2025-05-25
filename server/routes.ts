import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

  apiRouter.put("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
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

      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Notes endpoints
  apiRouter.get("/clients/:clientId/notes", async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      const notes = await storage.getNotes(clientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  apiRouter.post("/notes", async (req: Request, res: Response) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
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

      const success = await storage.deleteNote(id);
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Followups endpoints
  apiRouter.get("/followups", async (req: Request, res: Response) => {
    try {
      const today = req.query.today === "true";
      
      if (today) {
        const followups = await storage.getTodaysFollowups();
        res.json(followups);
      } else {
        const followups = await storage.getFollowups();
        res.json(followups);
      }
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

      const followup = await storage.completeFollowup(id);
      if (!followup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      // Create a notification when a follow-up is completed
      const client = await storage.getClient(followup.clientId);
      if (client) {
        createFollowupCompletionNotification(followup, client.name);
      }

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
