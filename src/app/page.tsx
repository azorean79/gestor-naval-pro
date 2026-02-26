import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ship,
  Anchor,
  Users,
  Calendar,
  BarChart3,
  Shield
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Marine Safe Station
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Sistema completo de gestão naval para controle de jangadas, navios, clientes,
            stock e operações portuárias.
          </p>
          <Badge variant="secondary" className="mt-4">
            Versão 2.0
          </Badge>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                          Stock
                        </CardTitle>
                        <CardDescription>
                          Gestão de artigos, inventário e controle de estoque
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link href="/stock">
                          <Button className="w-full">Acessar Stock</Button>
                        </Link>
                      </CardContent>
                    </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Anchor className="h-5 w-5 mr-2 text-blue-600" />
                Jangadas
              </CardTitle>
              <CardDescription>
                Gerencie frota de jangadas, inspeções e documentação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/jangadas">
                <Button className="w-full">Acessar Jangadas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="h-5 w-5 mr-2 text-blue-600" />
                Navios
              </CardTitle>
              <CardDescription>
                Controle de navios, certificados e equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/navios">
                <Button className="w-full">Acessar Navios</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Clientes
              </CardTitle>
              <CardDescription>
                Gestão de clientes e contactos de emergência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/clientes">
                <Button className="w-full">Acessar Clientes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Agenda
              </CardTitle>
              <CardDescription>
                Agendamentos, inspeções e manutenções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/agenda">
                <Button className="w-full">Acessar Agenda</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Access */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Dashboard Principal</CardTitle>
              <CardDescription>
                Visão geral do sistema com estatísticas e alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button size="lg" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ir para Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 Marine Safe Station. Sistema de Gestão Naval.</p>
        </footer>
      </div>
    </div>
  );
}
