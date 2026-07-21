import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  AgeGroup,
  QuestionDTO,
  AdminQuestionDTO,
  AnswerDTO,
  PageDTO,
  LoginRequest,
  LoginResponse,
  SubmitAnswerRequest,
  CreateQuestionRequest,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentCompleteRequest,
  PaymentCompleteResponse,
  PublicSettings,
  AdminSettings,
  UpdateSettingsRequest,
  ContactResponse,
  VerificationCodeResponse,
  AdminOrder,
  DeliverySettings,
  UpdateDeliverySettings,
  AdminContact,
  AnalyticsDiagnostics,
} from "@/types/api";

// 默认走相对路径 /api，由 Vite 代理到本机后端；内网其他电脑访问时勿写死 localhost
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "";

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor - attach admin token when available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor - extract data
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(error);
  }
);

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  return res.data.data;
}

// ======== Auth API ========
export const authApi = {
  login: (req: LoginRequest) => post<LoginResponse>("/admin/login", req),
  me: () => get<string>("/admin/me"),
};

// ======== Age Group API ========
export const ageGroupApi = {
  list: () => get<AgeGroup[]>("/age-groups"),
  setUnifiedPrice: (price: number) =>
    put<void>("/age-groups/admin/price", { price }),
};

// ======== Settings API ========
export const settingsApi = {
  getPublic: () => get<PublicSettings>("/settings/public"),
};

export const contactApi = {
  save: (email: string) => post<ContactResponse>("/contacts", { email, language: "en" }),
  sendCode: (email: string) => post<VerificationCodeResponse>("/contacts/send-code", { email, language: "en" }),
  verifyCode: (email: string, code: string) => post<ContactResponse>("/contacts/verify-code", { email, code, language: "en" }),
};

export const adminSettingsApi = {
  get: () => get<AdminSettings>("/admin/settings"),
  update: (req: UpdateSettingsRequest) => put<AdminSettings>("/admin/settings", req),
  analyticsDiagnostics: () => get<AnalyticsDiagnostics>("/admin/analytics/diagnostics"),
  sendAnalyticsTest: () => post<{ queued: boolean }>("/admin/analytics/test"),
  retryAnalytics: () => post<{ retried: number }>("/admin/analytics/retry"),
};

// ======== Question API ========
export const questionApi = {
  list: (ageGroupId: number, language: string) =>
    get<QuestionDTO[]>("/questions", { ageGroupId, language }),
  submitAnswer: (req: SubmitAnswerRequest) =>
    post<number>("/questions/answer", req),
  submitAnswersBatch: async (answers: SubmitAnswerRequest[]) => {
    const response = await fetch(`${API_BASE}/api/questions/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
      keepalive: true,
    });
    const payload = await response.json() as ApiResponse<{ saved: number }>;
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Unable to save quiz answers");
    }
    return payload.data;
  },
};

// ======== Admin Question API ========
export const adminQuestionApi = {
  list: () => get<AdminQuestionDTO[]>("/admin/questions"),
  create: (req: CreateQuestionRequest) =>
    post<number>("/admin/questions", req),
  update: (id: number, req: CreateQuestionRequest) =>
    put<void>(`/admin/questions/${id}`, req),
  delete: (id: number) => del<void>(`/admin/questions/${id}`),
};

// ======== Answer API ========
export const answerApi = {
  adminList: (page: number = 1, pageSize: number = 20) =>
    get<PageDTO<AnswerDTO>>("/admin/answers", { page, pageSize }),
};

export const adminOrderApi = {
  list: (page = 1, pageSize = 20, search = "", status = "") =>
    get<PageDTO<AdminOrder>>("/admin/orders", { page, pageSize, search, status }),
  retryReport: (reportId: string) => post<void>(`/admin/reports/${encodeURIComponent(reportId)}/retry`),
  resendEmail: (reportId: string) => post<void>(`/admin/reports/${encodeURIComponent(reportId)}/resend`),
};

export const adminContactApi = {
  list: (page = 1, pageSize = 20, search = "", verified = "all") =>
    get<PageDTO<AdminContact>>("/admin/contacts", { page, pageSize, search, verified }),
  exportCsv: async (search = "", verified = "all") => {
    const response = await apiClient.get<Blob>("/admin/contacts/export", {
      params: { search, verified },
      responseType: "blob",
    });
    return response.data;
  },
};

export const deliverySettingsApi = {
  get: () => get<DeliverySettings>("/admin/delivery-settings"),
  update: (req: UpdateDeliverySettings) => put<DeliverySettings>("/admin/delivery-settings", req),
};

// ======== Payment API (server-side mock/live) ========
export const paymentApi = {
  create: (req: PaymentCreateRequest) =>
    post<PaymentCreateResponse>("/payments/create", req),
  complete: (req: PaymentCompleteRequest) =>
    post<PaymentCompleteResponse>("/payments/complete", req),
};

export default apiClient;
