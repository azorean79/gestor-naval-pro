import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { Button } from "./button";
import { Card, CardTitle, CardDescription } from "./card";

interface ArtigoStockFormData {
  nome: string;
  categoria: string;
  quantidade: number;
  localizacao: string;
  descricao: string;
}

const steps = [
  { label: "Identificação" },
  { label: "Categoria e Localização" },
  { label: "Quantidade e Descrição" },
];

export function WizardArtigoStock({ onFinish }: { onFinish: (data: ArtigoStockFormData) => void }) {
  const methods = useForm<ArtigoStockFormData>({ defaultValues: {} });
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
          <CardDescription className="mb-4">Preencha as informações do artigo</CardDescription>
          {step === 0 && (
            <>
              <input className="input mb-2" placeholder="Nome do artigo" {...methods.register("nome", { required: true })} />
            </>
          )}
          {step === 1 && (
            <>
              <input className="input mb-2" placeholder="Categoria" {...methods.register("categoria")} />
              <input className="input mb-2" placeholder="Localização" {...methods.register("localizacao")} />
            </>
          )}
          {step === 2 && (
            <>
              <input className="input mb-2" type="number" placeholder="Quantidade" {...methods.register("quantidade", { valueAsNumber: true })} />
              <input className="input mb-2" placeholder="Descrição" {...methods.register("descricao")} />
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
