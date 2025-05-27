import fs from 'fs';
import { dialog, app } from 'electron';
import path from 'path';
import { research_paper } from '../../src/lib/researchPaper';
import { ResearchDraft } from '../../src/lib/researchDraft';
import { getResearchDraft } from '../database';
import MarkdownIt from 'markdown-it';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import htmlToDocx from 'html-to-docx';
import puppeteer from 'puppeteer';

function toBibTeX(papers: research_paper[]): string {
  return papers.map(paper => `@article{${paper.uid || paper.title.replace(/\W/g, '')},
  title={${paper.title}},
  author={${paper.author}},
  year={${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}},
  url={${paper.url}},
  note={${paper.summary || ''}}
}`).join('\n\n');
}

function toEndNoteXML(papers: research_paper[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<xml>\n` +
    papers.map(paper => `  <record>\n    <ref-type name="Journal Article">17</ref-type>\n    <title>${paper.title}</title>\n    <authors>${paper.author}</authors>\n    <year>${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}</year>\n    <url>${paper.url}</url>\n    <notes>${paper.summary || ''}</notes>\n  </record>`).join('\n') +
    '\n</xml>';
}

function toRIS(papers: research_paper[]): string {
  return papers.map(paper => `TY  - JOUR\nTI  - ${paper.title}\nAU  - ${paper.author}\nPY  - ${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}\nUR  - ${paper.url}\nN1  - ${paper.summary || ''}\nER  -`).join('\n\n');
}

export async function exportLiteratureFile(format: string, papers: research_paper[]) {
  let content = '';
  let ext = '';
  let filterName = '';
  if (format === 'bibtex') {
    content = toBibTeX(papers);
    ext = 'bib';
    filterName = 'BibTeX';
  } else if (format === 'endnote') {
    content = toEndNoteXML(papers);
    ext = 'xml';
    filterName = 'EndNote XML';
  } else if (format === 'ris') {
    content = toRIS(papers);
    ext = 'ris';
    filterName = 'RIS';
  } else {
    throw new Error('Unsupported export format');
  }

  const { filePath } = await dialog.showSaveDialog({
    title: `Export Papers as ${filterName}`,
    defaultPath: path.join(app.getPath('documents'), `papers.${ext}`),
    filters: [
      { name: filterName, extensions: [ext] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, filePath };
  }
  return { success: false, error: 'Export cancelled' };
}

// Function to convert Markdown to HTML
const markdownToHtml = (markdown: string): string => {
    const md = new MarkdownIt();
    return md.render(markdown);
};

// Function to convert HTML to a DOCX Buffer using html-to-docx
const htmlToDocxBuffer = async (html: string): Promise<Buffer> => {
    // html-to-docx returns a Buffer
    return await htmlToDocx(html);
};

async function convertMarkdownToDocx(markdown: string): Promise<Buffer> {
    const html = markdownToHtml(markdown);
    return await htmlToDocxBuffer(html);
}

// Function to convert Markdown to PDF Buffer using puppeteer
async function convertMarkdownToPDF(markdown: string): Promise<Buffer> {
    const html = markdownToHtml(markdown);
    let browser;
    let page;
    
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-gpu-compositing',
                '--disable-gpu-rasterization',
                '--disable-gpu-sandbox',
                '--disable-software-rasterizer',
                '--disable-vsync',
                '--single-process'
            ]
        });

        // Create a new page directly
        page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });

        // Set a longer timeout for page load
        await page.setDefaultNavigationTimeout(60000);

        // Create a data URL from the HTML content
        const dataUrl = `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`;
        
        // Navigate to the data URL instead of using setContent
        await page.goto(dataUrl, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 60000
        });

        // Wait for the page to be fully loaded
        await page.waitForFunction(() => {
            return document.readyState === 'complete';
        }, { timeout: 60000 });

        // Add a small delay to ensure all resources are loaded
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate PDF with retry logic
        let retries = 3;
        let lastError;
        
        while (retries > 0) {
            try {
                const pdfUint8Array = await page.pdf({
                    format: 'A4',
                    margin: {
                        top: '1in',
                        right: '1in',
                        bottom: '1in',
                        left: '1in'
                    },
                    preferCSSPageSize: true,
                    printBackground: true,
                    timeout: 60000
                });
                return Buffer.from(pdfUint8Array);
            } catch (error) {
                lastError = error;
                retries--;
                if (retries > 0) {
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        throw lastError;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        // Close page first if it exists
        if (page) {
            try {
                await page.close().catch(() => {});
            } catch (closeError) {
                console.error('Error closing page:', closeError);
            }
        }
        
        // Then close browser if it exists
        if (browser) {
            try {
                await browser.close().catch(() => {});
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
    }
}

export async function exportDraftReportHelper(uid: string, format: 'md' | 'docs' | 'pdf') {
  // Fetch the draft
  const draft = (await getResearchDraft(uid)) as ResearchDraft;
  if (!draft || !draft.report) {
    throw new Error('Draft or report not found');
  }
  let content;
  let ext = '';
  let filterName = '';
  if (format === 'md') {
    content = draft.report;
    ext = 'md';
    filterName = 'Markdown';
  } else if (format === 'docs') {
    const buffer = await convertMarkdownToDocx(draft.report);
    content = buffer;
    ext = 'docx';
    filterName = 'Word Document';
  } else if (format === 'pdf') {
    const buffer = await convertMarkdownToPDF(draft.report);
    content = buffer;
    ext = 'pdf';
    filterName = 'PDF';
  } else {
    throw new Error('Unsupported export format');
  }

  const { filePath } = await dialog.showSaveDialog({
    title: `Export Report as ${filterName}`,
    defaultPath: path.join(app.getPath('documents'), `draft-${draft.title}-${Date.now()}.${ext}`),
    filters: [
      { name: filterName, extensions: [ext] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (filePath) {
    if (format === 'pdf' || format === 'docs') {
      fs.writeFileSync(filePath, content);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    return { success: true, filePath };
  }
  return { success: false, error: 'Export cancelled' };
}
