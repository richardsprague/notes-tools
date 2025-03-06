# Notes Tools

A TypeScript-based utility for processing and combining daily markdown notes files. This tool is designed to work with notes organized by date in the format "Notes YYMMDD DayOfWeek.md".

## Features

- Processes markdown files with YAML frontmatter
- Maintains chronological order of notes
- Adds formatted date headers to each note
- Combines multiple note files into a single document
- Preserves markdown formatting
- Handles file encoding and line ending normalization
- Generates processing summary

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript
- Git (optional)

## Quick Start

You must explicitly set the directory where your notes are kept.

Generate a consolidated notes file in `./output`:

```bash
NOTES_DIR="~/vaults/notes/Sprague2025/Notes2025" NOTES_QUARTER="Notes 2025Q1" OUTPUT_DIR="./output" npm run dev
```

then copy it to the `notes-quarto` directory

```bash
npm run copy-quarto
```

## Installation

1. Clone the repository or create a new directory:

```bash
git clone <repository-url>
# or
mkdir notes-tools && cd notes-tools
```

2. Install dependencies:

```bash
npm install
```

## Project Structure

```
notes-tools/
├── src/
│   ├── index.ts      # Main entry point
│   ├── processor.ts  # Markdown processing logic
│   ├── types.ts      # TypeScript interfaces
│   └── utils.ts      # Helper functions
├── dist/            # Compiled JavaScript
├── output/          # Generated output files
├── package.json
└── tsconfig.json
```

## Configuration

The application uses environment variables for configuration:

- `NOTES_DIR`: Base directory for notes (default: "~/vaults/notes/Sprague2025/Notes2025")
- `NOTES_QUARTER`: Quarter subdirectory (default: "Notes 2025Q1")
- `OUTPUT_DIR`: Output directory for processed files (default: "./output")

## Usage

### Development Mode

Run the application with ts-node:

```bash
npm run dev
```

Or with specific environment variables:

```bash
NOTES_DIR="~/path/to/notes" NOTES_QUARTER="Notes 2025Q1" OUTPUT_DIR="./output" npm run dev
```

### Production Mode

1. Build the TypeScript files:

```bash
npm run build
```

2. Run the compiled JavaScript:

```bash
npm start
```

## Input Format

The tool expects note files in the following format:

```markdown
---
date: 2025-01-24
tags: notes
day_of_week: Friday
---

Your note content here...
```

File naming convention:

- Format: `Notes YYMMDD DayOfWeek.md`
- Example: `Notes 250124 Friday.md`

## Output

The tool generates two files in the output directory:

1. `combined_notes.md`: Combined notes with formatted date headers
2. `processed_files.txt`: List of processed files

### Date Box Format

Each note in the combined output includes a formatted date header:

```html
<div class="raw"><p class="date-box">Friday, January 24</p></div>
```

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

## Dependencies

- `unified`: Core text processing
- `remark-parse`: Markdown parsing
- `remark-frontmatter`: YAML frontmatter handling
- `remark-stringify`: Markdown serialization
- `glob`: File pattern matching
- `vfile`: Virtual file handling

## License

Copyright 2025 Richard Sprague

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
