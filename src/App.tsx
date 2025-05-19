import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ResearchProjectDetailPage from "./pages/ResearchProjectDetail";
import SettingsPage from "./pages/Settings/index";
import { UserMetaDataProvider } from './context/UserMetaDataContext';
import ResearchProjectsPage from "./pages/ResearchProjects";
import LiteraturePage from "./pages/Literature";
import LiteratureListingPage from "./pages/Literature/listing";
import { Toaster } from '@/components/ui/sonner';
import ViewPaperPage from "./pages/Literature/viewPaper";

const App = () => {
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
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </TooltipProvider>
      </HashRouter>
    </UserMetaDataProvider>
  );
};

export default App;
