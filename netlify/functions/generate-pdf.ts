import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { convert } from 'mdpdf';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

interface PDFOptions {
  paperSize: 'a4' | 'letter' | 'legal';
  margins: 'narrow' | 'normal' | 'wide';
  includeToC: boolean;
  pageNumbers: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Create temporary files for input and output
  const tempDir = tmpdir();
  const inputPath = join(tempDir, 'input.md');
  const outputPath = join(tempDir, 'output.pdf');

  try {
    // Parse and validate request body
    if (!event.body) {
      const response: HandlerResponse = {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      return response;
    }

    const body = JSON.parse(event.body);
    if (!body.markdown || !body.options) {
      const response: HandlerResponse = {
        statusCode: 400,
        body: JSON.stringify({ error: 'markdown and options are required' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      return response;
    }

    const { markdown, options } = body as { markdown: string; options: PDFOptions };

    // Convert margins to size values
    const margin = options.margins === 'narrow' ? '15mm' : options.margins === 'wide' ? '25mm' : '20mm';

    // Fix image paths to be absolute URLs
    const fixedMarkdown = markdown.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, alt, path) => {
        if (path.startsWith('http')) {
          return match;
        }
        // Convert relative paths to absolute URLs
        return `![${alt}](${process.env.URL}/${path.replace(/^\//, '')})`;
      }
    );

    // Write markdown to temporary file
    await writeFile(inputPath, fixedMarkdown);

    // Header template for page numbers
    const header = options.pageNumbers ? `
      <div style="
        font-family: system-ui;
        font-size: 10px;
        padding: 0 25mm;
        width: 100%;
        margin: 0;
        position: relative;
        background-color: #F8F8F8;
        border-bottom: 1px solid #E5E7EB;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 15mm;
      ">
        <span class="pageNumber"></span>
      </div>
    ` : '';

    // Footer template for page numbers
    const footer = options.pageNumbers ? `
      <div style="
        font-family: system-ui;
        font-size: 10px;
        padding: 0 25mm;
        width: 100%;
        margin: 0;
        position: relative;
        background-color: #F8F8F8;
        border-top: 1px solid #E5E7EB;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 15mm;
      ">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    ` : '';

    // Configure mdpdf options
    const mdpdfOptions = {
      source: inputPath,
      destination: outputPath,
      ghStyle: true,
      defaultStyle: true,
      header: options.pageNumbers ? header : undefined,
      footer: options.pageNumbers ? footer : undefined,
      pdf: {
        format: options.paperSize.toLowerCase(),
        orientation: 'portrait',
        border: {
          top: margin,
          right: margin,
          bottom: margin,
          left: margin
        }
      }
    };

    // Generate PDF
    await convert(mdpdfOptions);

    // Read the generated PDF
    const pdfContent = await readFile(outputPath);

    // Clean up temporary files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);

    const response: HandlerResponse = {
      statusCode: 200,
      body: pdfContent.toString('base64'),
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Cache-Control': 'no-cache'
      }
    };
    return response;
  } catch (error) {
    console.error('PDF Generation Error:', error);

    // Clean up temporary files in case of error
    if (inputPath) {
      await unlink(inputPath).catch(() => {});
    }
    if (outputPath) {
      await unlink(outputPath).catch(() => {});
    }

    const response: HandlerResponse = {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    return response;
  }
};
