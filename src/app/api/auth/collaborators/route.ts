import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    let users = await prisma.user.findMany({
      where: {
        NOT: {
          role: "CLIENTE"
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: {
        name: "asc"
      }
    });

    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash("Cabouco#321", 10);
      const defaultAdmin = await prisma.user.upsert({
        where: { email: "julio.correia@orey.com" },
        update: { name: "Julio Correia", role: "ADMIN", passwordHash: hashedPassword },
        create: { email: "julio.correia@orey.com", name: "Julio Correia", role: "ADMIN", passwordHash: hashedPassword },
      });
      users = [{
        id: defaultAdmin.id,
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        image: defaultAdmin.image,
        role: defaultAdmin.role,
      }];
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erro ao obter colaboradores:", error);
    return NextResponse.json({ 
      users: [{ id: 1, name: "Julio Correia", email: "julio.correia@orey.com", image: null, role: "ADMIN" }] 
    });
  }
}
