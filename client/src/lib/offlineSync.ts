import { Client, InsertClient, Note, InsertNote, Followup, InsertFollowup, JobStatusType, JobStatus } from "@shared/schema";
import { getClients, createClient, updateClient, deleteClient, getNotes, createNote, deleteNote, getFollowups, getFollowupsByClient, createFollowup, updateFollowup, completeFollowup, deleteFollowup } from "./api";

// Types for pending actions
type PendingActionType = 
  | "CREATE_CLIENT" 
  | "UPDATE_CLIENT" 
  | "DELETE_CLIENT"
  | "CREATE_NOTE"
  | "DELETE_NOTE"
  | "CREATE_FOLLOWUP"
  | "UPDATE_FOLLOWUP"
  | "COMPLETE_FOLLOWUP"
  | "DELETE_FOLLOWUP";

interface PendingAction {
  id: string;
  type: PendingActionType;
  data: any;
  timestamp: number;
}

// Storage keys
const CLIENTS_STORAGE_KEY = "offline_clients";
const NOTES_STORAGE_KEY = "offline_notes";
const FOLLOWUPS_STORAGE_KEY = "offline_followups";
const PENDING_ACTIONS_KEY = "offline_pending_actions";

// Local data cache
let clientsCache: Client[] = [];
let notesCache: Record<number, Note[]> = {};
let followupsCache: Record<number, Followup[]> = {};
let pendingActions: PendingAction[] = [];

// Generate temporary ID for new items
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load data from localStorage
export function loadOfflineData(): void {
  try {
    const clientsJson = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (clientsJson) {
      clientsCache = JSON.parse(clientsJson);
    }

    const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
    if (notesJson) {
      notesCache = JSON.parse(notesJson);
    }

    const followupsJson = localStorage.getItem(FOLLOWUPS_STORAGE_KEY);
    if (followupsJson) {
      followupsCache = JSON.parse(followupsJson);
    }

    const pendingJson = localStorage.getItem(PENDING_ACTIONS_KEY);
    if (pendingJson) {
      pendingActions = JSON.parse(pendingJson);
    }
  } catch (error) {
    console.error("Error loading offline data:", error);
  }
}

// Save data to localStorage
function saveOfflineData(): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientsCache));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesCache));
    localStorage.setItem(FOLLOWUPS_STORAGE_KEY, JSON.stringify(followupsCache));
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  } catch (error) {
    console.error("Error saving offline data:", error);
  }
}

// Add a pending action
function addPendingAction(type: PendingActionType, data: any): string {
  const id = generateTempId();
  pendingActions.push({
    id,
    type,
    data,
    timestamp: Date.now()
  });
  saveOfflineData();
  return id;
}

// Remove a pending action
function removePendingAction(id: string): void {
  pendingActions = pendingActions.filter(action => action.id !== id);
  saveOfflineData();
}

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Get all clients (from cache if offline)
export async function getOfflineClients(status?: string): Promise<Client[]> {
  if (isOnline()) {
    try {
      const clients = await getClients(status);
      clientsCache = clients;
      saveOfflineData();
      return clients;
    } catch (error) {
      console.warn("Error fetching clients, using cached data:", error);
      if (status) {
        return clientsCache.filter(c => c.status === status);
      }
      return clientsCache;
    }
  } else {
    // Offline mode - return from cache
    if (status) {
      return clientsCache.filter(c => c.status === status);
    }
    return clientsCache;
  }
}

// Create a client (queue for sync if offline)
export async function createOfflineClient(client: InsertClient): Promise<Client> {
  if (isOnline()) {
    try {
      const newClient = await createClient(client);
      clientsCache.push(newClient);
      saveOfflineData();
      return newClient;
    } catch (error) {
      // If API fails, fall back to offline mode
      return createOfflineClientFallback(client);
    }
  } else {
    return createOfflineClientFallback(client);
  }
}

