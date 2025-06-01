import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Mail } from "lucide-react";
import PageLayout from '@/components/layout/PageLayout';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const Help: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('help.title')}</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('help.needHelp.title')}</CardTitle>
              <CardDescription>
                {t('help.needHelp.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('help.needHelp.reportIssues.title')}</h3>
                <p className="text-muted-foreground">
                  {t('help.needHelp.reportIssues.description')}
                </p>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => window.open('https://github.com/alaaet/research_wizard/issues', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('help.needHelp.reportIssues.button')}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('help.needHelp.contactSupport.title')}</h3>
                <p className="text-muted-foreground">
                  {t('help.needHelp.contactSupport.description')}
                </p>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => window.open('mailto:info@rwiz.eu')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {t('help.needHelp.contactSupport.button')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText('info@rwiz.eu');
                      toast.success(t('help.needHelp.contactSupport.emailCopied', 'Email address copied to clipboard'));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('help.license.title')}</CardTitle>
              <CardDescription>
                {t('help.license.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('help.license.content')}{' '}
                <a href="https://github.com/alaaet/research_wizard/blob/main/LICENSE" 
                   className="text-primary hover:underline" 
                   target="_blank" 
                   rel="noopener noreferrer">
                  {t('help.license.link')}
                </a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Help; 