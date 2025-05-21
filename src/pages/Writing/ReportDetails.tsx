import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResearchDraft,
  exportDraftReport,
} from "../../utils/researchDraftIpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import PageLayout from "@/components/layout/PageLayout";
import { Clipboard, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export default function ReportDetails() {
  const { uid } = useParams<{ uid: string }>();
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getResearchDraft(uid)
      .then((d) => {
        setDraft(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load draft.");
        setLoading(false);
      });
  }, [uid]);

  const handleExport = async (format: "md" | "docs" | "pdf") => {
    if (!draft) return;
    await exportDraftReport(draft.uid, format);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!draft) return <div className="p-8">Draft not found.</div>;

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter max-w-4xl mx-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)} title="Back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Report Details</h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("md")}
            >
              Export .md
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("docs")}
            >
              Export .docs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport("pdf")}
            >
              Export .pdf
            </Button>
          </div>
        </div>
        <Card className="p-4">
          <Tabs defaultValue="formatted" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="raw">Raw</TabsTrigger>
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
              </TabsList>
              <div className="flex gap-2 ml-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={async (e) => {
                        e.preventDefault();
                        if (draft?.report) {
                          await navigator.clipboard.writeText(draft.report);
                          toast.success('Raw report copied!');
                        }
                      }}>
                        <Clipboard className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy raw text</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={async (e) => {
                        e.preventDefault();
                        if (draft?.report) {
                          const md = new (await import('markdown-it')).default();
                          const html = md.render(draft.report);
                          await navigator.clipboard.write([
                            new window.ClipboardItem({
                              'text/html': new Blob([html], { type: 'text/html' }),
                              'text/plain': new Blob([draft.report], { type: 'text/plain' }),
                            }),
                          ]);
                          toast.success('Formatted report copied as rich text!');
                        }
                      }}>
                        <ClipboardCheck className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy formatted text</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <TabsContent value="raw">
              <Button
                size="sm"
                variant="ghost"
                className="mb-2"
                onClick={() => setShowRaw((r) => !r)}
              >
                {showRaw ? "Hide Raw" : "Show Raw"}
              </Button>
              {showRaw && (
                <pre className="bg-muted p-2 rounded overflow-x-auto text-xs max-h-96 whitespace-pre-wrap">
                  {draft.report}
                </pre>
              )}
            </TabsContent>
            <TabsContent value="formatted">
              <div className="prose max-w-none">
                <ReactMarkdown>{draft.report || ""}</ReactMarkdown>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </PageLayout>
  );
}
