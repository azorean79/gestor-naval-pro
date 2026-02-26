import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs são obrigatórios" },
        { status: 400 }
      );
    }

    // Simulação de exclusão - em modo offline, apenas retorna sucesso
    console.log("Excluindo itens do stock:", ids);

    return NextResponse.json({
      message: "Itens do stock excluídos com sucesso",
      deletedCount: ids.length
    });
  } catch (error) {
    console.error("Erro ao excluir itens do stock:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}