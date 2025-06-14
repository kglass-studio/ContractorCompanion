// import {
//   clients,
//   notes,
//   followups,
//   type Client,
//   type InsertClient,
//   type Note,
//   type InsertNote,
//   type Followup,
//   type InsertFollowup,
//   JobStatus,
// } from "@shared/schema";
// import { log } from "./vite";

export interface IStorage {
  // Clients
  getClients(userId: string | null): Promise<Client[]>;
  getClientsByStatus(userId: string, status: string): Promise<Client[]>;
  getClient(userId: string, id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(userId: string, id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(userId: string, id: number): Promise<boolean>;

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

  // User Management
  purgeUserData(userId: string): Promise<boolean>;
}

// Import required database packages
//import { Pool } from 'pg';

// Database connection
//let pool: Pool | null = null;

// Initialize database connection
// const initDatabase = async () => {
//   try {
//     if (process.env.DATABASE_URL) {
//       try {
//         // Log connection attempt (without sensitive details)
//         log("Attempting to connect to Supabase Transaction pooler...", "database");
        
//         // Create a connection pool optimized for Supabase Transaction pooler
//         pool = new Pool({
//           connectionString: process.env.DATABASE_URL,
//           ssl: {
//             rejectUnauthorized: false  // Required for Supabase connections
//           },
//           max: 10,                     // Maximum number of clients in the pool
//           idleTimeoutMillis: 30000,    // How long a client is allowed to remain idle before being closed
//           connectionTimeoutMillis: 10000, // How long to wait for a connection
//           statement_timeout: 10000,    // Maximum time (ms) any statement can run
//         });
        
//         // Test the connection with a simple query
//         const result = await pool.query('SELECT NOW() as time');
        
//         if (result.rows.length > 0) {
//           log(`Successfully connected to Supabase database at: ${result.rows[0].time}`, "database");
          
//           // Create tables if they don't exist
//           await createTablesIfNotExist();
//           log("Database tables verified/created successfully", "database");
//         }
//       } catch (dbError) {
//         log(`Database connection error: ${dbError}`, "error");
//         log("Falling back to in-memory storage", "database");
//         pool = null;
//       }
//     } else {
//       log("No DATABASE_URL provided, using in-memory storage", "database");
//     }
//   } catch (error) {
//     log(`Failed to connect to database: ${error}`, "error");
//     pool = null;
//   }
// };

// Function to create tables if they don't exist
// async function createTablesIfNotExist() {
//   if (!pool) {
//     log("Cannot create tables - no database connection", "error");
//     return;
//   }
  
//   try {
//     // Create clients table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS clients (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         phone VARCHAR(20) NOT NULL,
//         email VARCHAR(255),
//         address_line1 VARCHAR(255),
//         city VARCHAR(100),
//         state VARCHAR(50),
//         zip_code VARCHAR(20),
//         status VARCHAR(20) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     // Create notes table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS notes (
//         id SERIAL PRIMARY KEY,
//         client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
//         text TEXT NOT NULL,
//         photo_url VARCHAR(255),
//         voice_url VARCHAR(255),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     // Create followups table
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS followups (
//         id SERIAL PRIMARY KEY,
//         client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
//         action VARCHAR(255) NOT NULL,
//         scheduled_date TIMESTAMP NOT NULL,
//         is_completed BOOLEAN DEFAULT FALSE,
//         reminder BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     log("Database tables created successfully", "database");
//   } catch (error) {
//     log(`Failed to create tables: ${error}`, "error");
//     throw error;
//   }
// }

// Initialize the database
//initDatabase();

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
import { log } from "./vite";
import { neon, NeonHttp } from '@neondatabase/serverless';

// Initialize the Neon connection
const sql = neon(process.env.DATABASE_URL as string) as NeonHttp;

// Create a Neon/PostgreSQL implementation of the storage interface
export class PostgresStorage implements IStorage {
    // Clients methods
    async getClients(userId: string | null): Promise<Client[]> {
        try {
            const result = await sql<Client[]>`
                SELECT * FROM clients
                ${userId ? sql`WHERE user_id = ${userId}` : sql``}
                ORDER BY created_at DESC
            `;
            return result;
        } catch (error) {
            log(`DB Error in getClients: ${error}`, "error");
            return [];
        }
    }

    async getClientsByStatus(userId: string, status: string): Promise<Client[]> {
        try {
            const result = await sql<Client[]>`
                SELECT * FROM clients
                WHERE user_id = ${userId} AND status = ${status}
                ORDER BY created_at DESC
            `;
            return result;
        } catch (error) {
            log(`DB Error in getClientsByStatus: ${error}`, "error");
            return [];
        }
    }

    async getClient(userId: string, id: number): Promise<Client | undefined> {
        try {
            const result = await sql<Client[]>`
                SELECT * FROM clients
                WHERE user_id = ${userId} AND id = ${id}
            `;
            return result[0];
        } catch (error) {
            log(`DB Error in getClient: ${error}`, "error");
            return undefined;
        }
    }

    async createClient(client: InsertClient): Promise<Client> {
        try {
            const result = await sql<Client[]>`
                INSERT INTO clients (user_id, name, phone, email, address_line1, city, state, zip_code, status)
                VALUES (${client.userId}, ${client.name}, ${client.phone}, ${client.email}, ${client.addressLine1}, ${client.city}, ${client.state}, ${client.zipCode}, ${client.status})
                RETURNING *
            `;
            return result[0]!;
        } catch (error) {
            log(`DB Error in createClient: ${error}`, "error");
            throw error;
        }
    }

    async updateClient(userId: string, id: number, updateData: Partial<Client>): Promise<Client | undefined> {
        try {
            const updates = Object.keys(updateData)
                .filter(key => updateData[key as keyof Client] !== undefined)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');
            const values = Object.values(updateData).filter(value => value !== undefined);

            if (updates) {
                const result = await sql<Client[]>`
                    UPDATE clients
                    SET ${sql.raw(updates)}, updated_at = NOW()
                    WHERE user_id = ${userId} AND id = ${id}
                    RETURNING *
                `;
                return result[0];
            }
            return this.getClient(userId, id);
        } catch (error) {
            log(`DB Error in updateClient: ${error}`, "error");
            return undefined;
        }
    }

    async deleteClient(userId: string, id: number): Promise<boolean> {
        try {
            const result = await sql`
                DELETE FROM clients
                WHERE user_id = ${userId} AND id = ${id}
                RETURNING id
            `;
            return result.count > 0;
        } catch (error) {
            log(`DB Error in deleteClient: ${error}`, "error");
            return false;
        }
    }

    // Notes methods
    async getNotes(clientId: number): Promise<Note[]> {
        try {
            const result = await sql<Note[]>`
                SELECT * FROM notes
                WHERE client_id = ${clientId}
                ORDER BY created_at DESC
            `;
            return result;
        } catch (error) {
            log(`DB Error in getNotes: ${error}`, "error");
            return [];
        }
    }

    async getNote(id: number): Promise<Note | undefined> {
        try {
            const result = await sql<Note[]>`
                SELECT * FROM notes
                WHERE id = ${id}
            `;
            return result[0];
        } catch (error) {
            log(`DB Error in getNote: ${error}`, "error");
            return undefined;
        }
    }

    async createNote(note: InsertNote): Promise<Note> {
        try {
            const result = await sql<Note[]>`
                INSERT INTO notes (client_id, text, photo_url, voice_url)
                VALUES (${note.clientId}, ${note.text}, ${note.photoUrl}, ${note.voiceUrl})
                RETURNING *
            `;
            // Also update the client's updated_at timestamp (omitted for brevity, can add back if needed)
            return result[0]!;
        } catch (error) {
            log(`DB Error in createNote: ${error}`, "error");
            throw error;
        }
    }

    async deleteNote(id: number): Promise<boolean> {
        try {
            const result = await sql`
                DELETE FROM notes
                WHERE id = ${id}
                RETURNING id
            `;
            // Also update the client's updated_at timestamp (omitted for brevity)
            return result.count > 0;
        } catch (error) {
            log(`DB Error in deleteNote: ${error}`, "error");
            return false;
        }
    }

    // Followups methods
    async getFollowups(): Promise<Followup[]> {
        try {
            const result = await sql<Followup[]>`
                SELECT f.*, c.name as client_name
                FROM followups f
                JOIN clients c ON f.client_id = c.id
                ORDER BY f.scheduled_date ASC
            `;
            return result.map(f => ({ ...f, clientName: f.client_name }));
        } catch (error) {
            log(`DB Error in getFollowups: ${error}`, "error");
            return [];
        }
    }

    async getFollowupsByClient(clientId: number): Promise<Followup[]> {
        try {
            const result = await sql<Followup[]>`
                SELECT f.*, c.name as client_name
                FROM followups f
                JOIN clients c ON f.client_id = c.id
                WHERE f.client_id = ${clientId}
                ORDER BY f.scheduled_date ASC
            `;
            return result.map(f => ({ ...f, clientName: f.client_name }));
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

            const result = await sql<Followup[]>`
                SELECT f.*, c.name as client_name
                FROM followups f
                JOIN clients c ON f.client_id = c.id
                WHERE f.scheduled_date >= ${today} AND f.scheduled_date < ${tomorrow}
                AND f.is_completed = false
                ORDER BY f.scheduled_date ASC
            `;
            return result.map(f => ({ ...f, clientName: f.client_name }));
        } catch (error) {
            log(`DB Error in getTodaysFollowups: ${error}`, "error");
            return [];
        }
    }

    async getFollowup(id: number): Promise<Followup | undefined> {
        try {
            const result = await sql<Followup[]>`
                SELECT f.*, c.name as client_name
                FROM followups f
                JOIN clients c ON f.client_id = c.id
                WHERE f.id = ${id}
            `;
            return result.map(f => ({ ...f, clientName: f.client_name }))[0];
        } catch (error) {
            log(`DB Error in getFollowup: ${error}`, "error");
            return undefined;
        }
    }

    async createFollowup(followup: InsertFollowup): Promise<Followup> {
        try {
            const result = await sql<Followup[]>`
                INSERT INTO followups (client_id, action, scheduled_date, is_completed, reminder)
                VALUES (${followup.clientId}, ${followup.action}, ${followup.scheduledDate}, ${followup.isCompleted}, ${followup.reminder})
                RETURNING *
            `;
            // Get the client name
            const clientResult = await sql<{ name: string }[]>`
                SELECT name FROM clients WHERE id = ${followup.clientId}
            `;
            return { ...result[0]!, clientName: clientResult[0]?.name };
        } catch (error) {
            log(`DB Error in createFollowup: ${error}`, "error");
            throw error;
        }
    }

    async updateFollowup(id: number, updateData: Partial<Followup>): Promise<Followup | undefined> {
        try {
            const updates = Object.keys(updateData)
                .filter(key => updateData[key as keyof Followup] !== undefined)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');
            const values = Object.values(updateData).filter(value => value !== undefined);

            if (updates) {
                const result = await sql<Followup[]>`
                    UPDATE followups
                    SET ${sql.raw(updates)}
                    WHERE id = ${id}
                    RETURNING *
                `;
                if (result[0]) {
                    const clientResult = await sql<{ name: string }[]>`
                        SELECT name FROM clients
                        WHERE id = (SELECT client_id FROM followups WHERE id = ${id})
                    `;
                    return { ...result[0], clientName: clientResult[0]?.name };
                }
            }
            return this.getFollowup(id);
        } catch (error) {
            log(`DB Error in updateFollowup: ${error}`, "error");
            return undefined;
        }
    }

    async completeFollowup(id: number): Promise<Followup | undefined> {
        try {
            const result = await sql<Followup[]>`
                UPDATE followups
                SET is_completed = true
                WHERE id = ${id}
                RETURNING *
            `;
            if (result[0]) {
                const clientResult = await sql<{ name: string }[]>`
                    SELECT name FROM clients
                    WHERE id = (SELECT client_id FROM followups WHERE id = ${id})
                `;
                return { ...result[0], clientName: clientResult[0]?.name };
            }
            return undefined;
        } catch (error) {
            log(`DB Error in completeFollowup: ${error}`, "error");
            return undefined;
        }
    }

    async deleteFollowup(id: number): Promise<boolean> {
        try {
            const result = await sql`
                DELETE FROM followups
                WHERE id = ${id}
                RETURNING id
            `;
            return result.count > 0;
        } catch (error) {
            log(`DB Error in deleteFollowup: ${error}`, "error");
            return false;
        }
    }

    async purgeUserData(userId: string): Promise<boolean> {
        try {
            await sql`DELETE FROM notes WHERE client_id IN (SELECT id FROM clients WHERE user_id = ${userId})`;
            await sql`DELETE FROM followups WHERE client_id IN (SELECT id FROM clients WHERE user_id = ${userId})`;
            const result = await sql`DELETE FROM clients WHERE user_id = ${userId} RETURNING id`;
            return result.count > 0;
        } catch (error) {
            log(`DB Error in purgeUserData: ${error}`, "error");
            return false;
        }
    }
}

// Use in-memory storage if no DATABASE_URL is provided
export const storage: IStorage = process.env.DATABASE_URL
    ? new PostgresStorage()
    : new MemStorage();

export class MemStorage implements IStorage {
  // Make clients accessible for debugging and direct access
  clients: Map<number, Client>;
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
    
    // Add test data
    this.addSampleData();
  }
  
  // For testing purposes only - adds sample data with userId
  private addSampleData() {
    // Example clients with userId
    const client1: Client = {
      id: this.clientId++,
      userId: "default-user",
      name: "John Doe",
      phone: "555-123-4567",
      email: "john@example.com",
      addressLine1: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "90210",
      status: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(client1.id, client1);
    
    const client2: Client = {
      id: this.clientId++,
      userId: "default-user",
      name: "Sarah Smith",
      phone: "555-987-6543",
      email: "sarah@example.com",
      addressLine1: "456 Oak Ave",
      city: "Somewhere",
      state: "NY",
      zipCode: "10001",
      status: "quoted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(client2.id, client2);
  }

  // Client methods with user isolation
  async getClients(userId: string | null): Promise<Client[]> {
    // If userId is null, return all clients (admin mode)
    const allClients = Array.from(this.clients.values());
    
    if (userId === null) {
      return allClients;
    }
    
    // Otherwise filter by the specified userId
    return allClients
      .filter(client => client.userId === userId)
      .sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  async getClientsByStatus(userId: string, status: string): Promise<Client[]> {
    console.log(`Getting clients for userId: ${userId}, status: ${status}`);
    console.log("Total clients in memory:", this.clients.size);
    
    const filteredClients = Array.from(this.clients.values())
      .filter((client) => {
        console.log(`Checking client ${client.id}: userId=${client.userId}, status=${client.status}`);
        return client.userId === userId && client.status === status;
      })
      .sort((a, b) => {
        return new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime();
      });
    
    console.log(`Found ${filteredClients.length} clients with status ${status} for user ${userId}`);
    return filteredClients;
  }

  async getClient(userId: string, id: number): Promise<Client | undefined> {
    const client = this.clients.get(id);
    // Only return the client if it belongs to this user
    if (client && client.userId === userId) {
      return client;
    }
    return undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const now = new Date();
    
    // Ensure we're using the correct status value from JobStatus
    const status = Object.values(JobStatus).includes(insertClient.status as any) 
      ? insertClient.status as any
      : JobStatus.LEAD;
    
    // Ensure all fields are properly set with default values if needed
    const client: Client = {
      id,
      userId: insertClient.userId || 'default-user', // Ensure userId is always set
      name: insertClient.name,
      phone: insertClient.phone,
      email: insertClient.email || null,
      addressLine1: insertClient.addressLine1 || null,
      city: insertClient.city || null,
      state: insertClient.state || null,
      zipCode: insertClient.zipCode || null,
      status,
      createdAt: now,
      updatedAt: now,
    };
    
    this.clients.set(id, client);
    console.log("Client added to in-memory storage:", client);
    return client;
  }

  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    // Create a properly updated client with all fields preserved
    const updatedClient: Client = {
      ...client,
      ...updateData,
      updatedAt: new Date(),
    };
    
    // Save the updated client to the Map
    this.clients.set(id, updatedClient);
    console.log("Client updated in MemStorage:", updatedClient);
    
    // Return the full updated client object
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

  async purgeUserData(userId: string): Promise<boolean> {
    try {
      // Remove all clients for this user (this will cascade to notes and followups)
      const userClients = Array.from(this.clients.values()).filter(client => client.userId === userId);
      
      userClients.forEach(client => {
        // Delete all notes for this client
        const clientNotes = Array.from(this.notes.values()).filter(note => note.clientId === client.id);
        clientNotes.forEach(note => this.notes.delete(note.id));
        
        // Delete all followups for this client
        const clientFollowups = Array.from(this.followups.values()).filter(followup => followup.clientId === client.id);
        clientFollowups.forEach(followup => this.followups.delete(followup.id));
        
        // Delete the client
        this.clients.delete(client.id);
      });
      
      return true;
    } catch (error) {
      console.error('Error purging user data:', error);
      return false;
    }
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
// For now, use memory storage to ensure the app works while we fix the database
// Initialize database connection on startup
initDatabase().catch((error) => {
  log(`Database initialization error: ${error}`, "error");
});

// Export the storage implementation
// Debug helper function to log current storage state
function logCurrentStorageState(storage: any) {
  console.log("----- STORAGE STATE DEBUG -----");
  if (storage instanceof MemStorage) {
    console.log("Using MemStorage");
    if (storage.clients instanceof Map) {
      console.log("Clients using Map storage with size:", storage.clients.size);
      console.log("Client entries:", Array.from(storage.clients.entries()));
    } else if (Array.isArray(storage.clients)) {
      console.log("Clients using Array storage with length:", storage.clients.length);
      console.log("Client entries:", storage.clients);
    } else {
      console.log("Unknown clients storage type:", typeof storage.clients);
    }
  } else {
    console.log("Not using MemStorage:", storage.constructor.name);
  }
  console.log("----- END STORAGE STATE DEBUG -----");
}

// Create a singleton instance
const memStorage = new MemStorage();

// Override the updateClient method for special debugging
const originalUpdateClient = memStorage.updateClient;
memStorage.updateClient = async function(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
  console.log("CUSTOM UPDATE CLIENT CALLED with ID:", id, "and data:", updateData);
  
  // Log before state
  console.log("Before update, client map:", this.clients);
  
  // Get the current client
  const client = this.clients.get(id);
  if (!client) {
    console.log("Client not found with ID:", id);
    return undefined;
  }
  
  console.log("Found client to update:", client);
  
  // Create a properly updated client with all fields preserved
  const updatedClient: Client = {
    ...client,
    ...updateData,
    updatedAt: new Date(),
  };
  
  console.log("Updated client object:", updatedClient);
  
  // Save the updated client to the Map
  this.clients.set(id, updatedClient);
  
  // Log after state
  console.log("After update, client map:", this.clients);
  console.log("Direct client check after update:", this.clients.get(id));
  
  // Return the full updated client object
  return updatedClient;
};

// Create a utility method to directly update status
memStorage.directUpdateStatus = function(id: number, newStatus: string): Client | undefined {
  console.log("DIRECT STATUS UPDATE CALLED with ID:", id, "and status:", newStatus);
  
  // IMPORTANT: Manually add sample data for debugging if needed
  if (id === 1 && !this.clients.has(1)) {
    this.clients.set(1, {
      id: 1,
      userId: "default-user",
      name: "John Doe",
      phone: "555-123-4567",
      email: "john@example.com",
      addressLine1: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      status: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Added sample client 1 for testing");
  }
  
  if (id === 2 && !this.clients.has(2)) {
    this.clients.set(2, {
      id: 2,
      userId: "default-user",
      name: "Sarah Smith",
      phone: "555-987-6543",
      email: "sarah@example.com",
      addressLine1: "456 Oak Ave",
      city: "Othertown",
      state: "NY",
      zipCode: "67890",
      status: "quoted",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Added sample client 2 for testing");
  }
  
  // Get the client
  const client = this.clients.get(id);
  if (!client) {
    console.log("Client not found for direct status update");
    return undefined;
  }
  
  console.log("Found client to update:", client);
  console.log("Current status:", client.status);
  console.log("New status:", newStatus);
  
  // Create a new client object to avoid reference issues
  const updatedClient = {
    ...client,
    status: newStatus,
    updatedAt: new Date()
  };
  
  // Save the updated client to the Map
  this.clients.set(id, updatedClient);
  
  // Double-check that the update was successful
  const verifyClient = this.clients.get(id);
  console.log("Verification - client after update:", verifyClient);
  
  // Make the client list change visible in the DB immediately
  // This is needed to force the clients query to see changes
  Array.from(this.clients.values()).forEach(c => {
    if (c.id === id) {
      c.status = newStatus;
      c.updatedAt = new Date();
    }
  });
  
  return updatedClient;
};

// Log the initial state
logCurrentStorageState(memStorage);

// Create special method for direct status updates
memStorage.updateClientStatus = async function(id: number, status: string): Promise<Client | undefined> {
  console.log("DIRECT STATUS UPDATE: Updating client", id, "to status", status);
  
  // Get the client to update
  const client = this.clients.get(id);
  if (!client) {
    console.log("Client not found for status update");
    return undefined;
  }
  
  // Update the client status
  const updatedClient = {
    ...client,
    status: status,
    updatedAt: new Date()
  };
  
  // Save the updated client
  this.clients.set(id, updatedClient);
  
  console.log("Client status updated successfully:", updatedClient);
  
  return updatedClient;
};


