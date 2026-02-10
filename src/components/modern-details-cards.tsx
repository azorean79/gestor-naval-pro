
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, Trash2, Ship, LifeBuoy, Plus } from 'lucide-react';


export function NavioDetailsCard({ navio, onEdit, onDelete }: {
	navio: any;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	return (
		<Card className="shadow-xl border-blue-200 bg-white/80 dark:bg-slate-900/80 mb-8 animate-fade-in">
			<CardHeader className="flex flex-row items-center gap-4">
				<div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900">
					<Ship className="w-10 h-10 text-blue-700 dark:text-blue-200" />
				</div>
				<div className="flex-1">
					<CardTitle className="text-2xl font-bold flex items-center gap-2">
						{navio.nome}
						{navio.status && (
							<Badge variant={navio.status === 'ativo' ? 'secondary' : 'destructive'}>{navio.status}</Badge>
						)}
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-300">
						IMO: <span className="font-mono">{navio.imo || 'N/A'}</span> | Bandeira: {navio.bandeira || 'N/A'}
					</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={onEdit} title="Editar navio">
						<Edit className="w-4 h-4" />
					</Button>
					<Button size="sm" variant="destructive" onClick={() => setShowConfirm(true)} title="Remover navio">
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Armador: <b>{navio.armador || 'N/A'}</b></div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Ano: <b>{navio.ano || 'N/A'}</b></div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Porto: <b>{navio.porto || 'N/A'}</b></div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Última inspeção: <b>{navio.ultimaInspecao ? navio.ultimaInspecao : 'N/A'}</b></div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500">Criado em:</span>
						<span className="font-mono text-xs">{navio.createdAt ? new Date(navio.createdAt).toLocaleDateString() : 'N/A'}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500">Atualizado em:</span>
						<span className="font-mono text-xs">{navio.updatedAt ? new Date(navio.updatedAt).toLocaleDateString() : 'N/A'}</span>
					</div>
				</div>
			</CardContent>
			{showConfirm && (
				<div className="p-4 bg-red-50 dark:bg-red-900/40 flex items-center gap-4 animate-fade-in">
					<span className="text-red-700 dark:text-red-200 font-bold">Tem certeza que deseja remover este navio?</span>
					<Button size="sm" variant="destructive" onClick={onDelete}>Remover</Button>
					<Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
				</div>
			)}
		</Card>
	);
}


export function JangadaDetailsCard({ jangada, componentes, onEdit, onAddComponente, onUpdateValidade }: {
	jangada: any;
	componentes: any[];
	onEdit: () => void;
	onAddComponente: () => void;
	onUpdateValidade: () => void;
}) {
	const [showEditValidade, setShowEditValidade] = useState(false);
	const [novaValidade, setNovaValidade] = useState(jangada?.validade || '');
	return (
		<Card className="shadow-xl border-teal-200 bg-white/80 dark:bg-slate-900/80 mb-8 animate-fade-in">
			<CardHeader className="flex flex-row items-center gap-4">
				<div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900">
					<LifeBuoy className="w-10 h-10 text-teal-700 dark:text-teal-200" />
				</div>
				<div className="flex-1">
					<CardTitle className="text-2xl font-bold flex items-center gap-2">
						{jangada.numeroSerie}
						{jangada.status && (
							<Badge variant={jangada.status === 'ativa' ? 'secondary' : 'destructive'}>{jangada.status}</Badge>
						)}
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-300">
						Marca: <b>{jangada.marca || 'N/A'}</b> | Modelo: <b>{jangada.modelo || 'N/A'}</b> | Capacidade: <b>{jangada.lotacao || 'N/A'}</b>
					</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={onEdit} title="Editar jangada">
						<Edit className="w-4 h-4" />
					</Button>
					<Button size="sm" variant="outline" onClick={onAddComponente} title="Adicionar componente">
						<Plus className="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Validade: <b>{jangada.validade || 'N/A'}</b> <Button size="xs" variant="ghost" onClick={() => setShowEditValidade(v => !v)}>{showEditValidade ? <Save className="w-3 h-3" /> : <Edit className="w-3 h-3" />}</Button></div>
					{showEditValidade && (
						<div className="flex gap-2 items-center mt-2">
							<input type="date" value={novaValidade} onChange={e => setNovaValidade(e.target.value)} className="border rounded px-2 py-1 text-xs" />
							<Button size="xs" onClick={() => { onUpdateValidade(); setShowEditValidade(false); }}>
								<Save className="w-3 h-3" /> Guardar
							</Button>
						</div>
					)}
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Data Fabricação: <b>{jangada.dataFabricacao || 'N/A'}</b></div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Navio: <b>{jangada.navioNome || 'N/A'}</b></div>
				</div>
				<div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Última inspeção: <b>{jangada.ultimaInspecao || 'N/A'}</b></div>
					<div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Próxima inspeção: <b>{jangada.proximaInspecao || 'N/A'}</b></div>
				</div>
			</CardContent>
			<CardContent>
				<div className="mt-4">
					<h4 className="font-semibold text-base mb-2">Componentes</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{componentes && componentes.length > 0 ? componentes.map((comp, idx) => (
							<Card key={comp.id || idx} className="p-2 flex flex-col gap-1 border-l-4 border-teal-400 bg-teal-50 dark:bg-slate-800/60">
								<div className="flex items-center gap-2">
									<span className="font-bold text-teal-800 dark:text-teal-200">{comp.nome}</span>
									<Badge variant={comp.status === 'ok' ? 'secondary' : 'destructive'}>{comp.status}</Badge>
								</div>
								<div className="text-xs text-slate-500">{comp.descricao}</div>
							</Card>
						)) : <span className="text-xs text-slate-400">Nenhum componente cadastrado.</span>}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
