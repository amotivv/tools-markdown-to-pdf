# Markdown to PDF

> A free tool provided by amotivv, inc. to convert Markdown documents to beautifully formatted PDFs with real-time preview.

---

## Overview

The **Markdown to PDF** is an open-source web tool built with [Astro](https://astro.build) and styled with [Tailwind CSS](https://tailwindcss.com) that enables you to write Markdown content and export it as professionally formatted PDFs. Whether you're creating documentation, reports, or articles, this tool provides a seamless writing experience with instant preview and customizable PDF export options.

## Features

- **Real-Time Preview:** See your markdown content rendered instantly as you type
- **Syntax Highlighting:** Code blocks are beautifully highlighted for better readability
- **Custom PDF Settings:** Customize paper size, margins, and other PDF export options
- **Math Support:** Write mathematical equations using LaTeX syntax with KaTeX rendering
- **Table of Contents:** Automatically generate a table of contents for your document
- **Document Metadata:** Add custom metadata like title, author, and keywords to your PDF
- **Modern Tech Stack:** Built using Astro, Tailwind CSS, CodeMirror, and TypeScript

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (or your preferred package manager)

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/amotivv/tools-mdpdf
cd tools-mdpdf
npm install
```

### Running the App in Development

Start the development server with:

```sh
npm run dev
```

Then open your browser and navigate to the local URL (usually [http://localhost:4321](http://localhost:4321)).

### Building for Production

To build your production site:

```sh
npm run build
```

You can preview your production build using:

```sh
npm run preview
```

## Project Structure

The key files and folders include:

- **astro.config.mjs** & **tailwind.config.mjs**: Configuration files for Astro and Tailwind CSS
- **package.json**: Contains project scripts and dependency definitions
- **tsconfig.json**: TypeScript configuration for Astro
- **src/**: Contains your application source code
  - **components/**: Reusable UI components (Editor.astro, Controls.astro, Navigation.astro)
  - **layouts/**: Layout components wrapping pages (Layout.astro)
  - **pages/**: The main pages and API routes
  - **utils/**: Utility functions and storage management
- **.astro/**: Contains Astro-specific types and settings

## Usage

### Editor Features

The markdown editor provides:

1. **Syntax Highlighting:** Write markdown with proper syntax highlighting
2. **Line Numbers:** Keep track of your document structure with line numbers
3. **Auto-save:** Your content is automatically saved as you type
4. **File Management:** Open existing markdown files or save your work

### PDF Export Options

Customize your PDF output with:

- **Paper Size:** Choose from A4, Letter, or Legal formats
- **Margins:** Select from normal, narrow, or wide margin presets
- **Table of Contents:** Automatically generate a table of contents
- **Page Numbers:** Add page numbers to your document
- **Math Support:** Enable KaTeX rendering for mathematical equations
- **Document Metadata:** Add title, author, subject, and keywords

### Document Storage

The app provides:

- **Recent Files:** Quick access to recently edited documents
- **Auto-save:** Automatic saving of your work
- **Local Storage:** Your documents are safely stored in the browser

## How It Works

- **Editor:** Uses CodeMirror 6 for a powerful editing experience with syntax highlighting and line numbers
- **Preview:** Real-time markdown rendering with support for GFM and math equations
- **PDF Generation:** Server-side PDF generation with proper styling and layout
- **Storage:** Browser local storage for document management and settings

## Customization

You can customize the editor theme, PDF styling, and other features by modifying the relevant components and configuration files.

## Contributing

This tool is provided as-is by **amotivv, inc.** Contributions and feedback are welcome. Feel free to open issues or submit pull requests with improvements or fixes.

## Credits

- Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- Editor powered by [CodeMirror](https://codemirror.net/)
- Math rendering by [KaTeX](https://katex.org/)
- Markdown parsing by [markdown-it](https://github.com/markdown-it/markdown-it)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 amotivv, inc.

## Contact

For any questions or support, please contact us at [ai@amotivv.com](mailto:ai@amotivv.com) or visit our [website](https://amotivv.com).
