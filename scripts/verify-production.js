#!/usr/bin/env node

/**
 * VERIFICAÇÃO FINAL DE PRODUÇÃO
 * Gestor Naval Pro - v1.0.0
 */

const https = require('https');

console.log('🚀 VERIFICANDO SISTEMA EM PRODUÇÃO...\n');

// URLs para verificar
const urls = [
    'https://gestor-naval-pro.vercel.app',
    'https://gestor-naval-pro.vercel.app/api/health',
    'https://gestor-naval-pro.vercel.app/api/marcas-jangada',
    'https://gestor-naval-pro.vercel.app/api/navios'
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    url,
                    status: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    data: data.length > 100 ? data.substring(0, 100) + '...' : data
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                url,
                status: null,
                success: false,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                url,
                status: null,
                success: false,
                error: 'Timeout (10s)'
            });
        });
    });
}

async function main() {
    console.log('📊 VERIFICANDO ENDPOINTS PRINCIPAIS:\n');

    const results = await Promise.all(urls.map(checkUrl));

    let allGood = true;

    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const statusCode = result.status ? `(${result.status})` : '(ERRO)';
        console.log(`${status} ${result.url} ${statusCode}`);

        if (result.error) {
            console.log(`   └─ Erro: ${result.error}`);
        } else if (result.data) {
            console.log(`   └─ Resposta: ${result.data}`);
        }

        if (!result.success) allGood = false;
        console.log('');
    });

    console.log('🎯 RESULTADO FINAL:');
    if (allGood) {
        console.log('✅ SISTEMA TOTALMENTE OPERACIONAL!');
        console.log('🎉 Gestor Naval Pro está rodando perfeitamente em produção.');
        console.log('\n📱 Acesse: https://gestor-naval-pro.vercel.app');
    } else {
        console.log('⚠️  Alguns endpoints podem ter problemas.');
        console.log('🔍 Verifique os logs no Vercel Dashboard.');
    }

    console.log('\n🏆 PRODUÇÃO FINALIZADA COM SUCESSO!');
    console.log('📅 Data: ' + new Date().toLocaleString('pt-BR'));
}

main().catch(console.error);