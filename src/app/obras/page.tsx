import { redirect } from "next/navigation";
import { OT_CREATION_ROUTE } from "@/lib/permissions-catalog";

export default function ObrasLegacyPage() {
	redirect(OT_CREATION_ROUTE);
}