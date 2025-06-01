import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ResearchProjectDetailPage from "./pages/Projects/ResearchProjectDetail";
import SettingsPage from "./pages/Settings/index";
import { UserMetaDataProvider } from './context/UserMetaDataContext';
import ResearchProjectsPage from "./pages/Projects/index";
import LiteraturePage from "./pages/Literature";
import LiteratureListingPage from "./pages/Literature/listing";
import { Toaster } from '@/components/ui/sonner';
import ViewPaperPage from "./pages/Literature/viewPaper";
import ResearchDrafts from "./pages/Writing";
import CreateDraftPage from "./pages/Writing/CreateDraft";
import ResearchDraftDetailPage from "./pages/Writing/ResearchDraftDetail";
import ReportDetails from "./pages/Writing/ReportDetails";
import Help from "./pages/Help";
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './lib/i18n';

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set initial document direction based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <UserMetaDataProvider>
      <HashRouter>
        <TooltipProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<ResearchProjectsPage />} />
            <Route path="/projects/:uid" element={<ResearchProjectDetailPage />} />
            <Route path="/literature" element={<LiteraturePage />} />
            <Route path="/literature/listing" element={<LiteratureListingPage />} />
            <Route path="/literature/view/:projectId/:uid" element={<ViewPaperPage />} />
            <Route path="/writing" element={<ResearchDrafts />} />
            <Route path="/writing/:projectId/create-draft" element={<CreateDraftPage />} />
            <Route path="/writing/draft/:uid" element={<ResearchDraftDetailPage />} />
            <Route path="/writing/draft/:uid/report" element={<ReportDetails />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </TooltipProvider>
      </HashRouter>
    </UserMetaDataProvider>
  );
};

export default App;
