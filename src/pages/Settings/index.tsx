import React from "react";
import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GeneralTab from "./GeneralTab";
import AIAgentsTab from "./AIAgentsTab";
import IntegrationsTab from "./IntegrationsTab";
import ReportParametersTab from "./ReportParametersTab";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 animate-enter mx-auto w-full"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="report-parameters">
              Report Parameters
            </TabsTrigger>
            <TabsTrigger value="ai-agents">AI agents</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <GeneralTab />
            </Card>
          </TabsContent>
          <TabsContent value="report-parameters">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <ReportParametersTab />
            </Card>
          </TabsContent>
          <TabsContent value="ai-agents">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <AIAgentsTab />
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card className="max-w-2xl mx-auto p-8 shadow-lg">
              <IntegrationsTab />
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageLayout>
  );
}
