import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResearchProject, PROJECT_STATUSES, ProjectStatus } from '../../lib/researchProject';
import { getResearchProject, updateResearchProject } from '../../connectors/researchProjectIpc';
import { generateResearchKeywordsFromTopic, generateResearchQuestionsFromTopic } from '../../connectors/aiAgentsIpc';
import PageLayout from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
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
  const { toast } = useToast();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      getResearchProject(uid),
    ])
      .then(([proj]) => {
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
            status: (proj.status as ProjectStatus) || PROJECT_STATUSES[0],
          });
        }
      })
      .catch(err => {
        setError(t('projects.details.error.loadFailed'));
        console.error(err);
      })
      .finally(() => {
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

  if (loading) {
    return <PageLayout><div className="p-8">{t('common.loading')}</div></PageLayout>;
  }
  if (error && !project) { // Only show full page error if project couldn't load
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
        className="p-6 animate-enter max-w-4xl mx-auto" // Increased max-width
      >
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-4 bg-rwiz-primary-light hover:bg-rwiz-primary-dark">
          &larr; {t('projects.details.back')}
        </Button>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{project.title}</h1>
        
        {/* Project Details Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('projects.details.viewEdit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="projectTitle" className="block font-medium text-gray-800 mb-1">
                  {t('projects.details.titleLabel')} <span className="text-red-500">*</span>
                </Label>
                <Input id="projectTitle" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <div className='flex flex-row items-center gap-2 mb-1'>
                  <Label htmlFor="projectKeywords" className="block font-medium text-gray-800">
                    {t('projects.details.keywords')}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateKeywordsFromTitle()}
                    className='p-1 h-auto bg-rwiz-primary-light hover:bg-rwiz-primary-dark'
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
                <Label htmlFor="projectDescription" className="block font-medium text-gray-800 mb-1">{t('projects.details.description')}</Label>
                <Textarea id="projectDescription" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <div className='flex flex-row items-center gap-2 mb-1'>
                  <Label htmlFor="projectResearchQuestions" className="block font-medium text-gray-800">
                    {t('projects.details.researchQuestions')}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateResearchQuestionsFromTitle()}
                    className='p-1 h-auto bg-rwiz-primary-light hover:bg-rwiz-primary-dark'
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
              <div className="flex justify-end gap-2 items-center">
                {success && <span className="text-green-600 text-sm">{t('common.saved')}</span>}
                {error && <span className="text-red-500 text-sm">{error}</span>}
                <Button type="submit" disabled={saving || !form.title.trim()}>
                  {saving ? t('common.saving') : t('projects.details.saveChanges')}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <div className="flex flex-col">
              <span>{t('projects.details.createdAt')}: {project.created_at ? new Date(project.created_at).toLocaleString() : ''}</span>
              <span>{t('projects.details.updatedAt')}: {project.updated_at ? new Date(project.updated_at).toLocaleString() : ''}</span>
              <span>{t('projects.details.currentStatus')}: <Badge variant="outline" className="ml-1">{t(`projectStatus.${form.status}`, form.status)}</Badge></span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </PageLayout>
  );
}