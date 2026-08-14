#!/usr/bin/env python3
import json

print("=== Creating stock-import-data.json with 200 items ===")

# Create 200 stock items
data = []
for i in range(1, 201):
    item = {
        "referencia": f"REF-{i:05d}",
        "descricao": f"TESTE {i}",
        "categoria": "TEST",
        "quantidade": i,
        "precoVenda": float(i) + 10.0,
        "precoCompra": float(i) + 5.0,
        "codigoFabricante": f"CODE-{i:04d}",
        "localizacao": f"LOC-{i:03d}",
        "associavelJangada": False,
        "estadoArtigo": "NOVO"
    }
    data.append(item)

with open("scripts/stock-import-data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Created scripts/stock-import-data.json with {len(data)} items")
print(f"File size: {len(open('scripts/stock-import-data.json', 'rb').read())} bytes")
print("\nFirst 5 items:")
for i, item in enumerate(data[:5]):
    print(f"  {i+1}. {item['referencia']} - {item['descricao']}")