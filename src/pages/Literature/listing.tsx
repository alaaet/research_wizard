import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

import {
  listResources,
  exportLiterature,
  addResource,
  updateResource,
  deleteResource,
} from "@/connectors/resourceIpc";
import { listResearchProjects } from "@/connectors/researchProjectIpc";
import type { Resource } from "@/lib/Resource";
import type { ResearchProject } from "../../lib/researchProject";
import {
  Globe,
  Eye,
  Pencil,
  Trash2,
  Copy,
  PlusIcon,
  FolderOpenIcon,
  LinkIcon,
} from "lucide-react";
import EditPaperModal from "@/components/modals/EditResourceModal";
import DeletePaperModal from "@/components/modals/DeleteResourceModal";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, ChevronUp } from "lucide-react";
import AddPaperModal from "@/components/modals/AddResourceModal";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ImportFromUrlModal from "@/components/modals/ImportFromUrlModal";
import ImportFromFolderModal from "@/components/modals/ImportFromFolderModal";
import { ButtonGroup } from "@/components/ui/button-group";

export default function LiteratureListingPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null
  );
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [cardCollapsed, setCardCollapsed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importUrlOpen, setImportUrlOpen] = useState(false);
  const [importFolderOpen, setImportFolderOpen] = useState(false);

  useEffect(() => {
    // Load research projects
    listResearchProjects().then((data) => {
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].uid);
      }
    });
  }, []);

  useEffect(() => {
    // Load all papers for all projects
    async function fetchAllPapers() {
      setLoading(true);
      let allResources: Resource[] = [];
      for (const project of projects) {
        const projectPapers = await listResources(project.uid);
        if (projectPapers) allResources = allResources.concat(projectPapers);
      }
      setResources(allResources);
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
    setSelectedProject((prev) => (prev === uid ? "" : uid));
  };

  const filteredResources = resources.filter(
    (r) => r.project_uid === selectedProject
  );
  const totalPages = Math.ceil(filteredResources.length / pageSize);
  const paginatedResources = filteredResources.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleEditSave = async (updated: Resource) => {
    const res = await updateResource(updated);
    if (res?.success) {
      setResources((resources) =>
        resources.map((r) => (r.uid === updated.uid ? updated : r))
      );
      toast(t("literature.manage.success.resourceUpdated"));
    } else {
      setError(t("literature.manage.error.updateFailed"));
    }
    setEditOpen(false);
  };

  const handleDelete = async (resource: Resource) => {
    const res = await deleteResource(resource.uid);
    if (res?.success) {
      setResources((resources) =>
        resources.filter((r) => r.uid !== resource.uid)
      );
      toast(t("literature.manage.success.resourceDeleted"));
    } else {
      setError(t("literature.manage.error.deleteFailed"));
    }
    setDeleteOpen(false);
  };

  const fetchProjectResources = async () => {
    if (!selectedProject) return;
    setLoading(true);
    const projectResources = await listResources(selectedProject);
    setResources((prev) => {
      // Replace all resources for this project, keep others
      const others = prev.filter(r => r.project_uid !== selectedProject);
      return [...others, ...(projectResources || [])];
    });
    setLoading(false);
  };

  const handleAddResource = async (resource: Resource) => {
    if (!selectedProject) return;
    resource.project_uid = selectedProject; // Ensure project_uid is set
    const { uid, project_uid, ...rest } = resource;
    const res = await addResource(selectedProject, rest);
    if (res?.success) {
      await fetchProjectResources();
      toast(t("literature.manage.success.resourceAdded"));
      setError(null);
    } else {
      if (res?.error === "A resource with this title and URL/path already exists.") {
        setError(t("literature.manage.error.duplicateResource"));
      } else {
        setError(t("literature.manage.error.addFailed"));
      }
    }
    setAddOpen(false);
  };

  const handleAddResources = async (resourcesToAdd: Resource[]) => {
    if (!selectedProject) return;
    for (const resource of resourcesToAdd) {
      resource.project_uid = selectedProject; // Ensure project_uid is set
      const { uid, project_uid, ...rest } = resource;
      await addResource(selectedProject, rest);
      // (You may want to handle errors individually here)
    }
    await fetchProjectResources();
    toast(t("literature.manage.success.resourceAdded"));
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
          <h1 className="text-2xl font-bold">{t("literature.manage.title")}</h1>
          <Card className="p-4 space-y-4 w-full">
            <div className="flex items-center justify-between">
              <Label>{t("literature.manage.filterByProjects")}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {t("literature.manage.selectProjects")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2">
                  {projects.map((project) => (
                    <div
                      key={project.uid}
                      className="flex items-center gap-2 py-1"
                    >
                      <Checkbox
                        checked={selectedProject === project.uid}
                        onCheckedChange={() => setSelectedProject(project.uid)}
                        id={`project-checkbox-${project.uid}`}
                      />
                      <label
                        htmlFor={`project-checkbox-${project.uid}`}
                        className="text-sm cursor-pointer"
                      >
                        {project.title.length > 70
                          ? project.title.slice(0, 70) + "..."
                          : project.title}
                      </label>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
          <div className="flex justify-end mb-4">
            <TooltipProvider>
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                >
                  <PlusIcon className="w-4 h-4" />
                  {t("literature.manage.addPaper")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportUrlOpen(true)}
                >
                  <PlusIcon className="w-4 h-4" />
                  <LinkIcon className="w-4 h-4" />
                  {t("literature.manage.importFromUrl")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportFolderOpen(true)}
                >
                  <PlusIcon className="w-4 h-4" />
                  <FolderOpenIcon className="w-4 h-4" />
                  {t("literature.manage.importFromFolder")}
                </Button>
              </ButtonGroup>
            </TooltipProvider>
          </div>
          {filteredResources.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {t("literature.manage.papers")}
                </h2>
                <div className="flex gap-2">
                  <Select
                    onValueChange={async (value) => {
                      await exportLiterature(value, filteredResources);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={t("literature.manage.exportPapers")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bibtex">
                        {t("literature.manage.exportFormats.bibtex")}
                      </SelectItem>
                      <SelectItem value="endnote">
                        {t("literature.manage.exportFormats.endnote")}
                      </SelectItem>
                      <SelectItem value="ris">
                        {t("literature.manage.exportFormats.ris")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Card className="p-4 space-y-4 w-full">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-2">
                          {t("literature.manage.table.index")}
                        </TableHead>
                        <TableHead className="w-80">
                          {t("literature.manage.table.title")}
                        </TableHead>
                        <TableHead className="w-40">
                          {t("literature.manage.table.authors")}
                        </TableHead>
                        <TableHead className="w-20">
                          {t("literature.manage.table.date")}
                        </TableHead>
                        <TableHead className="w-20">
                          {t("literature.manage.table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedResources.map((resource, idx) => {
                        let publishedDate = "";
                        if (resource.publishedDate) {
                          const dateObj =
                            resource.publishedDate instanceof Date
                              ? resource.publishedDate
                              : new Date(resource.publishedDate);
                          publishedDate = isNaN(dateObj.getTime())
                            ? ""
                            : dateObj.toLocaleDateString();
                        }
                        return (
                          <TableRow
                            key={resource.uid}
                            className="hover:bg-gray-100 cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/literature/view/${resource.project_uid}/${resource.uid}`
                              )
                            }
                          >
                            <TableCell>
                              {(page - 1) * pageSize + idx + 1}
                            </TableCell>
                            <TableCell>{resource.title}</TableCell>
                            <TableCell>
                              {resource.author && resource.author.length > 50
                                ? resource.author.slice(0, 50) + "..."
                                : resource.author}
                            </TableCell>
                            <TableCell>{publishedDate}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={t(
                                    "literature.manage.actions.openLink"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(resource.url, "_blank");
                                  }}
                                >
                                  <Globe className="w-5 h-5 text-green-500" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={t("literature.manage.actions.copyUrl")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(resource.url);
                                    toast.success(
                                      t("literature.manage.success.urlCopied")
                                    );
                                  }}
                                >
                                  <Copy className="w-5 h-5 text-blue-500" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={t("literature.manage.actions.view")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/literature/view/${resource.project_uid}/${resource.uid}`
                                    );
                                  }}
                                >
                                  <Eye className="w-5 h-5 text-blue-500" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={t("literature.manage.actions.edit")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setResourceToEdit(resource);
                                    setEditOpen(true);
                                  }}
                                >
                                  <Pencil className="w-5 h-5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title={t("literature.manage.actions.delete")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setResourceToDelete(resource);
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
                            onClick={(e) => {
                              e.preventDefault();
                              setPage((p) => Math.max(1, p - 1));
                            }}
                            aria-disabled={page === 1}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              href="#"
                              isActive={page === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(i + 1);
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage((p) => Math.min(totalPages, p + 1));
                            }}
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
          {filteredResources.length === 0 && (
            <Card className="p-4 space-y-4 w-full">
              <p className="text-sm text-muted-foreground">
                {t("literature.manage.noPapers")}
              </p>
            </Card>
          )}
          <EditPaperModal
            open={editOpen}
            onOpenChange={setEditOpen}
            resource={resourceToEdit}
            onSave={handleEditSave}
          />
          <DeletePaperModal
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            resource={resourceToDelete}
            onDelete={handleDelete}
          />
          <AddPaperModal
            open={addOpen}
            onOpenChange={setAddOpen}
            onAdd={(resource) => {
              if (!selectedProject) return;
              // Ensure the resource gets the selected project UID
              resource.project_uid = selectedProject;
              handleAddResource(resource);
            }}
          />
          <ImportFromUrlModal
            open={importUrlOpen}
            onOpenChange={setImportUrlOpen}
            onImport={handleAddResource}
          />
          <ImportFromFolderModal
            open={importFolderOpen}
            onOpenChange={setImportFolderOpen}
            onImport={handleAddResources}
          />
        </div>
      </motion.div>
    </PageLayout>
  );
}
