import json
with open('scripts/ocean_safety_items.json', encoding='utf-8') as f:
    items = json.load(f)
with_img = sum(1 for it in items if it.get('imagem'))
print(f'Total: {len(items)}, images: {with_img}')
for it in items[:3]:
    ref = it['refFabricante']
    sell = it['precoVenda']
    buy = it['precoCompra']
    mn = it['quantidadeMinima']
    has_img = bool(it['imagem'])
    print(f'{ref} | sell={sell} buy={buy} min={mn} img={has_img}')
