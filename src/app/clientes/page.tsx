"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClientes } from "@/hooks/use-clientes";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WizardCliente } from "@/components/ui/WizardCliente";
import Link from "next/link";
import Shortcuts from '@/components/dashboard/shortcuts';

// Mock data - será substituído por dados reais
const mockClientes = [
  {
    id: "1",
    nome: "João Silva",
    tipo: "individual",
    nif: "123456789",
    email: "joao.silva@email.com",
    telefone: "+351 912 345 678",
    morada: "Rua das Flores, 123, Lisboa",
    status: "ativo",
    ilha: "Lisboa",
    portoEscala: "Lisboa",
    dataNascimento: "1985-03-15",
    profissao: "Pescador",
    empresa: null,
    observacoes: "Cliente regular, paga em dia"
  },
  {
    id: "2",
    nome: "Maria Santos",
    tipo: "individual",
    nif: "234567890",
    email: "maria.santos@email.com",
    telefone: "+351 913 456 789",
    morada: "Avenida do Mar, 456, Porto",
    status: "ativo",
    ilha: "Porto",
    portoEscala: "Leixões",
    dataNascimento: "1990-07-22",
    profissao: "Empresária",
    empresa: "Pesca Sustentável Ltd",
    observacoes: "Proprietária de 3 jangadas"
  },
  {
    id: "3",
    nome: "António Costa",
    tipo: "individual",
    nif: "345678901",
    email: "antonio.costa@email.com",
    telefone: "+351 914 567 890",
    morada: "Praça da República, 789, Faro",
    status: "ativo",
    ilha: "Algarve",
    portoEscala: "Faro",
    dataNascimento: "1978-11-08",
    profissao: "Capitão",
    empresa: null,
    observacoes: "Capitão experiente, trabalha há 20 anos"
  },
  {
    id: "4",
    nome: "Transportes Marítimos SA",
    tipo: "empresa",
    nif: "456789012",
    email: "contacto@transportesmaritimos.pt",
    telefone: "+351 215 678 901",
    morada: "Rua do Comércio, 1000, Lisboa",
    status: "ativo",
    ilha: "Lisboa",
    portoEscala: "Lisboa",
    dataNascimento: null,
    profissao: null,
    empresa: "Transportes Marítimos SA",
    observacoes: "Empresa de transporte marítimo, frota de 5 navios"
  },
  {
    id: "5",
    nome: "Ana Pereira",
    tipo: "individual",
    nif: "567890123",
    email: "ana.pereira@email.com",
    telefone: "+351 915 678 901",
    morada: "Rua dos Pescadores, 234, Aveiro",
    status: "ativo",
    ilha: "Aveiro",
    portoEscala: "Aveiro",
    dataNascimento: "1982-05-30",
    profissao: "Bióloga Marinha",
    empresa: "Instituto Oceanográfico",
    observacoes: "Especialista em biologia marinha, colabora em projetos de investigação"
  },
  {
    id: "6",
    nome: "Carlos Rodrigues",
    tipo: "individual",
    nif: "678901234",
    email: "carlos.rodrigues@email.com",
    telefone: "+351 916 789 012",
    morada: "Travessa do Porto, 567, Viana do Castelo",
    status: "ativo",
    ilha: "Viana do Castelo",
    portoEscala: "Viana do Castelo",
    dataNascimento: "1975-09-12",
    profissao: "Mecânico Naval",
    empresa: "Manutenção Naval Ltd",
    observacoes: "Especialista em motores de jangadas"
  },
  {
    id: "7",
    nome: "Sofia Almeida",
    tipo: "individual",
    nif: "789012345",
    email: "sofia.almeida@email.com",
    telefone: "+351 917 890 123",
    morada: "Largo da Praia, 890, Setúbal",
    status: "ativo",
    ilha: "Setúbal",
    portoEscala: "Setúbal",
    dataNascimento: "1988-12-03",
    profissao: "Advogada",
    empresa: "Almeida & Associados",
    observacoes: "Advogada especializada em direito marítimo"
  },
  {
    id: "8",
    nome: "Pedro Gomes",
    tipo: "individual",
    nif: "890123456",
    email: "pedro.gomes@email.com",
    telefone: "+351 918 901 234",
    morada: "Rua Nova, 111, Coimbra",
    status: "ativo",
    ilha: "Coimbra",
    portoEscala: "Peniche",
    dataNascimento: "1983-01-25",
    profissao: "Professor",
    empresa: "Universidade de Coimbra",
    observacoes: "Professor de engenharia naval"
  },
  {
    id: "9",
    nome: "Inês Ferreira",
    tipo: "individual",
    nif: "901234567",
    email: "ines.ferreira@email.com",
    telefone: "+351 919 012 345",
    morada: "Avenida Central, 222, Évora",
    status: "ativo",
    ilha: "Évora",
    portoEscala: "Grândola",
    dataNascimento: "1992-06-18",
    profissao: "Técnica de Laboratório",
    empresa: "Laboratório Marítimo",
    observacoes: "Responsável por análises de água do mar"
  },
  {
    id: "10",
    nome: "Luís Martins",
    tipo: "individual",
    nif: "012345678",
    email: "luis.martins@email.com",
    telefone: "+351 920 123 456",
    morada: "Praça Velha, 333, Bragança",
    status: "ativo",
    ilha: "Bragança",
    portoEscala: "Viana do Castelo",
    dataNascimento: "1970-04-10",
    profissao: "Pescador Reformado",
    empresa: null,
    observacoes: "Pescador reformado, agora dedica-se à formação de jovens pescadores"
  },
  {
    id: "11",
    nome: "Rita Sousa",
    tipo: "individual",
    nif: "123456780",
    email: "rita.sousa@email.com",
    telefone: "+351 921 234 567",
    morada: "Rua da Praia, 444, Leiria",
    status: "ativo",
    ilha: "Leiria",
    portoEscala: "Peniche",
    dataNascimento: "1987-08-27",
    profissao: "Fotógrafa",
    empresa: "Mar Fotografia",
    observacoes: "Especializada em fotografia submarina e documentação de vida marinha"
  },
  {
    id: "12",
    nome: "Miguel Oliveira",
    tipo: "individual",
    nif: "234567801",
    email: "miguel.oliveira@email.com",
    telefone: "+351 922 345 678",
    morada: "Travessa do Cais, 555, Aveiro",
    status: "ativo",
    ilha: "Aveiro",
    portoEscala: "Aveiro",
    dataNascimento: "1979-02-14",
    profissao: "Artesão",
    empresa: "Artesanato Marinho",
    observacoes: "Produz artesanato tradicional relacionado com o mar"
  },
  {
    id: "13",
    nome: "Catarina Nunes",
    tipo: "individual",
    nif: "345678902",
    email: "catarina.nunes@email.com",
    telefone: "+351 923 456 789",
    morada: "Avenida do Atlântico, 666, Faro",
    status: "ativo",
    ilha: "Algarve",
    portoEscala: "Faro",
    dataNascimento: "1995-10-05",
    profissao: "Estudante",
    empresa: null,
    observacoes: "Estudante de biologia marinha, interessada em conservação marinha"
  },
  {
    id: "14",
    nome: "Tiago Lopes",
    tipo: "individual",
    nif: "456789003",
    email: "tiago.lopes@email.com",
    telefone: "+351 924 567 890",
    morada: "Rua do Porto, 777, Porto",
    status: "ativo",
    ilha: "Porto",
    portoEscala: "Leixões",
    dataNascimento: "1981-07-19",
    profissao: "Engenheiro",
    empresa: "Engenharia Marítima SA",
    observacoes: "Engenheiro especializado em estruturas offshore"
  },
  {
    id: "15",
    nome: "Patrícia Mendes",
    tipo: "individual",
    nif: "567890104",
    email: "patricia.mendes@email.com",
    telefone: "+351 925 678 901",
    morada: "Praça do Mar, 888, Lisboa",
    status: "ativo",
    ilha: "Lisboa",
    portoEscala: "Lisboa",
    dataNascimento: "1984-11-30",
    profissao: "Jornalista",
    empresa: "Jornal do Mar",
    observacoes: "Jornalista especializada em temas marítimos e ambientais"
  },
  {
    id: "16",
    nome: "André Silva",
    tipo: "individual",
    nif: "678901205",
    email: "andre.silva@email.com",
    telefone: "+351 926 789 012",
    morada: "Largo dos Pescadores, 999, Setúbal",
    status: "ativo",
    ilha: "Setúbal",
    portoEscala: "Setúbal",
    dataNascimento: "1977-03-08",
    profissao: "Restaurador",
    empresa: "Restaurante do Mar",
    observacoes: "Proprietário de restaurante especializado em cozinha de peixe"
  },
  {
    id: "17",
    nome: "Filipa Costa",
    tipo: "individual",
    nif: "789012306",
    email: "filipa.costa@email.com",
    telefone: "+351 927 890 123",
    morada: "Rua Velha, 1010, Coimbra",
    status: "ativo",
    ilha: "Coimbra",
    portoEscala: "Peniche",
    dataNascimento: "1991-12-22",
    profissao: "Médica",
    empresa: "Clínica Marítima",
    observacoes: "Médica especializada em medicina hiperbárica e mergulho"
  },
  {
    id: "18",
    nome: "Bruno Ferreira",
    tipo: "individual",
    nif: "890123407",
    email: "bruno.ferreira@email.com",
    telefone: "+351 928 901 234",
    morada: "Avenida Nova, 1111, Évora",
    status: "ativo",
    ilha: "Évora",
    portoEscala: "Grândola",
    dataNascimento: "1986-05-14",
    profissao: "Guia Turístico",
    empresa: "Turismo Marinho",
    observacoes: "Guia turístico especializado em passeios de barco e observação de golfinhos"
  },
  {
    id: "19",
    nome: "Joana Pinto",
    tipo: "individual",
    nif: "901234508",
    email: "joana.pinto@email.com",
    telefone: "+351 929 012 345",
    morada: "Travessa do Atlântico, 1212, Faro",
    status: "ativo",
    ilha: "Algarve",
    portoEscala: "Faro",
    dataNascimento: "1993-09-07",
    profissao: "Oceanógrafa",
    empresa: "Centro de Investigação Marinha",
    observacoes: "Oceanógrafa dedicada ao estudo das correntes marinhas"
  },
  {
    id: "20",
    nome: "Ricardo Santos",
    tipo: "individual",
    nif: "012345609",
    email: "ricardo.santos@email.com",
    telefone: "+351 930 123 456",
    morada: "Praça Nova, 1313, Bragança",
    status: "ativo",
    ilha: "Bragança",
    portoEscala: "Viana do Castelo",
    dataNascimento: "1974-01-16",
    profissao: "Historiador",
    empresa: "Museu Marítimo",
    observacoes: "Historiador especializado na história da navegação portuguesa"
  },
  {
    id: "21",
    nome: "Marina Rodrigues",
    tipo: "individual",
    nif: "123456710",
    email: "marina.rodrigues@email.com",
    telefone: "+351 931 234 567",
    morada: "Rua do Cais, 1414, Aveiro",
    status: "ativo",
    ilha: "Aveiro",
    portoEscala: "Aveiro",
    dataNascimento: "1989-04-29",
    profissao: "Arquiteta",
    empresa: "Arquitetura Marinha",
    observacoes: "Arquiteta especializada em projetos de marinas e portos"
  },
  {
    id: "22",
    nome: "Hugo Almeida",
    tipo: "individual",
    nif: "234567811",
    email: "hugo.almeida@email.com",
    telefone: "+351 932 345 678",
    morada: "Avenida dos Pescadores, 1515, Leiria",
    status: "ativo",
    ilha: "Leiria",
    portoEscala: "Peniche",
    dataNascimento: "1980-08-11",
    profissao: "Chef",
    empresa: "Cozinha do Mar",
    observacoes: "Chef especializado em gastronomia de peixe e marisco"
  },
  {
    id: "23",
    nome: "Diana Gomes",
    tipo: "individual",
    nif: "345678912",
    email: "diana.gomes@email.com",
    telefone: "+351 933 456 789",
    morada: "Largo do Porto, 1616, Viana do Castelo",
    status: "ativo",
    ilha: "Viana do Castelo",
    portoEscala: "Viana do Castelo",
    dataNascimento: "1994-11-23",
    profissao: "Bióloga",
    empresa: "Aquário de Viana",
    observacoes: "Bióloga responsável pelo aquário local"
  },
  {
    id: "24",
    nome: "Filipe Sousa",
    tipo: "individual",
    nif: "456789013",
    email: "filipe.sousa@email.com",
    telefone: "+351 934 567 890",
    morada: "Rua Nova, 1717, Coimbra",
    status: "ativo",
    ilha: "Coimbra",
    portoEscala: "Peniche",
    dataNascimento: "1976-06-05",
    profissao: "Capitão de Porto",
    empresa: "Autoridade Marítima",
    observacoes: "Capitão do porto responsável pela segurança marítima"
  }
];

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ilhaFilter, setIlhaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);


  // Sempre chamar o hook na raiz do componente

  const hookResult = useClientes({ tipo: tipoFilter || undefined, ilha: ilhaFilter || undefined });

  // Só usa dados reais se montado, senão usa mock
  const displayClientes = mounted && hookResult.data ? hookResult.data : mockClientes;
  const islands = Array.from(new Set(displayClientes.map((c: any) => c.ilha).filter(Boolean)));
  const isLoading = mounted ? hookResult.isLoading : false;
  const error = mounted ? hookResult.error : null;

  // Filtrar clientes baseado no termo de busca
  const filteredClientes = displayClientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.telefone && cliente.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
  ).filter((cliente) => {
    if (ilhaFilter) {
      if ((cliente.ilha || '').toLowerCase() !== ilhaFilter.toLowerCase()) return false;
    }
    if (tipoFilter) {
      // server already filters when mounted; keep a defensive local filter for mock data
      const t = (cliente.tipo || '').toLowerCase();
      const tf = tipoFilter.toLowerCase();
      if (!t.includes(tf) && !(tf.includes('pesca') && t.includes('pesca'))) return false;
    }
    return true;
  });


  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredClientes.map(c => c.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  useEffect(() => {
    if (selectedIds.length === filteredClientes.length && filteredClientes.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, filteredClientes]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar clientes</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>

        <Shortcuts />
      </div>
    );
  }

  // Exclusão em massa
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} cliente(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/clientes/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Erro ao excluir clientes");
      toast.success("Clientes excluídos com sucesso!");
      setSelectedIds([]);
      // Forçar atualização da lista (ideal: usar React Query ou SWR)
      window.location.reload();
    } catch (e) {
      toast.error("Erro ao excluir clientes");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Clientes
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestão de clientes e contactos
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <WizardCliente onFinish={(data) => {
                // Aqui você pode integrar com a API ou mutate SWR/React Query
                alert("Cliente cadastrado: " + JSON.stringify(data, null, 2));
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar clientes..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-56">
                <label className="sr-only">Filtrar por ilha</label>
                <select
                  value={ilhaFilter}
                  onChange={(e) => setIlhaFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                >
                  <option value="">Todas as ilhas</option>
                  {islands.map((il) => (
                    <option key={il} value={il}>{il}</option>
                  ))}
                </select>
              </div>
              <div className="w-56">
                <label className="sr-only">Filtrar por tipo</label>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                >
                  <option value="">Todos os tipos</option>
                  <option value="pesca">Pesca (geral)</option>
                  <option value="pesca costeira">Pesca Costeira</option>
                  <option value="pesca local">Pesca Local</option>
                  <option value="maritimo turistica">Marítimo Turística</option>
                  <option value="recreio">Recreio</option>
                  <option value="nacional">Nacional</option>
                </select>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{displayClientes.length}</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {displayClientes.filter(c => c.status === 'ativo').length}
              </div>
              <p className="text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {displayClientes.filter(c => c.tipo === 'empresa').length}
              </div>
              <p className="text-sm text-gray-600">Empresas</p>
            </CardContent>
          </Card>
        </div>

        {/* Botão de exclusão em massa */}
        <div className="mb-4 flex gap-2">
          <Button
            variant="destructive"
            disabled={selectedIds.length === 0 || isDeleting}
            onClick={handleDeleteSelected}
          >
            {isDeleting ? "Excluindo..." : `Excluir selecionados (${selectedIds.length})`}
          </Button>
        </div>
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Todos os clientes registados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={e => handleSelectAll(e.target.checked)}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ilha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jangadas</TableHead>
                  <TableHead>Navios</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cliente.id)}
                          onChange={e => handleSelectOne(cliente.id, e.target.checked)}
                          aria-label={`Selecionar cliente ${cliente.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === 'empresa' ? 'secondary' : 'default'}>
                          {cliente.tipo === 'empresa' ? 'Empresa' : 'Individual'}
                        </Badge>
                      </TableCell>
                      <TableCell>{cliente.nif}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.ilha}</TableCell>
                      <TableCell>
                        <Badge
                          variant={cliente.status === 'ativo' ? 'default' : 'secondary'}
                        >
                          {cliente.status}
                        </Badge>
                      </TableCell>
                      {/* Jangadas deste cliente (mock: filtrar por proprietario) */}
                      <TableCell>
                        <Link href={`/jangadas?search=${encodeURIComponent(cliente.nome)}`} className="text-blue-600 underline hover:text-blue-800">
                          Ver Jangadas
                        </Link>
                      </TableCell>
                      {/* Navios deste cliente (mock: filtrar por proprietario/empresa) */}
                      <TableCell>
                        <Link href={`/navios?search=${encodeURIComponent((cliente as any).empresa ?? cliente.nome)}`} className="text-blue-600 underline hover:text-blue-800">
                          Ver Navios
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/clientes/${cliente.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}