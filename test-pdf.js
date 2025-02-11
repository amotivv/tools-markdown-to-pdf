import { convert } from 'mdpdf';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPdfGeneration() {
  try {
    const inputPath = join(__dirname, 'test.md');
    const outputPath = join(__dirname, 'test-output.pdf');

    // Configure mdpdf options
    const options = {
      source: inputPath,
      destination: outputPath,
      ghStyle: true,
      defaultStyle: true,
      debug: 'debug.html',
      pdf: {
        format: 'a4',
        orientation: 'portrait',
        border: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      }
    };

    // Generate PDF
    const pdfPath = await convert(options);
    console.log('PDF generated successfully:', pdfPath);
  } catch (error) {
    console.error('PDF Generation Error:', error);
  }
}

testPdfGeneration();
