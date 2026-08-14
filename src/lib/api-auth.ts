import { NextRequest, NextResponse } from "next/server";
import { getAccessContext, type AccessContext } from "@/lib/access-control";
import { canEditPath } from "@/lib/user-permissions";

type AuthenticatedHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>>; access: AccessContext },
) => Promise<NextResponse>;

type WithAuthOptions = {
  requireEdit?: boolean;
  stationParam?: string;
};

/**
 * Higher-order function that wraps API route handlers with authentication.
 * Eliminates the repeated getAccessContext() + 401 check boilerplate.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { access }) => { ... });
 *   export const POST = withAuth(async (req, { access }) => { ... }, { requireEdit: true });
 */
export function withAuth(handler: AuthenticatedHandler, options?: WithAuthOptions) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    if (options?.requireEdit && !access.isAdmin && !canEditPath(access.permissions, "/stock")) {
      return NextResponse.json({ error: "Sem permissão para editar." }, { status: 403 });
    }

    if (options?.stationParam) {
      const resolvedParams = await context.params;
      const stationId = Number(resolvedParams[options.stationParam]);
      if (stationId && !access.isAdmin && !access.allowedStationIds.includes(stationId)) {
        return NextResponse.json({ error: "Sem acesso a esta estação." }, { status: 403 });
      }
    }

    return handler(req, { params: context.params, access });
  };
}

/**
 * Convenience wrapper for routes that only need view access check.
 */
export function withViewAuth(handler: AuthenticatedHandler) {
  return withAuth(handler);
}
