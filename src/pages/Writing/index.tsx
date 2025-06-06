import React, { useEffect, useState } from 'react';
import { ResearchDraft } from '../../lib/researchDraft';
import { deleteResearchDraft, listResearchDrafts } from '../../connectors/researchDraftIpc';
import { listResearchProjects } from '../../connectors/researchProjectIpc';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from "sonner"
import { ResearchProject } from '@/lib/researchProject';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

export default function ResearchDraftsPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [drafts, setDrafts] = useState<ResearchDraft[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load research projects
    listResearchProjects().then((data) => {
      setProjects(data || []);
      // Select all projects by default
      setSelectedProjects((data || []).map((p: ResearchProject) => p.uid));
    });
    // Load all drafts for all projects
    async function fetchAllDrafts() {
      setLoading(true);
      let allDrafts: ResearchDraft[] = [];
      for (const project of projects) {
        const projectDrafts = await listResearchDrafts(project.uid);
        if (projectDrafts) allDrafts = allDrafts.concat(projectDrafts);
      }
      setDrafts(allDrafts);
      setLoading(false);
    }
    if (projects.length > 0) fetchAllDrafts();
  }, [projects.length]);

  useEffect(() => {
    if (error) {
      toast.error(error, { dismissible: true });
    }
  }, [error]);

  const handleProjectToggle = (uid: string) => {
    setSelectedProjects((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const filteredDrafts = drafts.filter(d => selectedProjects.includes(d.project_uid));

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const result = await deleteResearchDraft(draftId);
      if (result.success) {
        setDrafts(drafts.filter(draft => draft.uid !== draftId));
        toast.success("Draft deleted successfully");
      } else {
        setError(result.error || "An error occurred while deleting the draft");
      }
    } catch (err) {
      setError(err.message || "An error occurred while deleting the draft");
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
        <Card className="p-4 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <Label>{t('writing.filterByResearchProjects')}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">{t('writing.selectProjects')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2">
                {projects.map((project) => (
                  <div key={project.uid} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={selectedProjects.includes(project.uid)}
                      onCheckedChange={() => handleProjectToggle(project.uid)}
                      id={`project-checkbox-${project.uid}`}
                    />
                    <label htmlFor={`project-checkbox-${project.uid}`} className="text-sm cursor-pointer">
                      {project.title.length > 70 ? project.title.slice(0, 70)+'...' : project.title}
                    </label>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
        <div className="mx-auto py-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{t('writing.researchDrafts')}</h1>
            <Button onClick={() => navigate(`/writing/${selectedProjects[0]}/create-draft`)} disabled={selectedProjects.length === 0}>{t('writing.addDraft')}</Button>
          </div>
          <div className="space-y-4">
            {filteredDrafts.length === 0 ? (
              <div className="text-muted-foreground text-gray-800">{t('writing.noResearchDraftsFound')}</div>
            ) : (
              filteredDrafts.map(draft => (
                <Link to={`/writing/draft/${draft.uid}`} key={draft.uid}>
                  <Card className="p-4 mb-4 hover:bg-muted cursor-pointer">
                    <div className="font-semibold text-lg">{draft.title}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>
                        {t('writing.created')}: {draft.created_at ? new Date(draft.created_at).toLocaleString() : ''}
                        {draft.updated_at ? `, ${t('writing.updated')}: ${draft.updated_at ? new Date(draft.updated_at).toLocaleString() : ''}` : ''}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t('writing.delete')}
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteDraft(draft.uid);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
