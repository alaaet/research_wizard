import React, { useEffect, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getSearchRetrievers,
  searchWithRetriever,
} from "@/connectors/integrationsIpc";
import type { SearchRetriever } from "../../../shared/searchRetrieverTypes";
import type { ResearchProject } from "../../lib/researchProject";
import type { Resource } from "@/lib/Resource";
import { saveLiteratureResults } from "@/connectors/resourceIpc";
import { listResearchProjects, getResearchProject, updateResearchProject } from "@/connectors/researchProjectIpc";
import { generateResearchQuestionsFromTopic } from "@/connectors/aiAgentsIpc";
import { useTranslation } from "react-i18next";

export default function LiteraturePage() {
  const { t } = useTranslation();
  const [retrievers, setRetrievers] = useState<SearchRetriever[]>([]);
  const [selectedRetrieverName, setSelectedRetrieverName] =
    useState<string>("");
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load search retrievers
    getSearchRetrievers().then((data) => {
      setRetrievers(data?.filter((r) => r.is_active) || []);
    });

    // Load research projects
    listResearchProjects().then((data) => {
      setProjects(data || []);
    });
  }, []);

  const handleSearch = async () => {
    if (!selectedProject || !selectedRetrieverName) {
      setError(t('literature.discover.error.selectBoth'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the selected project details
      const project = await getResearchProject(selectedProject);

      // Check if research questions exist
      if (!project.research_questions?.length) {
        const generateQueries = confirm(
          t('literature.discover.confirm.generateQuestions')
        );

        if (generateQueries) {
          const questions = await generateResearchQuestionsFromTopic(project.title);

          // Update project with new questions
          await updateResearchProject({
            ...project,
            research_questions: questions,
          });
        } else {
          setError(t('literature.discover.error.questionsRequired'));
          setLoading(false);
          return;
        }
      }

      // Perform the search using the selected retriever
      const results: Resource[] = await searchWithRetriever(
        selectedRetrieverName,
        projects.find((p) => p.title === selectedProject)?.uid,
        project.title,
        project.research_questions,
        project.keywords
      );

      setSearchResults(results);
    } catch (err) {
      setError(err.message || t('literature.discover.error.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    try {
      await saveLiteratureResults(selectedProject, searchResults);
      alert(t('literature.discover.success.saved'));
    } catch (err) {
      setError(t('literature.discover.error.saveFailed', { error: err.message }));
    }
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
          <h1 className="text-2xl font-bold">{t('literature.discover.title')}</h1>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('common.error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="p-4 space-y-4 w-full">
            <div className="space-y-2">
              <Label>{t('literature.discover.searchRetriever')}</Label>
              <Select
                value={selectedRetrieverName}
                onValueChange={setSelectedRetrieverName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('literature.discover.selectRetriever')} />
                </SelectTrigger>
                <SelectContent>
                  {retrievers.map((retriever) => (
                    <SelectItem key={retriever.slug} value={retriever.slug}>
                      {retriever.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('literature.discover.researchProject')}</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="h-10 min-h-[2.5rem] max-h-10 overflow-hidden">
                  <SelectValue
                    placeholder={t('literature.discover.selectProject')}
                    className="truncate"
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.uid}
                      value={project.uid}
                      title={project.title}
                      className="truncate"
                    >
                      {project.title.length > 100 ? project.title.slice(0, 100) + "..." : project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !selectedProject || !selectedRetrieverName}
            >
              {loading ? t('literature.discover.searching') : t('literature.discover.search')}
            </Button>
          </Card>

          {searchResults.length > 0 && (
            <Card className="p-4 space-y-4 w-full">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{t('literature.discover.results')}</h2>
                <Button onClick={handleSaveResults}>{t('literature.discover.saveResults')}</Button>
              </div>
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('literature.paper.title')}</TableHead>
                      <TableHead>{t('literature.paper.authors')}</TableHead>
                      <TableHead>{t('literature.paper.published')}</TableHead>
                      <TableHead>{t('literature.paper.source')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result, index) => {
                      let publishedDate = '';
                      if (result.publishedDate) {
                        const dateObj = result.publishedDate instanceof Date
                          ? result.publishedDate
                          : new Date(result.publishedDate);
                        publishedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
                      }
                      return (
                        <TableRow key={index}>
                          <TableCell>{result.title}</TableCell>
                          <TableCell>{result.author}</TableCell>
                          <TableCell>{publishedDate}</TableCell>
                          <TableCell>
                            <a 
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 underline"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(result.url, '_blank');
                              }}
                            >
                              {result.url}
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    </PageLayout>
  );
}
