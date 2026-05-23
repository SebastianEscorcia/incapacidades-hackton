export type FiltroBoton = {
  key: string;
  label: string;
  value: string;
  icon?: string;
  count?: number;
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'help'
    | 'danger';
};

export type GrupoFiltros = {
  titulo: string;
  parametro: string;
  botones: FiltroBoton[];
  multiple?: boolean;
  mostrarTodos?: boolean;
};
