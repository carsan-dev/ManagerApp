export type Alumno = {
  nombre: string;
  cantidad: number;
};

export type RootStackParamList = {
  Home: undefined;
  Pdf: { alumnos: Alumno[] };
};
