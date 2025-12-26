export type TipoAsistencia = 'completo' | 'medio' | 'dias';

export type Pagador = {
  nombre: string;
  proporcion: number; // Porcentaje (0-100)
};

export type Alumno = {
  nombre: string;
  cantidad: number;
  activo: boolean;
  tipoAsistencia: TipoAsistencia;
  diasAsistencia?: number; // Solo se usa cuando tipoAsistencia es 'dias'
};

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Pdf: { alumnos: Alumno[] };
};
