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
    const res = await apiRequest("PUT", `/api/clients/${id}`, client);
    const data = await res.json();
    console.log("Client update response:", data);
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

// Dashboard API
export async function getDashboardCounts(): Promise<Record<string, number>> {
  const res = await apiRequest("GET", "/api/dashboard/counts");
  return res.json();
}
