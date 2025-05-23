import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResearchDraft } from "../../lib/researchDraft";
import {
  getResearchDraft,
  updateResearchDraft,
} from "../../utils/researchDraftIpc";
import { ResearchDraftOutline } from "../../lib/researchDraftOutline";
import PageLayout from "../../components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Card, CardFooter, CardContent } from "@/components/ui/card";
import { ReportGenerator } from '@/components/data/ReportGenerator';
import { toast } from 'sonner';
import { generateSubsectionContent } from "../../utils/researchDraftIpc";
import { Separator } from '@/components/ui/separator';

function OutlineEditor({
  outline,
  onChange,
}: {
  outline: ResearchDraftOutline;
  onChange: (o: ResearchDraftOutline) => void;
}) {
  // Simple outline editor for title and sections
  const [sectionTitle, setSectionTitle] = useState("");
  const [subsectionInput, setSubsectionInput] = useState("");
  const [subsections, setSubsections] = useState<string[]>([]);

  const addSection = () => {
    if (!sectionTitle.trim()) return;
    onChange({
      ...outline,
      sections: [...outline.sections, { title: sectionTitle, subsections }],
    });
    setSectionTitle("");
    setSubsections([]);
  };
  const addSubsection = () => {
    if (!subsectionInput.trim()) return;
    setSubsections((prev) => [...prev, subsectionInput]);
    setSubsectionInput("");
  };
  const removeSection = (idx: number) => {
    onChange({
      ...outline,
      sections: outline.sections.filter((_, i) => i !== idx),
    });
  };
  const removeSubsection = (idx: number) => {
    setSubsections((prev) => prev.filter((_, i) => i !== idx));
  };
  return (
    <div className="mb-4">
      {/* <label className="block font-medium mb-1">Outline Title</label>
      <Input
        value={outline.title}
        onChange={(e) => onChange({ ...outline, title: e.target.value })}
      /> */}
      <div className="mt-2">
        <label className="block font-medium mb-1">Add Section</label>
        <Input
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
          placeholder="Section title"
        />
        <div className="flex gap-2 mt-2">
          <Input
            value={subsectionInput}
            onChange={(e) => setSubsectionInput(e.target.value)}
            placeholder="Add subsection"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubsection();
              }
            }}
          />
          <Button type="button" onClick={addSubsection} variant="outline">
            Add Subsection
          </Button>
        </div>
        <ul className="list-disc pl-5 mt-2">
          {subsections.map((sub, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {sub}{" "}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSubsection(idx)}
              >
                &times;
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" onClick={addSection} className="mt-2">
          Add Section
        </Button>
      </div>
      <div className="mt-4">
        <Card className="mb-4 border-l-4 border-primary bg-muted/40 rounded-lg shadow-sm p-4">
          {/* <h3 className="font-serif text-lg font-bold mb-2 text-primary">Outline (Book Index)</h3> */}
          <ul className="list-none pl-6">
            {outline.sections.map((section, idx) => (
              <li key={idx} className="mb-2">
                <div className="flex items-center gap-2 font-semibold font-serif text-base">
                  {section.title}{" "}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSection(idx)}
                  >
                    &times;
                  </Button>
                </div>
                <ul className="list-disc pl-6 text-sm font-serif text-muted-foreground">
                  {section.subsections.map((sub, subIdx) => (
                    <li key={subIdx}>{sub}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function ResearchDraftDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [form, setForm] = useState({
    title: "",
    outline: { title: "", sections: [] } as ResearchDraftOutline,
    report: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  // Draft generation state for regeneration
  const [regenReport, setRegenReport] = useState<{ [key: string]: { status: 'pending' | 'success' | 'error', content: string } }>({});
  const [regenGenerating, setRegenGenerating] = useState(false);
  const [regenAllDone, setRegenAllDone] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getResearchDraft(uid)
      .then((d) => {
        if (!d) {
          setError("Draft not found.");
          setDraft(null);
        } else {
          setDraft(d);
          setForm({
            title: d.title,
            outline: d.outline,
            report: d.report || "",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load draft.");
        setLoading(false);
      });
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const updated = {
      ...draft,
      ...form,
    };
    try {
      const result = await updateResearchDraft(updated);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error || "Failed to update draft.");
      }
    } catch (err) {
      setError("Failed to update draft.");
    }
    setSaving(false);
  };

  // Handler for regeneration (reuse logic from CreateDraft)
  const handleRegenerateReport = async () => {
    setRegenGenerating(true);
    setRegenAllDone(false);
    const newReport: typeof regenReport = {};
    for (const section of form.outline.sections) {
      for (const subsection of section.subsections) {
        const key = `${section.title}|||${subsection}`;
        setRegenReport(r => ({ ...r, [key]: { status: 'pending', content: '' } }));
        try {
          const result = await generateSubsectionContent(
            draft!.project_uid,
            form.outline.title,
            section.title,
            subsection,
            'English' // or use a language selector if available
          );
          if (result && result.success && result.text) {
            console.log('Generated subsection content:', result.text);
            newReport[key] = { status: 'success', content: result.text };
            setRegenReport(r => ({ ...r, [key]: { status: 'success', content: result.text } }));
          } else {
            newReport[key] = { status: 'error', content: '' };
            setRegenReport(r => ({ ...r, [key]: { status: 'error', content: '' } }));
            toast.error('Failed to generate subsection content.');
            console.error('Failed to generate subsection content:', result);
          }
        } catch (err: any) {
          newReport[key] = { status: 'error', content: '' };
          setRegenReport(r => ({ ...r, [key]: { status: 'error', content: '' } }));
          toast.error('Failed to generate subsection content.');
          console.error('Failed to generate subsection content:', err);
        }
      }
    }
    setRegenGenerating(false);
    setRegenAllDone(true);
  };

  // Handler to save regenerated report
  const handleSaveRegeneratedReport = async () => {
    const reportText = form.outline.sections.map(section => {
      const sectionText = section.subsections.map(subsection => {
        const key = `${section.title}|||${subsection}`;
        return `### ${subsection}\n${regenReport[key]?.content || ''}`;
      }).join('\n\n');
      return `## ${section.title}\n${sectionText}`;
    }).join('\n\n');
    const draftObj = {
      ...draft,
      report: reportText,
    };
    const result = await updateResearchDraft(draftObj);
    if (result.success) {
      toast.success('Draft regenerated and saved!');
      setShowRegenerate(false);
      // Optionally, reload the draft
      getResearchDraft(uid!).then(d => setDraft(d));
    } else {
      toast.error('Failed to save regenerated draft.');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-8">Loading...</div>
      </PageLayout>
    );
  }
  if (error) {
    return (
      <PageLayout>
        <div className="p-8 text-red-500">{error}</div>
      </PageLayout>
    );
  }
  if (!draft) {
    return (
      <PageLayout>
        <div className="p-8">Draft not found.</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter mx-auto w-full"
      >
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate(-1)}
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            View/Edit Draft
          </h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              Outline
            </label>
            <OutlineEditor
              outline={form.outline}
              onChange={(outline) => setForm((f) => ({ ...f, outline }))}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              Report
            </label>
            <div className="mt-4">
              {showRegenerate ? (
                <ReportGenerator
                  outline={form.outline}
                  report={regenReport}
                  generating={regenGenerating}
                  allDone={regenAllDone}
                  handleGenerateReport={handleRegenerateReport}
                  handleSaveReport={handleSaveRegeneratedReport}
                  footer={
                    <Button onClick={() => setShowRegenerate(false)} variant="outline" className="mt-4">Cancel</Button>
                  }
                />
              ) : (
                <Card className="p-2 mb-4">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="prose prose-sm max-w-none text-muted-foreground mt-1 line-clamp-6 max-h-40 overflow-hidden">
                        <ReactMarkdown>{draft?.report?.slice(0, 500) || ""}</ReactMarkdown>
                      </div>
                      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-white/90 to-transparent" />
                    </div>
                  </CardContent>
                  <Separator className="my-2" />
                  <CardFooter className="flex justify-end gap-2 pt-2 pb-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/writing/draft/${uid}/report`)}
                    >
                      View Report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegenerate(true)}
                    >
                      Regenerate Report <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {success && (
              <span className="text-green-600 self-center">Saved!</span>
            )}
            {error && <span className="text-red-500 self-center">{error}</span>}
          </div>
        </form>
        <div className="text-xs text-muted-foreground mt-4">
          Created:{" "}
          {draft.created_at ? new Date(draft.created_at).toLocaleString() : ""}
        </div>
      </motion.div>
    </PageLayout>
  );
}
