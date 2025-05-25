import { apiRequest } from "./queryClient";
import type { 
  Client, 
  InsertClient,
  Note,
  InsertNote,
  Followup,
  InsertFollowup,
} from "@shared/schema";

// Client API
export async function getClients(status?: string): Promise<Client[]> {
  const url = status ? `/api/clients?status=${status}` : "/api/clients";
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function getClient(id: number): Promise<Client> {
  const res = await apiRequest("GET", `/api/clients/${id}`);
  return res.json();
}

export async function createClient(client: Omit<InsertClient, 'userId'>): Promise<Client> {
  console.log("API createClient called with:", client);
  
  // The userId will be added by the server from the session
  try {
    const res = await apiRequest("POST", "/api/clients", client);
    const data = await res.json();
    console.log("API createClient response:", data);
    return data;
  } catch (error) {
    console.error("Error in createClient API call:", error);
    throw error;
  }
}

export async function updateClient(id: number, client: Partial<Client>): Promise<Client> {
  console.log(`Updating client ${id} with data:`, client);
  try {
    // Make sure we're sending valid status values
    if (client.status) {
      // Ensure it's one of the JobStatus values
      const validStatuses = ["lead", "quoted", "scheduled", "completed", "paid"];
      if (!validStatuses.includes(client.status)) {
        client.status = "lead";
      }
    }
    
    // Send the request
    const res = await apiRequest("PUT", `/api/clients/${id}`, client);
    
    // Handle the response - if empty, return what we sent
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      console.log("Response couldn't be parsed as JSON, returning updated client");
      // If there's an error parsing the response, return a constructed response
      // using the client ID and our update data
      return {
        id,
        ...client,
        updatedAt: new Date()
      } as Client;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateClient API call:", error);
    throw error;
  }
}

export async function deleteClient(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/clients/${id}`);
}

// Note API
export async function getNotes(clientId: number): Promise<Note[]> {
  const res = await apiRequest("GET", `/api/clients/${clientId}/notes`);
  return res.json();
}

export async function createNote(note: InsertNote): Promise<Note> {
  const res = await apiRequest("POST", "/api/notes", note);
  return res.json();
}

export async function deleteNote(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/notes/${id}`);
}

// Followup API
export async function getFollowups(today: boolean = false): Promise<Followup[]> {
  const url = today ? "/api/followups?today=true" : "/api/followups";
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function getFollowupsByClient(clientId: number): Promise<Followup[]> {
  const res = await apiRequest("GET", `/api/clients/${clientId}/followups`);
  return res.json();
}

export async function createFollowup(followup: InsertFollowup): Promise<Followup> {
  const res = await apiRequest("POST", "/api/followups", followup);
  return res.json();
}

export async function updateFollowup(id: number, followup: Partial<Followup>): Promise<Followup> {
  const res = await apiRequest("PUT", `/api/followups/${id}`, followup);
  return res.json();
}

export async function completeFollowup(id: number): Promise<Followup> {
  const res = await apiRequest("PUT", `/api/followups/${id}/complete`, {});
  return res.json();
}

export async function deleteFollowup(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/followups/${id}`);
}

// Special function for status updates to use the dedicated endpoint
export async function updateClientStatus(id: number, status: string): Promise<Client> {
  console.log(`Updating client ${id} status to:`, status);
  try {
    const res = await apiRequest("POST", `/api/clients/${id}/update-status`, { status });
    const updatedClient = await res.json();
    console.log("Status update response:", updatedClient);
    return updatedClient;
  } catch (error) {
    console.error("Error updating client status:", error);
    throw error;
  }
}

// Dashboard API
export async function getDashboardCounts(): Promise<Record<string, number>> {
  const res = await apiRequest("GET", "/api/dashboard/counts");
  return res.json();
}
