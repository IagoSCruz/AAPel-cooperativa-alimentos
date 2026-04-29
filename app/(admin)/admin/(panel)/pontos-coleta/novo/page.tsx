import { CollectionPointForm } from "../_form";
import { createCollectionPointAction } from "../actions";

export default function NovoPontoPage() {
  return (
    <CollectionPointForm
      onSubmit={createCollectionPointAction}
      submitLabel="Criar ponto de coleta"
    />
  );
}
