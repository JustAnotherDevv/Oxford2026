export interface Note {
  id: string;
  value: string; // bigint as string for JSON serialization
  secret: string;
  owner: string; // owner field element as decimal string
  commitment: string;
  leafIndex: number;
  spent: boolean;
  createdAt: number;
}

const STORAGE_KEY = "neobank_notes_global";

function loadAllNotes(): Note[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/** Convert an Ethereum address to the owner field string used in notes */
export function addressToOwnerField(address: string): string {
  return BigInt(address).toString();
}

/** Save a note to the global store */
export function saveNote(note: Note): void {
  const notes = loadAllNotes();
  notes.push(note);
  persistNotes(notes);
}

/** Get unspent notes for a specific owner (by address) */
export function getUnspentNotes(address: string): Note[] {
  const ownerField = addressToOwnerField(address);
  return loadAllNotes().filter((n) => !n.spent && n.owner === ownerField);
}

/** Get all notes for a specific owner (by address) */
export function getAllNotes(address: string): Note[] {
  const ownerField = addressToOwnerField(address);
  return loadAllNotes().filter((n) => n.owner === ownerField);
}

/** Get all notes globally (regardless of owner) */
export function getAllNotesGlobal(): Note[] {
  return loadAllNotes();
}

/** Mark a note as spent by ID (global lookup) */
export function markNoteSpent(id: string): void {
  const notes = loadAllNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.spent = true;
    persistNotes(notes);
  }
}

export function generateNoteId(): string {
  return crypto.randomUUID();
}

export function generateSecret(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Convert to a field-compatible decimal string (< 2^128)
  let hex = "0x";
  for (const b of arr) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex).toString();
}
