import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { Button } from "./button";
import { Card, CardTitle, CardDescription } from "./card";

interface AgendamentoFormData {
  titulo: string;
  data: string;
  hora: string;
  cliente: string;
  tipo: string;
  descricao: string;
}

const steps = [
  { label: "Informações Básicas" },
  { label: "Data e Hora" },
  { label: "Cliente e Tipo" },
  { label: "Descrição" },
];

export function WizardAgendamento({ onFinish }: { onFinish: (data: AgendamentoFormData) => void }) {
  const methods = useForm<AgendamentoFormData>({ defaultValues: {} });
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
          <CardDescription className="mb-4">Preencha os dados do agendamento</CardDescription>
          {step === 0 && (
            <input className="input mb-2" placeholder="Título" {...methods.register("titulo", { required: true })} />
          )}
          {step === 1 && (
            <>
              <input className="input mb-2" type="date" placeholder="Data" {...methods.register("data", { required: true })} />
              <input className="input mb-2" type="time" placeholder="Hora" {...methods.register("hora", { required: true })} />
            </>
          )}
          {step === 2 && (
            <>
              <input className="input mb-2" placeholder="Cliente" {...methods.register("cliente")} />
              <input className="input mb-2" placeholder="Tipo" {...methods.register("tipo")} />
            </>
          )}
          {step === 3 && (
            <input className="input mb-2" placeholder="Descrição" {...methods.register("descricao")} />
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
