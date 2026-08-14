import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

function resolvePythonCommand(): string | null {
  const candidates = ["python", "py -3", "python3"];
  for (const candidate of candidates) {
    try {
      execSync(`${candidate} --version`, { stdio: "pipe", timeout: 10000 });
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const templatePath = path.join(process.cwd(), "templates", "FICHA_DGRM_TEMPLATE.docx");
    const scriptPath = path.join(process.cwd(), "scripts", "gerar_dgrm_docx.py");
    const tempJsonPath = path.join(os.tmpdir(), "temp_dgrm_data.json");
    const outputPath = path.join(os.tmpdir(), "temp_dgrm_output.docx");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template DGRM nao encontrado" }, { status: 500 });
    }

    const pythonCmd = resolvePythonCommand();
    if (!pythonCmd) {
      return NextResponse.json(
        { error: "Python nao encontrado no PATH do servidor (python, py, python3)." },
        { status: 500 }
      );
    }

    // Write data to temp file to avoid command line length limit
    fs.writeFileSync(tempJsonPath, JSON.stringify(data), "utf-8");

    let stderr = "";
    try {
      execSync(
        `${pythonCmd} "${scriptPath}" "${templatePath}" "${outputPath}" "${tempJsonPath}"`,
        { timeout: 30000, encoding: "utf-8" }
      );
    } catch (err) {
      stderr = (err as { stderr?: string | Buffer })?.stderr
        ? String((err as { stderr: string | Buffer }).stderr)
        : String((err as Error)?.message || err);
    }

    // Clean up temp JSON
    try { fs.unlinkSync(tempJsonPath); } catch {}

    if (!fs.existsSync(outputPath)) {
      return NextResponse.json(
        { error: stderr ? `Erro ao gerar ficha DGRM: ${stderr}` : "Erro ao gerar ficha DGRM" },
        { status: 500 }
      );
    }

    const fileBuffer = fs.readFileSync(outputPath);
    try { fs.unlinkSync(outputPath); } catch {}

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Ficha_DGRM_Jangada.docx"`,
      },
    });
  } catch (err) {
    console.error("Erro ao gerar DGRM DOCX:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
