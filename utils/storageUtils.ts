
import Dexie, { Table } from 'dexie';
import { FullCaseData, CaseMetadata } from '../types';

const CURRENT_CASE_KEY = 'evidence_master_current_case_id';

class EvidenceMasterDB extends Dexie {
  cases!: Table<FullCaseData>; 
  metadata!: Table<CaseMetadata>;

  constructor() {
    super('EvidenceMasterDB');
    (this as any).version(1).stores({
      cases: 'metadata.id', // Primary key is inside metadata object
      metadata: 'id' // Separate table for fast listing
    });
  }
}

export const db = new EvidenceMasterDB();

// Get list of all saved cases
export const listSavedCases = async (): Promise<CaseMetadata[]> => {
  try {
    return await db.metadata.toArray();
  } catch (e) {
    console.error("Failed to list cases", e);
    return [];
  }
};

// Save the current case
export const saveCase = async (data: FullCaseData): Promise<void> => {
  try {
    await (db as any).transaction('rw', db.cases, db.metadata, async () => {
      // 1. Save full data payload
      await db.cases.put(data);
      
      // 2. Update index
      const meta: CaseMetadata = {
        id: data.metadata.id,
        name: data.metadata.name,
        lastModified: Date.now(),
        description: data.metadata.description
      };
      await db.metadata.put(meta);
    });
    
    localStorage.setItem(CURRENT_CASE_KEY, data.metadata.id);
    console.log(`Case saved to IndexedDB: ${data.metadata.name}`);
  } catch (e) {
    console.error("Failed to save case data", e);
    throw e;
  }
};

// Load a specific case
export const loadCase = async (id: string): Promise<FullCaseData | undefined> => {
  try {
    const data = await db.cases.get(id);
    if (data) {
      localStorage.setItem(CURRENT_CASE_KEY, id);
    }
    return data;
  } catch (e) {
    console.error("Failed to load case", e);
    return undefined;
  }
};

// Delete a case
export const deleteCase = async (id: string): Promise<void> => {
  try {
    await (db as any).transaction('rw', db.cases, db.metadata, async () => {
      await db.cases.delete(id);
      await db.metadata.delete(id);
    });

    if (localStorage.getItem(CURRENT_CASE_KEY) === id) {
      localStorage.removeItem(CURRENT_CASE_KEY);
    }
  } catch (e) {
    console.error("Failed to delete case", e);
  }
};

// Load the last active case on startup
export const loadLastActiveCase = async (): Promise<FullCaseData | undefined> => {
  const lastId = localStorage.getItem(CURRENT_CASE_KEY);
  if (lastId) {
    return await loadCase(lastId);
  }
  return undefined;
};
