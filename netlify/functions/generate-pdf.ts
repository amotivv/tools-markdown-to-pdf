import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';
import MarkdownIt from 'markdown-it';

interface Metadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

interface PDFOptions {
  paperSize: 'a4' | 'letter' | 'legal';
  margins: 'narrow' | 'normal' | 'wide';
  includeToC: boolean;
  pageNumbers: boolean;
  metadata?: Metadata;
}

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Process markdown and generate HTML with table of contents
function processMarkdown(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  let headingIndex = 0;

  // Add IDs to headings during rendering
  const defaultRender = md.renderer.rules.heading_open || 
    ((tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options));

  md.renderer.rules.heading_open = function(tokens: any[], idx: number, options: any, env: any, self: any) {
    const token = tokens[idx];
    const nextToken = tokens[idx + 1];
    const id = `heading-${headingIndex}`;
    
    if (nextToken && nextToken.type === 'inline') {
      const level = parseInt(token.tag.slice(1));
      const text = nextToken.content;
      headings.push({ level, text, id });
      headingIndex++;
    }
    
    if (!token.attrs) {
      token.attrs = [];
    }
    token.attrs.push(['id', id]);
    
    return defaultRender(tokens, idx, options, env, self);
  };

  // Convert markdown to HTML
  const html = md.render(markdown);
  
  return { html, headings };
}

