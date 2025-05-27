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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

import { getLiteratureResults, exportLiterature, addPaper, updatePaper, deletePaper } from '@/connectors/literatureIpc';
import { listResearchProjects } from '@/connectors/researchProjectIpc';
import type { research_paper } from '@/lib/researchPaper';
import type { ResearchProject } from '../../lib/researchProject';
import { Globe, Eye, Pencil, Trash2, Copy } from 'lucide-react';
import EditPaperModal from '@/components/modals/editPaperModal';
import DeletePaperModal from '@/components/modals/deletePaperModal';
import { useNavigate } from 'react-router-dom';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AddPaperModal from '@/components/modals/addPaperModal';
import { toast } from "sonner"

export default function LiteratureListingPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [papers, setPapers] = useState<research_paper[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [paperToEdit, setPaperToEdit] = useState<research_paper | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<research_paper | null>(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    // Load research projects
    listResearchProjects().then((data) => {
      setProjects(data || []);
      setSelectedProjects((data || []).map((p: ResearchProject) => p.uid));
    });
  }, []);

  useEffect(() => {
    // Load all papers for all projects
    async function fetchAllPapers() {
      setLoading(true);
      let allPapers: research_paper[] = [];
      for (const project of projects) {
        const projectPapers = await getLiteratureResults(project.uid);
        if (projectPapers) allPapers = allPapers.concat(projectPapers);
      }
      setPapers(allPapers);
      setLoading(false);
    }
    if (projects.length > 0) fetchAllPapers();
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

  const filteredPapers = papers.filter(p => selectedProjects.includes(p.project_uid));
  const totalPages = Math.ceil(filteredPapers.length / pageSize);
  const paginatedPapers = filteredPapers.slice((page - 1) * pageSize, page * pageSize);

  const handleEditSave = async (updated: research_paper) => {
    const res = await updatePaper(updated);
    if (res?.success) {
      setPapers(papers => papers.map(p => p.uid === updated.uid ? updated : p));
      toast(t('literature.manage.success.paperUpdated'));
    }
    else{
      setError(t('literature.manage.error.updateFailed'));
    }
    setEditOpen(false);
  };

  const handleDelete = async (paper: research_paper) => {
    const res = await deletePaper(paper.uid);
    if (res?.success) {
      setPapers(papers => papers.filter(p => p.uid !== paper.uid));
      toast(t('literature.manage.success.paperDeleted'));
    }
    else{
      setError(t('literature.manage.error.deleteFailed'));
    }
    setDeleteOpen(false);
  };

  const handleAddPaper = async (paper: research_paper) => {
    if (!selectedProjects.includes(paper.project_uid)) return;
    const res = await addPaper(paper.project_uid, paper);
    if (res?.success) {
      setPapers(papers => [...papers, paper]);
      toast(t('literature.manage.success.paperAdded'));
      setError(null);
    } else {
      if (res?.error === 'A paper with this title and URL already exists.') {
        setError(t('literature.manage.error.duplicatePaper'));
      } else {
        setError(t('literature.manage.error.addFailed'));
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
      <h1 className="text-2xl font-bold">{t('literature.manage.title')}</h1>
      <Card className="p-4 space-y-4 w-full">
        <div className="flex items-center justify-between">
          <Label>{t('literature.manage.filterByProjects')}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">{t('literature.manage.selectProjects')}</Button>
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
      {filteredPapers.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('literature.manage.papers')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                {t('literature.manage.addPaper')}
              </Button>
              <Select onValueChange={async (value) => { await exportLiterature(value, filteredPapers); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('literature.manage.exportPapers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bibtex">{t('literature.manage.exportFormats.bibtex')}</SelectItem>
                  <SelectItem value="endnote">{t('literature.manage.exportFormats.endnote')}</SelectItem>
                  <SelectItem value="ris">{t('literature.manage.exportFormats.ris')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card className="p-4 space-y-4 w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2">{t('literature.manage.table.index')}</TableHead>
                    <TableHead className="w-80">{t('literature.manage.table.title')}</TableHead>
                    <TableHead className="w-40">{t('literature.manage.table.authors')}</TableHead>
                    <TableHead className="w-20">{t('literature.manage.table.date')}</TableHead>
                    <TableHead className="w-20">{t('literature.manage.table.actions')}</TableHead>
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
                      <TableRow key={paper.uid} className="hover:bg-gray-100 cursor-pointer" onClick={() => navigate(`/literature/view/${paper.project_uid}/${paper.uid}`)}>
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{paper.title}</TableCell>
                        <TableCell>{paper.author && paper.author.length > 50 ? paper.author.slice(0, 50) + '...' : paper.author}</TableCell>
                        <TableCell>{publishedDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              title={t('literature.manage.actions.openLink')}
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
                              title={t('literature.manage.actions.copyUrl')}
                              onClick={e => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(paper.url);
                                toast.success(t('literature.manage.success.urlCopied'));
                              }}
                            >
                              <Copy className="w-5 h-5 text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={t('literature.manage.actions.view')}
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/literature/view/${paper.project_uid}/${paper.uid}`);
                              }}
                            >
                              <Eye className="w-5 h-5 text-blue-500" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={t('literature.manage.actions.edit')}
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
                              title={t('literature.manage.actions.delete')}
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
