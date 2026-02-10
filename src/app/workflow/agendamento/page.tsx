"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Jangada {
  id: string;
  numeroSerie: string;
  modelo: string;
  marca: string;
  cliente: string;
  navio: string;
  status: string;
}

interface Tecnico {
  id: string;
  nome: string;
  especialidade: string;
  disponibilidade: string[];
}

export default function AgendamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jangadaId = searchParams.get('jangada');

  const [loading, setLoading] = useState(false);
  const [jangada, setJangada] = useState<Jangada | null>(null);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [date, setDate] = useState<Date>();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    jangadaId: jangadaId || '',
    tecnicoId: '',
    dataInspecao: '',
    horaInspecao: '',
    tipoInspecao: 'rotina',
    prioridade: 'normal',
    observacoes: '',
    equipamentosNecessarios: [] as string[],
    tempoEstimado: '2' // horas
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (jangadaId) {
      fetchJangada(jangadaId);
    }
    fetchTecnicos();
    generateTimeSlots();
  }, [jangadaId]);

  const fetchJangada = async (id: string) => {
    try {
      const response = await fetch(`/api/jangadas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJangada(data);
        setFormData(prev => ({ ...prev, jangadaId: id }));
      }
    } catch (error) {
      console.error('Erro ao carregar jangada:', error);
    }
  };

  const fetchTecnicos = async () => {
    // Simular dados de técnicos
    const mockTecnicos: Tecnico[] = [
      { id: '1', nome: 'Julio Correia', especialidade: 'Inspeções Gerais', disponibilidade: ['09:00', '10:00', '14:00', '15:00'] },
      { id: '2', nome: 'João Silva', especialidade: 'Equipamentos Eletrônicos', disponibilidade: ['08:00', '11:00', '16:00'] },
      { id: '3', nome: 'Maria Santos', especialidade: 'Estrutura e Segurança', disponibilidade: ['09:00', '13:00', '15:00', '17:00'] }
    ];
    setTecnicos(mockTecnicos);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    setTimeSlots(slots);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.jangadaId) newErrors.jangadaId = 'Jangada é obrigatória';
    if (!formData.tecnicoId) newErrors.tecnicoId = 'Técnico é obrigatório';
    if (!date) newErrors.dataInspecao = 'Data é obrigatória';
    if (!formData.horaInspecao) newErrors.horaInspecao = 'Hora é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const agendamentoData = {
        ...formData,
        dataInspecao: date?.toISOString(),
        status: 'agendado'
      };

      // Criar agendamento
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agendamentoData),
      });

      if (response.ok) {
        // Atualizar status da jangada
        await fetch(`/api/jangadas/${formData.jangadaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'agendado',
            dataInspecaoAgendada: date?.toISOString()
          }),
        });

        router.push('/workflow');
      } else {
        const error = await response.json();
        alert('Erro ao agendar inspeção: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao agendar inspeção');
    } finally {
      setLoading(false);
    }
  };

  const selectedTecnico = tecnicos.find(t => t.id === formData.tecnicoId);
  const availableSlots = selectedTecnico ? selectedTecnico.disponibilidade : timeSlots;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamento de Inspeção</h1>
          <p className="text-gray-600">Agendar inspeção técnica para jangada</p>
        </div>
      </div>

      {jangada && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Jangada Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{jangada.numeroSerie}</h3>
                <p className="text-sm text-gray-600">
                  {jangada.modelo} - {jangada.marca} • {jangada.cliente} • {jangada.navio}
                </p>
              </div>
              <Badge variant="outline">{jangada.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Jangada */}
        {!jangadaId && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Jangada</CardTitle>
              <CardDescription>Escolha a jangada para agendar a inspeção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="jangadaId">Jangada</Label>
                <Select value={formData.jangadaId} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, jangadaId: value }));
                  fetchJangada(value);
                }}>
                  <SelectTrigger className={errors.jangadaId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a jangada" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui seria necessário buscar jangadas com status 'recebido' */}
                    <SelectItem value="1">LR-2024-001 - MK4 Seasava</SelectItem>
                    <SelectItem value="2">LR-2024-002 - MKIII Eurovinil</SelectItem>
                  </SelectContent>
                </Select>
                {errors.jangadaId && <p className="text-sm text-red-500">{errors.jangadaId}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Agendamento
            </CardTitle>
            <CardDescription>
              Definir data, hora e técnico responsável
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Inspeção *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !date && 'text-muted-foreground'
                      } ${errors.dataInspecao ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: pt }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dataInspecao && <p className="text-sm text-red-500">{errors.dataInspecao}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaInspecao">Hora da Inspeção *</Label>
                <Select value={formData.horaInspecao} onValueChange={(value) => setFormData(prev => ({ ...prev, horaInspecao: value }))}>
                  <SelectTrigger className={errors.horaInspecao ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.horaInspecao && <p className="text-sm text-red-500">{errors.horaInspecao}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnicoId">Técnico Responsável *</Label>
                <Select value={formData.tecnicoId} onValueChange={(value) => setFormData(prev => ({ ...prev, tecnicoId: value }))}>
                  <SelectTrigger className={errors.tecnicoId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {tecnicos.map((tecnico) => (
                      <SelectItem key={tecnico.id} value={tecnico.id}>
                        {tecnico.nome} - {tecnico.especialidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tecnicoId && <p className="text-sm text-red-500">{errors.tecnicoId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempoEstimado">Tempo Estimado (horas)</Label>
                <Input
                  id="tempoEstimado"
                  type="number"
                  value={formData.tempoEstimado}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempoEstimado: e.target.value }))}
                  min="1"
                  max="8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoInspecao">Tipo de Inspeção</Label>
                <Select value={formData.tipoInspecao} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoInspecao: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rotina">Rotina</SelectItem>
                    <SelectItem value="reparacao">Reparação</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="emergencia">Emergência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o agendamento, requisitos especiais, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Data:</span> {date ? format(date, "PPP", { locale: pt }) : 'Não definida'}
              </div>
              <div>
                <span className="font-medium">Hora:</span> {formData.horaInspecao || 'Não definida'}
              </div>
              <div>
                <span className="font-medium">Técnico:</span> {selectedTecnico?.nome || 'Não selecionado'}
              </div>
              <div>
                <span className="font-medium">Duração:</span> {formData.tempoEstimado} horas
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {formData.tipoInspecao}
              </div>
              <div>
                <span className="font-medium">Prioridade:</span> {formData.prioridade}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-4">
          <Link href="/workflow">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Agendar Inspeção
          </Button>
        </div>
      </form>
    </div>
  );
}