import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResearchDraftOutline } from '../../lib/researchDraftOutline';
import { addResearchDraftToProject, generateResearchDraftOutline, generateSubsectionContent, updateResearchDraftReport } from '../../connectors/researchDraftIpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getResearchProject, listResearchProjects } from '@/connectors/researchProjectIpc';
import { getUserMetaData } from '@/connectors/userMetaDataIpc';
import { ResearchDraft } from '@/lib/researchDraft';
import { generateUID } from '@/lib/researchProject';
import { ReportGenerator } from '@/components/data/ReportGenerator';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import supportedLanguages from '../../../backend/default_settings/supported_languages.json';
import type { ResearchProject } from '@/lib/researchProject';
import { useReportGenerator } from '@/hooks/useReportGenerator';

export default function CreateDraftPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [outline, setOutline] = useState<ResearchDraftOutline>({ title: '', sections: [] });
  const [manualSectionTitle, setManualSectionTitle] = useState('');
  const [manualSubsections, setManualSubsections] = useState<string[]>([]);
  const [manualSubsectionInput, setManualSubsectionInput] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiLoading, setAiLoading] = useState(false);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const navigate = useNavigate();

  const {
    report,
    setReport,
    generating,
    allDone,
    handleGenerateReport,
    handleSaveReport,
  } = useReportGenerator({
    outline,
    draft,
    projectId,
    language: aiLanguage,
    navigate,
  });

  useEffect(() => {
    async function fetchLanguage() {
      try {
        const meta = await getUserMetaData('research_language');
        console.log('default language from meta:', meta.Value);
        if (meta && meta.Value) {
          setAiLanguage(meta.Value?.toLowerCase());
        }else{
          setAiLanguage('english');
        }
      } catch {}
    }
    fetchLanguage();

    // Load research projects
    listResearchProjects().then((data) => {
      setProjects(data || []);
    });
  }, []);

  useEffect(() => {
    if (!projectId) {
      toast.error('No project ID found');
      return;
    }
    async function fetchProject() {
      const project = await getResearchProject(projectId);
      setOutline({ title: project.title, sections: [] });
      setAiTopic(project.title);
    }
    fetchProject();
  }, [projectId]);

  // Manual outline handlers
  const addManualSection = () => {
    if (!manualSectionTitle.trim()) return;
    setOutline((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: manualSectionTitle, subsections: manualSubsections },
      ],
    }));
    setManualSectionTitle('');
    setManualSubsections([]);
    setManualSubsectionInput('');
  };
  const addManualSubsection = () => {
    if (!manualSubsectionInput.trim()) return;
    setManualSubsections((prev) => [...prev, manualSubsectionInput]);
    setManualSubsectionInput('');
  };
  const removeManualSubsection = (idx: number) => {
    setOutline((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };
  const removeManualSection = (idx: number) => {
    setOutline((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };

  // AI outline handler
  const handleGenerateAIOutline = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic.');
      return;
    }
    setAiLoading(true);
    try {
      // You may want to pass a projectId if needed
      const result = await generateResearchDraftOutline(aiTopic, aiLanguage);
      if (result && result.title && Array.isArray(result.sections)) {
        setOutline(result);
        toast.success('Outline generated!');
      } else {
        toast.error('Failed to generate outline.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating outline.');
    } finally {
      setAiLoading(false);
    }
  };

  const initiateDraftAndContinueToStep2 = async () => {
      console.log('Initiating draft and continuing to step 2');
      const draft: ResearchDraft = {
        uid: generateUID(),
        project_uid: projectId,
        title: outline.title,
        outline: outline,
        created_at: new Date().toISOString(),
      };
      setDraft(draft);
      const result = await addResearchDraftToProject(draft);
      if (result.success) {
        setStep(2);
      } else {
        toast.error('Failed to initiate draft.');
      }
  };

  return (
    <PageLayout>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 animate-enter"
    >
    <div className="max-w-3xl mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t('writing.createDraft.title')}</h1>
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold mb-2">{t('writing.createDraft.step1')}</h2>
            <Tabs defaultValue="ai" className="mb-4">
              <TabsList>
                <TabsTrigger value="ai">{t('writing.draft.aiAssist')}</TabsTrigger>
                <TabsTrigger value="manual">{t('writing.draft.manual')}</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <div className="mb-2">
                  <Label>{t('writing.createDraft.reportTitle')}</Label>
                  <Input
                    value={outline.title}
                    onChange={e => setOutline(o => ({ ...o, title: e.target.value }))}
                    placeholder={t('writing.createDraft.enterTitle')}
                  />
                </div>
                <div className="mb-2">
                  <Label>{t('writing.createDraft.sectionTitle')}</Label>
                  <Input
                    value={manualSectionTitle}
                    onChange={e => setManualSectionTitle(e.target.value)}
                    placeholder={t('writing.createDraft.enterSection')}
                  />
                </div>
                <div className="mb-2">
                  <Label>{t('writing.createDraft.subsections')}</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={manualSubsectionInput}
                      onChange={e => setManualSubsectionInput(e.target.value)}
                      placeholder={t('writing.createDraft.addSubsection')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualSubsection();
                        }
                      }}
                    />
                    <Button type="button" onClick={addManualSubsection} variant="outline">{t('writing.createDraft.add')}</Button>
                  </div>
                  <ul className="list-disc pl-5">
                    {manualSubsections.map((sub, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {sub}
                        <Button size="icon" variant="ghost" onClick={() => removeManualSubsection(idx)}>
                          &times;
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button type="button" onClick={addManualSection} className="mb-4">{t('writing.createDraft.addSection')}</Button>
                <div className="mb-4">
                  <Label>{t('writing.createDraft.currentOutline')}</Label>
                  <ul className="list-decimal pl-5">
                    {outline.sections.map((section, idx) => (
                      <li key={idx} className="mb-2">
                        <div className="flex items-center gap-2 font-semibold">
                          {section.title}
                          <Button size="icon" variant="ghost" onClick={() => removeManualSection(idx)}>&times;</Button>
                        </div>
                        <ul className="list-disc pl-5">
                          {section.subsections.map((sub, subIdx) => (
                            <li key={subIdx}>{sub}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="mb-2">
                  <Label>{t('writing.createDraft.topic')}</Label>
                  <Select
                    value={aiTopic}
                    onValueChange={(value) => {
                      setAiTopic(value);
                      setOutline(o => ({ ...o, title: value }));
                    }}
                  >
                    <SelectTrigger className="h-10 min-h-[2.5rem] max-h-10 overflow-hidden">
                      <SelectValue
                        placeholder={t('writing.createDraft.enterTopic')}
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.uid}
                          value={project.title}
                          title={project.title}
                          className="truncate"
                        >
                          {project.title.length > 100 ? project.title.slice(0, 100) + "..." : project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-2">
                  <Label>{t('writing.createDraft.language')}</Label>
                  <Select
                    value={aiLanguage}
                    onValueChange={(value) => setAiLanguage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('writing.createDraft.enterLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.languages.map(lang => (
                        <SelectItem key={lang.code} value={lang.name.toLowerCase()}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleGenerateAIOutline} disabled={aiLoading}>
                  {aiLoading ? t('writing.createDraft.generating') : t('writing.createDraft.generateOutline')}
                </Button>
                {outline.title && outline.sections.length > 0 && (
                  <div className="mt-4">
                    <Label>{t('writing.createDraft.generatedOutline')}</Label>
                      {/* <Label className="mb-2 font-semibold">{t('writing.createDraft.reportTitle')}: {outline.title}</Label> */}
                    <ul className="list-decimal pl-5">
                      {outline.sections.map((section, idx) => (
                        <li key={idx} className="mb-2">
                          <div className="font-semibold">{section.title}</div>
                          <ul className="list-disc pl-5">
                            {section.subsections.map((sub, subIdx) => (
                              <li key={subIdx}>{sub}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>{t('writing.createDraft.cancel')}</Button>
              <Button onClick={() => initiateDraftAndContinueToStep2()} disabled={!outline.title || outline.sections.length === 0}>
                {t('writing.createDraft.saveAndGenerate')}
              </Button>
            </div>
          </>
        )}
        {step === 2 && (
          <ReportGenerator
            outline={outline}
            report={report}
            generating={generating}
            allDone={allDone}
            handleGenerateReport={handleGenerateReport}
            handleSaveReport={handleSaveReport}
            footer={
              <Button onClick={() => setStep(1)} variant="outline" className="mt-4">{t('writing.createDraft.back')}</Button>
            }
          />
        )}
      </Card>
    </div>
    </motion.div>
    </PageLayout>
  );
}
