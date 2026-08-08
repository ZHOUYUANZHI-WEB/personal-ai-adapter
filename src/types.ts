export type SourceKind =
  | "user"
  | "url"
  | "email"
  | "file"
  | "agent"
  | "external_system"
  | "unknown";

export interface InboxItem {
  id: string;
  type: "inbox";
  title?: string;
  created_at: string;
  updated_at?: string;
  source: {
    kind: SourceKind;
    reference?: string;
    captured_by?: string;
  };
  status: "new" | "processing" | "deferred" | "resolved";
  content: string;
  attachments?: string[];
  suggested_destination?: "project" | "knowledge" | "asset" | "archive" | "delete";
  resolved_to?: string[];
  defer_until?: string;
}

export interface Project {
  id: string;
  type: "project";
  title: string;
  status: "proposed" | "active" | "waiting" | "blocked" | "completed" | "archived";
  objective: string;
  current_state: string;
  current_focus?: string;
  last_completed?: string;
  next_actions: string[];
  open_questions?: string[];
  blockers?: string[];
  decisions?: string[];
  knowledge_links?: string[];
  asset_links?: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  type: "knowledge";
  title: string;
  status: "draft" | "verified" | "deprecated" | "archived";
  summary: string;
  content: string;
  sources: string[];
  scope?: string;
  confidence: "confirmed" | "inferred" | "uncertain";
  created_by: string;
  related_projects?: string[];
  related_knowledge?: string[];
  created_at: string;
  updated_at: string;
}

export type ProcessDestination = "project" | "knowledge";

export interface ProcessResult {
  inbox: InboxItem;
  destination: Project | KnowledgeItem;
  destinationPath: string;
}
