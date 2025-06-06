import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResearchDraft } from "../../lib/researchDraft";
import {
  getResearchDraft,
  updateResearchDraft,
  updateResearchDraftReport,
} from "../../connectors/researchDraftIpc";
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
import { generateSubsectionContent } from "../../connectors/researchDraftIpc";
import { Separator } from '@/components/ui/separator';
import { useTranslation } from "react-i18next";
import { useReportGenerator } from '@/hooks/useReportGenerator';

function OutlineEditor({
  outline,
  onChange,
}: {
  outline: ResearchDraftOutline;
  onChange: (o: ResearchDraftOutline) => void;
}) {
  const { t } = useTranslation();
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
      <div className="mt-2">
        <label className="block font-medium mb-1">{t('writing.draftDetail.form.addSection')}</label>
        <Input
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
          placeholder={t('writing.draftDetail.form.sectionTitle')}
        />
        <div className="flex gap-2 mt-2">
          <Input
            value={subsectionInput}
            onChange={(e) => setSubsectionInput(e.target.value)}
            placeholder={t('writing.draftDetail.form.addSubsection')}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubsection();
              }
            }}
          />
          <Button type="button" onClick={addSubsection} variant="outline">
            {t('writing.draftDetail.form.addSubsectionButton')}
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
          {t('writing.draftDetail.form.addSectionButton')}
        </Button>
      </div>
      <div className="mt-4">
        <Card className="mb-4 border-l-4 border-primary bg-muted/40 rounded-lg shadow-sm p-4">
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
  const { t } = useTranslation();
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

  // Use the hook for report regeneration
  const {
    report: regenReport,
    setReport: setRegenReport,
    generating: regenGenerating,
    allDone: regenAllDone,
    handleGenerateReport: handleRegenerateReport,
    handleSaveReport: handleSaveRegeneratedReport,
  } = useReportGenerator({
    outline: form.outline,
    draft,
    projectId: draft?.project_uid,
    language: 'English',
    navigate: () => {}, // No navigation on save in detail page
    initialReport: {},
    setReport: undefined,
  });

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getResearchDraft(uid)
      .then((d) => {
        if (!d) {
          setError(t('writing.draftDetail.error.notFound'));
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
        setError(t('writing.draftDetail.error.loadFailed'));
        setLoading(false);
      });
  }, [uid, t]);

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
        setError(result.error || t('writing.draftDetail.error.updateFailed'));
      }
    } catch (err) {
      setError(t('writing.draftDetail.error.updateFailed'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-8">{t('common.loading')}</div>
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
        <div className="p-8">{t('writing.draftDetail.error.notFound')}</div>
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
            title={t('writing.draftDetail.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {t('writing.draftDetail.title')}
          </h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              {t('writing.draftDetail.form.title')} <span className="text-red-500">*</span>
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
              {t('writing.draftDetail.form.outline')}
            </label>
            <OutlineEditor
              outline={form.outline}
              onChange={(outline) => setForm((f) => ({ ...f, outline }))}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              {t('writing.draftDetail.form.report')}
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
                    <Button onClick={() => setShowRegenerate(false)} variant="outline" className="mt-4">
                      {t('writing.draftDetail.form.cancel')}
                    </Button>
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
                      {t('writing.draftDetail.form.viewReport')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegenerate(true)}
                    >
                      {t('writing.draftDetail.form.regenerateReport')} <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? t('writing.draftDetail.form.saving') : t('writing.draftDetail.form.saveChanges')}
            </Button>
            {success && (
              <span className="text-green-600 self-center">{t('writing.draftDetail.form.saved')}</span>
            )}
            {error && <span className="text-red-500 self-center">{error}</span>}
          </div>
        </form>
        <div className="text-xs text-muted-foreground mt-4">
          {t('writing.draftDetail.form.created')}:{" "}
          {draft.created_at ? new Date(draft.created_at).toLocaleString() : ""}
        </div>
      </motion.div>
    </PageLayout>
  );
}
