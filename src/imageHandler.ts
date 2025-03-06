// src/imageHandler.ts
import { copyFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, basename } from "path";
import { ProcessedNote } from "./types.js";

interface ImageReference {
  originalPath: string;
  markdown: string;
}

export async function processImages(
  note: ProcessedNote,
  notePath: string,
  outputDir: string
): Promise<string> {
  const assetsDir = join(outputDir, "_assets");

  // Ensure assets directory exists
  if (!existsSync(assetsDir)) {
    await mkdir(assetsDir, { recursive: true });
  }

  // Get the directory of the current note file
  const noteDir = dirname(notePath);

  // Find all image references in the markdown content
  const imageRefs = findImageReferences(note.content);
  let updatedContent = note.content;

  // Get all subdirectories in the note's directory
  const subDirs = await getSubdirectories(noteDir);

  // Process each image reference
  for (const ref of imageRefs) {
    try {
      const filename = ref.originalPath.split("|")[0].trim(); // Remove any Obsidian parameters

      // Possible locations: current directory and all subdirectories
      const possibleLocations = [
        join(noteDir, filename), // Same directory as note
        ...subDirs.map((subDir) => join(subDir, filename)), // All subdirectories
      ];

      const existingImagePath = possibleLocations.find((path) =>
        existsSync(path)
      );

      if (existingImagePath) {
        // Generate a unique filename to avoid collisions
        const uniqueFilename = generateUniqueFilename(filename);
        const newImagePath = join(assetsDir, uniqueFilename);

        // Copy the image file
        await copyFile(existingImagePath, newImagePath);

        // Update the markdown to use the new _assets path
        const caption = filename
          .split(".")[0]
          .replace(/([A-Z])/g, " $1")
          .trim();
        const newRef = `![${caption}](_assets/${uniqueFilename})`;

        updatedContent = updatedContent.replace(ref.markdown, newRef);

        console.log(
          `Copied image: ${basename(
            existingImagePath
          )} -> _assets/${uniqueFilename}`
        );
      } else {
        console.warn(`Warning: Image not found for ${ref.markdown}`);
        console.warn("Tried locations:", possibleLocations);
      }
    } catch (error) {
      console.error(`Error processing image ${ref.originalPath}:`, error);
    }
  }

  return updatedContent;
}

async function getSubdirectories(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const subDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(dir, entry.name));
    return subDirs;
  } catch (error) {
    console.error(`Error reading subdirectories of ${dir}:`, error);
    return [];
  }
}

function findImageReferences(markdown: string): ImageReference[] {
  const refs: ImageReference[] = [];

  // Match both ![]() and ![[]] Obsidian-style image references
  const patterns = [
    {
      pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, // Standard markdown
      pathIndex: 2,
    },
    {
      pattern: /!\[\[([^\]]+)\]\]/g, // Obsidian style
      pathIndex: 1,
    },
  ];

  for (const { pattern, pathIndex } of patterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const fullMatch = match[0];
      const imagePath = match[pathIndex];

      // Clean up the path (remove any URL parameters or size specifications)
      const cleanPath = imagePath.split("|")[0].trim();

      refs.push({
        originalPath: cleanPath,
        markdown: fullMatch,
      });
    }
  }

  return refs;
}

function generateUniqueFilename(originalPath: string): string {
  const filename = basename(originalPath);
  const timestamp = Date.now().toString(36);
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  const name = filename.includes(".")
    ? filename.split(".").slice(0, -1).join(".")
    : filename;

  return `${name}-${timestamp}.${ext}`;
}
