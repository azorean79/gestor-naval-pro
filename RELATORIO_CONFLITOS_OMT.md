# Relatório de conflitos OMT vs BD (clientes de navios)

Análise cruzada entre o ficheiro OMT (`_tmp_omt_structured.json`) e os clientes na BD.
Fonte OMT: licenças de operador por embarcação/registo.

## Grupo A — mesma entidade (typos / nomes com morada) — APLICADO ✔

| Navio | Matrícula | Antes | Depois | Ação |
|---|---|---|---|---|
| BETTY (#792) | 101097-4PT | PURE ADVETURE AZORES (#682) | PURE ADVENTURE AZORES (#1081) | Cliente 682 eliminado |
| Brasilia (#813) | 133167-4PT | VIANDANTE (#703) | O Viandante - Empreendimentos Turísticos, Lda (#195) | Cliente 703 eliminado |
| Zifio (#757) | 132236-4PT | BESTSPOT AZORES (#652) | Suzi Paula do Rego Oliveira (#247) | Cliente 652 eliminado |
| SIMÃO GATO (#1022) | 111743-4PT | Tércio Ricardo Machado Lima da Silva + morada (#251) | TÉRCIO RICARDO MACHADO LIMA DA (#862) | Cliente 251 eliminado (morada/CP/localidade/ilha migrados) |

Season (#714): só difere na grafia "Actividades"/"Atividades" (PT vs BR) — **sem alteração**.

## Grupo B — multi-operador — DECISÃO REGISTADA

### Shido (#912, 110889-3PT) — FUNDIDO ✔
- OMT: operado por Pedro Silveira Soares (licença 03/2018) e Victor Fernando Machado Soares (licença 06/2021).
- BD: "Urzelina tour" (#66) era a marca comercial de Pedro Silveira Soares (morada em Urzelina - São Jorge; registos da mesma série 11088x do HATCHI 110887-1PT).
- Ação: **fundido #66 → #212 (Pedro Silveira Soares)**; navio 912 migrado, cliente 66 eliminado.
- Nota: Victor Fernando Machado Soares (#1111) aparece como operador a partir de 06/2021 — possível sucessão; sem navios no BD, fica documentado para confirmação.

### Cluster AGUIA (AGUIATURS #514, AGUIA #659, AGUIATUR #660) — MANTIDO ✔
- BD: os três navios sob "Way 2 Azores, Unipessoal Lda" (#264, Angra do Heroísmo).
- OMT: AGUIA com dois operadores em datas diferentes — "Way 2 Azores" (02/2022) e "Paulo Aguiar, Unipessoal Lda" (03/2022). AGUIATUR/AGUIATURS sem operador.
- Ação: **mantidos sob #264** (OMT confirma Way 2 Azores como operador). "Paulo Aguiar, Unipessoal Lda" (#205, sem navios) fica documentado como operador alternativo de 03/2022.

## Grupo C — conflitos genuínos — RESOLVIDO

### Falsos conflitos (navios diferentes com o mesmo nome) — SEM AÇÃO ✔

| Caso | Explicação |
|---|---|
| Badejo (#777, PTPDL-118603-C) | É o Badejo de **pesca** de José Francisco Melo Vieira (São Miguel). O Badejo **marítimo-turístico** do OMT é outro navio (106665-4PT), sem correspondência na BD. |
| CENTRAL SUB (#532, 138811-4PT) | O OMT tem dois registos: CENTRAL SUB (774HT4) sob Central Sub e CENTRAL SUB (138811-4PT) sem operador. O navio da BD é o 138811-4PT — sem conflito. |
| Guernica (#878, H-211-C) | Caso idêntico ao Badejo: há um segundo Guernica (PTHOR-118476-L) no seed `navios_sao_miguel.ts`, nunca importado. Sem ação. |

### Movimentos aplicados ✔ (reassigned; clientes de origem mantidos — têm outros navios)

| Navio | Matrícula | Antes | Depois |
|---|---|---|---|
| INÊS PAULOS (#562) | 130611-4PT | Espaço Talassa (#133) | Espírito Azul (#134) |
| Paínho (#527) | 104816-4PT | Rolando Manuel da Silva Oliveira (#225) | Calypso (#108) |
| RILUSA (#607) | 136412-4PT | Mantamaria (#175) | Jorge Alberto Cabral Botelho (#169) |

### Mantidos conforme BD ✔

| Navio | Matrícula | BD (mantido) | Nota |
|---|---|---|---|
| BENJAMIM (#915) | 18629LX3 | A. HUM. BOMBEIROS DA RIBEIRA GRANDE (#69) | OMT 02/2018 (Bestazores, Pico) provavelmente anterior à doação/transferência. |

**Resultado final dos conflitos OMT vs BD: todos os grupos A/B/C tratados.**
