// notes-tools/src/scripts/create-quarto-project.ts
import { mkdir, writeFile, copyFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

async function createQuartoProject(year: string) {
  const baseDir = process.env.QUARTO_BASE_DIR || "../notes-quarto";
  const projectDir = join(baseDir, `notes-${year}`);

  // Create project directory structure
  const dirs = [
    projectDir,
    join(projectDir, "notes"),
    join(projectDir, "images"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }

  // Create _quarto.yml
  const quartoConfig = `
project:
  type: website
  output-dir: _site
  resources:
    - "../shared/_styles"

website:
  title: "Notes ${year}"
  navbar:
    left:
      - href: index.qmd
        text: Home
      - href: notes/index.qmd
        text: Notes
`;

  await writeFile(join(projectDir, "_quarto.yml"), quartoConfig);
  console.log("Created _quarto.yml");

  // Create index.qmd
  const indexContent = `---
title: "${year} Notes"
---

Welcome to my ${year} notes collection.
`;

  await writeFile(join(projectDir, "index.qmd"), indexContent);
  console.log("Created index.qmd");
}

// Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const year = process.argv[2];
  if (!year) {
    console.error("Please provide a year: npm run create-project 2025");
    process.exit(1);
  }
  createQuartoProject(year).catch(console.error);
}
