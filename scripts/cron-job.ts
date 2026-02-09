import { exec } from 'child_process';

function executarScript(script: string) {
  exec(`npx tsx ${script}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar ${script}:`, error);
      return;
    }
    console.log(`Saída de ${script}:\n`, stdout);
    if (stderr) console.error(`Stderr de ${script}:\n`, stderr);
  });
}

// Rotina diária
function rotinaDiaria() {
  executarScript('scripts/validar-validades-componentes.ts');
  executarScript('scripts/validar-componentes-jangada.ts');
  executarScript('scripts/gerar-relatorio-final.ts');
}

// Simulação de agendamento (substitua por cron real em produção)
setInterval(rotinaDiaria, 24 * 60 * 60 * 1000); // a cada 24h
console.log('Rotina automática de validação e relatório iniciada.');
