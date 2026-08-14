export type PageParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export function parsePageParams(
  searchParams: URLSearchParams,
  defaults?: { pageSize?: number; maxPageSize?: number }
): PageParams {
  const maxPageSize = defaults?.maxPageSize ?? 200;
  const defaultPageSize = defaults?.pageSize ?? 50;
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const rawSize = Number(searchParams.get("pageSize") || searchParams.get("take") || defaultPageSize);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number.isFinite(rawSize) ? rawSize : defaultPageSize));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginatedResponse<T>(args: {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  extra?: Record<string, unknown>;
}) {
  const totalPages = Math.max(1, Math.ceil(args.total / args.pageSize));
  return {
    items: args.items,
    page: args.page,
    pageSize: args.pageSize,
    total: args.total,
    totalPages,
    hasMore: args.page < totalPages,
    ...(args.extra || {}),
  };
}
