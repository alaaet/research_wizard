import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { ResearchDraftOutline } from '../../lib/researchDraftOutline';
import { useTranslation } from 'react-i18next';

export type ReportGeneratorProps = {
  outline: ResearchDraftOutline,
  report: { [key: string]: { status: 'pending' | 'success' | 'error', content: string } },
  generating: boolean,
  allDone: boolean,
  handleGenerateReport: () => void,
  handleSaveReport: () => void,
  footer?: React.ReactNode,
};

export function ReportGenerator({
  outline,
  report,
  generating,
  allDone,
  handleGenerateReport,
  handleSaveReport,
  footer,
}: ReportGeneratorProps): React.ReactElement {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{t('writing.draft.step2')}</h2>
      <Button onClick={handleGenerateReport} disabled={generating || Object.keys(report).length > 0} className="mb-4">
        {generating ? t('writing.draft.generating') : t('writing.draft.generateOutline')}
      </Button>
      <div className="space-y-4">
        {outline.sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-4">
            <div className="font-semibold text-lg mb-2">{section.title}</div>
            <ul className="space-y-2">
              {section.subsections.map((sub, subIdx) => {
                const key = `${section.title}|||${sub}`;
                const status = report[key]?.status;
                return (
                  <li key={subIdx} className="flex items-center gap-2">
                    <span>{sub}</span>
                    {status === 'success' && <CheckCircle className="text-green-500 w-5 h-5" />}
                    {status === 'error' && <XCircle className="text-red-500 w-5 h-5" />}
                    {status === 'pending' && <span className="text-yellow-500">...</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {allDone && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveReport} variant="default">{t('writing.draft.saveChanges')}</Button>
        </div>
      )}
      {footer}
    </div>
  );
}

export default ReportGenerator;
