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

// Import required database packages
import { Pool } from 'pg';

// Try to connect to database
let db: any = null;

// Global database pool
let pool: Pool | null = null;

// Initialize database connection
const initDatabase = async () => {
  try {
    if (process.env.DATABASE_URL) {
      try {
        // Create a connection pool
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        
        // Test the connection
        const result = await pool.query('SELECT 1');
        
        if (result.rows.length > 0) {
          // Create tables if they don't exist
          await createTablesIfNotExist();
          log("Database connection established successfully", "database");
        }
      } catch (dbError) {
        log(`Database connection error: ${dbError}`, "error");
        log("Falling back to in-memory storage", "database");
        pool = null; // Reset pool on error
      }
    } else {
      log("No DATABASE_URL provided, using in-memory storage", "database");
    }
  } catch (error) {
    log(`Failed to connect to database: ${error}`, "error");
    pool = null;
  }
};

// Function to create tables if they don't exist
async function createTablesIfNotExist() {
  if (!pool) {
    log("Cannot create tables - no database connection", "error");
    return;
  }
  
  try {
    // Create clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address_line1 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        photo_url VARCHAR(255),
        voice_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create followups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followups (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        reminder BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    log("Database tables created successfully", "database");
  } catch (error) {
    log(`Failed to create tables: ${error}`, "error");
    throw error;
  }
}

// Initialize the database
initDatabase();

// Create a PostgreSQL implementation of the storage interface
export class PostgresStorage implements IStorage {
  // Clients methods
  async getClients(): Promise<Client[]> {
    try {
      if (!pool) return [];
      
      const result = await pool.query(`
        SELECT * FROM clients ORDER BY created_at DESC
      `);
      
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        addressLine1: row.address_line1,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      log(`DB Error in getClients: ${error}`, "error");
      return [];
    }
  }
  
  async getClientsByStatus(status: string): Promise<Client[]> {
    try {
      if (!pool) return [];
      
      const result = await pool.query(`
        SELECT * FROM clients WHERE status = $1 ORDER BY created_at DESC
      `, [status]);
      
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        addressLine1: row.address_line1,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      log(`DB Error in getClientsByStatus: ${error}`, "error");
      return [];
    }
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    try {
      if (!pool) return undefined;
      
      const result = await pool.query(`
        SELECT * FROM clients WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        addressLine1: row.address_line1,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      log(`DB Error in getClient: ${error}`, "error");
      return undefined;
    }
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    try {
      if (!pool) throw new Error("Database not available");
      
      const result = await pool.query(`
        INSERT INTO clients (name, phone, email, address_line1, city, state, zip_code, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        client.name, 
        client.phone, 
        client.email || null, 
        client.addressLine1 || null,
        client.city || null,
        client.state || null,
        client.zipCode || null,
        client.status
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        addressLine1: row.address_line1,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      log(`DB Error in createClient: ${error}`, "error");
      throw error;
    }
  }
  
  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
    try {
      if (!pool) return undefined;
      
      // Build the update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (updateData.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      
      if (updateData.phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        values.push(updateData.phone);
      }
      
      if (updateData.email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(updateData.email);
      }
      
      if (updateData.addressLine1 !== undefined) {
        updates.push(`address_line1 = $${paramCount++}`);
        values.push(updateData.addressLine1);
      }
      
      if (updateData.city !== undefined) {
        updates.push(`city = $${paramCount++}`);
        values.push(updateData.city);
      }
      
      if (updateData.state !== undefined) {
        updates.push(`state = $${paramCount++}`);
        values.push(updateData.state);
      }
      
      if (updateData.zipCode !== undefined) {
        updates.push(`zip_code = $${paramCount++}`);
        values.push(updateData.zipCode);
      }
      
      if (updateData.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }
      
      updates.push(`updated_at = NOW()`);
      
      // If there's nothing to update, return the existing client
      if (updates.length === 1) {
        return this.getClient(id);
      }
      
      // Add the client id as the last parameter
      values.push(id);
      
      const result = await pool.query(`
        UPDATE clients
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        addressLine1: row.address_line1,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      log(`DB Error in updateClient: ${error}`, "error");
      return undefined;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      if (!pool) return false;
      
      const result = await pool.query(`
        DELETE FROM clients WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      log(`DB Error in deleteClient: ${error}`, "error");
      return false;
    }
  }
  
  // Notes methods
  async getNotes(clientId: number): Promise<Note[]> {
    try {
      if (!pool) return [];
      
      const result = await pool.query(`
        SELECT * FROM notes
        WHERE client_id = $1
        ORDER BY created_at DESC
      `, [clientId]);
      
      return result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        text: row.text,
        photoUrl: row.photo_url,
        voiceUrl: row.voice_url,
        createdAt: row.created_at
      }));
    } catch (error) {
      log(`DB Error in getNotes: ${error}`, "error");
      return [];
    }
  }
  
  async getNote(id: number): Promise<Note | undefined> {
    try {
      if (!pool) return undefined;
      
      const result = await pool.query(`
        SELECT * FROM notes WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        text: row.text,
        photoUrl: row.photo_url,
        voiceUrl: row.voice_url,
        createdAt: row.created_at
      };
    } catch (error) {
      log(`DB Error in getNote: ${error}`, "error");
      return undefined;
    }
  }
  
  async createNote(note: InsertNote): Promise<Note> {
    try {
      if (!pool) throw new Error("Database not available");
      
      const result = await pool.query(`
        INSERT INTO notes (client_id, text, photo_url, voice_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        note.clientId,
        note.text,
        note.photoUrl || null,
        note.voiceUrl || null
      ]);
      
      // Also update the client's updated_at timestamp
      await pool.query(`
        UPDATE clients
        SET updated_at = NOW()
        WHERE id = $1
      `, [note.clientId]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        text: row.text,
        photoUrl: row.photo_url,
        voiceUrl: row.voice_url,
        createdAt: row.created_at
      };
    } catch (error) {
      log(`DB Error in createNote: ${error}`, "error");
      throw error;
    }
  }
  
  async deleteNote(id: number): Promise<boolean> {
    try {
      if (!pool) return false;
      
      // First get the client_id for the note
      const noteResult = await pool.query(`
        SELECT client_id FROM notes WHERE id = $1
      `, [id]);
      
      if (noteResult.rows.length === 0) {
        return false;
      }
      
      const clientId = noteResult.rows[0].client_id;
      
      // Delete the note
      const result = await pool.query(`
        DELETE FROM notes WHERE id = $1
        RETURNING id
      `, [id]);
      
      // Update the client's updated_at timestamp
      if (result.rows.length > 0) {
        await pool.query(`
          UPDATE clients
          SET updated_at = NOW()
          WHERE id = $1
        `, [clientId]);
      }
      
      return result.rows.length > 0;
    } catch (error) {
      log(`DB Error in deleteNote: ${error}`, "error");
      return false;
    }
  }
  
  // Followups methods
  async getFollowups(): Promise<Followup[]> {
    try {
      if (!pool) return [];
      
      const result = await pool.query(`
        SELECT f.*, c.name as client_name
        FROM followups f
        JOIN clients c ON f.client_id = c.id
        ORDER BY f.scheduled_date ASC
      `);
      
      return result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: row.client_name
      }));
    } catch (error) {
      log(`DB Error in getFollowups: ${error}`, "error");
      return [];
    }
  }
  
  async getFollowupsByClient(clientId: number): Promise<Followup[]> {
    try {
      if (!pool) return [];
      
      const result = await pool.query(`
        SELECT f.*, c.name as client_name
        FROM followups f
        JOIN clients c ON f.client_id = c.id
        WHERE f.client_id = $1
        ORDER BY f.scheduled_date ASC
      `, [clientId]);
      
      return result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: row.client_name
      }));
    } catch (error) {
      log(`DB Error in getFollowupsByClient: ${error}`, "error");
      return [];
    }
  }
  
  async getTodaysFollowups(): Promise<Followup[]> {
    try {
      if (!pool) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await pool.query(`
        SELECT f.*, c.name as client_name
        FROM followups f
        JOIN clients c ON f.client_id = c.id
        WHERE f.scheduled_date >= $1 AND f.scheduled_date < $2
        AND f.is_completed = false
        ORDER BY f.scheduled_date ASC
      `, [today, tomorrow]);
      
      return result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: row.client_name
      }));
    } catch (error) {
      log(`DB Error in getTodaysFollowups: ${error}`, "error");
      return [];
    }
  }
  
  async getFollowup(id: number): Promise<Followup | undefined> {
    try {
      if (!pool) return undefined;
      
      const result = await pool.query(`
        SELECT f.*, c.name as client_name
        FROM followups f
        JOIN clients c ON f.client_id = c.id
        WHERE f.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: row.client_name
      };
    } catch (error) {
      log(`DB Error in getFollowup: ${error}`, "error");
      return undefined;
    }
  }
  
  async createFollowup(followup: InsertFollowup): Promise<Followup> {
    try {
      if (!pool) throw new Error("Database not available");
      
      const result = await pool.query(`
        INSERT INTO followups (client_id, action, scheduled_date, is_completed, reminder)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        followup.clientId,
        followup.action,
        followup.scheduledDate,
        followup.isCompleted || false,
        followup.reminder !== undefined ? followup.reminder : true
      ]);
      
      // Get the client name
      const clientResult = await pool.query(`
        SELECT name FROM clients WHERE id = $1
      `, [followup.clientId]);
      
      // Update the client's updated_at timestamp
      await pool.query(`
        UPDATE clients
        SET updated_at = NOW()
        WHERE id = $1
      `, [followup.clientId]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: clientResult.rows[0]?.name
      };
    } catch (error) {
      log(`DB Error in createFollowup: ${error}`, "error");
      throw error;
    }
  }
  
  async updateFollowup(id: number, updateData: Partial<Followup>): Promise<Followup | undefined> {
    try {
      if (!pool) return undefined;
      
      // Build the update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (updateData.action !== undefined) {
        updates.push(`action = $${paramCount++}`);
        values.push(updateData.action);
      }
      
      if (updateData.scheduledDate !== undefined) {
        updates.push(`scheduled_date = $${paramCount++}`);
        values.push(updateData.scheduledDate);
      }
      
      if (updateData.isCompleted !== undefined) {
        updates.push(`is_completed = $${paramCount++}`);
        values.push(updateData.isCompleted);
      }
      
      if (updateData.reminder !== undefined) {
        updates.push(`reminder = $${paramCount++}`);
        values.push(updateData.reminder);
      }
      
      // If there's nothing to update, return the existing followup
      if (updates.length === 0) {
        return this.getFollowup(id);
      }
      
      // Add the followup id as the last parameter
      values.push(id);
      
      const result = await pool.query(`
        UPDATE followups
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Update the client's updated_at timestamp
      await pool.query(`
        UPDATE clients
        SET updated_at = NOW()
        WHERE id = (SELECT client_id FROM followups WHERE id = $1)
      `, [id]);
      
      // Get the client name
      const clientResult = await pool.query(`
        SELECT name FROM clients
        WHERE id = (SELECT client_id FROM followups WHERE id = $1)
      `, [id]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: clientResult.rows[0]?.name
      };
    } catch (error) {
      log(`DB Error in updateFollowup: ${error}`, "error");
      return undefined;
    }
  }
  
  async completeFollowup(id: number): Promise<Followup | undefined> {
    try {
      if (!pool) return undefined;
      
      const result = await pool.query(`
        UPDATE followups
        SET is_completed = true
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Update the client's updated_at timestamp
      await pool.query(`
        UPDATE clients
        SET updated_at = NOW()
        WHERE id = (SELECT client_id FROM followups WHERE id = $1)
      `, [id]);
      
      // Get the client name
      const clientResult = await pool.query(`
        SELECT name FROM clients
        WHERE id = (SELECT client_id FROM followups WHERE id = $1)
      `, [id]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        clientId: row.client_id,
        action: row.action,
        scheduledDate: row.scheduled_date,
        isCompleted: row.is_completed,
        reminder: row.reminder,
        createdAt: row.created_at,
        clientName: clientResult.rows[0]?.name
      };
    } catch (error) {
      log(`DB Error in completeFollowup: ${error}`, "error");
      return undefined;
    }
  }
  
  async deleteFollowup(id: number): Promise<boolean> {
    try {
      if (!pool) return false;
      
      // First get the client_id for the followup
      const followupResult = await pool.query(`
        SELECT client_id FROM followups WHERE id = $1
      `, [id]);
      
      if (followupResult.rows.length === 0) {
        return false;
      }
      
      const clientId = followupResult.rows[0].client_id;
      
      // Delete the followup
      const result = await pool.query(`
        DELETE FROM followups WHERE id = $1
        RETURNING id
      `, [id]);
      
      // Update the client's updated_at timestamp
      if (result.rows.length > 0) {
        await pool.query(`
          UPDATE clients
          SET updated_at = NOW()
          WHERE id = $1
        `, [clientId]);
      }
      
      return result.rows.length > 0;
    } catch (error) {
      log(`DB Error in deleteFollowup: ${error}`, "error");
      return false;
    }
  }
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
export const storage = pool ? new PostgresStorage() : new MemStorage();
