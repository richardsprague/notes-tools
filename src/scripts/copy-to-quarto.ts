// src/copy-to-quarto.ts
import { cp, mkdir } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

async function copyToQuartoProject() {
  try {
    // Get environment variables or use defaults
    const outputDir = process.env.OUTPUT_DIR || "./output";
    const quartoProjectDir = process.env.QUARTO_DIR || "../notes-quarto";

    // Resolve paths
    const sourceDir = resolve(outputDir);
    const targetDir = resolve(quartoProjectDir);

    // Define target directory structure
    const notesDir = join(targetDir, "notes-2025", "notes");
    const assetsDir = join(notesDir, "_assets"); // Using _assets instead of images

    console.log("Copying processed files to Quarto project...");
    console.log(`From: ${sourceDir}`);
    console.log(`To notes directory: ${notesDir}`);
    console.log(`To assets directory: ${assetsDir}`);

    // Ensure target directories exist
    if (!existsSync(notesDir)) {
      await mkdir(notesDir, { recursive: true });
    }
    if (!existsSync(assetsDir)) {
      await mkdir(assetsDir, { recursive: true });
    }

    // Copy the main notes file
    await cp(
      join(sourceDir, "combined_notes.md"),
      join(notesDir, "notes.qmd"),
      { force: true }
    );

    // Copy the assets directory contents
    if (existsSync(join(sourceDir, "_assets"))) {
      await cp(join(sourceDir, "_assets"), assetsDir, {
        recursive: true,
        force: true,
      });

      console.log("Successfully copied files to Quarto project!");
      console.log(
        `- Main notes file copied to: ${join(notesDir, "notes.qmd")}`
      );
      console.log(`- Assets copied to: ${assetsDir}`);
    } else {
      console.warn("No _assets directory found in source directory");
    }
  } catch (error) {
    console.error("Error copying files:", error);
    process.exit(1);
  }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copyToQuartoProject();
}

export { copyToQuartoProject };
