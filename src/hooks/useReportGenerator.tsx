import { useState } from 'react';
import { generateSubsectionContent, updateResearchDraftReport } from '@/connectors/researchDraftIpc';
import { listResources } from '@/connectors/resourceIpc';
import { ResearchDraft } from '@/lib/researchDraft';
import { ResearchDraftOutline } from '@/lib/researchDraftOutline';
import { Resource } from '@/lib/Resource';
import { toast } from 'sonner';

interface ReportStatus {
  status: 'pending' | 'success' | 'error';
  content: string;
}

interface UseReportGeneratorProps {
  outline: ResearchDraftOutline;
  draft: ResearchDraft | null;
  projectId: string | undefined;
  language: string;
  navigate?: (to: any) => void;
  initialReport?: { [key: string]: ReportStatus };
  setReport?: React.Dispatch<React.SetStateAction<{ [key: string]: ReportStatus }>>;
}

export function useReportGenerator({
  outline,
  draft,
  projectId,
  language,
  navigate,
  initialReport = {},
  setReport: externalSetReport,
}: UseReportGeneratorProps) {
  const [report, setReport] = useState<{ [key: string]: ReportStatus }>(initialReport);
  const [generating, setGenerating] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Use external setReport if provided (for controlled state)
  const setReportFn = externalSetReport || setReport;

  const handleGenerateReport = async () => {
    setGenerating(true);
    setAllDone(false);
    for (const section of outline.sections) {
      for (const subsection of section.subsections) {
        const key = `${section.title}|||${subsection}`;
        setReportFn(r => ({ ...r, [key]: { status: 'pending', content: '' } }));
        try {
          const result = await generateSubsectionContent(
            projectId!,
            outline.title,
            section.title,
            subsection,
            language
          );
          if (result && result.success && result.text) {
            setReportFn(r => ({ ...r, [key]: { status: 'success', content: result.text } }));
          } else {
            setReportFn(r => ({ ...r, [key]: { status: 'error', content: '' } }));
            toast.error('Failed to generate subsection content.');
            console.error('Failed to generate subsection content:', result);
          }
        } catch (err: any) {
          setReportFn(r => ({ ...r, [key]: { status: 'error', content: '' } }));
          toast.error('Failed to generate subsection content.');
          console.error('Failed to generate subsection content:', err);
        }
      }
    }
    setGenerating(false);
    setAllDone(true);
  };

  const handleSaveReport = async () => {
    try {
      if (!outline?.sections || !Array.isArray(outline.sections)) {
        throw new Error('Invalid outline structure: sections array is missing or invalid');
      }
      if (!draft?.uid) {
        throw new Error('Draft UID is missing');
      }
      // Compose report text
      const reportText = outline.sections.map(section => {
        if (!section.title || !Array.isArray(section.subsections)) {
          throw new Error(`Invalid section structure: missing title or subsections in section "${section.title || 'unnamed'}"`);
        }
        const sectionText = section.subsections.map(subsection => {
          if (!subsection) {
            throw new Error(`Invalid subsection in section "${section.title}": subsection is empty`);
          }
          const key = `${section.title}|||${subsection}`;
          const content = (externalSetReport ? initialReport : report)[key]?.content;
          if (!content) {
            console.warn(`Warning: No content found for subsection "${subsection}" in section "${section.title}"`);
          }
          return `### ${subsection}\n${content || ''}`;
        }).join('\n\n');
        return `## ${section.title}\n${sectionText}`;
      }).join('\n\n');
      // Fetch and format references
      let referencesText = '';
      if (draft.project_uid) {
        const resources: Resource[] = await listResources(draft.project_uid);
        if (resources && resources.length > 0) {
          referencesText = '\n\n## References\n';
          referencesText += resources.map((res, idx) => {
            const author = res.author || '';
            const year = res.publishedDate ? (typeof res.publishedDate === 'string' ? res.publishedDate.slice(0, 4) : '') : '';
            const title = res.title || '';
            const url = res.url || '';
            return `- [${idx + 1}] ${author}${year ? ` (${year})` : ''}. ${title}. [${url}](${url})`;
          }).join('\n\n');
        }
      }
      const fullReportText = reportText + referencesText;
      const draftObj = {
        uid: draft.uid,
        report: fullReportText,
      };
      const result = await updateResearchDraftReport(draftObj);
      if (result.success) {
        toast.success('Draft saved successfully!');
        if (navigate) navigate(-1);
      } else {
        throw new Error(result.error || 'Failed to save draft');
      }
    } catch (error: any) {
      console.error('Error in handleSaveReport:', error);
      toast.error(error.message || 'Failed to save draft');
    }
  };

  return {
    report: externalSetReport ? initialReport : report,
    setReport: setReportFn,
    generating,
    allDone,
    handleGenerateReport,
    handleSaveReport,
  };
} 