import { useEffect } from "react";
import { useLocation } from "react-router";
import { scheduleAnalyticsInitialization, trackPageView } from "@/services/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    scheduleAnalyticsInitialization();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