function createOfflineClientFallback(client: InsertClient): Client {
  // Create a temporary client with a temp ID
  const tempId = parseInt(generateTempId().replace(/\\D/g, '').substr(0, 9));
  const now = new Date();
  
  const newClient: Client = {
    ...client,
    id: tempId,
    createdAt: now,
    updatedAt: now
  };
  
  // Add to cache
  clientsCache.push(newClient);
  
  // Add pending action
  addPendingAction("CREATE_CLIENT", client);
  
  saveOfflineData();
  return newClient;
}

// Update a client (queue for sync if offline)
export async function updateOfflineClient(id: number, updateData: Partial<Client>): Promise<Client | undefined> {
  if (isOnline()) {
    try {
      const updatedClient = await updateClient(id, updateData);
      
      // Update cache
      const index = clientsCache.findIndex(c => c.id === id);
      if (index >= 0 && updatedClient) {
        clientsCache[index] = updatedClient;
        saveOfflineData();
      }
      
      return updatedClient;
    } catch (error) {
      // If API fails, fall back to offline mode
      return updateOfflineClientFallback(id, updateData);
    }
  } else {
    return updateOfflineClientFallback(id, updateData);
  }
}

function updateOfflineClientFallback(id: number, updateData: Partial<Client>): Client | undefined {
  // Find client in cache
  const index = clientsCache.findIndex(c => c.id === id);
  if (index < 0) return undefined;
  
  // Update in cache
  const updatedClient: Client = {
    ...clientsCache[index],
    ...updateData,
    updatedAt: new Date()
  };
  
  clientsCache[index] = updatedClient;
  
  // Add pending action
  addPendingAction("UPDATE_CLIENT", { id, updateData });
  
  saveOfflineData();
  return updatedClient;
}

// Delete a client (queue for sync if offline)
export async function deleteOfflineClient(id: number): Promise<boolean> {
  if (isOnline()) {
    try {
      const success = await deleteClient(id);
      
      if (success) {
        // Remove from cache
        clientsCache = clientsCache.filter(c => c.id !== id);
        saveOfflineData();
      }
      
      return success;
    } catch (error) {
      // If API fails, fall back to offline mode
      return deleteOfflineClientFallback(id);
    }
  } else {
    return deleteOfflineClientFallback(id);
  }
}

function deleteOfflineClientFallback(id: number): boolean {
  // Check if client exists in cache
  const exists = clientsCache.some(c => c.id === id);
  if (!exists) return false;
  
  // Remove from cache
  clientsCache = clientsCache.filter(c => c.id !== id);
  
  // Add pending action
  addPendingAction("DELETE_CLIENT", { id });
  
  saveOfflineData();
  return true;
}

// Get notes for a client (from cache if offline)
export async function getOfflineNotes(clientId: number): Promise<Note[]> {
  if (isOnline()) {
    try {
      const notes = await getNotes(clientId);
      notesCache[clientId] = notes;
      saveOfflineData();
      return notes;
    } catch (error) {
      console.warn("Error fetching notes, using cached data:", error);
      return notesCache[clientId] || [];
    }
  } else {
    // Offline mode - return from cache
    return notesCache[clientId] || [];
  }
}

// Create a note (queue for sync if offline)
export async function createOfflineNote(note: InsertNote): Promise<Note> {
  if (isOnline()) {
    try {
      const newNote = await createNote(note);
      
      // Update cache
      if (!notesCache[note.clientId]) {
        notesCache[note.clientId] = [];
      }
      notesCache[note.clientId].push(newNote);
      saveOfflineData();
      
      return newNote;
    } catch (error) {
      // If API fails, fall back to offline mode
      return createOfflineNoteFallback(note);
    }
  } else {
    return createOfflineNoteFallback(note);
  }
}

