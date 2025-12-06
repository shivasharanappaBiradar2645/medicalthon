CREATE TABLE "adherence_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"taken_at" timestamp DEFAULT now(),
	"missed" boolean DEFAULT false,
	"remarks" text
);
--> statement-breakpoint
ALTER TABLE "adherence_logs" ADD CONSTRAINT "adherence_logs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_logs" ADD CONSTRAINT "adherence_logs_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;