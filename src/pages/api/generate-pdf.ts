import type { APIRoute } from 'astro';
import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.markdown || !body.options) {
      return new Response(
        JSON.stringify({ error: 'markdown and options are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { markdown, options } = body;
    
    // Convert markdown to HTML
    const html = md.render(markdown);
    
    // Enhanced table styles
    const tableStyles = `
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        page-break-inside: avoid;
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
        vertical-align: top;
      }
      tr:nth-child(even) {
        background: #FAFAFA;
      }
    `;

    // Create PDF template with proper styling
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            ${tableStyles}
            body {
              font-family: 'IBM Plex Mono', monospace;
              line-height: 1.6;
              color: #111111;
              padding: ${options.margins === 'narrow' ? '0.5in' : options.margins === 'wide' ? '1.5in' : '1in'};
              max-width: 100%;
              box-sizing: border-box;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #111111;
              font-weight: 500;
              margin-top: 2em;
              margin-bottom: 1em;
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
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            th, td {
              border: 1px solid #E5E5E5;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #F8F8F8;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            a {
              color: #4D7EFF;
              text-decoration: none;
            }
            blockquote {
              border-left: 4px solid rgba(77, 126, 255, 0.2);
              margin: 0;
              padding-left: 1em;
              color: #333333;
            }
            #toc {
              background: #F8F8F8;
              padding: 1em 2em;
              border-radius: 4px;
              margin-bottom: 2em;
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
          ${options.includeToC ? '<div id="toc"></div>' : ''}
          ${html}
        </body>
      </html>
    `;

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for network idle
    await page.setContent(template, {
      waitUntil: 'networkidle0'
    });
    
    // Generate table of contents if requested
    if (options.includeToC) {
      await page.evaluate(() => {
        const toc = document.getElementById('toc');
        if (!toc) return;

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const tocHtml = ['<h2>Table of Contents</h2>', '<ul>'];
        
        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName[1]);
          const text = heading.textContent || '';
          const id = `heading-${index}`;
          heading.id = id;
          
          tocHtml.push(
            `<li style="margin-left: ${(level - 1) * 1.5}em">` +
            `<a href="#${id}">${text}</a>` +
            '</li>'
          );
        });
        
        tocHtml.push('</ul>');
        toc.innerHTML = tocHtml.join('');
      });
    }

    // Set PDF metadata if provided
    if (options.metadata) {
      await page.evaluate((metadata) => {
        const metaTags = [
          { name: 'title', content: metadata.title },
          { name: 'author', content: metadata.author },
          { name: 'subject', content: metadata.subject },
          { name: 'keywords', content: metadata.keywords.join(', ') }
        ];
        
        metaTags.forEach(({ name, content }) => {
          if (content) {
            const meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
          }
        });
      }, options.metadata);
    }

    // Generate PDF with proper configuration
    const pdf = await page.pdf({
      format: options.paperSize as 'a4' | 'letter' | 'legal',
      printBackground: true,
      displayHeaderFooter: options.pageNumbers,
      headerTemplate: options.pageNumbers ? `
        <div style="font-size: 10px; text-align: right; width: 100%; padding: 0 0.5in; font-family: 'IBM Plex Mono';">
          <span class="pageNumber"></span>
        </div>
      ` : '',
      footerTemplate: options.pageNumbers ? `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 0 0.5in; font-family: 'IBM Plex Mono';">
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

    console.log('PDF generated successfully');
    await browser.close();

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"'
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
