import prisma from '@/lib/prisma';
import { addMonths, format } from 'date-fns';

/**
 * API route that returns a map of dates (YYYY-MM-DD) to jangadas that have
 * at least one article whose validity expires within the next 12 months.
 * This is used by the agenda/calendar view to display expiring information per day.
 */
export async function GET() {
  try {
    const today = new Date();
    const limitDate = addMonths(today, 12);

    // Fetch articles with a validity date <= limitDate
    const articles = await prisma.artigoJangada.findMany({
      where: {
        validade: {
          not: null,
          lte: limitDate,
        },
      },
      select: {
        id: true,
        name: true,
        validade: true,
        Jangada: {
          select: {
            id: true,
            serial: true,
          },
        },
      },
    });

    // Group by the date of expiration (formatted as YYYY-MM-DD)
    const grouped: Record<string, Array<{ jangadaId: number; serial: string; articleId: number; articleName: string; validade: string }>> = {};
    for (const art of articles) {
      if (!art.validade) continue;
      const dateKey = format(new Date(art.validade), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push({
        jangadaId: art.Jangada?.id ?? 0,
        serial: art.Jangada?.serial ?? 'ND',
        articleId: art.id,
        articleName: art.name,
        validade: art.validade.toISOString().split('T')[0],
      });
    }

    return new Response(JSON.stringify(grouped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching expiring jangadas', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}
