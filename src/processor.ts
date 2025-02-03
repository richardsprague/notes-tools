// src/processor.ts
import { unified } from "unified";
import { VFile } from "vfile";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import { NoteFile } from "./types.js";
import { processImages } from "./imageHandler.js";

function formatDateBox(date: Date, dayName: string): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `<div class="raw"><p class="date-box">${dayName}, ${
    monthNames[date.getMonth()]
  } ${date.getDate()}</p></div>`;
}

export async function processNote(noteFile: NoteFile): Promise<string> {
  console.log(`Processing note: ${noteFile.filename}`);
  const file = new VFile({ path: noteFile.path, value: noteFile.content });

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkStringify);

  const ast = await processor.parse(file);

  // Remove YAML frontmatter from the AST
  if (ast.children && ast.children.length > 0) {
    ast.children = ast.children.filter((node) => node.type !== "yaml");
  }

  let processed = await processor.stringify(ast);

  // Extract day name from filename
  const dayMatch = noteFile.filename.match(/Notes \d{6} (\w+)\.md$/);
  const dayName = dayMatch ? dayMatch[1] : "";

  // Format the date box as in the Python implementation
  const dateBox = formatDateBox(noteFile.date, dayName);

  // Process images and get updated content
  const processedWithImages = await processImages(
    {
      date: noteFile.date,
      content: processed,
      filename: noteFile.filename,
    },
    noteFile.path,
    process.env.OUTPUT_DIR || "./output"
  );

  return `${dateBox}\n\n${processedWithImages}`;
}
