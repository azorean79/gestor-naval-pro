import { NextRequest, NextResponse } from 'next/server';

// Rate limiting simples em memória (para produção, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(request: NextRequest, maxRequests = 10, windowMs = 60000) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  const now = Date.now();
  const windowStart = now - windowMs;

  const current = rateLimitMap.get(ip);

  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null; // OK
  }

  if (current.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  current.count++;
  return null; // OK
}