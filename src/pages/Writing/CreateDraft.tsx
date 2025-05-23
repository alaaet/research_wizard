import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResearchDraftOutline } from '../../lib/researchDraftOutline';
import { addResearchDraftToProject, generateResearchDraftOutline, generateSubsectionContent, updateResearchDraftReport } from '../../utils/researchDraftIpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getResearchProject } from '@/utils/researchProjectIpc';
import { getUserMetaData } from '@/utils/userMetaDataIpc';
import { ResearchDraft } from '@/lib/researchDraft';
import { generateUID } from '@/lib/researchProject';
import { ReportGenerator } from '@/components/data/ReportGenerator';

export default function CreateDraftPage() {
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
  const [report, setReport] = useState<{ [key: string]: { status: 'pending' | 'success' | 'error', content: string } }>({});
  const [generating, setGenerating] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLanguage() {
      try {
        const meta = await getUserMetaData('research_language');
        if (meta && meta.Value) {
          setAiLanguage(meta.Value);
        }
      } catch {}
    }
    fetchLanguage();
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

  // Step 2: Generate report content for each subsection
  const handleGenerateReport = async () => {
    setGenerating(true);
    setAllDone(false);
    const newReport: typeof report = {};
    for (const section of outline.sections) {
      for (const subsection of section.subsections) {
        const key = `${section.title}|||${subsection}`;
        setReport(r => ({ ...r, [key]: { status: 'pending', content: '' } }));
        try {
          const result = await generateSubsectionContent(
            projectId!,
            outline.title,
            section.title,
            subsection,
            aiLanguage
          );
          if (result && result.success && result.text) {
            console.log('Generated subsection content:', result.text);
            newReport[key] = { status: 'success', content: result.text };
            setReport(r => ({ ...r, [key]: { status: 'success', content: result.text } }));
          } else {
            newReport[key] = { status: 'error', content: '' };
            setReport(r => ({ ...r, [key]: { status: 'error', content: '' } }));
            toast.error('Failed to generate subsection content.');
            console.error('Failed to generate subsection content:', result);
          }
        } catch (err: any) {
          newReport[key] = { status: 'error', content: '' };
          setReport(r => ({ ...r, [key]: { status: 'error', content: '' } }));
          toast.error('Failed to generate subsection content.');
          console.error('Failed to generate subsection content:', err);
        }
      }
    }
    setGenerating(false);
    setAllDone(true);
  };

  // Save the report to the draft
  const handleSaveReport = async () => {
    const reportText = outline.sections.map(section => {
      const sectionText = section.subsections.map(subsection => {
        const key = `${section.title}|||${subsection}`;
        return `### ${subsection}\n${report[key]?.content || ''}`;
      }).join('\n\n');
      return `## ${section.title}\n${sectionText}`;
    }).join('\n\n');
    console.log('Report text:', reportText);
    const draftObj = {
        uid: draft?.uid,
        report: reportText,
    };
    const result = await updateResearchDraftReport(draftObj);
    if (result.success) {
      toast.success('Draft saved successfully!');
      navigate(-1);
    } else {
      toast.error('Failed to save draft.');
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
        <h1 className="text-2xl font-bold mb-4">Create Research Draft</h1>
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Step 1: Create Outline</h2>
            <Tabs defaultValue="ai" className="mb-4">
              <TabsList>
                <TabsTrigger value="ai">AI Assist</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <div className="mb-2">
                  <Label>Report Title</Label>
                  <Input
                    value={outline.title}
                    onChange={e => setOutline(o => ({ ...o, title: e.target.value }))}
                    placeholder="Enter report title"
                  />
                </div>
                <div className="mb-2">
                  <Label>Section Title</Label>
                  <Input
                    value={manualSectionTitle}
                    onChange={e => setManualSectionTitle(e.target.value)}
                    placeholder="Enter section title"
                  />
                </div>
                <div className="mb-2">
                  <Label>Subsections</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={manualSubsectionInput}
                      onChange={e => setManualSubsectionInput(e.target.value)}
                      placeholder="Add subsection"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualSubsection();
                        }
                      }}
                    />
                    <Button type="button" onClick={addManualSubsection} variant="outline">Add</Button>
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
                <Button type="button" onClick={addManualSection} className="mb-4">Add Section</Button>
                <div className="mb-4">
                  <Label>Current Outline</Label>
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
                  <Label>Topic</Label>
                  <Input
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="Enter research topic"
                  />
                </div>
                <div className="mb-2">
                  <Label>Language</Label>
                  <Input
                    value={aiLanguage}
                    onChange={e => setAiLanguage(e.target.value)}
                    placeholder="e.g. English"
                  />
                </div>
                <Button type="button" onClick={handleGenerateAIOutline} disabled={aiLoading}>
                  {aiLoading ? 'Generating...' : 'Generate Outline'}
                </Button>
                {outline.title && outline.sections.length > 0 && (
                  <div className="mt-4">
                    <Label>Generated Outline</Label>
                    <ul className="list-decimal pl-5">
                      <li className="mb-2 font-semibold">{outline.title}</li>
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
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button onClick={() => initiateDraftAndContinueToStep2()} disabled={!outline.title || outline.sections.length === 0}>Save & Generate Report</Button>
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
              <Button onClick={() => setStep(1)} variant="outline" className="mt-4">Back</Button>
            }
          />
        )}
      </Card>
    </div>
    </motion.div>
    </PageLayout>
  );
}
