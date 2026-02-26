import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardTitle, CardDescription } from "./card";


interface JangadaFormData {
  numeroSerie: string;
  dataFabricacao: string;
  tipoPackId: string;
  tipo: string;
  capacidade: string;
  proprietario: string;
  validade: string;
  observacoes: string;
}


const steps = [
  { label: "Identificação" },
  { label: "Detalhes" },
  { label: "Pack e Proprietário" },
  { label: "Validade e Observações" },
];

export function WizardJangada({ onFinish }: { onFinish: (data: JangadaFormData) => void }) {
  const methods = useForm<JangadaFormData>({ defaultValues: {} });
  // Packs mockados para seleção
  const packs = [
    { id: "pack1", nome: "Pack Básico" },
    { id: "pack2", nome: "Pack Completo" },
    { id: "pack3", nome: "Pack Premium" },
  ];
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = methods.handleSubmit((data) => {
    if (step === steps.length - 1) {
      onFinish(data);
    } else {
      next();
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="max-w-lg mx-auto p-6 bg-white rounded shadow">
        <Card>
          <CardTitle className="mb-2 text-xl font-bold">{steps[step].label}</CardTitle>
          <CardDescription className="mb-4">Preencha as informações da jangada</CardDescription>
          {step === 0 && (
            <>
              <Input label="Número de Série" {...methods.register("numeroSerie", { required: true })} />
              <label className="block mt-4 mb-1 font-medium">Data de Fabrico</label>
              <input type="date" className="input mb-2" {...methods.register("dataFabricacao", { required: true })} />
            </>
          )}
          {step === 1 && (
            <>
              <Input label="Tipo" {...methods.register("tipo")} />
              <Input label="Capacidade" {...methods.register("capacidade")} />
            </>
          )}
          {step === 2 && (
            <>
              <label className="block mb-1 font-medium">Tipo de Pack</label>
              <select className="input mb-2" {...methods.register("tipoPackId", { required: true })}>
                <option value="">Selecione o pack</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>{pack.nome}</option>
                ))}
              </select>
              <Input label="Proprietário" {...methods.register("proprietario")} />
            </>
          )}
          {step === 3 && (
            <>
              <Input label="Validade" {...methods.register("validade")} />
              <Input label="Observações" {...methods.register("observacoes")} />
            </>
          )}
          <div className="flex justify-between mt-6">
            <Button type="button" onClick={back} disabled={step === 0} variant="secondary">Voltar</Button>
            <Button type="submit">{step === steps.length - 1 ? "Finalizar" : "Próximo"}</Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}
