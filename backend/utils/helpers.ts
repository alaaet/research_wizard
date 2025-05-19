import fs from 'fs';
import { dialog, app } from 'electron';
import path from 'path';
import { research_paper } from '../../src/lib/researchPaper';

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
