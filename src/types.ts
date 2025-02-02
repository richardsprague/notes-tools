// src/types.ts
export interface NoteFile {
    path: string;
    date: Date;
    content: string;
    filename: string;
}

export interface ProcessedNote {
    date: Date;
    content: string;
    filename: string;
}