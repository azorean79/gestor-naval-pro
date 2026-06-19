import fitz, re

doc = fitz.open('documentacao/ocean safety spares.pdf')
page = doc[2]
raw = page.get_text("text")
print(repr(raw[:3000]))
