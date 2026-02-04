'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  MessageCircle, 
  Sparkles, 
  Zap,
  Shield,
  Database,
  Calendar,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function AssistenteDemoPage() {
  const features = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: 'Conversa Natural',
      description: 'Fale com o Julinho como falaria com um colega especializado',
      color: 'text-blue-500',
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Acesso Completo',
      description: 'Consulta jangadas, stock, clientes, navios e muito mais',
      color: 'text-purple-500',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Ações Automáticas',
      description: 'Executa tarefas como agendar inspeções e gerar relatórios',
      color: 'text-yellow-500',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Conhecimento SOLAS',
      description: 'Especialista em regulamentos SOLAS/IMO e normas marítimas',
      color: 'text-green-500',
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Gestão Proativa',
      description: 'Identifica jangadas próximas do vencimento e sugere ações',
      color: 'text-orange-500',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Relatórios Inteligentes',
      description: 'Gera insights e relatórios baseados nos seus dados',
      color: 'text-pink-500',
    },
  ];

  const exampleQuestions = [
    {
      category: 'Alertas & Monitorização',
      questions: [
        'Quais são os alertas ativos?',
        'Que jangadas vencem nos próximos 30 dias?',
        'Tenho cilindros expirados?',
        'Itens de stock abaixo do mínimo?',
      ],
    },
    {
      category: 'Consultas',
      questions: [
        'Busca a jangada RFD-MKIV-ESP-1770163975684',
        'Quantas jangadas tenho registadas?',
        'Qual o stock de tubos alta pressão?',
        'Mostrar estatísticas do dashboard',
      ],
    },
    {
      category: 'Cálculos Técnicos',
      questions: [
        'Que testes precisa uma jangada de 2010?',
        'Calcular testes SOLAS para jangada fabricada em 01/03/2015',
        'Quanto custa uma inspeção completa?',
        'Quando é a próxima inspeção de uma jangada de 2018?',
      ],
    },
    {
      category: 'Ações',
      questions: [
        'Agendar inspeção para jangada X em 15/03/2026',
        'Criar novo agendamento',
        'Gerar relatório de jangadas',
        'Ver obras em progresso',
      ],
    },
  ];

  const capabilities = [
    { name: 'Consultar Jangadas', supported: true },
    { name: 'Buscar por Número de Série', supported: true },
    { name: 'Verificar Stock', supported: true },
    { name: 'Listar Alertas', supported: true },
    { name: 'Calcular Testes SOLAS', supported: true },
    { name: 'Agendar Inspeções', supported: true },
    { name: 'Estatísticas Dashboard', supported: true },
    { name: 'Criar Jangadas', supported: false, comingSoon: true },
    { name: 'Gerar PDFs', supported: false, comingSoon: true },
    { name: 'Comandos de Voz', supported: false, comingSoon: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Julinho
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Assistente Inteligente de Gestão Naval
          </p>
          <p className="text-sm text-gray-500">
            Powered by OpenAI GPT-4o-mini • Disponível em toda a aplicação
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={feature.color}>{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Example Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Perguntas de Exemplo
            </CardTitle>
            <CardDescription>
              Experimente fazer estas perguntas ao Julinho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exampleQuestions.map((category, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.questions.map((question, qIndex) => (
                      <li
                        key={qIndex}
                        className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        💬 {question}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Capacidades
            </CardTitle>
            <CardDescription>
              O que o Julinho pode fazer por si
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-sm text-center font-medium">
                    {capability.name}
                  </div>
                  {capability.supported ? (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Disponível
                    </Badge>
                  ) : capability.comingSoon ? (
                    <Badge variant="secondary">🚧 Em breve</Badge>
                  ) : (
                    <Badge variant="outline">Planeado</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Como Começar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Clique no botão flutuante</p>
                  <p className="text-sm text-blue-100">
                    Encontre o ícone do Julinho no canto inferior direito de qualquer página
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Faça uma pergunta</p>
                  <p className="text-sm text-blue-100">
                    Use linguagem natural, como se estivesse a falar com um colega
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Deixe o Julinho ajudar</p>
                  <p className="text-sm text-blue-100">
                    O assistente vai consultar dados, fazer cálculos e sugerir ações
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc list-inside space-y-1">
              <li>O Julinho está sempre a aprender e melhorar</li>
              <li>Verifique informações críticas antes de tomar decisões importantes</li>
              <li>Para ações que modificam dados, o assistente pede confirmação</li>
              <li>Os dados são consultados em tempo real da base de dados</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Pronto para experimentar?
          </p>
          <p className="text-sm text-gray-500">
            Clique no botão flutuante <MessageCircle className="inline h-4 w-4" /> no canto inferior direito para começar!
          </p>
        </div>
      </div>
    </div>
  );
}
