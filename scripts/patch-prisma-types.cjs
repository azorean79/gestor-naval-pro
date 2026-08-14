const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  '.prisma',
  'client',
  'index.d.ts'
);

const MODE_LINE = '    mode?: QueryMode';

const TARGET_LINES = [
  '    not?: NestedStringFilter<$PrismaModel> | string',
  '    not?: NestedStringNullableFilter<$PrismaModel> | string | null',
];

function ensureModeBefore(content, targetLine) {
  const escaped = targetLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `((?:\\n${MODE_LINE.replace('?', '\\?')})*)(\\n${escaped})`,
    'g'
  );
  let inserted = 0;
  const next = content.replace(re, (match, modes, rest) => {
    inserted++;
    return `\n${MODE_LINE}${rest}`;
  });
  return { content: next, inserted };
}

function main() {
  if (!fs.existsSync(TARGET)) {
    console.error(`Arquivo de tipos gerado não encontrado: ${TARGET}`);
    process.exit(1);
  }

  const original = fs.readFileSync(TARGET, 'utf8');
  let content = original;

  for (const targetLine of TARGET_LINES) {
    const { content: next, inserted } = ensureModeBefore(content, targetLine);
    content = next;
    const label = targetLine.trim();
    if (inserted > 0) {
      console.log(`Patch garantido (${inserted}x): ${label}`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(TARGET, content, 'utf8');
    console.log(`Prisma types patch aplicado em ${TARGET}`);
  } else {
    console.log('Nenhuma alteração necessária.');
  }
}

main();
