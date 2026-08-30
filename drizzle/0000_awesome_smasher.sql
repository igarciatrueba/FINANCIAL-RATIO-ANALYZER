CREATE TYPE "public"."analysis_result_type" AS ENUM('financial_analysis');--> statement-breakpoint
CREATE TYPE "public"."analysis_run_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."dataset_source_type" AS ENUM('manual', 'demo', 'import', 'scenario');--> statement-breakpoint
CREATE TYPE "public"."file_category" AS ENUM('financial_input', 'source_document', 'import', 'report');--> statement-breakpoint
CREATE TYPE "public"."statement_type" AS ENUM('income_statement', 'balance_sheet', 'cash_flow', 'working_capital');--> statement-breakpoint
CREATE TYPE "public"."value_source_type" AS ENUM('manual', 'demo', 'import', 'scenario');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"company_id" uuid,
	"event_type" varchar(128) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"result_type" "analysis_result_type" DEFAULT 'financial_analysis' NOT NULL,
	"schema_version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"dataset_version_id" uuid NOT NULL,
	"requested_by" uuid,
	"status" "analysis_run_status" DEFAULT 'pending' NOT NULL,
	"engine_version" varchar(128) NOT NULL,
	"input_schema_version" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_code" varchar(128),
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(255) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid,
	"uploaded_by" uuid,
	"original_filename" varchar(512) NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"category" "file_category" NOT NULL,
	"checksum" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "financial_dataset_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"financial_dataset_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source_type" "dataset_source_type" NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"canonical_input" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_datasets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "financial_statement_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"financial_statement_id" uuid NOT NULL,
	"metric_key" varchar(128) NOT NULL,
	"value" numeric(20, 6) NOT NULL,
	"source" "value_source_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_statements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dataset_version_id" uuid NOT NULL,
	"statement_type" "statement_type" NOT NULL,
	"period_year" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_assumptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scenario_id" uuid NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"assumptions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scenario_id" uuid NOT NULL,
	"source_dataset_version_id" uuid NOT NULL,
	"base_analysis_run_id" uuid NOT NULL,
	"engine_version" varchar(128) NOT NULL,
	"schema_version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"base_analysis_run_id" uuid NOT NULL,
	"source_dataset_version_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_provider" varchar(64) NOT NULL,
	"auth_provider_user_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_dataset_version_id_financial_dataset_versions_id_fk" FOREIGN KEY ("dataset_version_id") REFERENCES "public"."financial_dataset_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_dataset_versions" ADD CONSTRAINT "financial_dataset_versions_financial_dataset_id_financial_datasets_id_fk" FOREIGN KEY ("financial_dataset_id") REFERENCES "public"."financial_datasets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_dataset_versions" ADD CONSTRAINT "financial_dataset_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_datasets" ADD CONSTRAINT "financial_datasets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_datasets" ADD CONSTRAINT "financial_datasets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_statement_values" ADD CONSTRAINT "financial_statement_values_financial_statement_id_financial_statements_id_fk" FOREIGN KEY ("financial_statement_id") REFERENCES "public"."financial_statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_dataset_version_id_financial_dataset_versions_id_fk" FOREIGN KEY ("dataset_version_id") REFERENCES "public"."financial_dataset_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_assumptions" ADD CONSTRAINT "scenario_assumptions_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_results" ADD CONSTRAINT "scenario_results_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_results" ADD CONSTRAINT "scenario_results_source_dataset_version_id_financial_dataset_versions_id_fk" FOREIGN KEY ("source_dataset_version_id") REFERENCES "public"."financial_dataset_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_results" ADD CONSTRAINT "scenario_results_base_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("base_analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_base_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("base_analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_source_dataset_version_id_financial_dataset_versions_id_fk" FOREIGN KEY ("source_dataset_version_id") REFERENCES "public"."financial_dataset_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_workspace_created_at_idx" ON "activity_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_events_company_id_idx" ON "activity_events" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_results_run_type_unique" ON "analysis_results" USING btree ("analysis_run_id","result_type");--> statement-breakpoint
CREATE INDEX "analysis_results_analysis_run_id_idx" ON "analysis_results" USING btree ("analysis_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_runs_workspace_idempotency_unique" ON "analysis_runs" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "analysis_runs_workspace_created_at_idx" ON "analysis_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "analysis_runs_company_created_at_idx" ON "analysis_runs" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "analysis_runs_dataset_version_id_idx" ON "analysis_runs" USING btree ("dataset_version_id");--> statement-breakpoint
CREATE INDEX "companies_workspace_id_idx" ON "companies" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "files_storage_key_unique" ON "files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "files_workspace_created_at_idx" ON "files" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "files_company_id_idx" ON "files" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_dataset_versions_dataset_version_unique" ON "financial_dataset_versions" USING btree ("financial_dataset_id","version_number");--> statement-breakpoint
CREATE INDEX "financial_dataset_versions_dataset_id_idx" ON "financial_dataset_versions" USING btree ("financial_dataset_id");--> statement-breakpoint
CREATE INDEX "financial_datasets_company_id_idx" ON "financial_datasets" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_statement_values_statement_metric_unique" ON "financial_statement_values" USING btree ("financial_statement_id","metric_key");--> statement-breakpoint
CREATE INDEX "financial_statement_values_statement_id_idx" ON "financial_statement_values" USING btree ("financial_statement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_statements_version_type_year_unique" ON "financial_statements" USING btree ("dataset_version_id","statement_type","period_year");--> statement-breakpoint
CREATE INDEX "financial_statements_dataset_version_id_idx" ON "financial_statements" USING btree ("dataset_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scenario_assumptions_scenario_unique" ON "scenario_assumptions" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "scenario_results_scenario_id_idx" ON "scenario_results" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "scenarios_company_id_idx" ON "scenarios" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_identity_unique" ON "users" USING btree ("auth_provider","auth_provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces" USING btree ("owner_user_id");
