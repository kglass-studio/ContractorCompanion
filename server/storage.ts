import {
  clients,
  notes,
  followups,
  type Client,
  type InsertClient,
  type Note,
  type InsertNote,
  type Followup,
  type InsertFollowup,
  JobStatus,
} from "@shared/schema";
import { eq, and, gte, lt, desc, asc } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { log } from "./vite";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClientsByStatus(status: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Notes
  getNotes(clientId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;

  // Followups
  getFollowups(): Promise<Followup[]>;
  getFollowupsByClient(clientId: number): Promise<Followup[]>;
  getTodaysFollowups(): Promise<Followup[]>;
  getFollowup(id: number): Promise<Followup | undefined>;
  createFollowup(followup: InsertFollowup): Promise<Followup>;
  updateFollowup(id: number, followup: Partial<Followup>): Promise<Followup | undefined>;
  completeFollowup(id: number): Promise<Followup | undefined>;
  deleteFollowup(id: number): Promise<boolean>;
}

// Try to connect to database
let db: any = null;
try {
  if (process.env.DATABASE_URL) {
    try {
      // Parse and sanitize the connection string for Supabase
      let connectionString = process.env.DATABASE_URL.trim();
      
      // Fix common issues in connection strings
      // Remove duplicate protocol or domain sections if present
      if (connectionString.includes('postgresql://') && connectionString.indexOf('postgresql://', connectionString.indexOf('postgresql://') + 1) !== -1) {
        // Extract just the first part up to the first complete URL
        connectionString = connectionString.substring(0, connectionString.indexOf('@') + 1) + 
          connectionString.substring(connectionString.lastIndexOf('@') + 1);
      }
      
      // Ensure special characters in password are properly encoded
      if (connectionString.includes('#')) {
        connectionString = connectionString.replace(/#/g, '%23');
      }
      
      log(`Attempting connection with sanitized URL`, "database");
      
      try {
        // For Supabase, use the async client
        const sql = neon(connectionString);
        
        // Initialize the database with Drizzle
        db = drizzle(sql);
        
        // Test the connection with a simple query
        await sql`SELECT 1`;
        
        log("Database connection established successfully", "database");
      } catch (connError) {
        log(`Connection test failed: ${connError}`, "error");
        throw connError;
      }
    } catch (dbError) {
      log(`Database connection error: ${dbError}`, "error");
      log("Falling back to in-memory storage", "database");
      // Will fall back to memory storage
    }
  } else {
    log("No DATABASE_URL provided, using in-memory storage", "database");
  }
} catch (error) {
  log(`Failed to connect to database: ${error}`, "error");
}

export class MemStorage implements IStorage {
  private clients: Map<number, Client>;
  private notes: Map<number, Note>;
  private followups: Map<number, Followup>;
  private clientId: number;
  private noteId: number;
  private followupId: number;

  constructor() {
    this.clients = new Map();
    this.notes = new Map();
    this.followups = new Map();
    this.clientId = 1;
    this.noteId = 1;
    this.followupId = 1;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter((client) => client.status === status)
      .sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const now = new Date();
    const client: Client = {
      ...insertClient,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient: Client = {
      ...client,
      ...updateData,
      updatedAt: new Date(),
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Note methods
  async getNotes(clientId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter((note) => note.clientId === clientId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteId++;
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date(),
    };
    this.notes.set(id, note);

    // Update client's updatedAt
    const client = this.clients.get(note.clientId);
    if (client) {
      this.clients.set(client.id, {
        ...client,
        updatedAt: new Date(),
      });
    }

    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Followup methods
  async getFollowups(): Promise<Followup[]> {
    return Array.from(this.followups.values()).sort((a, b) => {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }

  async getFollowupsByClient(clientId: number): Promise<Followup[]> {
    return Array.from(this.followups.values())
      .filter((followup) => followup.clientId === clientId)
      .sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
  }

  async getTodaysFollowups(): Promise<Followup[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.followups.values())
      .filter((followup) => {
        const followupDate = new Date(followup.scheduledDate);
        return (
          followupDate >= today &&
          followupDate < tomorrow &&
          !followup.isCompleted
        );
      })
      .sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
  }

  async getFollowup(id: number): Promise<Followup | undefined> {
    return this.followups.get(id);
  }

  async createFollowup(insertFollowup: InsertFollowup): Promise<Followup> {
    const id = this.followupId++;
    const followup: Followup = {
      ...insertFollowup,
      id,
      createdAt: new Date(),
    };
    this.followups.set(id, followup);

    // Update client's updatedAt
    const client = this.clients.get(followup.clientId);
    if (client) {
      this.clients.set(client.id, {
        ...client,
        updatedAt: new Date(),
      });
    }

    return followup;
  }

  async updateFollowup(id: number, updateData: Partial<Followup>): Promise<Followup | undefined> {
    const followup = this.followups.get(id);
    if (!followup) return undefined;

    const updatedFollowup: Followup = {
      ...followup,
      ...updateData,
    };
    this.followups.set(id, updatedFollowup);
    return updatedFollowup;
  }

  async completeFollowup(id: number): Promise<Followup | undefined> {
    const followup = this.followups.get(id);
    if (!followup) return undefined;

    const completedFollowup: Followup = {
      ...followup,
      isCompleted: true,
    };
    this.followups.set(id, completedFollowup);
    return completedFollowup;
  }

  async deleteFollowup(id: number): Promise<boolean> {
    return this.followups.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Client methods
  async getClients(): Promise<Client[]> {
    try {
      const results = await db.select().from(clients).orderBy(desc(clients.updatedAt));
      return results;
    } catch (error) {
      log(`DB Error in getClients: ${error}`, "error");
      return [];
    }
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    try {
      const results = await db
        .select()
        .from(clients)
        .where(eq(clients.status, status as any))
        .orderBy(desc(clients.updatedAt));
      return results;
    } catch (error) {
      log(`DB Error in getClientsByStatus: ${error}`, "error");
      return [];
    }
  }

  async getClient(id: number): Promise<Client | undefined> {
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id));
      return result[0];
    } catch (error) {
      log(`DB Error in getClient: ${error}`, "error");
      return undefined;
    }
  }

  async createClient(client: InsertClient): Promise<Client> {
    try {
      const result = await db.insert(clients).values(client).returning();
      return result[0];
    } catch (error) {
      log(`DB Error in createClient: ${error}`, "error");
      throw error;
    }
  }

  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
    try {
      const result = await db
        .update(clients)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`DB Error in updateClient: ${error}`, "error");
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await db.delete(clients).where(eq(clients.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`DB Error in deleteClient: ${error}`, "error");
      return false;
    }
  }

  // Note methods
  async getNotes(clientId: number): Promise<Note[]> {
    try {
      const result = await db
        .select()
        .from(notes)
        .where(eq(notes.clientId, clientId))
        .orderBy(desc(notes.createdAt));
      return result;
    } catch (error) {
      log(`DB Error in getNotes: ${error}`, "error");
      return [];
    }
  }

  async getNote(id: number): Promise<Note | undefined> {
    try {
      const result = await db.select().from(notes).where(eq(notes.id, id));
      return result[0];
    } catch (error) {
      log(`DB Error in getNote: ${error}`, "error");
      return undefined;
    }
  }

  async createNote(note: InsertNote): Promise<Note> {
    try {
      // Insert note
      const result = await db.insert(notes).values(note).returning();
      
      // Update client's updatedAt
      await db
        .update(clients)
        .set({ updatedAt: new Date() })
        .where(eq(clients.id, note.clientId));
      
      return result[0];
    } catch (error) {
      log(`DB Error in createNote: ${error}`, "error");
      throw error;
    }
  }

  async deleteNote(id: number): Promise<boolean> {
    try {
      const result = await db.delete(notes).where(eq(notes.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`DB Error in deleteNote: ${error}`, "error");
      return false;
    }
  }

  // Followup methods
  async getFollowups(): Promise<Followup[]> {
    try {
      const result = await db
        .select()
        .from(followups)
        .orderBy(asc(followups.scheduledDate));
      return result;
    } catch (error) {
      log(`DB Error in getFollowups: ${error}`, "error");
      return [];
    }
  }

  async getFollowupsByClient(clientId: number): Promise<Followup[]> {
    try {
      const result = await db
        .select()
        .from(followups)
        .where(eq(followups.clientId, clientId))
        .orderBy(asc(followups.scheduledDate));
      return result;
    } catch (error) {
      log(`DB Error in getFollowupsByClient: ${error}`, "error");
      return [];
    }
  }

  async getTodaysFollowups(): Promise<Followup[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await db
        .select()
        .from(followups)
        .where(
          and(
            gte(followups.scheduledDate, today),
            lt(followups.scheduledDate, tomorrow),
            eq(followups.isCompleted, false)
          )
        )
        .orderBy(asc(followups.scheduledDate));
      return result;
    } catch (error) {
      log(`DB Error in getTodaysFollowups: ${error}`, "error");
      return [];
    }
  }

  async getFollowup(id: number): Promise<Followup | undefined> {
    try {
      const result = await db.select().from(followups).where(eq(followups.id, id));
      return result[0];
    } catch (error) {
      log(`DB Error in getFollowup: ${error}`, "error");
      return undefined;
    }
  }

  async createFollowup(followup: InsertFollowup): Promise<Followup> {
    try {
      // Insert followup
      const result = await db.insert(followups).values(followup).returning();
      
      // Update client's updatedAt
      await db
        .update(clients)
        .set({ updatedAt: new Date() })
        .where(eq(clients.id, followup.clientId));
      
      return result[0];
    } catch (error) {
      log(`DB Error in createFollowup: ${error}`, "error");
      throw error;
    }
  }

  async updateFollowup(id: number, updateData: Partial<Followup>): Promise<Followup | undefined> {
    try {
      const result = await db
        .update(followups)
        .set(updateData)
        .where(eq(followups.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`DB Error in updateFollowup: ${error}`, "error");
      return undefined;
    }
  }

  async completeFollowup(id: number): Promise<Followup | undefined> {
    try {
      const result = await db
        .update(followups)
        .set({ isCompleted: true })
        .where(eq(followups.id, id))
        .returning();
      return result[0];
    } catch (error) {
      log(`DB Error in completeFollowup: ${error}`, "error");
      return undefined;
    }
  }

  async deleteFollowup(id: number): Promise<boolean> {
    try {
      const result = await db.delete(followups).where(eq(followups.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      log(`DB Error in deleteFollowup: ${error}`, "error");
      return false;
    }
  }
}

// Export either the database storage or memory storage based on connection status
export const storage = db ? new DatabaseStorage() : new MemStorage();
