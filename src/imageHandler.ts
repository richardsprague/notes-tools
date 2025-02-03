// src/imageHandler.ts
import { copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, basename, resolve, isAbsolute } from "path";
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

  // Get the directory of the current note file to resolve relative paths
  const noteDir = dirname(notePath);

  // Find all image references in the markdown content
  const imageRefs = findImageReferences(note.content);
  let updatedContent = note.content;

  // Process each image reference
  for (const ref of imageRefs) {
    try {
      // Handle the path resolution based on whether it's absolute or relative
      const imagePath = isAbsolute(ref.originalPath)
        ? ref.originalPath
        : join(noteDir, ref.originalPath);

      // Try to find the image in multiple locations
      const possibleLocations = [
        imagePath,
        join(noteDir, ref.originalPath),
        join(noteDir, "images2025q1", ref.originalPath), // Look in quarter's images directory
        join(dirname(noteDir), ref.originalPath), // Look in parent directory
        join(dirname(noteDir), "images", ref.originalPath), // Look in sibling 'images' directory
        join(
          dirname(noteDir),
          `images${getQuarter(notePath)}`,
          ref.originalPath
        ), // Look in quarter-specific images directory
      ];

      const existingImagePath = possibleLocations.find((path) =>
        existsSync(path)
      );

      if (existingImagePath) {
        // Generate a unique filename to avoid collisions
        const uniqueFilename = generateUniqueFilename(ref.originalPath);
        const newImagePath = join(assetsDir, uniqueFilename);

        // Copy the image file
        await copyFile(existingImagePath, newImagePath);

        // Update the markdown to use the new _assets path while preserving caption/alt text
        let newRef = ref.markdown;
        if (ref.markdown.startsWith("![")) {
          // For standard markdown format ![caption](path)
          newRef = ref.markdown.replace(
            /\]\([^)]+\)/,
            `](_assets/${uniqueFilename})`
          );
        } else {
          // For Obsidian format ![[path]]
          const caption = ref.originalPath
            .split(".")[0]
            .replace(/([A-Z])/g, " $1")
            .trim();
          newRef = `![${caption}](_assets/${uniqueFilename})`;
        }
        updatedContent = updatedContent.replace(ref.markdown, newRef);

        console.log(
          `Copied image: ${basename(
            existingImagePath
          )} -> _assets/${uniqueFilename}`
        );
      } else {
        console.warn(
          `Warning: Image not found in any expected location: ${ref.originalPath}`
        );
        console.warn("Tried locations:", possibleLocations);
      }
    } catch (error) {
      console.error(`Error processing image ${ref.originalPath}:`, error);
    }
  }

  return updatedContent;
}

function findImageReferences(markdown: string): ImageReference[] {
  const refs: ImageReference[] = [];

  // Match both ![]() and ![[]] Obsidian-style image references
  const patterns = [
    {
      pattern: /!\[([^\]]*)\]\(([^)]+)\)/g, // Standard markdown
      pathIndex: 2,
      captionIndex: 1,
    },
    {
      pattern: /!\[\[([^\]]+)\]\]/g, // Obsidian style
      pathIndex: 1,
      captionIndex: null,
    },
  ];

  for (const { pattern, pathIndex, captionIndex } of patterns) {
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
  // Remove any directory structure and get just the filename
  const filename = basename(originalPath);

  // Add a timestamp to ensure uniqueness while preserving the original filename
  const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  const name = filename.includes(".")
    ? filename.split(".").slice(0, -1).join(".")
    : filename;

  return `${name}-${timestamp}.${ext}`;
}

function getQuarter(notePath: string): string {
  // Extract quarter from path like "Notes 2025Q1"
  const quarterMatch = notePath.match(/Notes\s+(\d{4}Q\d)/i);
  return quarterMatch ? quarterMatch[1].toLowerCase() : "";
}
