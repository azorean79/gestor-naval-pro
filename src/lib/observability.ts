import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export type ApiRequestContext = {
  requestId: string;
  module: string;
  route: string;
  method: string;
  userId: string | null;
  startedAt: number;
};

type LogLevel = 'info' | 'warn' | 'error';

function logStructured(level: LogLevel, event: string, payload: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.info(line);
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'Erro desconhecido');
}

export function beginApiRequest(request: Request, module: string, userId?: string | null): ApiRequestContext {
  const route = new URL(request.url).pathname;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const context: ApiRequestContext = {
    requestId,
    module,
    route,
    method: request.method,
    userId: userId ? String(userId) : null,
    startedAt: Date.now(),
  };

  logStructured('info', 'api.request.start', {
    requestId: context.requestId,
    module: context.module,
    route: context.route,
    method: context.method,
    userId: context.userId,
  });

  return context;
}

export function finishApiRequest(
  context: ApiRequestContext,
  status: number,
  extra: Record<string, unknown> = {}
) {
  logStructured('info', 'api.request.finish', {
    requestId: context.requestId,
    module: context.module,
    route: context.route,
    method: context.method,
    userId: context.userId,
    durationMs: Date.now() - context.startedAt,
    status,
    ...extra,
  });
}

export function captureApiError(
  context: ApiRequestContext,
  error: unknown,
  extra: Record<string, unknown> = {}
) {
  const normalizedError = toError(error);

  Sentry.withScope((scope) => {
    scope.setTag('module', context.module);
    scope.setTag('route', context.route);
    scope.setTag('method', context.method);
    scope.setTag('request_id', context.requestId);

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    scope.setContext('apiRequest', {
      requestId: context.requestId,
      module: context.module,
      route: context.route,
      method: context.method,
      durationMs: Date.now() - context.startedAt,
      ...extra,
    });

    Sentry.captureException(normalizedError);
  });

  logStructured('error', 'api.request.error', {
    requestId: context.requestId,
    module: context.module,
    route: context.route,
    method: context.method,
    userId: context.userId,
    durationMs: Date.now() - context.startedAt,
    errorName: normalizedError.name,
    errorMessage: normalizedError.message,
    ...extra,
  });
}

export function withRequestId(response: NextResponse, context: ApiRequestContext) {
  response.headers.set('x-request-id', context.requestId);
  return response;
}
