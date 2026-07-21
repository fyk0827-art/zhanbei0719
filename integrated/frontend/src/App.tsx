import { Routes, Route } from "react-router";
import "@/i18n";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
import GeneratorApp from "./generator/App";
import ReportAccess from "./pages/ReportAccess";
import { Toaster } from "@/components/ui/sonner";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import SharedReport from "@/pages/SharedReport";

export default function App() {
  return (
    <>
      <Toaster />
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/generator/*" element={<GeneratorApp />} />
        <Route path="/report-access" element={<ReportAccess />} />
        <Route path="/shared-report/:shareId" element={<SharedReport />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
