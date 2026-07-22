export interface AgeGroup {
  id: number;
  name: string;
  minAge: number;
  maxAge: number;
  price: number;
  sortOrder: number;
}

export interface OptionDTO {
  key: string;
  text: string;
}

export interface TranslationDTO {
  languageCode: string;
  title: string;
  description: string;
}

export interface QuestionDTO {
  id: number;
  ageGroupId: number;
  title: string;
  description: string;
  isActive: boolean;
  options: OptionDTO[];
  ageGroup?: AgeGroup;
}

export interface AdminQuestionDTO {
  id: number;
  ageGroupId: number;
  ageGroupName: string;
  isActive: boolean;
  translations: TranslationDTO[];
  options: OptionDTO[];
}

export interface AnswerDTO {
  id: number;
  questionId: number;
  respondentAge: number;
  selectedOption: string;
  questionTitle?: string;
  createdAt?: string;
}

export interface PageDTO<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface SubmitAnswerRequest {
  questionId: number;
  respondentAge: number;
  selectedOption: string;
}

export interface CreateQuestionRequest {
  ageGroupId: number;
  isActive: boolean;
  translations: TranslationDTO[];
  options: OptionDTO[];
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {
  id: number;
}

export interface PaymentRequest {
  questionId: number;
}

export interface PaymentVerifyRequest {
  paymentToken: string;
}

export interface PaymentCreateRequest {
  questionId: number;
}

export interface PaymentCreateResponse {
  tradeNo: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentCompleteRequest {
  tradeNo: string;
}

export interface PaymentCompleteResponse {
  tradeNo: string;
  status: string;
  orderId: string;
  frontendUrl: string;
}

export interface PublicSettings {
  quizQuestionCount: number;
  reportPrice: number;
  facebookPixelEnabled: boolean;
  facebookPixelId: string;
}

export interface ContactResponse {
  contactId: string;
  email: string;
  language: string;
  verified?: boolean;
}

export interface VerificationCodeResponse {
  email: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface AdminSettings {
  quizQuestionCount: number;
  paymentMode: "mock" | "live";
  facebookPixelEnabled: boolean;
  facebookPixelId: string;
  facebookCapiEnabled: boolean;
  facebookCapiAccessToken: string;
  facebookCapiAccessTokenConfigured: boolean;
  facebookCapiTestEventCode: string;
  facebookCapiApiVersion: string;
}

export interface UpdateSettingsRequest {
  quizQuestionCount?: number;
  paymentMode?: "mock" | "live";
  facebookPixelEnabled?: boolean;
  facebookPixelId?: string;
  facebookCapiEnabled?: boolean;
  facebookCapiAccessToken?: string;
  facebookCapiTestEventCode?: string;
  facebookCapiApiVersion?: string;
}

export interface AnalyticsDiagnostics {
  capiEnabled: boolean;
  pending: number;
  sending: number;
  failed: number;
  sent: number;
  latest?: {
    event_name?: string;
    status?: string;
    attempts?: number;
    sent_at?: number;
    last_error?: string;
  } | null;
  providers: Array<{
    provider: string;
    status: string;
    last_event?: string;
    last_ready_at?: number;
    last_event_at?: number;
    last_error?: string;
  }>;
}

export interface AdminContact {
  email: string;
  language: string;
  created_at: number;
  last_seen_at: number;
  verified_at?: number;
}

export interface AdminOrder {
  order_id: string;
  report_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  email?: string;
  payment_environment?: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  refund_status?: string;
  created_at: number;
  paid_at?: number;
  generation_status?: string;
  generation_started_at?: number;
  generation_completed_at?: number;
  generation_error?: string;
  email_status?: string;
  email_sent_at?: number;
  email_error?: string;
}

export interface DeliverySettings {
  paypalEnvironment: "sandbox" | "live";
  paypalSandboxClientId: string;
  paypalSandboxSecret: string;
  paypalSandboxWebhookId: string;
  paypalSandboxSecretConfigured: boolean;
  paypalSandboxWebhookConfigured: boolean;
  paypalLiveClientId: string;
  paypalLiveSecret: string;
  paypalLiveWebhookId: string;
  paypalLiveSecretConfigured: boolean;
  paypalLiveWebhookConfigured: boolean;
  deepseekApiKey: string;
  deepseekConfigured: boolean;
  deepseekModel: string;
  smtpConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpPasswordConfigured: boolean;
  smtpSecurity: "starttls" | "ssl" | "none";
  smtpFromAddress: string;
  encryptionConfigured: boolean;
}

export interface UpdateDeliverySettings {
  paypalEnvironment?: "sandbox" | "live";
  paypalSandboxClientId?: string;
  paypalSandboxSecret?: string;
  paypalSandboxWebhookId?: string;
  paypalLiveClientId?: string;
  paypalLiveSecret?: string;
  paypalLiveWebhookId?: string;
  deepseekApiKey?: string;
  deepseekModel?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecurity?: "starttls" | "ssl" | "none";
  smtpFromAddress?: string;
}

/** @deprecated use PaymentCreateResponse */
export interface PaymentResponse {
  paymentToken: string;
  amount: number;
  status: string;
}

export interface PartnerConfirmRequest {
  tradeNo: string;
  amount?: number;
  payerContact?: string;
}

export interface PartnerConfirmResponse {
  ok: boolean;
  alreadyConfirmed?: boolean;
  orderId: string;
  prepaid?: boolean;
  reportPending?: boolean;
  frontendUrl: string;
  amount?: number;
  amountDisplay?: string;
  hint?: string;
  tradeNo?: string;
}
