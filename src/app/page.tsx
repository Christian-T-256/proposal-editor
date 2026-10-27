import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function Home() {
  redirect(isDemoMode() ? "/p/northwind-dental-demo" : "/edit");
}
