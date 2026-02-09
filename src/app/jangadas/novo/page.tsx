'use client';
import { useState, useEffect } from 'react';

export default function NovaJangadaPage() {
  const [dataUltimaInspecao, setDataUltimaInspecao] = useState('');
  const [dataProximaInspecao, setDataProximaInspecao] = useState('');

  useEffect(() => {
    if (dataUltimaInspecao) {
      const ultima = new Date(dataUltimaInspecao);
      ultima.setFullYear(ultima.getFullYear() + 1);
      setDataProximaInspecao(ultima.toISOString().split('T')[0]);
    } else {
      setDataProximaInspecao('');
    }
  }, [dataUltimaInspecao]);

  const marcas = ['Marca A', 'Marca B', 'Marca C'];
  const modelos = ['Modelo X', 'Modelo Y', 'Modelo Z'];
  const lotacoes = ['Lotação 1', 'Lotação 2', 'Lotação 3'];
  const tiposPack = ['Pack 1', 'Pack 2', 'Pack 3'];

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [lotacao, setLotacao] = useState('');
  const [tipoPack, setTipoPack] = useState('');

  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => setMarca(e.target.value);
  const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => setModelo(e.target.value);
  const handleLotacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => setLotacao(e.target.value);
  const handleTipoPackChange = (e: React.ChangeEvent<HTMLSelectElement>) => setTipoPack(e.target.value);
  const handleUltimaInspecaoChange = (e: React.ChangeEvent<HTMLInputElement>) => setDataUltimaInspecao(e.target.value);

  return (
    <div>
      <label>
        Marca*
        <select value={marca} onChange={handleMarcaChange} required>
          <option value="">Selecione a marca</option>
          {marcas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        Modelo*
        <select value={modelo} onChange={handleModeloChange} required>
          <option value="">Selecione o modelo</option>
          {modelos.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        Lotação*
        <select value={lotacao} onChange={handleLotacaoChange} required>
          <option value="">Selecione a lotação</option>
          {lotacoes.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>
      <label>
        Tipo de Pack
        <select value={tipoPack} onChange={handleTipoPackChange}>
          <option value="">Selecione o tipo de pack</option>
          {tiposPack.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Data da última inspeção*
        <input
          type="date"
          value={dataUltimaInspecao}
          onChange={handleUltimaInspecaoChange}
          required
        />
      </label>
      <label>
        Data da próxima inspeção (calculada)
        <input
          type="date"
          value={dataProximaInspecao}
          disabled
        />
      </label>
    </div>
  );
}