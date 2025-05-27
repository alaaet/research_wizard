import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResearchProject, PROJECT_STATUSES, ProjectStatus } from '../../lib/researchProject';
import { getResearchProject, updateResearchProject } from '../../connectors/researchProjectIpc';
import { generateResearchKeywordsFromTopic , generateResearchQuestionsFromTopic} from '../../connectors/aiAgentsIpc';
import PageLayout from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  return (
    <div className="flex flex-wrap gap-2 border rounded p-2 bg-muted">
      {value.map((tag, idx) => (
        <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center">
          {tag}
          <button type="button" className="ml-1 text-xs" onClick={() => onChange(value.filter((_, i) => i !== idx))}>&times;</button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[100px] bg-transparent outline-none"
        value={input}
        placeholder={placeholder}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            if (!value.includes(input.trim())) {
              onChange([...value, input.trim()]);
            }
            setInput('');
          } else if (e.key === 'Backspace' && !input && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

export default function ResearchProjectDetailPage() {
  const { t } = useTranslation();
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [form, setForm] = useState<{
    title: string;
    keywords: string[];
    description: string;
    research_questions: string[];
    status: ProjectStatus;
  }>({
    title: '',
    keywords: [] as string[],
    description: '',
    research_questions: [] as string[],
    status: PROJECT_STATUSES[0],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getResearchProject(uid)
      .then(proj => {
        if (!proj) {
          setError(t('projects.details.error.notFound'));
          setProject(null);
        } else {
          setProject(proj);
          setForm({
            title: proj.title,
            keywords: proj.keywords || [],
            description: proj.description || '',
            research_questions: proj.research_questions || [],
            status: proj.status || PROJECT_STATUSES[0] as ProjectStatus,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        setError(t('projects.details.error.loadFailed'));
        setLoading(false);
      });
  }, [uid, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const updated = {
      ...project,
      ...form,
    };
    try {
      const result = await updateResearchProject(updated);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error || t('projects.details.error.updateFailed'));
      }
    } catch (err) {
      setError(t('projects.details.error.updateFailed'));
    }
    setSaving(false);
  };

  const generateKeywordsFromTitle = async () => {
    const keywords = await generateResearchKeywordsFromTopic(project.title);
    setForm(f => ({ ...f, keywords }));
  };

  const generateResearchQuestionsFromTitle = async () => {
    const research_questions = await generateResearchQuestionsFromTopic(project.title) || [];
    setForm(f => ({ ...f, research_questions }));
  };

  if (loading) {
    return <PageLayout><div className="p-8">{t('common.loading')}</div></PageLayout>;
  }
  if (error) {
    return <PageLayout><div className="p-8 text-red-500">{error}</div></PageLayout>;
  }
  if (!project) {
    return <PageLayout><div className="p-8">{t('projects.details.error.notFound')}</div></PageLayout>;
  }

  return (
    <PageLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter max-w-2xl mx-auto"
      >
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4 bg-rwiz-primary-light hover:bg-rwiz-primary-dark">
          &larr; {t('projects.details.back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('projects.details.viewEdit')}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium text-gray-800 mb-1">
              {t('projects.details.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />          
          </div>
          <div>
            <div className='flex flex-row items-center gap-2 mb-2'>
              <label className="block font-medium text-gray-800 mb-1">{t('projects.details.keywords')}</label>
              <Button 
                variant="secondary" 
                onClick={() => generateKeywordsFromTitle()} 
                className='w-6 h-6 p-0 bg-rwiz-primary-light hover:bg-rwiz-primary-dark' 
                title={t('projects.details.generateWithAI')}
              >
                <Brain className="w-4 h-4" />
              </Button>
            </div>
            <TagsInput 
              value={form.keywords} 
              onChange={v => setForm(f => ({ ...f, keywords: v }))} 
              placeholder={t('projects.details.addKeyword')} 
            />
          </div>
          <div>
            <label className="block font-medium text-gray-800 mb-1">{t('projects.details.description')}</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <div className='flex flex-row items-center gap-2 mb-2'>
              <label className="block font-medium text-gray-800 mb-1">{t('projects.details.researchQuestions')}</label>
              <Button 
                variant="secondary" 
                onClick={() => generateResearchQuestionsFromTitle()} 
                className='w-6 h-6 p-0 bg-rwiz-primary-light hover:bg-rwiz-primary-dark' 
                title={t('projects.details.generateWithAI')}
              >
                <Brain className="w-4 h-4" />
              </Button>
            </div>
            <TagsInput 
              value={form.research_questions} 
              onChange={v => setForm(f => ({ ...f, research_questions: v }))} 
              placeholder={t('projects.details.addQuestion')} 
            />
          </div>
          <div>
            <Label htmlFor="status" className="block font-medium text-gray-800 mb-1">{t('projects.details.status')}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm(f => ({ ...f, status: value as ProjectStatus }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t('projects.details.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{t(`projectStatus.${status}`, status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? t('common.saving') : t('projects.details.saveChanges')}
            </Button>
            {success && <span className="text-green-600 self-center">{t('common.saved')}</span>}
            {error && <span className="text-red-500 self-center">{error}</span>}
          </div>
        </form>
        <div className="text-xs text-muted-foreground mt-4">
          {t('projects.details.createdAt')}: {project.created_at ? new Date(project.created_at).toLocaleString() : ''}<br />
          {t('projects.details.updatedAt')}: {project.updated_at ? new Date(project.updated_at).toLocaleString() : ''}<br />
          {t('projects.details.currentStatus')}: <Badge variant="outline">{t(`projectStatus.${form.status}`, form.status)}</Badge>
        </div>
      </motion.div>
    </PageLayout>
  );
} 