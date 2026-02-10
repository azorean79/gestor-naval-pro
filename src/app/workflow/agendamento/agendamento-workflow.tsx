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

export function AgendamentoWorkflow() {
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Carregar dados da jangada se ID fornecido
  useEffect(() => {
    if (jangadaId) {
      loadJangada(jangadaId);
    }
  }, [jangadaId]);

  // Carregar técnicos disponíveis
  useEffect(() => {
    loadTecnicos();
  }, []);

  const loadJangada = async (id: string) => {
    try {
      const response = await fetch(`/api/jangadas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJangada({
          id: data.id,
          numeroSerie: data.numeroSerie,
          modelo: data.modelo?.nome || 'N/A',
          marca: data.marca?.nome || 'N/A',
          cliente: data.cliente?.nome || 'N/A',
          navio: data.navio?.nome || 'N/A',
          status: data.status
        });
        setFormData(prev => ({ ...prev, jangadaId: id }));
      }
    } catch (error) {
      console.error('Erro ao carregar jangada:', error);
    }
  };

  const loadTecnicos = async () => {
    try {
      // Simular carregamento de técnicos
      const mockTecnicos: Tecnico[] = [
        { id: '1', nome: 'João Silva', especialidade: 'Inspeções Gerais', disponibilidade: ['08:00', '09:00', '10:00', '14:00', '15:00'] },
        { id: '2', nome: 'Maria Santos', especialidade: 'Equipamentos de Segurança', disponibilidade: ['09:00', '10:00', '11:00', '15:00', '16:00'] },
        { id: '3', nome: 'Pedro Costa', especialidade: 'Manutenção Elétrica', disponibilidade: ['08:00', '13:00', '14:00', '15:00', '16:00'] },
      ];
      setTecnicos(mockTecnicos);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dataInspecao: format(selectedDate, 'yyyy-MM-dd')
      }));

      // Gerar horários disponíveis baseado no técnico selecionado
      if (formData.tecnicoId) {
        const tecnico = tecnicos.find(t => t.id === formData.tecnicoId);
        if (tecnico) {
          setTimeSlots(tecnico.disponibilidade);
        }
      }
    }
  };

  const handleTecnicoChange = (tecnicoId: string) => {
    setFormData(prev => ({ ...prev, tecnicoId }));
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    if (tecnico && date) {
      setTimeSlots(tecnico.disponibilidade);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.jangadaId) newErrors.jangadaId = 'Selecione uma jangada';
    if (!formData.tecnicoId) newErrors.tecnicoId = 'Selecione um técnico';
    if (!formData.dataInspecao) newErrors.dataInspecao = 'Selecione uma data';
    if (!formData.horaInspecao) newErrors.horaInspecao = 'Selecione um horário';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/gestao/agenda');
        }, 2000);
      } else {
        throw new Error('Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErrors({ submit: 'Erro ao criar agendamento' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Agendamento de Inspeção</h1>
          <p className="text-gray-600">Agende uma nova inspeção para jangada salva-vidas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção da Jangada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Jangada a Inspecionar
            </CardTitle>
            <CardDescription>
              Selecione a jangada que será inspecionada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jangada ? (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Número de Série</Label>
                    <p className="font-medium">{jangada.numeroSerie}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Marca/Modelo</Label>
                    <p className="font-medium">{jangada.marca} {jangada.modelo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Cliente</Label>
                    <p className="font-medium">{jangada.cliente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Navio</Label>
                    <p className="font-medium">{jangada.navio}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma jangada selecionada</p>
                <p className="text-sm">Use o parâmetro 'jangada' na URL ou selecione uma jangada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seleção do Técnico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Técnico Responsável
            </CardTitle>
            <CardDescription>
              Selecione o técnico que realizará a inspeção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tecnico">Técnico *</Label>
              <Select value={formData.tecnicoId} onValueChange={handleTecnicoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((tecnico) => (
                    <SelectItem key={tecnico.id} value={tecnico.id}>
                      {tecnico.nome} - {tecnico.especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tecnicoId && <p className="text-sm text-red-600">{errors.tecnicoId}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Data e Hora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Data e Hora da Inspeção
            </CardTitle>
            <CardDescription>
              Defina quando a inspeção será realizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
              <div className="space-y-2">
                <Label>Data da Inspeção *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: pt }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dataInspecao && <p className="text-sm text-red-600">{errors.dataInspecao}</p>}
              </div>

              {/* Hora */}
              <div className="space-y-2">
                <Label htmlFor="hora">Horário *</Label>
                <Select value={formData.horaInspecao} onValueChange={(value) => setFormData(prev => ({ ...prev, horaInspecao: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.horaInspecao && <p className="text-sm text-red-600">{errors.horaInspecao}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes da Inspeção */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Inspeção</CardTitle>
            <CardDescription>
              Configure os parâmetros da inspeção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Inspeção</Label>
                <Select value={formData.tipoInspecao} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoInspecao: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rotina">Rotina</SelectItem>
                    <SelectItem value="emergencial">Emergencial</SelectItem>
                    <SelectItem value="reparacao">Reparação</SelectItem>
                    <SelectItem value="certificacao">Certificação</SelectItem>
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
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais sobre a inspeção..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de erro/sucesso */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Agendamento criado com sucesso! Redirecionando...
            </AlertDescription>
          </Alert>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link href="/workflow">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Agendar Inspeção
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}