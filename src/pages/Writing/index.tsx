import React, { useEffect, useState } from 'react';
import { ResearchDraft } from '../../lib/researchDraft';
import { deleteResearchDraft, listResearchDrafts } from '../../utils/researchDraftIpc';
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



export default function ResearchDraftsPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [drafts, setDrafts] = useState<ResearchDraft[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load research projects
    window.electron?.invoke("researchProjects:list").then((data) => {
      setProjects(data || []);
    });
    // Collapse the card if drafts are loaded
    if (drafts.length > 0) setCardCollapsed(true);
  }, [drafts.length]);

  useEffect(() => {
    if (error) {
      toast.error(error, { dismissible: true });
    }
  }, [error]);

  const handleLoadDrafts = async () => {
    if (!selectedProject) {
      setError("Please select a project");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results: ResearchDraft[] = await listResearchDrafts(selectedProject);
      setDrafts(results);
    } catch (err) {
      setError(err.message || "An error occurred while loading drafts");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setCardCollapsed(c => !c)}>
          <Label>Research Project</Label>
          {cardCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </div>
        {!cardCollapsed && (
          <>
            <div className="space-y-2">
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.uid} value={project.uid}>
                      {project.title.length > 100 ? project.title.slice(0, 100) : project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLoadDrafts} disabled={loading || !selectedProject}>
              {loading ? "Loading..." : "Load Drafts"}
            </Button>
          </>
        )}
      </Card>
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Research Drafts</h1>
            <Button onClick={() => navigate(`/writing/${selectedProject}/create-draft`)} disabled={!selectedProject}>Add Draft</Button>
          </div>
          <div className="space-y-4">
            {drafts.length === 0 ? (
              <div className="text-muted-foreground text-gray-800">No research drafts found.</div>
            ) : (
              drafts.map(draft => (
                <Link to={`/writing/draft/${draft.uid}`} key={draft.uid}>
                  <Card className="p-4 mb-4 hover:bg-muted cursor-pointer">
                    <div className="font-semibold text-lg">{draft.title}</div>
                    <div className="text-muted-foreground mt-1 line-clamp-2">{draft.report?.slice(0, 120)}{draft.report?.length > 120 ? '...' : ''}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>
                        Created: {draft.created_at ? new Date(draft.created_at).toLocaleString() : ''}{draft.updated_at ? `, Updated: ${draft.updated_at ? new Date(draft.updated_at).toLocaleString() : ''}` : ''}
                      </span>
                      <Button
                              size="icon"
                              variant="ghost"
                              title="Delete"
                              onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteDraft(draft.uid);
                              }}
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </Button>
                      {/* <Button className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteDraft(draft.uid); }}><Trash2 className="w-3 h-3" /></Button> */}
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
