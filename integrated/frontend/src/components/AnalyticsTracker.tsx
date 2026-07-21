import { useEffect } from "react";
import { useLocation } from "react-router";
import { initializeAnalytics, trackPageView } from "@/services/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    void initializeAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
