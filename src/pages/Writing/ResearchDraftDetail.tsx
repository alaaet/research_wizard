import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResearchDraft } from '../../lib/researchDraft';
import { getResearchDraft, updateResearchDraft } from '../../utils/researchDraftIpc';
import { ResearchDraftOutline } from '../../lib/researchDraftOutline';
import PageLayout from '../../components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

function OutlineEditor({ outline, onChange }: { outline: ResearchDraftOutline; onChange: (o: ResearchDraftOutline) => void }) {
  // Simple outline editor for title and sections
  const [sectionTitle, setSectionTitle] = useState('');
  const [subsectionInput, setSubsectionInput] = useState('');
  const [subsections, setSubsections] = useState<string[]>([]);

  const addSection = () => {
    if (!sectionTitle.trim()) return;
    onChange({
      ...outline,
      sections: [
        ...outline.sections,
        { title: sectionTitle, subsections },
      ],
    });
    setSectionTitle('');
    setSubsections([]);
  };
  const addSubsection = () => {
    if (!subsectionInput.trim()) return;
    setSubsections(prev => [...prev, subsectionInput]);
    setSubsectionInput('');
  };
  const removeSection = (idx: number) => {
    onChange({
      ...outline,
      sections: outline.sections.filter((_, i) => i !== idx),
    });
  };
  const removeSubsection = (idx: number) => {
    setSubsections(prev => prev.filter((_, i) => i !== idx));
  };
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Outline Title</label>
      <Input value={outline.title} onChange={e => onChange({ ...outline, title: e.target.value })} />
      <div className="mt-2">
        <label className="block font-medium mb-1">Add Section</label>
        <Input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder="Section title" />
        <div className="flex gap-2 mt-2">
          <Input value={subsectionInput} onChange={e => setSubsectionInput(e.target.value)} placeholder="Add subsection" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubsection(); }}} />
          <Button type="button" onClick={addSubsection} variant="secondary">Add Subsection</Button>
        </div>
        <ul className="list-disc pl-5 mt-2">
          {subsections.map((sub, idx) => (
            <li key={idx} className="flex items-center gap-2">{sub} <Button size="icon" variant="ghost" onClick={() => removeSubsection(idx)}>&times;</Button></li>
          ))}
        </ul>
        <Button type="button" onClick={addSection} className="mt-2">Add Section</Button>
      </div>
      <div className="mt-4">
        <label className="block font-medium mb-1">Current Outline</label>
        <ul className="list-decimal pl-5">
          {outline.sections.map((section, idx) => (
            <li key={idx} className="mb-2">
              <div className="flex items-center gap-2 font-semibold">{section.title} <Button size="icon" variant="ghost" onClick={() => removeSection(idx)}>&times;</Button></div>
              <ul className="list-disc pl-5">
                {section.subsections.map((sub, subIdx) => (
                  <li key={subIdx}>{sub}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ResearchDraftDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [form, setForm] = useState({
    title: '',
    outline: { title: '', sections: [] } as ResearchDraftOutline,
    report: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getResearchDraft(uid)
      .then(d => {
        if (!d) {
          setError('Draft not found.');
          setDraft(null);
        } else {
          setDraft(d);
          setForm({
            title: d.title,
            outline: d.outline,
            report: d.report || '',
          });
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load draft.');
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
        setError(result.error || 'Failed to update draft.');
      }
    } catch (err) {
      setError('Failed to update draft.');
    }
    setSaving(false);
  };

  if (loading) {
    return <PageLayout><div className="p-8">Loading...</div></PageLayout>;
  }
  if (error) {
    return <PageLayout><div className="p-8 text-red-500">{error}</div></PageLayout>;
  }
  if (!draft) {
    return <PageLayout><div className="p-8">Draft not found.</div></PageLayout>;
  }

  return (
    <PageLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter max-w-2xl mx-auto"
      >
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4">&larr; Back</Button>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">View/Edit Draft</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium text-gray-800 mb-1">Title <span className="text-red-500">*</span></label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />          
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">Outline</label>
            <OutlineEditor outline={form.outline} onChange={outline => setForm(f => ({ ...f, outline }))} />
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">Report</label>
            <Button type="button" variant="outline" onClick={() => navigate(`/writing/draft/${uid}/report`)}>
              View Report Details
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            {success && <span className="text-green-600 self-center">Saved!</span>}
            {error && <span className="text-red-500 self-center">{error}</span>}
          </div>
        </form>
        <div className="text-xs text-muted-foreground mt-4">
          Created: {draft.created_at ? new Date(draft.created_at).toLocaleString() : ''}
        </div>
      </motion.div>
    </PageLayout>
  );
}
