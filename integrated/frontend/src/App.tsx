import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import "@/i18n";
import Home from "./pages/Home";
import { Toaster } from "@/components/ui/sonner";
import AnalyticsTracker from "@/components/AnalyticsTracker";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Report = lazy(() => import("./pages/Report"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GeneratorApp = lazy(() => import("./generator/App"));
const ReportAccess = lazy(() => import("./pages/ReportAccess"));
const SharedReport = lazy(() => import("./pages/SharedReport"));

export default function App() {
  return (
    <>
      <Toaster />
      <AnalyticsTracker />
      <Suspense fallback={<div className="min-h-screen bg-[#090611]" aria-label="Loading" />}>
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
      </Suspense>
    </>
  );
}
