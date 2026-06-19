const fs = require("fs"); let code = fs.readFileSync("src/app/stock/page.tsx", "utf8"); code = code.replace(`  async function saveInlineEdit(id: number) {`, `  async function quickUpdateCategory(id: number, newCategory: string) {
    setLoading(true);
    setMessage(null);
    try {
      await requestJson(\`/api/stock/\${id}\`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: newCategory }),
      });
      await fetchItens();
      setMessage({ type: "success", text: "Categoria atualizada com sucesso." });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Não foi possível atualizar a categoria." });
    } finally {
      setLoading(false);
    }
  }

  async function saveInlineEdit(id: number) {`); fs.writeFileSync("src/app/stock/page.tsx", code, "utf8"); console.log("OK2");
