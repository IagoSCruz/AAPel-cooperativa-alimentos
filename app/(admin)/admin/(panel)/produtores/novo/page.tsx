import { ProducerForm } from "../_form";
import { createProducerAction } from "../actions";

export default function NovoProdutorPage() {
  return <ProducerForm onSubmit={createProducerAction} submitLabel="Criar produtor" />;
}
