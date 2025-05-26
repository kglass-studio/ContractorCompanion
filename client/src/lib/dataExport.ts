import { Client, Note, Followup } from "@shared/schema";

export interface ExportData {
  clients: Client[];
  notes: Record<number, Note[]>;
  followups: Record<number, Followup[]>;
  exportDate: string;
  totalClients: number;
  totalNotes: number;
  totalFollowups: number;
}

// Generate CSV content for clients
export function generateClientsCSV(clients: Client[]): string {
  const headers = [
    'ID',
    'Name',
    'Phone',
    'Email',
    'Address Line 1',
    'City',
    'State',
    'Zip Code',
    'Status',
    'Created Date',
    'Last Updated'
  ];

  const csvRows = [headers.join(',')];

  clients.forEach(client => {
    const row = [
      client.id.toString(),
      `"${client.name}"`,
      `"${client.phone}"`,
      `"${client.email || ''}"`,
      `"${client.addressLine1 || ''}"`,
      `"${client.city || ''}"`,
      `"${client.state || ''}"`,
      `"${client.zipCode || ''}"`,
      `"${client.status}"`,
      client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
      client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : ''
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Generate CSV content for notes
export function generateNotesCSV(notes: Record<number, Note[]>, clients: Client[]): string {
  const headers = [
    'Client ID',
    'Client Name',
    'Note ID',
    'Note Content',
    'Created Date'
  ];

  const csvRows = [headers.join(',')];

  Object.entries(notes).forEach(([clientId, clientNotes]) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    const clientName = client ? client.name : 'Unknown Client';

    clientNotes.forEach(note => {
      const row = [
        clientId,
        `"${clientName}"`,
        note.id.toString(),
        `"${note.text.replace(/"/g, '""')}"`, // Escape quotes in content
        note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''
      ];
      csvRows.push(row.join(','));
    });
  });

  return csvRows.join('\n');
}

// Generate CSV content for followups
export function generateFollowupsCSV(followups: Record<number, Followup[]>, clients: Client[]): string {
  const headers = [
    'Client ID',
    'Client Name',
    'Followup ID',
    'Action',
    'Scheduled Date',
    'Completed',
    'Created Date'
  ];

  const csvRows = [headers.join(',')];

  Object.entries(followups).forEach(([clientId, clientFollowups]) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    const clientName = client ? client.name : 'Unknown Client';

    clientFollowups.forEach(followup => {
      const row = [
        clientId,
        `"${clientName}"`,
        followup.id.toString(),
        `"${followup.action.replace(/"/g, '""')}"`,
        followup.scheduledDate ? new Date(followup.scheduledDate).toLocaleDateString() : '',
        followup.isCompleted ? 'Yes' : 'No',
        followup.createdAt ? new Date(followup.createdAt).toLocaleDateString() : ''
      ];
      csvRows.push(row.join(','));
    });
  });

  return csvRows.join('\n');
}

// Generate JSON export
export function generateJSONExport(exportData: ExportData): string {
  return JSON.stringify(exportData, null, 2);
}

// Download file helper
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

// Main export function
export async function exportUserData(userId: string): Promise<ExportData> {
  try {
    // Fetch all user data
    const [clientsResponse, notesPromises, followupsPromises] = await Promise.all([
      fetch('/api/clients', {
        headers: { 'x-user-id': userId }
      }),
      // We'll fetch notes and followups after getting clients
      Promise.resolve([]),
      Promise.resolve([])
    ]);

    if (!clientsResponse.ok) {
      throw new Error('Failed to fetch clients');
    }

    const clients: Client[] = await clientsResponse.json();
    
    // Fetch notes and followups for each client
    const notesData: Record<number, Note[]> = {};
    const followupsData: Record<number, Followup[]> = {};
    
    await Promise.all(
      clients.map(async (client) => {
        try {
          // Fetch notes for this client
          const notesResponse = await fetch(`/api/clients/${client.id}/notes`, {
            headers: { 'x-user-id': userId }
          });
          if (notesResponse.ok) {
            notesData[client.id] = await notesResponse.json();
          } else {
            notesData[client.id] = [];
          }

          // Fetch followups for this client
          const followupsResponse = await fetch(`/api/clients/${client.id}/followups`, {
            headers: { 'x-user-id': userId }
          });
          if (followupsResponse.ok) {
            followupsData[client.id] = await followupsResponse.json();
          } else {
            followupsData[client.id] = [];
          }
        } catch (error) {
          console.error(`Failed to fetch data for client ${client.id}:`, error);
          notesData[client.id] = [];
          followupsData[client.id] = [];
        }
      })
    );

    // Calculate totals
    const totalNotes = Object.values(notesData).reduce((sum, notes) => sum + notes.length, 0);
    const totalFollowups = Object.values(followupsData).reduce((sum, followups) => sum + followups.length, 0);

    const exportData: ExportData = {
      clients,
      notes: notesData,
      followups: followupsData,
      exportDate: new Date().toISOString(),
      totalClients: clients.length,
      totalNotes,
      totalFollowups
    };

    return exportData;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}