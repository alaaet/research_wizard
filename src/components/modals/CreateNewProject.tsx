import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { ResearchProject, PROJECT_STATUSES, ProjectStatus, generateUID } from '../../lib/researchProject';
import { createResearchProject } from '../../connectors/researchProjectIpc';

interface CreateNewProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: ResearchProject) => void;
}

interface CreateProjectForm {
  title: string;
  keywords: string[];
  description: string;
  research_questions: string[];
  status: ProjectStatus;
}

export default function CreateNewProject({ open, onOpenChange, onProjectCreated }: CreateNewProjectProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateProjectForm>({
    title: '',
    keywords: [],
    description: '',
    research_questions: [],
    status: PROJECT_STATUSES[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project: ResearchProject = {
        uid: generateUID(),
        title: form.title.trim(),
        keywords: form.keywords,
        description: form.description,
        research_questions: form.research_questions,
        status: form.status,
      };
      const result = await createResearchProject(project);
      if (result.success) {
        onProjectCreated?.(project);
        onOpenChange(false);
        setForm({
          title: '',
          keywords: [],
          description: '',
          research_questions: [],
          status: PROJECT_STATUSES[0],
        });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('projects.create.title')}</DialogTitle>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium mb-1">
              {t('projects.create.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium mb-1">{t('projects.create.keywords')}</label>
            <div className="flex flex-wrap gap-2 border rounded p-2 bg-muted">
              {form.keywords.map((tag, idx) => (
                <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center">
                  {tag}
                  <button type="button" className="ml-1 text-xs" onClick={() => setForm(f => ({ ...f, keywords: f.keywords.filter((_, i) => i !== idx) }))}>&times;</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[100px] bg-transparent outline-none"
                placeholder={t('projects.create.addKeyword')}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && (e.target as HTMLInputElement).value.trim()) {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (!form.keywords.includes(value)) {
                      setForm(f => ({ ...f, keywords: [...f.keywords, value] }));
                    }
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">{t('projects.create.description')}</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block font-medium mb-1">{t('projects.create.researchQuestions')}</label>
            <div className="flex flex-wrap gap-2 border rounded p-2 bg-muted">
              {form.research_questions.map((question, idx) => (
                <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center">
                  {question}
                  <button type="button" className="ml-1 text-xs" onClick={() => setForm(f => ({ ...f, research_questions: f.research_questions.filter((_, i) => i !== idx) }))}>&times;</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[100px] bg-transparent outline-none"
                placeholder={t('projects.create.addQuestion')}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && (e.target as HTMLInputElement).value.trim()) {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (!form.research_questions.includes(value)) {
                      setForm(f => ({ ...f, research_questions: [...f.research_questions, value] }));
                    }
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status" className="block font-medium mb-1">{t('projects.create.status')}</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm(f => ({ ...f, status: value as ProjectStatus }))}
              defaultValue={PROJECT_STATUSES[0]}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t('projects.create.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{t(`projectStatus.${status}`, status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('projects.create.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>
              {loading ? t('projects.create.saving') : t('projects.create.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 