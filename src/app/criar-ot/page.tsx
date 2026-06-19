import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import RelatoriosPage from "../relatorios/page";

export default async function CriarOtPage() {
	const session = await getAuthSession();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/criar-ot");
	}

	return <RelatoriosPage />;
}