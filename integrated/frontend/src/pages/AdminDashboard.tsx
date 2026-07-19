import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, LogOut, Plus, Pencil, Trash2, Loader2, Banknote, Settings, ShoppingCart, RotateCcw, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ageGroupApi, adminQuestionApi, answerApi, adminSettingsApi, adminOrderApi, deliverySettingsApi } from "@/services/api";
import type { AdminQuestionDTO, CreateQuestionRequest, AgeGroup, UpdateDeliverySettings } from "@/types/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Tab = "questions" | "ageGroups" | "answers" | "orders" | "settings";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin, isLoading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>("questions");

  useEffect(() => {
    if (!authLoading && !admin) {
      navigate("/admin");
    }
  }, [authLoading, admin, navigate]);

  if (authLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDF5]">
        <Loader2 size={32} className="animate-spin text-[#E8C547]" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="border-b border-[#E8E4DC] bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8C547]/15">
              <Shield size={18} className="text-[#E8C547]" />
            </div>
            <h1 className="font-['Fredoka'] text-xl text-[#2D2A26]">{t("dashboard")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#6B6560] sm:inline">{admin.username}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#6B6560] transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t("logout")}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[#E8E4DC] sm:gap-2">
          {(["questions", "ageGroups", "answers", "orders", "settings"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === tab
                  ? "border-b-2 border-[#E8C547] text-[#2D2A26]"
                  : "text-[#6B6560] hover:text-[#2D2A26]"
              }`}
            >
              {t(tab === "ageGroups" ? "ageGroups" : tab === "settings" ? "settings" : tab)}
            </button>
          ))}
        </div>

        {activeTab === "questions" && <QuestionsTab />}
        {activeTab === "ageGroups" && <AgeGroupsTab />}
        {activeTab === "answers" && <AnswersTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

function QuestionsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ageGroupId: 0,
    title: "",
    description: "",
    isActive: true,
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
    ] as { key: string; text: string }[],
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin", "questions"],
    queryFn: adminQuestionApi.list,
  });
  const { data: ageGroups } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
  });

  const createMutation = useMutation({
    mutationFn: adminQuestionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: CreateQuestionRequest }) =>
      adminQuestionApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminQuestionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      ageGroupId: 0,
      title: "",
      description: "",
      isActive: true,
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
      ],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ageGroupId || !formData.title) return;
    const left = formData.options.find((o) => o.key === "A")?.text.trim() || "";
    const right = formData.options.find((o) => o.key === "B")?.text.trim() || "";
    if (!left || !right) {
      toast.error("Both left (A) and right (B) poles are required");
      return;
    }

    const req: CreateQuestionRequest = {
      ageGroupId: formData.ageGroupId,
      isActive: formData.isActive,
      translations: [
        { languageCode: "en", title: formData.title, description: formData.description },
      ],
      options: [
        { key: "A", text: left },
        { key: "B", text: right },
      ],
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, req });
    } else {
      createMutation.mutate(req);
    }
  };

  const startEdit = (q: AdminQuestionDTO) => {
    setEditingId(q.id);
    const byKey = Object.fromEntries((q.options || []).map((o) => [o.key, o.text]));
    setFormData({
      ageGroupId: q.ageGroupId,
      title: q.translations.find((t) => t.languageCode === "en")?.title || q.translations[0]?.title || "",
      description:
        q.translations.find((t) => t.languageCode === "en")?.description ||
        q.translations[0]?.description ||
        "",
      isActive: q.isActive ?? true,
      options: [
        { key: "A", text: byKey.A || "" },
        { key: "B", text: byKey.B || "" },
      ],
    });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#E8C547]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-['Fredoka'] text-lg text-[#2D2A26]">{t("questions")}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-full bg-[#E8C547] px-4 py-2 text-sm font-medium text-[#2D2A26] transition-transform hover:scale-[1.02]"
        >
          <Plus size={16} />
          {t("createQuestion")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E8E4DC] bg-white p-6">
          <h3 className="mb-4 font-['Fredoka'] text-lg">{editingId ? t("editQuestion") : t("createQuestion")}</h3>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm text-[#6B6560]">{t("ageGroups")}</label>
              <select
                value={formData.ageGroupId}
                onChange={(e) => setFormData({ ...formData, ageGroupId: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#2D2A26] outline-none focus:border-[#E8C547]"
              >
                <option value={0}>{t("selectAgeGroup", "Select age group...")}</option>
                {ageGroups?.map((ag: AgeGroup) => (
                  <option key={ag.id} value={ag.id}>{ag.name} ({ag.minAge}-{ag.maxAge})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#6B6560]">{t("title")}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#2D2A26] outline-none focus:border-[#E8C547]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#6B6560]">Chapter (optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. I · How you meet the world"
                className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#2D2A26] outline-none focus:border-[#E8C547]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#6B6560]">
                Preference poles (A left / B right)
              </label>
              <p className="mb-2 text-xs text-[#6B6560]">
                Users pick intensity on a 6-point scale between these two sides.
              </p>
              <div className="grid gap-2">
                {formData.options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-start gap-2">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8C547]/15 text-xs font-bold text-[#2D2A26]">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[idx] = { ...opt, text: e.target.value };
                        setFormData({ ...formData, options: newOpts });
                      }}
                      placeholder={opt.key === "A" ? "Left pole (lean A)" : "Right pole (lean B)"}
                      className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#2D2A26] outline-none focus:border-[#E8C547]"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#2D2A26]">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 accent-[#E8C547]"
              />
              {t("active")}
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-full bg-[#E8C547] px-6 py-2.5 text-sm font-medium text-[#2D2A26] transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : t("save")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[#E8E4DC] px-6 py-2.5 text-sm text-[#6B6560] transition-colors hover:bg-[#E8E4DC]/20"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="hidden overflow-x-auto rounded-xl border border-[#E8E4DC] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#FFFDF5]">
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">ID</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("title")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">Poles</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("ageGroups")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("status")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {questions?.map((q: AdminQuestionDTO) => {
              const left = q.options?.find((o) => o.key === "A")?.text;
              const right = q.options?.find((o) => o.key === "B")?.text;
              return (
                <tr key={q.id} className="border-b border-[#E8E4DC]/50 transition-colors hover:bg-[#FFFDF5]/50">
                  <td className="px-4 py-3 text-[#6B6560]">{q.id}</td>
                  <td className="px-4 py-3 font-medium text-[#2D2A26]">
                    <div>{q.translations[0]?.title || "Untitled"}</div>
                    {q.translations[0]?.description && (
                      <div className="mt-0.5 text-xs font-normal text-[#6B6560]">{q.translations[0].description}</div>
                    )}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-[#6B6560]">
                    <div className="truncate"><span className="font-semibold text-[#2D2A26]">A</span> {left || "—"}</div>
                    <div className="truncate"><span className="font-semibold text-[#2D2A26]">B</span> {right || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560]">{q.ageGroupName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${q.isActive ? "bg-[#81B29A]/15 text-[#81B29A]" : "bg-[#E8E4DC]/50 text-[#6B6560]"}`}>
                      {q.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(q)} className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-[#E8C547]/10 hover:text-[#E8C547]">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => { if (confirm("Delete this question?")) deleteMutation.mutate(q.id); }} className="rounded-lg p-1.5 text-[#6B6560] transition-colors hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!questions || questions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#6B6560]">No questions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {questions?.map((q: AdminQuestionDTO) => {
          const left = q.options?.find((o) => o.key === "A")?.text || "—";
          const right = q.options?.find((o) => o.key === "B")?.text || "—";
          return (
            <article key={q.id} className="rounded-lg border border-[#E8E4DC] bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0"><span className="text-xs text-[#6B6560]">#{q.id}</span><h3 className="mt-1 text-sm font-medium leading-5 text-[#2D2A26]">{q.translations[0]?.title || "Untitled"}</h3></div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${q.isActive ? "bg-[#81B29A]/15 text-[#527664]" : "bg-[#E8E4DC]/50 text-[#6B6560]"}`}>{q.isActive ? "Active" : "Inactive"}</span>
              </div>
              <p className="text-xs text-[#6B6560]">{q.ageGroupName}</p>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[#6B6560]"><p><strong className="text-[#2D2A26]">A</strong> {left}</p><p><strong className="text-[#2D2A26]">B</strong> {right}</p></div>
              <div className="mt-3 flex justify-end gap-2 border-t border-[#E8E4DC] pt-3">
                <button aria-label="Edit question" onClick={() => startEdit(q)} className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E8E4DC]"><Pencil size={16} /></button>
                <button aria-label="Delete question" onClick={() => { if (confirm("Delete this question?")) deleteMutation.mutate(q.id); }} className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E8E4DC] text-red-500"><Trash2 size={16} /></button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AgeGroupsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ageGroups, isLoading } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
  });

  const currentPrice = ageGroups?.[0]?.price ?? 9.99;
  const [priceInput, setPriceInput] = useState("");

  const setPriceMutation = useMutation({
    mutationFn: (price: number) => ageGroupApi.setUnifiedPrice(price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ageGroups"] });
      toast.success(t("priceSaved", "Price saved"));
    },
    onError: (err: unknown) => {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        toast.error(t("priceSaveAuthFailed", "Session expired. Please log in again."));
        navigate("/admin");
        return;
      }
      toast.error(t("priceSaveFailed", "Failed to save price"));
    },
  });

  const handleSavePrice = () => {
    if (!localStorage.getItem("adminToken")) {
      toast.error(t("priceSaveAuthFailed", "Session expired. Please log in again."));
      navigate("/admin");
      return;
    }
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      toast.error(t("invalidPrice", "Please enter a valid price greater than 0"));
      return;
    }
    setPriceMutation.mutate(price);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#E8C547]" /></div>;
  }

  const displayPrice = priceInput !== "" ? priceInput : currentPrice.toFixed(2);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#E8E4DC] bg-white p-5">
        <h2 className="mb-1 font-['Fredoka'] text-lg text-[#2D2A26]">{t("unifiedPriceSettings", "Unified Price")}</h2>
        <p className="mb-4 text-sm text-[#6B6560]">{t("unifiedPriceDesc", "One price applies to all age groups.")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm text-[#6B6560]">{t("priceCny", "Price (CNY)")}</label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-[#6B6560]">¥</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={displayPrice}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-32 rounded-lg border border-[#E8E4DC] px-3 py-2 text-[#2D2A26] outline-none focus:border-[#E8C547]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSavePrice}
            disabled={setPriceMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E8C547] px-5 py-2.5 font-medium text-[#2D2A26] transition-all hover:bg-[#e0bc3f] disabled:opacity-60"
          >
            {setPriceMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Banknote size={18} />
            )}
            {t("savePrice", "Save Price")}
          </button>
        </div>
        <p className="mt-3 text-sm font-medium text-[#E07A5F]">
          {t("currentUnifiedPrice", "Current price")}: ¥{currentPrice.toFixed(2)}
        </p>
      </div>

      <h2 className="mb-4 font-['Fredoka'] text-lg text-[#2D2A26]">{t("ageGroups")}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ageGroups?.map((ag: AgeGroup) => (
          <div key={ag.id} className="rounded-xl border border-[#E8E4DC] bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-['Fredoka'] text-lg text-[#2D2A26]">{ag.name}</h3>
              <span className="text-sm text-[#6B6560]">{ag.minAge}-{ag.maxAge} {t("yearsOld")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page, search, status],
    queryFn: () => adminOrderApi.list(page, 20, search, status),
  });
  const retry = useMutation({
    mutationFn: adminOrderApi.retryReport,
    onSuccess: () => { toast.success("Report queued again"); queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: () => toast.error("Unable to retry report"),
  });
  const resend = useMutation({
    mutationFn: adminOrderApi.resendEmail,
    onSuccess: () => { toast.success("Email queued again"); queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: () => toast.error("Unable to resend email"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><ShoppingCart size={20} className="text-[#E8C547]" /><h2 className="font-['Fredoka'] text-lg text-[#2D2A26]">Orders</h2></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Order, report or email" className="w-full rounded-md border border-[#E8E4DC] py-2 pl-9 pr-3 text-sm sm:w-64" /></div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-[#E8E4DC] px-3 py-2 text-sm">
            <option value="">All payments</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-[#E8E4DC] bg-white md:block">
        <table className="min-w-[1250px] w-full text-sm">
          <thead><tr className="border-b border-[#E8E4DC] bg-[#FFFDF5]">
            {['Order','Email','Amount','Payment','PayPal','Report','Email delivery','Created','Actions'].map((h) => <th key={h} className="px-3 py-3 text-left font-medium text-[#6B6560]">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-[#E8C547]" /></td></tr>}
            {data?.items.map((order) => (
              <tr key={order.order_id} className="border-b border-[#E8E4DC]/60 align-top">
                <td className="px-3 py-3"><div className="font-mono text-xs">{order.order_id}</div><div className="mt-1 text-xs text-[#6B6560]">{order.payment_environment || '-'}</div></td>
                <td className="px-3 py-3">{order.email || '-'}</td>
                <td className="px-3 py-3">{(order.amount / 100).toFixed(2)} {order.currency}</td>
                <td className="px-3 py-3"><StatusBadge value={order.payment_status} />{order.paid_at && <div className="mt-1 text-xs text-[#6B6560]">{new Date(order.paid_at).toLocaleString()}</div>}</td>
                <td className="px-3 py-3 font-mono text-xs">{order.paypal_capture_id || order.paypal_order_id || '-'}</td>
                <td className="px-3 py-3"><StatusBadge value={order.generation_status || 'not started'} />{order.generation_error && <div className="mt-1 max-w-xs text-xs text-red-600">{order.generation_error}</div>}</td>
                <td className="px-3 py-3"><StatusBadge value={order.email_status === "SENT" ? "SMTP accepted" : (order.email_status || "not sent")} />{order.email_error && <div className="mt-1 max-w-xs text-xs text-red-600">{order.email_error}</div>}</td>
                <td className="px-3 py-3 text-xs text-[#6B6560]">{new Date(order.created_at).toLocaleString()}</td>
                <td className="px-3 py-3"><div className="flex gap-2">
                  <button
                    title={order.payment_status !== "paid" ? "Payment is required before generating a report" : /queued|generating/i.test(order.generation_status || "") ? "Report generation is already in progress" : "Retry report"}
                    onClick={() => retry.mutate(order.report_id)}
                    disabled={retry.isPending || order.payment_status !== "paid" || /queued|generating/i.test(order.generation_status || "")}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E4DC] disabled:cursor-not-allowed disabled:opacity-35"
                  ><RotateCcw size={15} /></button>
                  <button
                    title={order.payment_status === "paid" && order.generation_status === "COMPLETE" ? "Resend email" : "A completed paid report is required before sending email"}
                    onClick={() => resend.mutate(order.report_id)}
                    disabled={resend.isPending || order.payment_status !== "paid" || order.generation_status !== "COMPLETE"}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E8E4DC] disabled:cursor-not-allowed disabled:opacity-35"
                  ><Mail size={15} /></button>
                </div></td>
              </tr>
            ))}
            {!isLoading && !data?.items.length && <tr><td colSpan={9} className="py-12 text-center text-[#6B6560]">No orders found</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {isLoading && <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-[#E8C547]" /></div>}
        {data?.items.map((order) => (
          <article key={order.order_id} className="rounded-lg border border-[#E8E4DC] bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="break-all font-mono text-xs text-[#2D2A26]">{order.order_id}</p><p className="mt-1 break-all text-xs text-[#6B6560]">{order.email || "No email"}</p></div>
              <StatusBadge value={order.payment_status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#E8E4DC] py-3 text-xs">
              <div><p className="text-[#6B6560]">Amount</p><p className="mt-1 font-medium">{(order.amount / 100).toFixed(2)} {order.currency}</p></div>
              <div><p className="text-[#6B6560]">Environment</p><p className="mt-1 font-medium">{order.payment_environment || "-"}</p></div>
              <div><p className="text-[#6B6560]">Report</p><div className="mt-1"><StatusBadge value={order.generation_status || "not started"} /></div></div>
              <div><p className="text-[#6B6560]">Email</p><div className="mt-1"><StatusBadge value={order.email_status === "SENT" ? "SMTP accepted" : (order.email_status || "not sent")} /></div></div>
            </div>
            {order.generation_error && <p className="mt-3 text-xs text-red-600">{order.generation_error}</p>}
            {order.email_error && <p className="mt-2 text-xs text-red-600">{order.email_error}</p>}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[#6B6560]">{new Date(order.created_at).toLocaleString()}</p>
              <div className="flex gap-2">
                <button aria-label="Retry report" title="Retry report" onClick={() => retry.mutate(order.report_id)} disabled={retry.isPending || order.payment_status !== "paid" || /queued|generating/i.test(order.generation_status || "")} className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E8E4DC] disabled:opacity-35"><RotateCcw size={16} /></button>
                <button aria-label="Resend email" title="Resend email" onClick={() => resend.mutate(order.report_id)} disabled={resend.isPending || order.payment_status !== "paid" || order.generation_status !== "COMPLETE"} className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E8E4DC] disabled:opacity-35"><Mail size={16} /></button>
              </div>
            </div>
          </article>
        ))}
        {!isLoading && !data?.items.length && <p className="py-12 text-center text-sm text-[#6B6560]">No orders found</p>}
      </div>
      {data && data.total > data.pageSize && <div className="mt-4 flex justify-center gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border px-4 py-2 disabled:opacity-40">Previous</button><span className="px-2 py-2 text-sm">Page {page}</span><button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="rounded-md border px-4 py-2 disabled:opacity-40">Next</button></div>}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const success = /paid|complete|sent/i.test(value);
  const failed = /fail|closed|refund/i.test(value);
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${success ? 'bg-emerald-50 text-emerald-700' : failed ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{value}</span>;
}

function SettingsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminSettingsApi.get,
  });
  const [questionCount, setQuestionCount] = useState("");

  const saveMutation = useMutation({
    mutationFn: adminSettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["publicSettings"] });
      toast.success(t("settingsSaved", "Settings saved"));
    },
    onError: (err: unknown) => {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      if (status === 401 || status === 403) {
        toast.error(t("priceSaveAuthFailed", "Session expired. Please log in again."));
        navigate("/admin");
        return;
      }
      toast.error(t("settingsSaveFailed", "Failed to save settings"));
    },
  });

  const handleSave = () => {
    if (!localStorage.getItem("adminToken")) {
      toast.error(t("priceSaveAuthFailed", "Session expired. Please log in again."));
      navigate("/admin");
      return;
    }
    const count = parseInt(questionCount || String(settings?.quizQuestionCount ?? 20), 10);
    if (isNaN(count) || count < 1 || count > 20) {
      toast.error(t("invalidQuestionCount", "Question count must be between 1 and 20"));
      return;
    }
    saveMutation.mutate({
      quizQuestionCount: count,
      paymentMode: (settings?.paymentMode || "mock") as "mock" | "live",
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#E8C547]" /></div>;
  }

  const displayCount = questionCount !== "" ? questionCount : String(settings?.quizQuestionCount ?? 20);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-[#E8E4DC] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings size={20} className="text-[#E8C547]" />
          <h2 className="font-['Fredoka'] text-lg text-[#2D2A26]">{t("settings", "Settings")}</h2>
        </div>
        <p className="mb-6 text-sm text-[#6B6560]">{t("settingsDesc", "Configure quiz behavior. Stored securely in the database.")}</p>

        <div>
          <div>
            <label className="mb-1 block text-sm text-[#6B6560]">{t("quizQuestionCount", "Quiz question count")}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={displayCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-[#E8E4DC] px-3 py-2 text-[#2D2A26] outline-none focus:border-[#E8C547]"
            />
            <p className="mt-1 text-xs text-[#6B6560]">{t("quizQuestionCountHelp", "How many questions each user answers (1–20). Enforced on the server.")}</p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E8C547] px-5 py-2.5 font-medium text-[#2D2A26] transition-all hover:bg-[#e0bc3f] disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
          {t("saveSettings", "Save Settings")}
        </button>
      </div>
      <DeliverySettingsPanel />
    </div>
  );
}

function DeliverySettingsPanel() {
  const liveWebhookUrl = "https://divinlove.com/api/paypal/webhook";
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "delivery-settings"], queryFn: deliverySettingsApi.get });
  const [form, setForm] = useState<UpdateDeliverySettings>({});
  const save = useMutation({
    mutationFn: deliverySettingsApi.update,
    onSuccess: () => { toast.success("Payment and delivery settings saved"); setForm({}); queryClient.invalidateQueries({ queryKey: ["admin", "delivery-settings"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Unable to save delivery settings"),
  });
  const handleDeliverySave = () => {
    const webhookIds = [form.paypalSandboxWebhookId, form.paypalLiveWebhookId];
    if (webhookIds.some((value) => /^https?:\/\//i.test(value?.trim() || ""))) {
      toast.error("Webhook ID must be the WH-... value generated by PayPal, not a URL");
      return;
    }
    save.mutate(form);
  };
  if (isLoading) return <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-[#E8C547]" /></div>;
  if (isError || !data) return <div className="border-t border-[#E8E4DC] bg-white p-5"><p className="text-sm text-red-600">Unable to load payment and delivery settings.</p><button type="button" onClick={() => refetch()} className="mt-3 rounded-md border border-[#E8E4DC] px-4 py-2 text-sm">Retry</button></div>;
  const currentValues: Partial<Record<keyof UpdateDeliverySettings, string | number>> = {
    paypalSandboxClientId: data.paypalSandboxClientId,
    paypalSandboxSecret: data.paypalSandboxSecret,
    paypalSandboxWebhookId: data.paypalSandboxWebhookId,
    paypalLiveClientId: data.paypalLiveClientId,
    paypalLiveSecret: data.paypalLiveSecret,
    paypalLiveWebhookId: data.paypalLiveWebhookId,
    deepseekApiKey: data.deepseekApiKey,
    deepseekModel: data.deepseekModel,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    smtpUsername: data.smtpUsername,
    smtpPassword: data.smtpPassword,
    smtpFromAddress: data.smtpFromAddress,
  };
  const hasUnavailableSecrets = [
    data.paypalSandboxSecretConfigured && !data.paypalSandboxSecret,
    data.paypalSandboxWebhookConfigured && !data.paypalSandboxWebhookId,
    data.paypalLiveSecretConfigured && !data.paypalLiveSecret,
    data.paypalLiveWebhookConfigured && !data.paypalLiveWebhookId,
    data.deepseekConfigured && !data.deepseekApiKey,
    data.smtpPasswordConfigured && !data.smtpPassword,
  ].some(Boolean);
  const field = (key: keyof UpdateDeliverySettings, label: string, placeholder = "", help = "") => {
    return (
      <label className="block"><span className="mb-1 block text-sm text-[#6B6560]">{label}</span><input type="text" name={`delivery-${String(key)}`} value={String(form[key] ?? currentValues[key] ?? "")} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-form-type="other" className="w-full rounded-md border border-[#E8E4DC] px-3 py-2 text-sm" />{help && <span className="mt-1 block text-xs leading-5 text-[#6B6560]">{help}</span>}</label>
    );
  };
  return (
    <section className="border-t border-[#E8E4DC] bg-white p-5 text-[#2D2A26]">
      <div className="mb-5 flex items-center gap-2"><Settings size={20} className="text-[#E8C547]" /><h2 className="text-lg font-medium">PayPal, AI and SMTP email delivery</h2></div>
      {!data.encryptionConfigured && <p className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800">APP_CONFIG_ENCRYPTION_KEY is not loaded. Existing encrypted values are preserved but cannot be displayed or changed until the original key is restored.</p>}
      {data.encryptionConfigured && hasUnavailableSecrets && <p className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800">Some stored secrets were encrypted with the previous unavailable key. Re-enter the blank secret fields once, then save. Future restarts will keep them available.</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <label><span className="mb-1 block text-sm text-[#6B6560]">PayPal environment</span><select value={form.paypalEnvironment ?? data.paypalEnvironment} onChange={(e) => setForm((p) => ({ ...p, paypalEnvironment: e.target.value as 'sandbox' | 'live' }))} className="w-full rounded-md border border-[#E8E4DC] bg-white px-3 py-2 text-[#2D2A26]"><option value="sandbox">Sandbox</option><option value="live">Live</option></select></label>
        {field("deepseekModel", "DeepSeek model", data.deepseekModel)}
        {field("paypalSandboxClientId", "PayPal Sandbox Client ID", data.paypalSandboxClientId || "Not configured")}
        {field("paypalSandboxSecret", "PayPal Sandbox Secret")}
        {field("paypalSandboxWebhookId", `PayPal Sandbox Webhook ID${data.paypalSandboxWebhookConfigured ? ' (configured)' : ''}`, "WH-... (not a URL)", "Create a Sandbox webhook in PayPal, then paste its generated Webhook ID here.")}
        {field("paypalLiveClientId", "PayPal Live Client ID", data.paypalLiveClientId || "Not configured")}
        {field("paypalLiveSecret", "PayPal Live Secret")}
        {field("paypalLiveWebhookId", `PayPal Live Webhook ID${data.paypalLiveWebhookConfigured ? ' (configured)' : ''}`, "WH-... (not a URL)", `Live webhook URL: ${liveWebhookUrl}. Paste the WH-... ID generated by PayPal here.`)}
        {field("deepseekApiKey", "DeepSeek API Key")}
        {field("smtpHost", "SMTP Host", data.smtpHost || "smtp.example.com")}
        {field("smtpPort", "SMTP Port", String(data.smtpPort || 587))}
        {field("smtpUsername", "SMTP Username", data.smtpUsername || "mailbox@example.com")}
        {field("smtpPassword", "SMTP Password")}
        <label><span className="mb-1 block text-sm text-[#6B6560]">SMTP Encryption</span><select value={form.smtpSecurity ?? data.smtpSecurity} onChange={(e) => setForm((p) => ({ ...p, smtpSecurity: e.target.value as 'starttls' | 'ssl' | 'none' }))} className="w-full rounded-md border border-[#E8E4DC] bg-white px-3 py-2 text-[#2D2A26]"><option value="starttls">STARTTLS (usually port 587)</option><option value="ssl">SSL/TLS (usually port 465)</option><option value="none">None</option></select></label>
        {field("smtpFromAddress", "SMTP From address", data.smtpFromAddress || "Life Script <reports@example.com>")}
      </div>
      <button type="button" onClick={handleDeliverySave} disabled={save.isPending || !data.encryptionConfigured} className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#E8C547] px-5 py-2.5 font-medium text-[#2D2A26] disabled:opacity-50">{save.isPending ? <Loader2 size={17} className="animate-spin" /> : <Settings size={17} />}Save delivery settings</button>
    </section>
  );
}

function AnswersTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "answers", page],
    queryFn: () => answerApi.adminList(page, 20),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#E8C547]" /></div>;
  }

  return (
    <div>
      <h2 className="mb-4 font-['Fredoka'] text-lg text-[#2D2A26]">{t("answers")}</h2>
      <div className="hidden overflow-x-auto rounded-xl border border-[#E8E4DC] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#FFFDF5]">
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">ID</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("questions")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("yourAge")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("selectedOption", "Selected")}</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B6560]">{t("date")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((a) => (
              <tr key={a.id} className="border-b border-[#E8E4DC]/50 hover:bg-[#FFFDF5]/50">
                <td className="px-4 py-3 text-[#6B6560]">{a.id}</td>
                <td className="px-4 py-3 text-[#2D2A26]">{a.questionTitle}</td>
                <td className="px-4 py-3 text-[#6B6560]">{a.respondentAge}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E8C547]/15 text-sm font-bold text-[#2D2A26]">{a.selectedOption}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B6560]">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {(!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6B6560]">No answers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {data?.items?.map((a) => (
          <article key={a.id} className="rounded-lg border border-[#E8E4DC] bg-white p-4">
            <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium leading-5 text-[#2D2A26]">{a.questionTitle}</p><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8C547]/15 text-sm font-bold">{a.selectedOption}</span></div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#6B6560]"><span>Age {a.respondentAge}</span><span>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</span></div>
          </article>
        ))}
        {(!data?.items || data.items.length === 0) && <p className="py-12 text-center text-sm text-[#6B6560]">No answers found</p>}
      </div>
      {data && data.total > data.pageSize && (
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border border-[#E8E4DC] px-4 py-2 text-sm disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-[#6B6560]">Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="rounded-lg border border-[#E8E4DC] px-4 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
