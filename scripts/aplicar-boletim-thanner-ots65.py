# Script para aplicar boletim de substituição de válvula Thanner OTS-65
# em Surviva (RFD Beaufort Inc, USA) e DSB Marine após 10 anos

import asyncio
import json
from datetime import datetime
from prisma import Prisma

BOLETIM = 'Replacement of Thanner OTS-65 Pressure Relief Valves'
COMPONENTE = 'Thanner OTS-65 Pressure Relief Valve'

async def aplicar_boletim():
    prisma = Prisma()
    await prisma.connect()
    aplicadas = 0
    hoje = datetime.now()
    dez_anos_atras = hoje.replace(year=hoje.year - 10)

    # Surviva (RFD Beaufort Inc, USA)
    surviva_jangadas = await prisma.jangada.find_many(
        where={
            'modelo': {
                'nome': {'contains': 'Surviva', 'mode': 'insensitive'},
                'marca': {'nome': {'contains': 'RFD Beaufort', 'mode': 'insensitive'}},
            }
        },
        include={'modelo': True}
    )

    # DSB Marine após 10 anos
    dsb_jangadas = await prisma.jangada.find_many(
        where={
            'modelo': {'marca': {'nome': {'contains': 'DSB Marine', 'mode': 'insensitive'}}},
            'dataFabricacao': {'lte': dez_anos_atras}
        },
        include={'modelo': True}
    )

    jangadas = surviva_jangadas + dsb_jangadas

    for jangada in jangadas:
        boletins = jangada.boletinsAplicados or []
        if BOLETIM not in boletins:
            boletins.append(BOLETIM)

        componentes = jangada.componentesSelecionados or {}
        if isinstance(componentes, str):
            try:
                componentes = json.loads(componentes)
            except:
                componentes = {}
        componentes[COMPONENTE] = {'substituido': True, 'data': hoje.isoformat()}

        await prisma.jangada.update(
            where={'id': jangada.id},
            data={
                'boletinsAplicados': boletins,
                'componentesSelecionados': componentes
            }
        )
        aplicadas += 1
        print(f"Boletim aplicado: {jangada.numeroSerie} ({jangada.modelo.nome})")

    print(f"Total de jangadas atualizadas: {aplicadas}")
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(aplicar_boletim())