export const handler: Handler = async (event: HandlerEvent) => {
  try {
    // Parse and validate request body
    if (!event.body) {
      const response: HandlerResponse = {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
      return response;
    }

    const body = JSON.parse(event.body);
    if (!body.markdown || !body.options) {
      const response: HandlerResponse = {
        statusCode: 400,
        body: JSON.stringify({ error: 'markdown and options are required' }),
        headers: { 'Content-Type': 'application/json' }
      };
      return response;
    }

    const { markdown, options } = body as { markdown: string; options: PDFOptions };
    
    // Process markdown and generate HTML with table of contents
    const { html, headings } = processMarkdown(markdown);
    
    // Generate table of contents if requested
    const tocHtml = options.includeToC ? `
      <div id="toc">
        <h2>Table of Contents</h2>
        <ul>
          ${headings.map(({ level, text, id }) => `
            <li style="margin-left: ${(level - 1) * 1.5}em">
              <a href="#${id}">${text}</a>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';
    
    // Add metadata tags if provided
    const metadataTags = options.metadata ? `
      <meta name="title" content="${options.metadata.title || ''}">
      <meta name="author" content="${options.metadata.author || ''}">
      <meta name="subject" content="${options.metadata.subject || ''}">
      <meta name="keywords" content="${options.metadata.keywords?.join(', ') || ''}">
    ` : '';

    // Create PDF template with proper styling
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${metadataTags}
          <style>
            @font-face {
              font-family: 'IBM Plex Mono';
              src: url('https://fonts.gstatic.com/s/ibmplexmono/v19/zYX9KVElMYYaJe8bpLHnCwDKjXr8AIFsdP3pBms.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
            }
            @font-face {
              font-family: 'IBM Plex Mono';
              src: url('https://fonts.gstatic.com/s/ibmplexmono/v19/zYX9KVElMYYaJe8bpLHnCwDKjWr7AIFsdP3pBms.woff2') format('woff2');
              font-weight: 500;
              font-style: normal;
            }
            @font-face {
              font-family: 'IBM Plex Mono';
              src: url('https://fonts.gstatic.com/s/ibmplexmono/v19/zYX9KVElMYYaJe8bpLHnCwDKjQ76AIFsdP3pBms.woff2') format('woff2');
              font-weight: 600;
              font-style: normal;
            }
            body {
              font-family: 'IBM Plex Mono', monospace;
              line-height: 1.6;
              color: #111111;
              padding: ${options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in'};
              max-width: 100%;
              box-sizing: border-box;
            }

            /* Improved page break controls */
            h1, h2, h3 {
              color: #111111;
              font-weight: 500;
              margin-top: 3rem;
              margin-bottom: 1.5rem;
              page-break-after: avoid;
              page-break-inside: avoid;
              border-bottom: 1px solid #E5E5E5;
              padding-bottom: 0.5rem;
            }

            h4, h5, h6 {
              color: #111111;
              font-weight: 500;
              margin-top: 2rem;
              margin-bottom: 1rem;
              page-break-after: avoid;
            }

            /* Content spacing and breaks */
            p, ul, ol {
              orphans: 3;
              widows: 3;
              margin-bottom: 1.5rem;
            }

            section, article {
              page-break-inside: avoid;
              margin-bottom: 2rem;
            }
            h1 { font-size: 2.5em; }
            h2 { font-size: 2em; }
            h3 { font-size: 1.75em; }
            h4 { font-size: 1.5em; }
            h5 { font-size: 1.25em; }
            h6 { font-size: 1em; }
            pre {
              background: #F8F8F8;
              padding: 1em;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.9em;
            }
            code {
              font-family: 'IBM Plex Mono', monospace;
              background: #F8F8F8;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 0.9em;
            }
            /* Table improvements */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 2rem 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Ensure table headers repeat on new pages */
            thead {
              display: table-header-group;
            }
            
            /* Keep table footers with their tables */
            tfoot {
              display: table-footer-group;
            }
            th {
              background: #F8F8F8;
              font-weight: 600;
              text-align: left;
              border: 1px solid #E5E5E5;
              padding: 12px;
            }
            td {
              border: 1px solid #E5E5E5;
              padding: 12px;
              text-align: left;
            }
            tr:nth-child(even) {
              background: #FAFAFA;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            a {
              color: #4D7EFF;
              text-decoration: none;
            }
            /* Improved blockquotes */
            blockquote {
              border-left: 4px solid rgba(77, 126, 255, 0.2);
              margin: 2rem 0;
              padding: 1rem 0 1rem 1.5rem;
              color: #333333;
              page-break-inside: avoid;
              background: rgba(77, 126, 255, 0.05);
              border-radius: 0 4px 4px 0;
            }
            /* Table of Contents improvements */
            #toc {
              background: #F8F8F8;
              padding: 1.5rem 2rem;
              border-radius: 4px;
              margin: 0 0 3rem 0;
              page-break-after: always;
              border: 1px solid #E5E5E5;
            }
            #toc h2 {
              margin-top: 0;
            }
            #toc ul {
              list-style-type: none;
              padding-left: 0;
            }
            #toc ul ul {
              padding-left: 1.5em;
            }
            #toc a {
              color: #333333;
              text-decoration: none;
              line-height: 1.8;
            }
            @page {
              margin: 0;
              size: ${options.paperSize};
            }
          </style>
        </head>
        <body>
          ${tocHtml}
          ${html}
        </body>
      </html>
    `;

    // Configure Chromium for serverless
    chromium.setGraphicsMode = false;
    
    // Initialize browser with serverless Chrome
    const executablePath = await chromium.executablePath();
    const browser = await puppeteerCore.launch({
      executablePath,
      args: [
        ...chromium.args,
        '--disable-web-security',
        '--font-render-hinting=none',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1200,
        height: 800,
        deviceScaleFactor: 1
      },
      headless: true
    });
    
    const page = await browser.newPage() as any;
    await page.setContent(template, {
      waitUntil: ['load', 'networkidle0']
    });

    // Ensure content is ready
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else {
          window.addEventListener('load', () => resolve(true));
        }
      });
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: options.paperSize,
      printBackground: true,
      displayHeaderFooter: options.pageNumbers,
      headerTemplate: options.pageNumbers ? `
        <div style="
          font-size: 10px;
          text-align: right;
          width: 100%;
          padding: 0.25in 0.5in;
          font-family: 'IBM Plex Mono';
          border-bottom: 1px solid #E5E5E5;
          margin-bottom: 0.25in;
          background-color: #F8F8F8;
        ">
          <span class="pageNumber"></span>
        </div>
      ` : '',
      footerTemplate: options.pageNumbers ? `
        <div style="
          font-size: 10px;
          text-align: center;
          width: 100%;
          padding: 0.25in 0.5in;
          font-family: 'IBM Plex Mono';
          border-top: 1px solid #E5E5E5;
          margin-top: 0.25in;
          background-color: #F8F8F8;
        ">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      ` : '',
      margin: {
        top: options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in',
        bottom: options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in',
        left: options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in',
        right: options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in'
      }
    });

    await browser.close();

    const response: HandlerResponse = {
      statusCode: 200,
      body: Buffer.from(pdf).toString('base64'),
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
    const response: HandlerResponse = {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    return response;
  }
};
