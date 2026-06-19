import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("title")) where.title = { contains: searchParams.get("title"), mode: "insensitive" };
  if (searchParams.get("published")) where.published = searchParams.get("published") === "true";
  if (searchParams.get("authorId")) where.authorId = Number(searchParams.get("authorId"));

  const posts = await prisma.post.findMany({
    where,
    include: { author: true }
  });
  return NextResponse.json(posts);
}
