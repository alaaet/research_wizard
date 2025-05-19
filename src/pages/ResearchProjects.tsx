import React, { useEffect, useState } from 'react';
import { ResearchProject, generateUID } from '../lib/researchProject';
import { listResearchProjects, createResearchProject } from '../utils/researchProjectIpc';
import { Link, useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { motion } from 'framer-motion';
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

export default function ResearchProjectsPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    keywords: [] as string[],
    description: '',
    research_questions: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    const newProjects = await listResearchProjects();
    setProjects(newProjects || []);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const project = {
      uid: generateUID(),
      title: form.title.trim(),
      keywords: form.keywords,
      description: form.description,
      research_questions: form.research_questions,
    }
    // await createResearchProject();
    createResearchProject(project)
      .then(result => console.log('Project creation result:', result))
      .catch(err => console.log('Project creation error:', err));

    setForm({ title: '', keywords: [], description: '', research_questions: [] });
    setOpen(false);
    setLoading(false);
    fetchProjects();
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Research Projects</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>Create New Project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Create Research Project</DialogTitle>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block font-medium mb-1">Title <span className="text-red-500">*</span></label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Keywords</label>
                    <TagsInput value={form.keywords} onChange={v => setForm(f => ({ ...f, keywords: v }))} placeholder="Add keyword..." />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Description</label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Research Questions</label>
                    <TagsInput value={form.research_questions} onChange={v => setForm(f => ({ ...f, research_questions: v }))} placeholder="Add question..." />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading || !form.title.trim()}>{loading ? 'Saving...' : 'Save'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-muted-foreground text-gray-800">No research projects found.</div>
            ) : (
              projects.map(project => (
                <Link to={`/projects/${project.uid}`}>
                  <Card key={project.uid} className="p-4 hover:bg-muted cursor-pointer">
                    <div className="font-semibold text-lg">{project.title}</div>
                    {project.description && <div className="text-muted-foreground mt-1">{project.description}</div>}
                    {project.keywords && project.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.keywords.map((kw, i) => (
                          <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">{kw}</span>
                        ))}
                      </div>
                    )}
                    {project.research_questions && project.research_questions.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm">Research Questions:</div>
                        <ul className="list-disc list-inside text-sm">
                          {project.research_questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Created: {project.created_at ? new Date(project.created_at).toLocaleString() : ''}
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
} 