CREATE TYPE "public"."document_extraction_candidate_kind" AS ENUM('direct', 'aggregation', 'average');--> statement-breakpoint
CREATE TYPE "public"."document_extraction_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."document_extraction_provenance" AS ENUM('PDF_EXTRACTED', 'USER_PROVIDED', 'USER_OVERRIDE', 'DERIVED', 'NOT_FOUND', 'CONFLICT');--> statement-breakpoint
CREATE TYPE "public"."document_extraction_review_state" AS ENUM('UNREVIEWED', 'NEEDS_REVIEW', 'USER_CONFIRMED');--> statement-breakpoint
CREATE TYPE "public"."document_extraction_status" AS ENUM('pending', 'processing', 'ready_for_review', 'failed', 'unsupported', 'superseded');--> statement-breakpoint
CREATE TABLE "document_extraction_candidates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"canonical_field_key" varchar(128) NOT NULL,
	"period_slot_index" integer NOT NULL,
	"candidate_kind" "document_extraction_candidate_kind" NOT NULL,
	"normalized_value" numeric(20, 6),
	"confidence" "document_extraction_confidence" NOT NULL,
	"source_evidence" jsonb NOT NULL,
	"diagnostics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_candidate_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_extraction_draft_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"canonical_field_key" varchar(128) NOT NULL,
	"period_slot_index" integer NOT NULL,
	"current_candidate_id" uuid,
	"original_candidate_id" uuid,
	"provenance_type" "document_extraction_provenance" NOT NULL,
	"review_state" "document_extraction_review_state" NOT NULL,
	"form_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_extraction_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"company_id" uuid,
	"requested_by" uuid,
	"status" "document_extraction_status" DEFAULT 'pending' NOT NULL,
	"engine_version" varchar(128) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"document_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"safe_failure_code" varchar(128),
	"safe_failure_message" text,
	"confirmed_dataset_version_id" uuid,
	"confirmed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_extraction_candidates" ADD CONSTRAINT "document_extraction_candidates_run_id_document_extraction_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."document_extraction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_draft_fields" ADD CONSTRAINT "document_extraction_draft_fields_run_id_document_extraction_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."document_extraction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_draft_fields" ADD CONSTRAINT "document_extraction_draft_fields_current_candidate_id_document_extraction_candidates_id_fk" FOREIGN KEY ("current_candidate_id") REFERENCES "public"."document_extraction_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_draft_fields" ADD CONSTRAINT "document_extraction_draft_fields_original_candidate_id_document_extraction_candidates_id_fk" FOREIGN KEY ("original_candidate_id") REFERENCES "public"."document_extraction_candidates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_runs" ADD CONSTRAINT "document_extraction_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_runs" ADD CONSTRAINT "document_extraction_runs_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_runs" ADD CONSTRAINT "document_extraction_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_runs" ADD CONSTRAINT "document_extraction_runs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extraction_runs" ADD CONSTRAINT "document_extraction_runs_confirmed_dataset_version_id_financial_dataset_versions_id_fk" FOREIGN KEY ("confirmed_dataset_version_id") REFERENCES "public"."financial_dataset_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_extraction_candidates_run_field_slot_idx" ON "document_extraction_candidates" USING btree ("run_id","canonical_field_key","period_slot_index");--> statement-breakpoint
CREATE INDEX "document_extraction_candidates_run_confidence_idx" ON "document_extraction_candidates" USING btree ("run_id","confidence");--> statement-breakpoint
CREATE UNIQUE INDEX "document_extraction_draft_fields_run_field_slot_unique" ON "document_extraction_draft_fields" USING btree ("run_id","canonical_field_key","period_slot_index");--> statement-breakpoint
CREATE INDEX "document_extraction_draft_fields_run_id_idx" ON "document_extraction_draft_fields" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "document_extraction_runs_workspace_created_at_idx" ON "document_extraction_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "document_extraction_runs_file_id_idx" ON "document_extraction_runs" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "document_extraction_runs_company_id_idx" ON "document_extraction_runs" USING btree ("company_id");