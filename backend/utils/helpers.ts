import fs from 'fs';
import { dialog, app } from 'electron';
import path from 'path';
import { research_paper } from '../../src/lib/researchPaper';
import { ResearchDraft } from '../../src/lib/researchDraft';
import { getResearchDraft } from '../database';
import MarkdownIt from 'markdown-it';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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

// Function to convert HTML to a DOCX Document (basic approach)
const htmlToDocx = (html: string): Document => {
    const paragraphs: Paragraph[] = html
        .split(/<\/p>|<br\s*\/?>/i) // Split by paragraph or line break
        .map(line => new Paragraph({ children: [new TextRun(line.replace(/<[^>]*>/g, ''))] })); // Remove HTML tags

    return new Document({ sections: [{ properties: {}, children: paragraphs }] });
};


function convertMarkdownToDocx(markdown: string): Document {
    const html = markdownToHtml(markdown);
    const doc = htmlToDocx(html);
    return doc
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
    const doc = convertMarkdownToDocx(draft.report);
    const buffer = await Packer.toBuffer(doc);
    content = buffer;
    ext = 'docx';
    filterName = 'Word Document';
  } else if (format === 'pdf') {
    // Placeholder: save as .pdf with plain text (real implementation would use a PDF library)
    content = draft.report;
    ext = 'pdf';
    filterName = 'PDF';
  } else {
    throw new Error('Unsupported export format');
  }

  const { filePath } = await dialog.showSaveDialog({
    title: `Export Report as ${filterName}`,
    defaultPath: path.join(app.getPath('documents'), `report.${ext}`),
    filters: [
      { name: filterName, extensions: [ext] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (filePath) {
    if (format === 'pdf') {
      // TODO: Use a real markdown-to-pdf library for proper export
      fs.writeFileSync(filePath, content, 'utf8');
    } else if (format === 'docs') {
      fs.writeFileSync(filePath, content);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    return { success: true, filePath };
  }
  return { success: false, error: 'Export cancelled' };
}
