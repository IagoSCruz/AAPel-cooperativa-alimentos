import { ZoneForm } from "../_form";
import { createZoneAction } from "../actions";

export default function NovaZonaPage() {
  return <ZoneForm onSubmit={createZoneAction} submitLabel="Criar zona" />;
}
