// src/index.ts
import { findNoteFiles, readNoteFile, ensureDirectory } from "./utils.js";
import { processNote } from "./processor.js";
import { writeFile } from "fs/promises";
import { join } from "path";
import { ProcessedNote } from "./types.js";

async function main() {
  try {
    const notesDir =
      process.env.NOTES_DIR || "~/vaults/notes/Sprague2025/Notes2025";
    const outputDir = process.env.OUTPUT_DIR || "./output";

    console.log(`Starting notes processing from ${notesDir}...`);

    // Ensure output directory exists
    await ensureDirectory(outputDir);

    // Find all note files recursively
    const filePaths = await findNoteFiles(notesDir);

    // Read and process each file
    const processedNotes = await Promise.all(
      filePaths
        .sort() // Initial sort by filepath for consistency
        .map(async (filepath: string) => {
          const noteFile = await readNoteFile(filepath);
          if (!noteFile) return null;

          const processed = await processNote(noteFile);
          return {
            date: noteFile.date,
            content: processed,
            filename: noteFile.filename,
          } as ProcessedNote;
        })
    );

    // Filter out nulls and sort by date
    const validNotes = processedNotes
      .filter((note): note is ProcessedNote => note !== null)
      .sort(
        (a: ProcessedNote, b: ProcessedNote) =>
          a.date.getTime() - b.date.getTime()
      );

    console.log(`Successfully processed ${validNotes.length} notes`);

    // Combine all notes into a single document
    const combinedContent = validNotes
      .map((note: ProcessedNote) => note.content.replace(/\r\n/g, "\n"))
      .join("\n\n")
      .replace(/\u2028/g, "\n")
      .replace(/\u2029/g, "\n")
      .replace(/\n{3,}/g, "\n\n");

    // Write the combined output
    const outputPath = join(outputDir, "combined_notes.md");
    await writeFile(outputPath, combinedContent);

    // Write a summary file
    const summaryContent = validNotes
      .map((note: ProcessedNote) => `- ${note.filename}`)
      .join("\n");
    await writeFile(join(outputDir, "processed_files.txt"), summaryContent);

    console.log(`\nProcessing complete!`);
    console.log(`Combined notes written to: ${outputPath}`);
    console.log(
      `Summary written to: ${join(outputDir, "processed_files.txt")}`
    );
  } catch (error) {
    console.error("Error processing notes:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
