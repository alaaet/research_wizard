import PageLayout from '../components/layout/PageLayout';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { listResearchProjects } from '../connectors/researchProjectIpc';
import { useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { t, i18n } = useTranslation();
  const [showAlert, setShowAlert] = useState(() => {
    return localStorage.getItem('aiAgentAlertDismissed') !== 'true';
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const navigate = useNavigate();
  const rtl = i18n.dir() === 'rtl';

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
      <div className="flex flex-col items-center">
        {showAlert && (
          <Alert
            style={{
              backgroundColor: '#e7f3fe',
              color: '#2176bd',
              border: '1px solid #b3d8fd',
              position: 'relative',
              direction: rtl ? 'rtl' : 'ltr'
            }}
            role="alert"
            aria-live="polite"
          >
            <AlertTitle className="font-bold">{t('home.aiAgentAlert.title')}</AlertTitle>
            <AlertDescription>
              {t('home.aiAgentAlert.description', {
                settingsLink: <Link to="/settings"><b>{t('home.aiAgentAlert.settingsLink')}</b></Link>
              })}
            </AlertDescription>
            <Button
              size="sm"
              variant="ghost"
              style={{
                position: 'absolute',
                top: 8,
                [rtl ? 'left' : 'right']: 8
              }}
              onClick={() => setShowAlert(false)}
              aria-label={t('common.close')}
              tabIndex={0}
            >
              ×
            </Button>
          </Alert>
        )}
        <div className="mt-10 mb-4">
          <Label className="text-rwiz-primary-dark text-lg font-semibold">{t('home.recentProjects.title')}</Label>
        </div>
        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center text-muted-foreground mt-8">
            <span className="material-icons text-4xl mb-2" aria-hidden="true">folder_open</span>
            <span>{t('home.recentProjects.noProjects')}</span>
          </div>
        ) : (
          <ul className="divide-y divide-rwiz-primary/20 w-full max-w-xl">
            {recentProjects.map((proj: any) => (
              <li key={proj.uid}>
                <Link to={`/projects/${proj.uid}`} tabIndex={0}>
                  <Card
                    className="p-5 my-3 hover:bg-muted cursor-pointer shadow transition-all duration-150"
                    style={{ textAlign: rtl ? 'right' : 'left' }}
                  >
                    <div>
                      <div className="font-semibold text-base">{proj.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('home.recentProjects.createdAt', {
                          date: new Date(proj.created_at).toLocaleString(i18n.language, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        })}
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
} 