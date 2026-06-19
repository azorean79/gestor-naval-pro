const fs = require("fs"); let code = fs.readFileSync("src/app/stock/page.tsx", "utf8"); code = code.replace(`                    {isColumnVisible("categoria") && <td className="p-2">{item.categoria}</td>}`, `                    {isColumnVisible("categoria") && <td className="p-2">
                      <select 
                        value={item.categoria || ""} 
                        onChange={(e) => quickUpdateCategory(item.id, e.target.value)}
                        className="border rounded px-2 py-1 w-full text-xs bg-transparent hover:bg-gray-50 cursor-pointer"
                        disabled={loading}
                      >
                        <option value="">Sem categoria</option>
                        {categoriasDisponiveis.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>}`); fs.writeFileSync("src/app/stock/page.tsx", code, "utf8"); console.log("OK");
