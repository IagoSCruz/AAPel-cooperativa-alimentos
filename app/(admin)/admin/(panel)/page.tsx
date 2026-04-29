/**
 * Admin home — for now, redirects to /admin/curadorias (the main feature
 * in Phase 2B). A real dashboard with KPIs lands in Phase 4.
 */

import { redirect } from "next/navigation";

export default function AdminHomePage() {
  redirect("/admin/curadorias");
}
