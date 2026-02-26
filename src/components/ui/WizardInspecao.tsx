import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardTitle, CardDescription } from "./card";

interface InspecaoFormData {
  data: string;
  responsavel: string;
  tipo: string;
  resultado: string;
  observacoes: string;
}

const steps = [
  { label: "Data e Responsável" },
  { label: "Tipo de Inspeção" },
  { label: "Resultado" },
  { label: "Observações" },
];

export function WizardInspecao({ onFinish }: { onFinish: (data: InspecaoFormData) => void }) {
  const methods = useForm<InspecaoFormData>({ defaultValues: {} });
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
          <CardDescription className="mb-4">Preencha as informações da inspeção</CardDescription>
          {step === 0 && (
            <>
              <Input label="Data" type="date" {...methods.register("data", { required: true })} />
              <Input label="Responsável" {...methods.register("responsavel")} />
            </>
          )}
          {step === 1 && (
            <Input label="Tipo de Inspeção" {...methods.register("tipo")} />
          )}
          {step === 2 && (
            <Input label="Resultado" {...methods.register("resultado")} />
          )}
          {step === 3 && (
            <Input label="Observações" {...methods.register("observacoes")} />
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
