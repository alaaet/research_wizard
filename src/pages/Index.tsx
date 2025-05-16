import PageLayout from '../components/layout/PageLayout';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { listResearchProjects } from '../utils/researchProjectIpc';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';

export default function Index() {
  const [showAlert, setShowAlert] = useState(() => {
    return localStorage.getItem('aiAgentAlertDismissed') !== 'true';
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showAlert) {
      localStorage.setItem('aiAgentAlertDismissed', 'true');
    }
  }, [showAlert]);

  useEffect(() => {
    listResearchProjects().then(projects => setRecentProjects(projects?.slice(0, 5) || []));
  }, []);

  return (
    <PageLayout>
      <div className="flex flex-col items-center h-screen">
        {showAlert && (
          <Alert style={{ backgroundColor: '#e7f3fe', color: '#2176bd', border: '1px solid #b3d8fd', position: 'relative' }}>
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>
              Please go to <Link to="/settings"><b> Settings </b></Link> to set up an AI agent for this app to work properly.
            </AlertDescription>
            <Button
              size="sm"
              variant="ghost"
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => setShowAlert(false)}
              aria-label="Close alert"
            >
              ×
            </Button>
          </Alert>
        )}
        {/** add here a list of recent research projects */}
        <div className="mt-6">
          <Label className="text-rwiz-primary-dark text-lg">Recent Research Projects</Label>
          {recentProjects.length === 0 ? (
            <div className="text-muted-foreground">No recent projects found.</div>
          ) : (
            <ul className="divide-y divide-rwiz-primary/20">
              {recentProjects.map((proj: any) => (
                <Link to={`/projects/${proj.uid}`}>
                  <Card key={proj.uid} className="p-4 hover:bg-muted cursor-pointer">
                    <div>
                      <div className="font-semibold">{proj.title}</div>
                      <div className="text-xs text-muted-foreground">Created: {new Date(proj.created_at).toLocaleString()}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
} 