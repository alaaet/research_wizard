import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLiteratureResults } from '@/utils/literatureIpc';
import type { research_paper } from '@/lib/researchPaper';
import { Globe } from 'lucide-react';

export default function ViewPaperPage() {
  const { uid, projectId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<research_paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaper() {
      if (!projectId || !uid) {
        setError('Invalid paper or project ID.');
        setLoading(false);
        return;
      }
      try {
        const results = await getLiteratureResults(projectId);
        const found = results.find((p: research_paper) => p.uid === uid);
        if (found) {
          setPaper(found);
        } else {
          setError('Paper not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load paper.');
      } finally {
        setLoading(false);
      }
    }
    fetchPaper();
  }, [projectId, uid]);

  return (
    <PageLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Back</Button>
        <Card className="p-6 space-y-4">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {paper && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold mb-2">{paper.title}</h2>
              <div><strong>Authors:</strong> {paper.author}</div>
              <div><strong>Published Date:</strong> {paper.publishedDate ? (paper.publishedDate instanceof Date ? paper.publishedDate.toLocaleDateString() : new Date(paper.publishedDate).toLocaleDateString()) : 'N/A'}</div>
              <div className="flex items-center gap-2"><strong>URL:</strong> <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">Open Link <Globe className="w-5 h-5 text-blue-500" /></a></div>
              <div><strong>Score:</strong> {paper.score ?? 'N/A'}</div>
              <div><strong>Summary:</strong> <div className="whitespace-pre-line mt-1">{paper.summary || 'No summary provided.'}</div></div>
              <div><strong>Source Query:</strong> {paper.sourceQuery || 'N/A'}</div>
              <div><strong>Index:</strong> {paper.index ?? 'N/A'}</div>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
} 