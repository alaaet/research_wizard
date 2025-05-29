import fs from 'fs';
import { dialog, app, shell } from 'electron';
import path from 'path';
import { Resource } from '../../src/lib/Resource';
import { ResearchDraft } from '../../src/lib/researchDraft';
import { getResearchDraft } from '../database';
import MarkdownIt from 'markdown-it';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import htmlToDocx from 'html-to-docx';
import pdf from 'html-pdf';
import { CreateOptions } from 'html-pdf';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

function toBibTeX(papers: Resource[]): string {
  return papers.map(paper => `@article{${paper.uid || paper.title.replace(/\W/g, '')},
  title={${paper.title}},
  author={${paper.author}},
  year={${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}},
  url={${paper.url}},
  note={${paper.summary || ''}}
}`).join('\n\n');
}

function toEndNoteXML(papers: Resource[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<xml>\n` +
    papers.map(paper => `  <record>\n    <ref-type name="Journal Article">17</ref-type>\n    <title>${paper.title}</title>\n    <authors>${paper.author}</authors>\n    <year>${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}</year>\n    <url>${paper.url}</url>\n    <notes>${paper.summary || ''}</notes>\n  </record>`).join('\n') +
    '\n</xml>';
}

function toRIS(papers: Resource[]): string {
  return papers.map(paper => `TY  - JOUR\nTI  - ${paper.title}\nAU  - ${paper.author}\nPY  - ${paper.publishedDate ? new Date(paper.publishedDate).getFullYear() : ''}\nUR  - ${paper.url}\nN1  - ${paper.summary || ''}\nER  -`).join('\n\n');
}

export async function exportLiteratureFile(format: string, papers: Resource[]) {
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

// Function to convert Markdown to PDF Buffer using html-pdf
async function convertMarkdownToPDF(markdown: string): Promise<Buffer> {
    const html = markdownToHtml(markdown);
    
    return new Promise((resolve, reject) => {
        const options: CreateOptions = {
            format: 'A4',
            border: {
                top: '1in',
                right: '1in',
                bottom: '1in',
                left: '1in'
            },
            type: 'pdf',
            quality: '100',
            timeout: 60000,
            phantomPath: require('phantomjs-prebuilt').path
        };

        pdf.create(html, options).toBuffer((err: Error | null, buffer: Buffer) => {
            if (err) {
                console.error('Error generating PDF:', err);
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });
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
    
    // Open the file with the default system application
    try {
      await shell.openPath(filePath);
    } catch (error) {
      console.error('Error opening file:', error);
    }
    
    return { success: true, filePath };
  }
  return { success: false, error: 'Export cancelled' };
}

// Extract Resource from PDF file
export async function extractResourceFromPDF(filePath: string): Promise<Resource> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  const info = data.info || {};
  return {
    uid: filePath,
    title: typeof (info as any)?.Title === 'string' && (info as any).Title.trim()
      ? (info as any).Title
      : (filePath && path.basename(filePath)) || 'Untitled',
    url: filePath,
    summary: data.text ? data.text.substring(0, 500) : null,
    publishedDate: typeof (info as any)?.CreationDate === 'string' ? (info as any).CreationDate : null,
    author: typeof (info as any)?.Author === 'string' ? (info as any).Author : null,
    resource_type: 'local_file',
  };
}

// Extract Resource from DOCX file
export async function extractResourceFromDocx(filePath: string): Promise<Resource> {
  const data = await mammoth.extractRawText({ path: filePath });
  // Try to infer title/author from the first lines
  const lines = data.value.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    uid: filePath,
    title: lines[0] || path.basename(filePath),
    url: filePath,
    summary: data.value.substring(0, 500),
    publishedDate: null,
    author: lines[1] || null,
    resource_type: 'local_file',
  };
}

// Extract Resource from TXT file
export async function extractResourceFromTxt(filePath: string): Promise<Resource> {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    uid: filePath,
    title: lines[0] || path.basename(filePath),
    url: filePath,
    summary: content.substring(0, 500),
    publishedDate: null,
    author: lines[1] || null,
    resource_type: 'local_file',
  };
}

// Extract Resource from a URL (web page)
export async function extractResourceFromUrl(url: string): Promise<Resource> {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const title = $('title').text() || url;
  const author = $('meta[name="author"]').attr('content') || null;
  const date = $('meta[name="date"]').attr('content') || $('meta[property="article:published_time"]').attr('content') || null;
  const summary = $('meta[name="description"]').attr('content') || $('p').first().text() || null;
  return {
    uid: url,
    title,
    url,
    summary,
    publishedDate: date,
    author,
    resource_type: 'url',
  };
}
