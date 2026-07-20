import { useCallback, useEffect, useState } from "react";
import {
  PAYMENT_DISABLED,
  capturePaypalOrder,
  checkUnlock,
  createPaypalOrder,
  type PaymentMode,
} from "../services/paymentApi";
import type { ReportTypeId } from "../types/reportTypes";
import { settingsApi } from "@/services/api";

export function useReportUnlock(
  reportId: string | null,
  _options?: { reportType?: ReportTypeId }
) {
  const [isUnlocked, setIsUnlocked] = useState(PAYMENT_DISABLED);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<number | null>(null);
  const [tradeNo, setTradeNo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportPrice, setReportPrice] = useState<string | null>(null);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [pollExhausted] = useState(false);
  const paymentMode: PaymentMode = PAYMENT_DISABLED ? "disabled" : "paypal";

  const refresh = useCallback(async () => {
    if (!reportId || PAYMENT_DISABLED) { setLoading(false); return; }
    try {
      const result = await checkUnlock(reportId);
      setIsUnlocked(result.unlocked);
      setOrderId(result.orderId ?? null);
      setPaidAt(result.paidAt ?? null);
      setTradeNo(result.tradeNo ?? null);
    } catch {
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getPublic()
      .then((settings) => {
        if (!cancelled && Number.isFinite(Number(settings.reportPrice))) {
          setReportPrice(Number(settings.reportPrice).toFixed(2));
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paypal") !== "return") return;
    const paypalOrderId = params.get("token");
    if (!paypalOrderId) return;
    let cancelled = false;
    setConfirmingReturn(true);
    setPaying(true);
    capturePaypalOrder(paypalOrderId)
      .then((result) => {
        if (cancelled) return;
        if (!result.paid) throw new Error("PayPal has not confirmed this payment.");
        setIsUnlocked(true);
        setTradeNo(result.captureId);
        setPaidAt(Date.now());
        const clean = new URL(window.location.href);
        clean.searchParams.delete("paypal");
        clean.searchParams.delete("token");
        clean.searchParams.delete("PayerID");
        window.history.replaceState({}, "", clean.toString());
        return refresh();
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Unable to confirm PayPal payment."))
      .finally(() => { if (!cancelled) { setConfirmingReturn(false); setPaying(false); } });
    return () => { cancelled = true; };
  }, [refresh]);

  const startPay = useCallback(async () => {
    if (PAYMENT_DISABLED || !reportId) return;
    setPaying(true);
    setError(null);
    try {
      const result = await createPaypalOrder(reportId);
      if (!result.approvalUrl) throw new Error("PayPal did not provide an approval link.");
      sessionStorage.setItem("life_blueprint_paypal_order_id", result.paypalOrderId);
      window.location.assign(result.approvalUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start PayPal checkout.");
      setPaying(false);
    }
  }, [reportId]);

  return {
    isUnlocked,
    isPaid: isUnlocked && Boolean(paidAt ?? orderId ?? PAYMENT_DISABLED),
    orderId,
    paidAt,
    tradeNo,
    loading,
    paying,
    error,
    wechatHint: null,
    isWeChatInApp: false,
    paymentMode,
    confirmingReturn,
    pollExhausted,
    reportPrice,
    startPay,
    refresh,
  };
}
