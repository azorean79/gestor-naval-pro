import { useForm, FormProvider } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardTitle, CardDescription } from "./card";

interface ClienteFormData {
  nome: string;
  email: string;
  nif: string;
  telefone: string;
  morada: string;
  ilha: string;
  portoEscala: string;
  status: string;
  observacoes: string;
}

const steps = [
  { label: "Dados Básicos" },
  { label: "Contato" },
  { label: "Endereço" },
  { label: "Outros" },
];

export function WizardCliente({ onFinish }: { onFinish: (data: ClienteFormData) => void }) {
  const methods = useForm<ClienteFormData>({ defaultValues: {} });
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
          <CardDescription className="mb-4">Preencha as informações do cliente</CardDescription>
          {step === 0 && (
            <>
              <Input label="Nome" aria-invalid={!!methods.formState.errors.nome} {...methods.register("nome", { required: "Nome é obrigatório" })} />
              {methods.formState.errors.nome && (
                <span className="text-red-600 text-xs">{methods.formState.errors.nome.message as string}</span>
              )}
              <Input label="Email" aria-invalid={!!methods.formState.errors.email} type="email" {...methods.register("email", {
                required: "Email é obrigatório",
                pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Email inválido" }
              })} />
              {methods.formState.errors.email && (
                <span className="text-red-600 text-xs">{methods.formState.errors.email.message as string}</span>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <Input label="NIF" aria-invalid={!!methods.formState.errors.nif} {...methods.register("nif", { required: "NIF é obrigatório", minLength: { value: 9, message: "NIF deve ter 9 dígitos" } })} />
              {methods.formState.errors.nif && (
                <span className="text-red-600 text-xs">{methods.formState.errors.nif.message as string}</span>
              )}
              <Input label="Telefone" aria-invalid={!!methods.formState.errors.telefone} {...methods.register("telefone", { required: "Telefone é obrigatório" })} />
              {methods.formState.errors.telefone && (
                <span className="text-red-600 text-xs">{methods.formState.errors.telefone.message as string}</span>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Input label="Morada" aria-invalid={!!methods.formState.errors.morada} {...methods.register("morada", { required: "Morada é obrigatória" })} />
              {methods.formState.errors.morada && (
                <span className="text-red-600 text-xs">{methods.formState.errors.morada.message as string}</span>
              )}
              <Input label="Ilha" aria-invalid={!!methods.formState.errors.ilha} {...methods.register("ilha", { required: "Ilha é obrigatória" })} />
              {methods.formState.errors.ilha && (
                <span className="text-red-600 text-xs">{methods.formState.errors.ilha.message as string}</span>
              )}
              <Input label="Porto de Escala" aria-invalid={!!methods.formState.errors.portoEscala} {...methods.register("portoEscala", { required: "Porto de Escala é obrigatório" })} />
              {methods.formState.errors.portoEscala && (
                <span className="text-red-600 text-xs">{methods.formState.errors.portoEscala.message as string}</span>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <Input label="Status" aria-invalid={!!methods.formState.errors.status} {...methods.register("status", { required: "Status é obrigatório" })} />
              {methods.formState.errors.status && (
                <span className="text-red-600 text-xs">{methods.formState.errors.status.message as string}</span>
              )}
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
