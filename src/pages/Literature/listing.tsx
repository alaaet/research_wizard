import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getLiteratureResults, exportLiterature, addPaper, updatePaper, deletePaper } from '@/utils/literatureIpc';
import type { research_paper } from '@/lib/researchPaper';
import type { ResearchProject } from '../../lib/researchProject';
import { Globe, Eye, Pencil, Trash2 } from 'lucide-react';
import EditPaperModal from '@/components/modals/editPaperModal';
import DeletePaperModal from '@/components/modals/deletePaperModal';
import { useNavigate } from 'react-router-dom';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AddPaperModal from '@/components/modals/addPaperModal';
import { toast } from "sonner"

export default function LiteratureListingPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [papers, setPapers] = useState<research_paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [paperToEdit, setPaperToEdit] = useState<research_paper | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<research_paper | null>(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(papers.length / pageSize);
  const paginatedPapers = papers.slice((page - 1) * pageSize, page * pageSize);
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    // Load research projects
    window.electron?.invoke("researchProjects:list").then((data) => {
      setProjects(data || []);
    });
    // Collapse the card if papers are loaded
    if (papers.length > 0) setCardCollapsed(true);
  }, [papers.length]);

  useEffect(() => {
    if (error) {
      toast.error(error, { dismissible: true });
    }
  }, [error]);

  const handleLoadPapers = async () => {
    if (!selectedProject) {
      setError("Please select a project");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results: research_paper[] = await getLiteratureResults(selectedProject);
      setPapers(results);
    } catch (err) {
      setError(err.message || "An error occurred while loading papers");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (updated: research_paper) => {
    const res = await updatePaper(updated);
    if (res?.success) {
      setPapers(papers => papers.map(p => p.uid === updated.uid ? updated : p));
      toast('Paper updated successfully');
    }
    else{
      setError("Failed to update paper");
    }
    setEditOpen(false);
  };

  const handleDelete = async (paper: research_paper) => {
    const res = await deletePaper(paper.uid);
    if (res?.success) {
      setPapers(papers => papers.filter(p => p.uid !== paper.uid));
      toast('Paper deleted successfully');
    }
    else{
      setError("Failed to delete paper");
    }
    setDeleteOpen(false);
  };

  const handleAddPaper = async (paper: research_paper) => {
    if (!selectedProject) return;
    const res = await addPaper(selectedProject, paper);
    if (res?.success) {
      setPapers(papers => [...papers, paper]);
      toast('Paper added successfully');
      setError(null);
    } else {
      if (res?.error === 'A paper with this title and URL already exists.') {
        setError('A paper with this title and URL already exists.');
      } else {
        setError('Failed to add paper');
      }
    }
    setAddOpen(false);
  };

  return (
    <PageLayout>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-3 animate-enter w-full"
    >
    <div className="w-full px-4 space-y-6">
      <h1 className="text-2xl font-bold">Saved Literature Papers</h1>
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
            <Button onClick={handleLoadPapers} disabled={loading || !selectedProject}>
              {loading ? "Loading..." : "Load Papers"}
            </Button>
          </>
        )}
      </Card>
      {papers.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Papers</h2>
            {/* add a button to add a new paper, and a button to export the papers , the export button should export the papers as : BibTeX, EndNote XML or RIS file format. */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                Add Paper
              </Button>
              <Select onValueChange={async (value) => { await exportLiterature(value, papers); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Export Papers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bibtex">BibTeX</SelectItem>
                  <SelectItem value="endnote">EndNote XML</SelectItem>
                  <SelectItem value="ris">RIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card className="p-4 space-y-4 w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2">Index</TableHead>
                    <TableHead className="w-80">Title</TableHead>
                    <TableHead className="w-40">Authors</TableHead>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPapers.map((paper, idx) => {
                    let publishedDate = '';
                    if (paper.publishedDate) {
                      const dateObj = paper.publishedDate instanceof Date
                        ? paper.publishedDate
                        : new Date(paper.publishedDate);
                      publishedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
                    }
                    return (
                      <TableRow key={paper.uid} className="hover:bg-gray-100 cursor-pointer" onClick={() => navigate(`/literature/view/${selectedProject}/${paper.uid}`)}>
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{paper.title}</TableCell>
                        <TableCell>{paper.author && paper.author.length > 50 ? paper.author.slice(0, 50) + '...' : paper.author}</TableCell>
                        <TableCell>{publishedDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Open Link"
                              onClick={e => {
                                e.stopPropagation();
                                window.open(paper.url, '_blank');
                              }}
                            >
                              <Globe className="w-5 h-5 text-green-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="View"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/literature/view/${selectedProject}/${paper.uid}`);
                              }}
                            >
                              <Eye className="w-5 h-5 text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit"
                              onClick={e => {
                                e.stopPropagation();
                                setPaperToEdit(paper);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil className="w-5 h-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete"
                              onClick={e => {
                                e.stopPropagation();
                                setPaperToDelete(paper);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-center mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                        aria-disabled={page === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          href="#"
                          isActive={page === i + 1}
                          onClick={e => { e.preventDefault(); setPage(i + 1); }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                        aria-disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </Card>
        </>
      )}
      <EditPaperModal
        open={editOpen}
        onOpenChange={setEditOpen}
        paper={paperToEdit}
        onSave={handleEditSave}
      />
      <DeletePaperModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        paper={paperToDelete}
        onDelete={handleDelete}
      />
      <AddPaperModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAddPaper}
      />
    </div>
    </motion.div>
    </PageLayout>
  );
}
