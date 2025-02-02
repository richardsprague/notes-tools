// src/utils.ts
import { readFile, mkdir } from "fs/promises";
import { parse as parsePath } from "path";
import { glob } from "glob";
import { existsSync } from "fs";
import { NoteFile } from "./types.js";

export async function findNoteFiles(directory: string): Promise<string[]> {
  console.log(`Searching for notes in: ${directory}`);
  const pattern = `${directory}/Notes *.md`;
  const files = await glob(pattern);
  console.log(`Found ${files.length} note files`);
  return files;
}

export function extractDateFromFilename(filename: string): Date | null {
  const match = filename.match(/Notes (\d{2})(\d{2})(\d{2})/);
  if (!match) {
    console.log(`Warning: Could not extract date from filename: ${filename}`);
    return null;
  }

  const [_, yy, mm, dd] = match;
  return new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd));
}

export async function readNoteFile(filepath: string): Promise<NoteFile | null> {
  console.log(`Reading file: ${filepath}`);
  try {
    const content = await readFile(filepath, "utf-8");
    const parsedPath = parsePath(filepath);
    const date = extractDateFromFilename(parsedPath.base);

    if (!date) return null;

    return {
      path: filepath,
      filename: parsedPath.base,
      date,
      content,
    };
  } catch (error) {
    console.error(`Error reading file ${filepath}:`, error);
    return null;
  }
}

export async function ensureDirectory(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}
