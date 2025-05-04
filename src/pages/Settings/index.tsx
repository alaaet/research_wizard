import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GeneralTab from './GeneralTab';
import AIAgentsTab from './AIAgentsTab';
import IntegrationsTab from './IntegrationsTab';
import ResearchTab from './ResearchTab';

export default function SettingsPage() {
  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter max-w-xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai-agents">AI agents</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="ai-agents">
            <AIAgentsTab />
          </TabsContent>
          <TabsContent value="research">
            <ResearchTab />
          </TabsContent>
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageLayout>
  );
} 