var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c;
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
const connectionString = (_c = (_b = (_a = process.env.DIRECT_URL) !== null && _a !== void 0 ? _a : process.env.DATABASE_URL) !== null && _b !== void 0 ? _b : process.env.gestornavalpro_DATABASE_URL) !== null && _c !== void 0 ? _c : process.env.GESTOR_DB;
if (!connectionString) {
    console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
    process.exit(1);
}
const prisma = new PrismaClient();
// Artigos relevantes a importar
const ARTIGOS_RELEVANTES = [
    'Handflares',
    'First Aid Kit',
    'Seasickness Tables',
    'Parachute Rockets',
    'Water Sachets',
    'Rações Alimentares 0,5 Kg',
    'Food Rations 0,5 Kg',
    'Lithium Battery',
    'Inside Light and Battery',
    'Top Light and Battery',
    'Smoke Signals',
    'Baterias',
    'Luzes',
];
const DATA_PATH = 'scripts/jangadas_pack_validades_2025.json';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        const data = JSON.parse(raw);
        const rows = Array.isArray(data.rows) ? data.rows : [];
        for (const row of rows) {
            const serial = (_a = row.raftSerial) === null || _a === void 0 ? void 0 : _a.trim();
            if (!serial)
                continue;
            const artigos = (Array.isArray(row.validities) ? row.validities : [])
                .filter((a) => ARTIGOS_RELEVANTES.includes(a.item))
                .map((a) => ({ item: a.item, validade: a.validade }));
            if (!artigos.length)
                continue;
            yield prisma.jangada.updateMany({
                where: { serial },
                data: { artigos: JSON.stringify(artigos) },
            });
            console.log(`Atualizado artigos da jangada ${serial}`);
        }
        yield prisma.$disconnect();
        console.log('Seed de artigos/validades concluído.');
    });
}
if (require.main === module) {
    main().catch(e => { console.error(e); process.exit(1); });
}
