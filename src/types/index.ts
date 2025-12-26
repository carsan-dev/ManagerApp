export type TipoAsistencia = 'completo' | 'medio' | 'dias';

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
