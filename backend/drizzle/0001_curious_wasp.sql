CREATE TYPE "public"."NotificationType" AS ENUM('LOW_STOCK', 'EXPIRY_WARNING', 'ORDER_SHIPPED', 'ORDER_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."RestockOrderStatus" AS ENUM('PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."Role" ADD VALUE 'DISTRIBUTOR';--> statement-breakpoint
CREATE TABLE "distributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact_number" varchar(20),
	"email" varchar(100) NOT NULL,
	"user_id" uuid,
	CONSTRAINT "distributors_email_unique" UNIQUE("email"),
	CONSTRAINT "distributors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"low_stock_threshold" integer DEFAULT 10,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "NotificationType" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prescription_fills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"prescription_medicine_id" uuid NOT NULL,
	"quantity_dispensed" integer NOT NULL,
	"dispensed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restock_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"distributor_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"status" "RestockOrderStatus" DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "adherence_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "inventories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "adherence_logs" CASCADE;--> statement-breakpoint
DROP TABLE "inventories" CASCADE;--> statement-breakpoint
DROP TABLE "transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prescription_medicines" ADD COLUMN "quantity_prescribed" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_fills" ADD CONSTRAINT "prescription_fills_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_fills" ADD CONSTRAINT "prescription_fills_prescription_medicine_id_prescription_medicines_id_fk" FOREIGN KEY ("prescription_medicine_id") REFERENCES "public"."prescription_medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_orders" ADD CONSTRAINT "restock_orders_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_orders" ADD CONSTRAINT "restock_orders_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_orders" ADD CONSTRAINT "restock_orders_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" DROP COLUMN "expiry_date";