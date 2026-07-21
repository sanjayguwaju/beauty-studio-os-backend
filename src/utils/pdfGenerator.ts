import puppeteer, { PaperFormat } from 'puppeteer';

export interface PDFOptions {
  format?: PaperFormat;
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
}

/**
 * Generate a PDF Buffer from an HTML string using Puppeteer
 * @param html The HTML string to render
 * @param options PDF formatting options (e.g., A4, landscape)
 * @returns Buffer containing the generated PDF
 */
export const generatePdfFromHtml = async (
  html: string,
  options: PDFOptions = { format: 'A4', printBackground: true }
): Promise<Buffer> => {
  let browser;
  try {
    // Launch headless Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set the HTML content
    // waitUntil: 'networkidle0' ensures fonts and images are fully loaded before printing
    await page.setContent(html, { waitUntil: 'load' });

    // Emulate media type screen for accurate colors/backgrounds
    await page.emulateMediaType('screen');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format,
      landscape: options.landscape,
      margin: options.margin || { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: options.printBackground,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Failed to generate PDF document');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
