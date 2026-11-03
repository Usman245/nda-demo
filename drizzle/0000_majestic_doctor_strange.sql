CREATE TABLE "deal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"strategy" text NOT NULL,
	"description" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"outcode" text NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"postcode" text NOT NULL,
	"purchase_price" integer NOT NULL,
	"refurb_cost" integer DEFAULT 0 NOT NULL,
	"other_costs" integer DEFAULT 0 NOT NULL,
	"sourcing_fee" integer DEFAULT 0 NOT NULL,
	"monthly_rent" integer NOT NULL,
	"service_charge_annual" integer DEFAULT 0 NOT NULL,
	"ground_rent_annual" integer DEFAULT 0 NOT NULL,
	"insurance_annual" integer DEFAULT 0 NOT NULL,
	"maintenance_pct" numeric(5, 2) DEFAULT '8' NOT NULL,
	"management_pct" numeric(5, 2) DEFAULT '10' NOT NULL,
	"voids_weeks" integer DEFAULT 3 NOT NULL,
	"ltv_pct" numeric(5, 2) DEFAULT '75' NOT NULL,
	"mortgage_rate_pct" numeric(5, 2) DEFAULT '5.5' NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deal_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"type" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"nda_id" uuid NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nda_signature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"signature_text" text NOT NULL,
	"consented" boolean NOT NULL,
	"ip" text,
	"user_agent" text,
	"signed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"brand_color" text DEFAULT '#0F766E' NOT NULL,
	"accent_color" text DEFAULT '#F59E0B' NOT NULL,
	"domain" text,
	"nda_text" text NOT NULL,
	"notify_email" text NOT NULL,
	"sourcer_name" text DEFAULT '' NOT NULL,
	"sourcer_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal" ADD CONSTRAINT "deal_org_id_org_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest" ADD CONSTRAINT "interest_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest" ADD CONSTRAINT "interest_nda_id_nda_signature_id_fk" FOREIGN KEY ("nda_id") REFERENCES "public"."nda_signature"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nda_signature" ADD CONSTRAINT "nda_signature_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deal_slug_idx" ON "deal" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_deal_idx" ON "event" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "nda_deal_idx" ON "nda_signature" USING btree ("deal_id");