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

export default function LiteratureListingPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [papers, setPapers] = useState<research_paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load research projects
    window.electron?.invoke("researchProjects:list").then((data) => {
      setProjects(data || []);
    });
  }, []);

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
        <div className="space-y-2">
          <Label>Research Project</Label>
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
      </Card>
      {papers.length > 0 && (
        <Card className="p-4 space-y-4 w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Papers</h2>
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Title</TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((result, index) => {
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
                          Link
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
