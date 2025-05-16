import React, { useEffect, useState } from "react";
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

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getLiteratureResults } from '@/utils/literatureIpc';
import type { research_paper } from '@/lib/researchPaper';
import type { ResearchProject } from '../../lib/researchProject';
import { Globe, Eye, Pencil, Trash2 } from 'lucide-react';
import EditPaperModal from '@/components/modals/editPaperModal';
import DeletePaperModal from '@/components/modals/deletePaperModal';
import { useNavigate } from 'react-router-dom';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function LiteratureListingPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [papers, setPapers] = useState<research_paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPaper, setEditPaper] = useState<research_paper | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePaper, setDeletePaper] = useState<research_paper | null>(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(papers.length / pageSize);
  const paginatedPapers = papers.slice((page - 1) * pageSize, page * pageSize);
  const [cardCollapsed, setCardCollapsed] = useState(false);

  useEffect(() => {
    // Load research projects
    window.electron?.invoke("researchProjects:list").then((data) => {
      setProjects(data || []);
    });
    // Collapse the card if papers are loaded
    if (papers.length > 0) setCardCollapsed(true);
  }, [papers.length]);

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

  const handleEditSave = (updated: research_paper) => {
    setPapers(papers => papers.map(p => p.uid === updated.uid ? updated : p));
    setEditOpen(false);
  };

  const handleDelete = (paper: research_paper) => {
    setPapers(papers => papers.filter(p => p.uid !== paper.uid));
    setDeleteOpen(false);
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
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
                      {project.title}
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
                  {paginatedPapers.map((result, idx) => {
                    let publishedDate = '';
                    if (result.publishedDate) {
                      const dateObj = result.publishedDate instanceof Date
                        ? result.publishedDate
                        : new Date(result.publishedDate);
                      publishedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
                    }
                    return (
                      <TableRow key={result.uid}>
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{result.title}</TableCell>
                        <TableCell>{result.author && result.author.length > 50 ? result.author.slice(0, 50) + '...' : result.author}</TableCell>
                        <TableCell>{publishedDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" title="Open Link" onClick={() => window.open(result.url, '_blank')}>
                              <Globe className="w-5 h-5 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" title="View" onClick={() => navigate(`/literature/view/${result.uid}`)}>
                              <Eye className="w-5 h-5 text-blue-500" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Edit" onClick={() => { setEditPaper(result); setEditOpen(true); }}>
                              <Pencil className="w-5 h-5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Delete" onClick={() => { setDeletePaper(result); setDeleteOpen(true); }}>
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
        paper={editPaper}
        onSave={handleEditSave}
      />
      <DeletePaperModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        paper={deletePaper}
        onDelete={handleDelete}
      />
    </div>
    </motion.div>
    </PageLayout>
  );
}
