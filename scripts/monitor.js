// Script para monitorar o status do servidor Node.js (Next.js)


const http = require('http');
const { exec } = require('child_process');

// Permite configurar host e porta por variáveis de ambiente ou argumentos
const args = process.argv.slice(2);
const HOST = process.env.MONITOR_HOST || args[0] || 'localhost';
const PORT = parseInt(process.env.MONITOR_PORT || args[1] || '3000', 10);

const options = {
	hostname: HOST,
	port: PORT,
	path: '/',
	method: 'GET',
	timeout: 5000
};


function playAlert() {
	// Windows: beep usando PowerShell
	exec('powershell -c "[console]::beep(1000,500)"');
}

function restartServer() {
	// Comando para reiniciar servidor Node.js (ajuste conforme seu ambiente)
	// Exemplo: npm run dev
	console.log(`[${new Date().toISOString()}] Tentando reiniciar o servidor...`);
	exec('npm run dev', (error, stdout, stderr) => {
		if (error) {
			console.error(`[${new Date().toISOString()}] Falha ao reiniciar:`, error.message);
		} else {
			console.log(`[${new Date().toISOString()}] Comando de reinício executado.`);
		}
	});
}

let consecutiveFails = 0;

function checkServer() {
	const req = http.request(options, res => {
		if (res.statusCode === 200) {
			console.log(`[${new Date().toISOString()}] Servidor online (${HOST}:${PORT}) (status 200)`);
			consecutiveFails = 0;
		} else {
			console.error(`[${new Date().toISOString()}] Servidor respondeu com status: ${res.statusCode} (${HOST}:${PORT})`);
			consecutiveFails++;
			playAlert();
			if (consecutiveFails === 2) restartServer();
		}
	});

	req.on('error', error => {
		console.error(`[${new Date().toISOString()}] Erro ao conectar (${HOST}:${PORT}):`, error.message);
		consecutiveFails++;
		playAlert();
		if (consecutiveFails === 2) restartServer();
	});

	req.on('timeout', () => {
		req.abort();
		console.error(`[${new Date().toISOString()}] Timeout ao tentar conectar ao servidor (${HOST}:${PORT}).`);
		consecutiveFails++;
		playAlert();
		if (consecutiveFails === 2) restartServer();
	});

	req.end();
}

// Checa a cada 30 segundos
setInterval(checkServer, 30000);

// Checa imediatamente ao iniciar
checkServer();