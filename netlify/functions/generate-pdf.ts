import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';

// Using require since types are not properly exported
const { mdToPdf } = require('md-to-pdf');

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
  try {
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const body = JSON.parse(event.body);
    if (!body.markdown || !body.options) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'markdown and options are required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const { markdown, options } = body as { markdown: string; options: PDFOptions };

    // Convert margins to CSS values
    const margin = options.margins === 'narrow' ? '1cm' : options.margins === 'wide' ? '2cm' : '1.5cm';
    
    // Add front matter for configuration
    const frontMatter = [
      '---',
      `title: ${options.metadata?.title || ''}`,
      `author: ${options.metadata?.author || ''}`,
      'pdf_options:',
      `  format: ${options.paperSize.toLowerCase()}`,
      '  margin: 35mm 25mm 30mm',
      '  printBackground: true',
      '  displayHeaderFooter: true',
      options.pageNumbers ? [
        '  headerTemplate: |',
        '    <style>',
        '      section {',
        '        position: relative;',
        '        margin: 0 auto;',
        '        font-family: system-ui;',
        '        font-size: 11px;',
        '        padding: 10mm 25mm;',
        '        width: 100%;',
        '        -webkit-print-color-adjust: exact;',
        '        background-color: #F8F8F8;',
        '        border-bottom: 1px solid #E5E7EB;',
        '      }',
        '    </style>',
        '    <section>',
        '      <span class="pageNumber"></span>',
        '    </section>',
        '  footerTemplate: |',
        '    <style>',
        '      section {',
        '        position: relative;',
        '        margin: 0 auto;',
        '        font-family: system-ui;',
        '        font-size: 11px;',
        '        padding: 10mm 25mm;',
        '        width: 100%;',
        '        -webkit-print-color-adjust: exact;',
        '        background-color: #F8F8F8;',
        '        border-top: 1px solid #E5E7EB;',
        '      }',
        '    </style>',
        '    <section>',
        '      <div style="text-align: center;">',
        '        Page <span class="pageNumber"></span>',
        '        of <span class="totalPages"></span>',
        '      </div>',
        '    </section>'
      ].join('\n') : '',
      'stylesheet: |',
      '  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");',
      '  body {',
      '    font-family: "Inter", system-ui, -apple-system, sans-serif;',
      '    line-height: 1.6;',
      '    max-width: 100%;',
      '    margin: 0 auto;',
      '    padding: 0;',
      '  }',
      '  h1, h2, h3 {',
      '    margin-top: 2em;',
      '    margin-bottom: 1em;',
      '    font-weight: 600;',
      '    color: #111827;',
      '    page-break-after: avoid;',
      '    break-after: avoid;',
      '  }',
      '  pre {',
      '    background: #f3f4f6;',
      '    padding: 1em;',
      '    border-radius: 6px;',
      '    overflow-x: auto;',
      '    page-break-inside: avoid;',
      '    break-inside: avoid;',
      '  }',
      '  code {',
      '    font-family: "IBM Plex Mono", Consolas, monospace;',
      '    font-size: 0.9em;',
      '  }',
      '  table {',
      '    width: 100%;',
      '    border-collapse: collapse;',
      '    margin: 2em 0;',
      '    page-break-inside: avoid;',
      '    break-inside: avoid;',
      '  }',
      '  th, td {',
      '    border: 1px solid #e5e7eb;',
      '    padding: 0.75em 1em;',
      '  }',
      '  th {',
      '    background: #f9fafb;',
      '    font-weight: 600;',
      '  }',
      '  img {',
      '    max-width: 100%;',
      '    height: auto;',
      '    border-radius: 6px;',
      '    page-break-inside: avoid;',
      '    break-inside: avoid;',
      '  }',
      '  blockquote {',
      '    border-left: 4px solid #e5e7eb;',
      '    margin: 1.5em 0;',
      '    padding: 0.5em 1em;',
      '    color: #4b5563;',
      '    page-break-inside: avoid;',
      '    break-inside: avoid;',
      '  }',
      '  .page-break {',
      '    page-break-before: always;',
      '    break-before: page;',
      '  }',
      options.includeToC ? [
        'toc: true',
        'toc_depth: 3',
        'toc_title: Table of Contents'
      ].join('\n') : '',
      '---\n'
    ].filter(Boolean).join('\n');

    // Generate PDF using md-to-pdf
    // Add page breaks between major sections only
    const enhancedMarkdown = markdown.replace(/\n# /g, '\n<div class="page-break"></div>\n# ');
    const pdf = await mdToPdf({ content: frontMatter + enhancedMarkdown }, { dest: undefined });

    if (!pdf) {
      throw new Error('Failed to generate PDF');
    }

    return {
      statusCode: 200,
      body: pdf.toString('base64'),
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
        'Cache-Control': 'no-cache'
      }
    };
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error)
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    } as HandlerResponse;
  }
};
