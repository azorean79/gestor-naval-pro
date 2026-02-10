// Script padronizado para cálculos de testes SOLAS usando Prisma
// Execute: node scripts/calcular-testes-solas.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
const path = require('path');

async function main() {
	try {
		// Argumentos de linha de comando para filtro (exemplo: node script.js --cliente=123 --modelo=MKIV)
		const args = process.argv.slice(2);
		let where = {};
		args.forEach(arg => {
			if (arg.startsWith('--cliente=')) {
				where.clienteId = arg.split('=')[1];
			}
			if (arg.startsWith('--modelo=')) {
				where.modelo = arg.split('=')[1];
			}
		});

		// Buscar todas as jangadas (com filtro se houver)
		const jangadas = await prisma.jangada.findMany({ where });
		console.log('Total de jangadas:', jangadas.length);

		// Exemplo de cálculo: pressão de teste em milibares
		// Supondo que cada jangada tenha um campo "pressaoTeste" em kPa (kilopascal)
		// 1 kPa = 10 mbar (milibares)
		// Cálculo de pressões em milibares
		const pressoesMbar = jangadas
			.map(j => (j.pressaoTeste !== undefined && j.pressaoTeste !== null) ? j.pressaoTeste * 10 : null)
			.filter(v => v !== null);

		// Estatísticas
		const soma = pressoesMbar.reduce((a, b) => a + b, 0);
		const media = pressoesMbar.length ? soma / pressoesMbar.length : 0;
		const min = pressoesMbar.length ? Math.min(...pressoesMbar) : 0;
		const max = pressoesMbar.length ? Math.max(...pressoesMbar) : 0;
		const desvio = pressoesMbar.length ? Math.sqrt(pressoesMbar.reduce((a, b) => a + Math.pow(b - media, 2), 0) / pressoesMbar.length) : 0;

		// Validação padrão SOLAS (exemplo: 180 a 220 mbar)
		const LIMITE_MIN = 180;
		const LIMITE_MAX = 220;
		const foraPadrao = jangadas.filter(j => {
			if (j.pressaoTeste === undefined || j.pressaoTeste === null) return false;
			const mbar = j.pressaoTeste * 10;
			return mbar < LIMITE_MIN || mbar > LIMITE_MAX;
		});

		// Atualizar status no banco (campo pressaoStatus)
		for (const j of jangadas) {
			let pressaoMbar = null;
			if (j.pressaoTeste !== undefined && j.pressaoTeste !== null) {
				pressaoMbar = j.pressaoTeste * 10;
			}
			let status = null;
			if (pressaoMbar !== null) {
				status = (pressaoMbar >= LIMITE_MIN && pressaoMbar <= LIMITE_MAX) ? 'OK' : 'FORA_DO_PADRAO';
				// Atualiza apenas se o campo existir no schema
				try {
					await prisma.jangada.update({
						where: { id: j.id },
						data: { pressaoStatus: status },
					});
				} catch (e) {
					// Campo não existe ou erro, ignora
				}
			}
		}

		// Relatório detalhado
		const csvRows = [
			'id,numeroSerie,pressaoTeste_kPa,pressaoTeste_mbar,status'
		];
		jangadas.forEach(j => {
			let pressaoMbar = null;
			if (j.pressaoTeste !== undefined && j.pressaoTeste !== null) {
				pressaoMbar = j.pressaoTeste * 10;
			}
			const status = (pressaoMbar !== null && pressaoMbar >= LIMITE_MIN && pressaoMbar <= LIMITE_MAX) ? 'OK' : 'FORA DO PADRÃO';
			console.log(`Jangada: ${j.numeroSerie || j.id} | Pressão Teste: ${j.pressaoTeste ?? 'N/A'} kPa | ${pressaoMbar !== null ? pressaoMbar + ' mbar' : 'Sem valor'} | ${status}`);
			csvRows.push([
				j.id,
				j.numeroSerie || '',
				j.pressaoTeste ?? '',
				pressaoMbar ?? '',
				status
			].join(','));
		});

		// Estatísticas gerais
		console.log('\n--- Estatísticas Gerais ---');
		console.log('Média:', media.toFixed(2), 'mbar');
		console.log('Mínimo:', min.toFixed(2), 'mbar');
		console.log('Máximo:', max.toFixed(2), 'mbar');
		console.log('Desvio padrão:', desvio.toFixed(2), 'mbar');
		console.log('Total analisado:', pressoesMbar.length);
		console.log('Fora do padrão SOLAS (', LIMITE_MIN, '-', LIMITE_MAX, 'mbar ):', foraPadrao.length);
		if (foraPadrao.length) {
			console.log('IDs/Num. Série fora do padrão:');
			foraPadrao.forEach(j => {
				console.log('-', j.numeroSerie || j.id);
			});
		}

		// Exportar CSV
		const csvPath = path.join(__dirname, 'relatorio-pressao-solas.csv');
		fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
		console.log(`\nRelatório CSV salvo em: ${csvPath}`);
	} catch (error) {
		console.error('Erro ao calcular testes SOLAS:', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();