function createOfflineNoteFallback(note: InsertNote): Note {
  // Create a temporary note with a temp ID
  const tempId = parseInt(generateTempId().replace(/\\D/g, '').substr(0, 9));
  const now = new Date();
  
  const newNote: Note = {
    ...note,
    id: tempId,
    createdAt: now
  };
  
  // Add to cache
  if (!notesCache[note.clientId]) {
    notesCache[note.clientId] = [];
  }
  notesCache[note.clientId].push(newNote);
  
  // Add pending action
  addPendingAction("CREATE_NOTE", note);
  
  saveOfflineData();
  return newNote;
}

// Delete a note (queue for sync if offline)
export async function deleteOfflineNote(id: number): Promise<boolean> {
  if (isOnline()) {
    try {
      const success = await deleteNote(id);
      
      if (success) {
        // Remove from cache
        for (const clientId in notesCache) {
          notesCache[clientId] = notesCache[clientId].filter(n => n.id !== id);
        }
        saveOfflineData();
      }
      
      return success;
    } catch (error) {
      // If API fails, fall back to offline mode
      return deleteOfflineNoteFallback(id);
    }
  } else {
    return deleteOfflineNoteFallback(id);
  }
}

function deleteOfflineNoteFallback(id: number): boolean {
  // Find which client this note belongs to
  let found = false;
  
  for (const clientId in notesCache) {
    const noteIndex = notesCache[clientId].findIndex(n => n.id === id);
    
    if (noteIndex >= 0) {
      found = true;
      notesCache[clientId] = notesCache[clientId].filter(n => n.id !== id);
    }
  }
  
  if (!found) return false;
  
  // Add pending action
  addPendingAction("DELETE_NOTE", { id });
  
  saveOfflineData();
  return true;
}

// Get followups (from cache if offline)
export async function getOfflineFollowups(today: boolean = false): Promise<Followup[]> {
  if (isOnline()) {
    try {
      const followups = await getFollowups(today);
      
      // Save all followups to cache by client
      followups.forEach(followup => {
        const clientId = followup.clientId;
        if (!followupsCache[clientId]) {
          followupsCache[clientId] = [];
        }
        
        // Check if already in cache
        const existingIndex = followupsCache[clientId].findIndex(f => f.id === followup.id);
        if (existingIndex >= 0) {
          followupsCache[clientId][existingIndex] = followup;
        } else {
          followupsCache[clientId].push(followup);
        }
      });
      
      saveOfflineData();
      return followups;
    } catch (error) {
      console.warn("Error fetching followups, using cached data:", error);
      // Combine all followups from cache
      let allFollowups: Followup[] = [];
      for (const clientId in followupsCache) {
        allFollowups = [...allFollowups, ...followupsCache[clientId]];
      }
      
      if (today) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        return allFollowups.filter(f => {
          const followupDate = new Date(f.followupDate);
          return followupDate.toISOString().split('T')[0] === todayStr;
        });
      }
      
      return allFollowups;
    }
  } else {
    // Offline mode - return from cache
    let allFollowups: Followup[] = [];
    for (const clientId in followupsCache) {
      allFollowups = [...allFollowups, ...followupsCache[clientId]];
    }
    
    if (today) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      return allFollowups.filter(f => {
        const followupDate = new Date(f.followupDate);
        return followupDate.toISOString().split('T')[0] === todayStr;
      });
    }
    
    return allFollowups;
  }
}

// Get followups for a client (from cache if offline)
export async function getOfflineFollowupsByClient(clientId: number): Promise<Followup[]> {
  if (isOnline()) {
    try {
      const followups = await getFollowups(false);
      followupsCache[clientId] = followups;
      saveOfflineData();
      return followups;
    } catch (error) {
      console.warn("Error fetching followups, using cached data:", error);
      return followupsCache[clientId] || [];
    }
  } else {
    // Offline mode - return from cache
    return followupsCache[clientId] || [];
  }
}

