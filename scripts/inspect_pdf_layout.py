import fitz, re

doc = fitz.open('documentacao/ocean safety spares.pdf')
page = doc[2]

# Get text blocks with positions
print('Text blocks (OSL lines) on page 3:')
blocks = page.get_text('dict')['blocks']
for b in blocks:
    if b['type'] == 0:
        y0 = b['bbox'][1]
        y1 = b['bbox'][3]
        for line in b['lines']:
            txt = ' '.join(s['text'] for s in line['spans'])
            if re.match(r'^OSL', txt.strip()):
                print(f'  y={y0:.1f}-{y1:.1f} | {txt[:80]}')

print()
imgs = page.get_images(full=True)
print(f'Images: {len(imgs)}')
for img in imgs:
    xref = img[0]
    rects = page.get_image_rects(xref)
    for r in rects:
        print(f'  xref={xref} y={r.y0:.1f}-{r.y1:.1f} x={r.x0:.1f}-{r.x1:.1f} size={img[2]}x{img[3]}')
