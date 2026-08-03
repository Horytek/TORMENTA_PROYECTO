export interface PuntosConfig {
  activo: boolean;
  soles_por_punto: number;
  valor_canje_por_punto: number;
}

export interface PuntosCliente {
  saldo: number;
  config: PuntosConfig;
}