// Create a followup (queue for sync if offline)
export async function createOfflineFollowup(followup: InsertFollowup): Promise<Followup> {
  if (isOnline()) {
    try {
      const newFollowup = await createFollowup(followup);
      
      // Update cache
      if (!followupsCache[followup.clientId]) {
        followupsCache[followup.clientId] = [];
      }
      followupsCache[followup.clientId].push(newFollowup);
      saveOfflineData();
      
      return newFollowup;
    } catch (error) {
      // If API fails, fall back to offline mode
      return createOfflineFollowupFallback(followup);
    }
  } else {
    return createOfflineFollowupFallback(followup);
  }
}

function createOfflineFollowupFallback(followup: InsertFollowup): Followup {
  // Create a temporary followup with a temp ID
  const tempId = parseInt(generateTempId().replace(/\\D/g, '').substr(0, 9));
  const now = new Date();
  
  const newFollowup: Followup = {
    ...followup,
    id: tempId,
    completed: false,
    createdAt: now,
    updatedAt: now
  };
  
  // Add to cache
  if (!followupsCache[followup.clientId]) {
    followupsCache[followup.clientId] = [];
  }
  followupsCache[followup.clientId].push(newFollowup);
  
  // Add pending action
  addPendingAction("CREATE_FOLLOWUP", followup);
  
  saveOfflineData();
  return newFollowup;
}

// Update a followup (queue for sync if offline)
export async function updateOfflineFollowup(id: number, updateData: Partial<Followup>): Promise<Followup | undefined> {
  if (isOnline()) {
    try {
      const updatedFollowup = await updateFollowup(id, updateData);
      
      // Update cache
      if (updatedFollowup) {
        const clientId = updatedFollowup.clientId;
        if (followupsCache[clientId]) {
          const index = followupsCache[clientId].findIndex(f => f.id === id);
          if (index >= 0) {
            followupsCache[clientId][index] = updatedFollowup;
            saveOfflineData();
          }
        }
      }
      
      return updatedFollowup;
    } catch (error) {
      // If API fails, fall back to offline mode
      return updateOfflineFollowupFallback(id, updateData);
    }
  } else {
    return updateOfflineFollowupFallback(id, updateData);
  }
}

function updateOfflineFollowupFallback(id: number, updateData: Partial<Followup>): Followup | undefined {
  // Find followup in cache
  let foundFollowup: Followup | undefined;
  let clientId: number | undefined;
  let index = -1;
  
  for (const cId in followupsCache) {
    const idx = followupsCache[cId].findIndex(f => f.id === id);
    if (idx >= 0) {
      foundFollowup = followupsCache[cId][idx];
      clientId = parseInt(cId);
      index = idx;
      break;
    }
  }
  
  if (!foundFollowup || clientId === undefined) return undefined;
  
  // Update in cache
  const updatedFollowup: Followup = {
    ...foundFollowup,
    ...updateData,
    updatedAt: new Date()
  };
  
  followupsCache[clientId][index] = updatedFollowup;
  
  // Add pending action
  addPendingAction("UPDATE_FOLLOWUP", { id, updateData });
  
  saveOfflineData();
  return updatedFollowup;
}

// Complete a followup (queue for sync if offline)
export async function completeOfflineFollowup(id: number): Promise<Followup | undefined> {
  if (isOnline()) {
    try {
      const completedFollowup = await completeFollowup(id);
      
      // Update cache
      if (completedFollowup) {
        const clientId = completedFollowup.clientId;
        if (followupsCache[clientId]) {
          const index = followupsCache[clientId].findIndex(f => f.id === id);
          if (index >= 0) {
            followupsCache[clientId][index] = completedFollowup;
            saveOfflineData();
          }
        }
      }
      
      return completedFollowup;
    } catch (error) {
      // If API fails, fall back to offline mode
      return completeOfflineFollowupFallback(id);
    }
  } else {
    return completeOfflineFollowupFallback(id);
  }
}

