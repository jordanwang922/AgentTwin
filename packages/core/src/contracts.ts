export enum ChatReplyMode {
  FAQ = "faq",
  RAG = "rag",
  AI = "ai",
  MANUAL_BLOCK = "manual_block"
}

export interface NormalizedInboundMessage {
  tenantId: string;
  channel: string;
  groupId: string;
  userId: string;
  message: string;
  traceId: string;
  rawPayload?: unknown;
}

export interface ChatRequest {
  tenantId: string;
  channel: string;
  groupId: string;
  userId: string;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
}

export interface ChatReply {
  replyText: string;
  replyMode: ChatReplyMode;
  confidence: number;
  riskFlags: string[];
  citations: string[];
  latencyMs: number;
  traceId: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  aliases: string[];
  answer: string;
  citation: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  citation: string;
}

export interface RiskRule {
  id: string;
  keywords: string[];
  flag: string;
  replyText: string;
}

export interface MessageLogEntry {
  traceId: string;
  tenantId: string;
  groupId: string;
  userId: string;
  normalizedText: string;
  replyText: string;
  replyMode: ChatReplyMode;
  confidence: number;
  citations: string[];
  riskFlags: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  traceId: string;
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AdminOverview {
  tenantName: string;
  channelName: string;
  groupName: string;
  knowledgeCount: number;
  faqCount: number;
  riskRuleCount: number;
  latestMessages: MessageLogEntry[];
}

export type GroupTriggerMode = "mention_only" | "always";

export interface TenantProfile {
  id: string;
  name: string;
  brandName: string;
  replyStyle: string;
}

export interface ChannelProfile {
  id: string;
  tenantId: string;
  type: string;
  name: string;
}

export interface GroupProfile {
  id: string;
  groupId: string;
  name: string;
  autoReplyEnabled: boolean;
  triggerMode: GroupTriggerMode;
  botName: string;
}

export type AssistantMode = "teacher" | "student";

export interface RoleRoutingInput {
  userId: string;
  channel: string;
  source?: string;
}

export interface SopTemplate {
  id: string;
  name: string;
  channel: string;
  content: string;
  variables: string[];
  createdAt: string;
}

export type SopDeliveryType = "group" | "private";
export type SopTaskStatus = "pending" | "sent" | "failed";
export type DeliveryStatus = "prepared" | "sent" | "failed";

export interface SopTask {
  id: string;
  templateId: string;
  scheduleAt: string;
  deliveryType: SopDeliveryType;
  targetGroupId?: string;
  targetUserId?: string;
  status: SopTaskStatus;
  variables: Record<string, string>;
  attempts: number;
  createdAt: string;
  executedAt?: string;
}

export interface MessageDelivery {
  id: string;
  taskId: string;
  channel: string;
  targetType: SopDeliveryType;
  targetId: string;
  content: string;
  status: DeliveryStatus;
  createdAt: string;
  sentAt?: string;
}

export interface SopExecutionRecord {
  id: string;
  taskId: string;
  deliveryId: string;
  status: DeliveryStatus;
  renderedContent: string;
  createdAt: string;
}

export interface TeacherDashboard {
  templateCount: number;
  pendingTasks: number;
  failedDeliveries: number;
  latestTasks: SopTask[];
  latestDeliveries: MessageDelivery[];
}

export type LearnerSegment = "new" | "active" | "needs_follow_up" | "milestone";

export interface DialogueTurn {
  role: "user" | "assistant";
  message: string;
  createdAt: string;
}

export interface LearnerProfile {
  learnerId: string;
  completedLessons: string[];
  nextRecommendedLesson: string;
  conversationCount: number;
  lastInteractionAt?: string;
  lastLessonId?: string;
  segment: LearnerSegment;
  tags: string[];
  updatedAt: string;
}

export type TeacherAlertSeverity = "low" | "medium" | "high";
export type TeacherAlertType = "learner_needs_follow_up" | "risk_intervention" | "milestone_reached";

export interface TeacherAlert {
  id: string;
  learnerId: string;
  type: TeacherAlertType;
  severity: TeacherAlertSeverity;
  summary: string;
  source: "learner_profile" | "runtime_message";
  createdAt: string;
}

export interface UnifiedOpsDashboard {
  totalLearners: number;
  activeLearners: number;
  atRiskLearners: number;
  milestoneLearners: number;
  segmentCounts: Record<LearnerSegment, number>;
  topTags: Array<{ tag: string; count: number }>;
  recentLearners: LearnerProfile[];
  alerts: TeacherAlert[];
}
