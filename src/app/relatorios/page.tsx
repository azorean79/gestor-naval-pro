"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatDate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, BarChart3, TrendingUp, Calendar, Users, Package, Ship } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const relatoriosDisponiveis = [
  {
    id: "1",
    nome: "Relatório de Jangadas",
    descricao: "Relatório completo das jangadas registadas, inspeções e status",
    categoria: "Frota",
    tipo: "PDF",
    ultimaGeracao: "2024-01-25",
    tamanho: "2.3 MB",
    status: "disponivel"
  },
  {
    id: "2",
    nome: "Relatório de Navios",
    descricao: "Análise da frota de navios, certificados e manutenções",
    categoria: "Frota",
    tipo: "PDF",
    ultimaGeracao: "2024-01-24",
    tamanho: "3.1 MB",
    status: "disponivel"
  },
  {
    id: "3",
    nome: "Relatório de Clientes",
    descricao: "Lista completa de clientes e estatísticas de utilização",
    categoria: "Clientes",
    tipo: "Excel",
    ultimaGeracao: "2024-01-23",
    tamanho: "1.8 MB",
    status: "disponivel"
  },
  {
    id: "4",
    nome: "Relatório de Stock",
    descricao: "Inventário completo e análise de stock por categoria",
    categoria: "Stock",
    tipo: "PDF",
    ultimaGeracao: "2024-01-22",
    tamanho: "4.2 MB",
    status: "disponivel"
  },
  {
    id: "5",
    nome: "Relatório Financeiro",
    descricao: "Relatório financeiro mensal com receitas e despesas",
    categoria: "Financeiro",
    tipo: "PDF",
    ultimaGeracao: "2024-01-20",
    tamanho: "2.7 MB",
    status: "disponivel"
  },
  {
    id: "6",
    nome: "Relatório de Manutenções",
    descricao: "Histórico de manutenções realizadas e agendadas",
    categoria: "Manutenção",
    tipo: "Excel",
    ultimaGeracao: "2024-01-19",
    tamanho: "3.5 MB",
    status: "disponivel"
  },
  {
    id: "7",
    nome: "Dashboard Executivo",
    descricao: "Relatório executivo com KPIs e métricas principais",
    categoria: "Executivo",
    tipo: "PDF",
    ultimaGeracao: "2024-01-18",
    tamanho: "5.1 MB",
    status: "disponivel"
  },
  {
    id: "8",
    nome: "Relatório de Segurança",
    descricao: "Análise de incidentes e medidas de segurança implementadas",
    categoria: "Segurança",
    tipo: "PDF",
    ultimaGeracao: "2024-01-15",
    tamanho: "2.9 MB",
    status: "disponivel"
  }
];

const estatisticasRapidas = [
  {
    titulo: "Jangadas Ativas",
    valor: "22/25",
    percentual: "88%",
    tendencia: "up",
    icone: Ship
  },
  {
    titulo: "Clientes Ativos",
    valor: "156",
    percentual: "+12%",
    tendencia: "up",
    icone: Users
  },
  {
    titulo: "Itens em Stock",
    valor: "1,247",
    percentual: "+5%",
    tendencia: "up",
    icone: Package
  },
  {
    titulo: "Receita Mensal",
    valor: "€45,230",
    percentual: "+8%",
    tendencia: "up",
    icone: TrendingUp
  }
];

export default function RelatoriosPage() {
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const relatoriosFiltrados = relatoriosDisponiveis.filter(relatorio => {
    const categoriaMatch = categoriaFiltro === "todos" || relatorio.categoria === categoriaFiltro;
    const tipoMatch = tipoFiltro === "todos" || relatorio.tipo === tipoFiltro;
    return categoriaMatch && tipoMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Relatórios
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Geração e download de relatórios do sistema
            </p>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Novo Relatório
          </Button>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {estatisticasRapidas.map((stat, index) => {
            const IconComponent = stat.icone;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                      <p className="text-2xl font-bold">{stat.valor}</p>
                      <p className={`text-sm ${stat.tendencia === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.percentual} este mês
                      </p>
                    </div>
                    <IconComponent className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    <SelectItem value="Frota">Frota</SelectItem>
                    <SelectItem value="Clientes">Clientes</SelectItem>
                    <SelectItem value="Stock">Stock</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Executivo">Executivo</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
            <CardDescription>
              Lista de relatórios gerados recentemente ({relatoriosFiltrados.length} relatórios)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Relatório</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Última Geração</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatoriosFiltrados.map((relatorio) => (
                  <TableRow key={relatorio.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{relatorio.nome}</div>
                        <div className="text-sm text-gray-500">{relatorio.descricao}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{relatorio.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={relatorio.tipo === 'PDF' ? 'default' : 'secondary'}>
                        {relatorio.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(relatorio.ultimaGeracao)}
                    </TableCell>
                    <TableCell>{relatorio.tamanho}</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {relatorio.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Relatórios Agendados */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Relatórios Agendados</CardTitle>
            <CardDescription>
              Relatórios configurados para geração automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum relatório agendado configurado</p>
              <p className="text-sm">Configure relatórios automáticos para receber atualizações regulares</p>
              <Button className="mt-4" variant="outline">
                Configurar Relatórios Agendados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}