"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, TrendingUp, ExternalLink } from "lucide-react";
import { useJulinhoWidget } from "@/hooks/use-julinho-widget";
import Link from "next/link";

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
};

const categoryIcons = {
  Manutenção: AlertTriangle,
  Agendamento: TrendingUp,
  Stock: AlertTriangle,
  Introdução: Lightbulb
};

export function JulinhoWidget() {
  const { data, isLoading, error } = useJulinhoWidget();
  const [expandedSections, setExpandedSections] = useState({
    suggestions: true,
    insights: false,
    recommendations: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
            Sugestões do Julinho
          </CardTitle>
          <CardDescription>Carregando sugestões inteligentes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="animate-pulse h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
            Sugestões do Julinho
          </CardTitle>
          <CardDescription>Erro ao carregar dados do Julinho</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Não foi possível carregar as sugestões. Tente novamente mais tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
          Sugestões do Julinho
        </CardTitle>
        <CardDescription>
          Recomendações inteligentes baseadas nos seus dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggestions */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('suggestions')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            Sugestões ({data.suggestions?.length || 0})
            <span className="text-xs">
              {expandedSections.suggestions ? '−' : '+'}
            </span>
          </Button>
          {expandedSections.suggestions && (
            <div className="mt-3 space-y-3">
              {!Array.isArray(data.suggestions) || data.suggestions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma sugestão no momento. Tudo está em ordem!
                </p>
              ) : (
                data.suggestions.map((suggestion) => {
                  const IconComponent = categoryIcons[suggestion.category as keyof typeof categoryIcons] || Lightbulb;
                  return (
                    <div key={suggestion.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <IconComponent className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <Badge className={`text-xs ${priorityColors[suggestion.priority]}`}>
                            {suggestion.priority === 'high' ? 'Alta' :
                             suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {suggestion.description}
                        </p>
                        {suggestion.actionUrl && (
                          <Link href={suggestion.actionUrl}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver detalhes
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('insights')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            Insights ({data.insights?.length || 0})
            <span className="text-xs">
              {expandedSections.insights ? '−' : '+'}
            </span>
          </Button>
          {expandedSections.insights && (
            <div className="mt-3 space-y-2">
              {Array.isArray(data.insights) && data.insights.map((insight, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('recommendations')}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            Recomendações ({data.recommendations?.length || 0})
            <span className="text-xs">
              {expandedSections.recommendations ? '−' : '+'}
            </span>
          </Button>
          {expandedSections.recommendations && (
            <div className="mt-3 space-y-2">
              {Array.isArray(data.recommendations) && data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}