import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listResources } from '@/connectors/resourceIpc';
import type { Resource } from '@/lib/Resource';
import { Copy, Globe } from 'lucide-react';
import { toast } from "sonner"


export default function ViewPaperPage() {
  const { uid, projectId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
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
        const results = await listResources(projectId);
        const found = results.find((r: Resource) => r.uid === uid);
        if (found) {
          setResource(found);
        } else {
          setError('Resource not found.');
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
          {resource && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold mb-2">{resource.title}</h2>
              <div><strong>Authors:</strong> {resource.author}</div>
              <div><strong>Published Date:</strong> {resource.publishedDate ? (resource.publishedDate instanceof Date ? resource.publishedDate.toLocaleDateString() : new Date(resource.publishedDate).toLocaleDateString()) : 'N/A'}</div>
              <div className="flex items-center gap-2"><strong>URL:</strong> <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">Open Link <Globe className="w-5 h-5 text-blue-500" /></a>                             <Button
                size="icon"
                variant="ghost"
                title="Copy URL"
                onClick={e => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(resource.url);
                  toast.success("URL copied to clipboard");
                }}
              >
                <Copy className="w-5 h-5 text-blue-500" />
              </Button></div>
              <div><strong>Score:</strong> {resource.score ?? 'N/A'}</div>
              <div><strong>Summary:</strong> <div className="whitespace-pre-line mt-1">{resource.summary || 'No summary provided.'}</div></div>
              <div><strong>Source Query:</strong> {resource.sourceQuery || 'N/A'}</div>
              <div><strong>Index:</strong> {resource.index ?? 'N/A'}</div>
              <div><strong>Type:</strong> {resource.resource_type || 'N/A'}</div>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
} 