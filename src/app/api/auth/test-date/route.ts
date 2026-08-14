import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const d1 = new Date();
  const d2 = Date.now();
  const iso = d1.toISOString();

  let user = null;
  let updateError = null;
  try {
    user = await prisma.user.findUnique({ where: { id: 1 }, select: { id: true, email: true, role: true } });
  } catch (e) {
    updateError = "find: " + (e as Error).message;
  }

  try {
    await prisma.user.update({
      where: { id: 1 },
      data: { lastLoginAt: new Date() },
    });
  } catch (e) {
    updateError = (updateError ? updateError + " | " : "") + "update: " + (e as Error).message;
  }

  return NextResponse.json({
    dateValue: typeof d1 === "object" ? Object.prototype.toString.call(d1) : typeof d1,
    dateType: typeof d1,
    dateConstructor: d1?.constructor?.name,
    dateKeys: Object.keys(d1 || {}),
    dateIso: iso,
    dateNow: d2,
    user,
    updateError,
  });
}
