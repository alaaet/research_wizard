import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ResearchProjectDetailPage from "./pages/ResearchProjectDetail";
import SettingsPage from "./pages/Settings";
import { UserMetaDataProvider } from './context/UserMetaDataContext';

const App = () => {
  return (
    <UserMetaDataProvider>
      <HashRouter>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects/:uid" element={<ResearchProjectDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </TooltipProvider>
      </HashRouter>
    </UserMetaDataProvider>
  );
};

export default App;
