// src/index.ts
import { findNoteFiles, readNoteFile, ensureDirectory } from './utils.js';
import { processNote } from './processor.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ProcessedNote } from './types.js';

async function main() {
    try {
        const baseDir = process.env.NOTES_DIR || '~/vaults/notes/Sprague2025/Notes2025';
        const quarter = process.env.NOTES_QUARTER || 'Notes 2025Q1';
        const outputDir = process.env.OUTPUT_DIR || './output';
        
        const notesDir = `${baseDir}/${quarter}`;
        console.log(`Starting notes processing from ${notesDir}...`);
        
        // Ensure output directory exists
        await ensureDirectory(outputDir);
        
        // Find all note files
        const filePaths = await findNoteFiles(notesDir);
        
        // Read and process each file
        const processedNotes = await Promise.all(
            filePaths
                .sort()
                .map(async (filepath: string) => {
                    const noteFile = await readNoteFile(filepath);
                    if (!noteFile) return null;
                    
                    const processed = await processNote(noteFile);
                    return {
                        date: noteFile.date,
                        content: processed,
                        filename: noteFile.filename
                    } as ProcessedNote;
                })
        );
        
        // Filter out nulls and sort by date
        const validNotes = processedNotes
            .filter((note): note is ProcessedNote => note !== null)
            .sort((a: ProcessedNote, b: ProcessedNote) => a.date.getTime() - b.date.getTime());
            
        console.log(`Successfully processed ${validNotes.length} notes`);
        
        // Combine all notes with consistent line endings and proper spacing
        const combinedContent = validNotes
            .map((note: ProcessedNote) => note.content.replace(/\r\n/g, '\n'))  // Normalize CRLF to LF
            .join('\n\n')
            .replace(/\u2028/g, '\n')  // Replace LS (Line Separator)
            .replace(/\u2029/g, '\n')  // Replace PS (Paragraph Separator)
            .replace(/\n{3,}/g, '\n\n'); // Replace multiple blank lines with double
            
        // Write the combined output
        const outputPath = join(outputDir, 'combined_notes.md');
        await writeFile(outputPath, combinedContent);
        
        // Write a summary file
        const summaryContent = validNotes
            .map((note: ProcessedNote) => `- ${note.filename}`)
            .join('\n');
        await writeFile(join(outputDir, 'processed_files.txt'), summaryContent);
        
        console.log(`\nProcessing complete!`);
        console.log(`Full notes written to: ${outputPath}`);
        console.log(`Summary written to: ${join(outputDir, 'processed_files.txt')}`);
        
    } catch (error) {
        console.error('Error processing notes:', error);
        process.exit(1);
    }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}