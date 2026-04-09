// Exemplo de tipos compartilhados (serão expandidos conforme a necessidade)
export type TenantInfo = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type DeliveryDateRange = {
  start: Date;
  end: Date;
};
