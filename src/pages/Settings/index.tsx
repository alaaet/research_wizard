import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import GeneralTab from "./GeneralTab";
import ReportParametersTab from "./ReportParametersTab";
import AIAgentsTab from "./AIAgentsTab";
import IntegrationsTab from "./IntegrationsTab";
import { Card } from "@/components/ui/card";

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter mx-auto w-full"
        dir={dir}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('settings.title')}</h1>
        <Tabs defaultValue="general" className="w-full" dir={dir}>
          <TabsList className={`mb-4`}>
            <TabsTrigger value="general">{t('settings.general.title')}</TabsTrigger>
            <TabsTrigger value="report-parameters">
              {t('settings.reportParameters.title')}
            </TabsTrigger>
            <TabsTrigger value="ai-agents">{t('settings.aiAgents.title')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('settings.integrations.title')}</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <GeneralTab dir={dir} />
            </Card>
          </TabsContent>
          <TabsContent value="report-parameters">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <ReportParametersTab dir={dir} />
            </Card>
          </TabsContent>
          <TabsContent value="ai-agents">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <AIAgentsTab dir={dir} />
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <IntegrationsTab dir={dir} />
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageLayout>
  );
};

export default SettingsPage;
