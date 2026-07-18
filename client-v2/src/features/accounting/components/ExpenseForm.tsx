import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { getExpenseCategories, createExpense } from "../api/accounting";
import type { ExpenseInput } from "../types";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExpenseFormValues {
  descripcion: string;
  monto: string;
  fecha: string;
  id_categoria: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ExpenseForm({ isOpen, onClose }: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const { data: categorias = [] } = useQuery({ queryKey: ["expense-categories"], queryFn: getExpenseCategories });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: { descripcion: "", monto: "", fecha: todayIso(), id_categoria: 0 },
  });

  const mutation = useMutation({
    mutationFn: (values: ExpenseInput) => createExpense(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-pl"] });
      reset({ descripcion: "", monto: "", fecha: todayIso(), id_categoria: 0 });
      onClose();
    },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    mutation.mutate({
      descripcion: values.descripcion,
      monto: Number(values.monto),
      fecha: values.fecha,
      id_categoria: Number(values.id_categoria),
    });
  };

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title="Nuevo gasto"
      description="Registra un egreso para incluirlo en el Estado de Resultados."
      submitLabel="Guardar gasto"
      isSubmitting={mutation.isPending}
      error={mutation.isError ? "No se pudo registrar el gasto." : null}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField label="Descripción" htmlFor="gasto-desc" error={errors.descripcion?.message}>
        <Input id="gasto-desc" placeholder="Ej: Recibo de luz - julio" {...register("descripcion", { required: "La descripción es obligatoria" })} />
      </FormField>

      <FormField label="Categoría">
        <Controller
          control={control}
          name="id_categoria"
          rules={{ required: true, validate: (v) => Number(v) > 0 }}
          render={({ field }) => (
            <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Monto (S/.)" htmlFor="gasto-monto" error={errors.monto?.message}>
          <Input
            id="gasto-monto"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("monto", { required: "El monto es obligatorio", min: { value: 0.01, message: "Debe ser mayor a 0" } })}
          />
        </FormField>
        <FormField label="Fecha" htmlFor="gasto-fecha">
          <Input id="gasto-fecha" type="date" {...register("fecha", { required: true })} />
        </FormField>
      </div>
    </FormDialog>
  );
}