function completeOfflineFollowupFallback(id: number): Followup | undefined {
  // Find followup in cache
  let foundFollowup: Followup | undefined;
  let clientId: number | undefined;
  let index = -1;
  
  for (const cId in followupsCache) {
    const idx = followupsCache[cId].findIndex(f => f.id === id);
    if (idx >= 0) {
      foundFollowup = followupsCache[cId][idx];
      clientId = parseInt(cId);
      index = idx;
      break;
    }
  }
  
  if (!foundFollowup || clientId === undefined) return undefined;
  
  // Update in cache
  const completedFollowup: Followup = {
    ...foundFollowup,
    completed: true,
    updatedAt: new Date()
  };
  
  followupsCache[clientId][index] = completedFollowup;
  
  // Add pending action
  addPendingAction("COMPLETE_FOLLOWUP", { id });
  
  saveOfflineData();
  return completedFollowup;
}

// Delete a followup (queue for sync if offline)
export async function deleteOfflineFollowup(id: number): Promise<boolean> {
  if (isOnline()) {
    try {
      const success = await deleteFollowup(id);
      
      if (success) {
        // Remove from cache
        for (const clientId in followupsCache) {
          followupsCache[clientId] = followupsCache[clientId].filter(f => f.id !== id);
        }
        saveOfflineData();
      }
      
      return success;
    } catch (error) {
      // If API fails, fall back to offline mode
      return deleteOfflineFollowupFallback(id);
    }
  } else {
    return deleteOfflineFollowupFallback(id);
  }
}

function deleteOfflineFollowupFallback(id: number): boolean {
  // Find which client this followup belongs to
  let found = false;
  
  for (const clientId in followupsCache) {
    const followupIndex = followupsCache[clientId].findIndex(f => f.id === id);
    
    if (followupIndex >= 0) {
      found = true;
      followupsCache[clientId] = followupsCache[clientId].filter(f => f.id !== id);
    }
  }
  
  if (!found) return false;
  
  // Add pending action
  addPendingAction("DELETE_FOLLOWUP", { id });
  
  saveOfflineData();
  return true;
}

// Process pending actions when online
export async function syncOfflineActions(): Promise<boolean> {
  if (!isOnline() || pendingActions.length === 0) {
    return false;
  }
  
  console.log(`Syncing ${pendingActions.length} pending actions...`);
  
  // Sort actions by timestamp
  const sortedActions = [...pendingActions].sort((a, b) => a.timestamp - b.timestamp);
  
  for (const action of sortedActions) {
    try {
      await processAction(action);
      // Remove successfully processed action
      removePendingAction(action.id);
    } catch (error) {
      console.error(`Error processing action ${action.type}:`, error);
      // Keep the action in the queue for next sync attempt
    }
  }
  
  return true;
}

async function processAction(action: PendingAction): Promise<void> {
  const { type, data } = action;
  
  switch (type) {
    case "CREATE_CLIENT":
      await createClient(data);
      break;
      
    case "UPDATE_CLIENT":
      await updateClient(data.id, data.updateData);
      break;
      
    case "DELETE_CLIENT":
      await deleteClient(data.id);
      break;
      
    case "CREATE_NOTE":
      await createNote(data);
      break;
      
    case "DELETE_NOTE":
      await deleteNote(data.id);
      break;
      
    case "CREATE_FOLLOWUP":
      await createFollowup(data);
      break;
      
    case "UPDATE_FOLLOWUP":
      await updateFollowup(data.id, data.updateData);
      break;
      
    case "COMPLETE_FOLLOWUP":
      await completeFollowup(data.id);
      break;
      
    case "DELETE_FOLLOWUP":
      await deleteFollowup(data.id);
      break;
      
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Get pending actions count
export function getPendingActionsCount(): number {
  return pendingActions.length;
}

// Initialize - load data from localStorage and add event listeners for online/offline
export function initOfflineSync(): void {
  loadOfflineData();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('App is online, syncing pending actions...');
    syncOfflineActions();
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline, data will be cached locally');
  });
}