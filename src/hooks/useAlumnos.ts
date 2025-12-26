import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Alumno, TipoAsistencia } from '../types';
import { StorageService, AppConfig } from '../services/storage';

const DIAS_MES = 30;

export function useAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>({
    nombreProfesor1: 'Profesor 1',
    nombreProfesor2: 'Profesor 2',
    proporcionProfesor1: 60,
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const [alumnosData, configData] = await Promise.all([
        StorageService.getAlumnos(),
        StorageService.getConfig(),
      ]);

      // Migrar datos antiguos si no tienen los nuevos campos
      const datosMigrados = alumnosData.map(alumno => ({
        ...alumno,
        activo: alumno.activo ?? true,
        tipoAsistencia: alumno.tipoAsistencia ?? 'completo' as TipoAsistencia,
        diasAsistencia: alumno.diasAsistencia,
      }));

      setAlumnos(datosMigrados);
      setConfig(configData);
      setIsLoading(false);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveAlumnos(alumnos);
    }
  }, [alumnos, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveConfig(config);
    }
  }, [config, isLoading]);

  const actualizarConfig = useCallback((nuevoConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...nuevoConfig }));
  }, []);

  const agregarAlumno = useCallback((nombre: string, cantidad: number) => {
    const nombreTrimmed = nombre.trim();

    if (nombreTrimmed === '') {
      Alert.alert('Error', 'El nombre del alumno no puede estar vacío.');
      return false;
    }

    if (alumnos.some(al => al.nombre === nombreTrimmed)) {
      Alert.alert('Error', 'El alumno ya está en la lista.');
      return false;
    }

    const nuevoAlumno: Alumno = {
      nombre: nombreTrimmed,
      cantidad,
      activo: true,
      tipoAsistencia: 'completo',
    };

    setAlumnos(prev => [...prev, nuevoAlumno]);
    return true;
  }, [alumnos]);

  const editarAlumno = useCallback((nombre: string, nuevaCantidad: number) => {
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor o igual a 0.');
      return false;
    }

    setAlumnos(prev =>
      prev.map(al =>
        al.nombre === nombre ? { ...al, cantidad: nuevaCantidad } : al
      )
    );
    return true;
  }, []);

  const toggleActivo = useCallback((nombre: string) => {
    setAlumnos(prev =>
      prev.map(al =>
        al.nombre === nombre ? { ...al, activo: !al.activo } : al
      )
    );
  }, []);

  const cambiarAsistencia = useCallback((
    nombre: string,
    tipoAsistencia: TipoAsistencia,
    diasAsistencia?: number
  ) => {
    setAlumnos(prev =>
      prev.map(al =>
        al.nombre === nombre
          ? { ...al, tipoAsistencia, diasAsistencia }
          : al
      )
    );
  }, []);

  const eliminarAlumno = useCallback((nombre: string) => {
    Alert.alert(
      'Eliminar alumno',
      `¿Estás seguro de que deseas eliminar a ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setAlumnos(prev => prev.filter(al => al.nombre !== nombre));
          },
        },
      ]
    );
  }, []);

  const eliminarTodos = useCallback(() => {
    Alert.alert(
      'Eliminar todos los alumnos',
      '¿Estás seguro de que deseas eliminar todos los datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAlumnos();
            setAlumnos([]);
          },
        },
      ]
    );
  }, []);

  // Calcular la cantidad efectiva de un alumno según su tipo de asistencia
  const calcularCantidadEfectiva = useCallback((alumno: Alumno): number => {
    if (!alumno.activo) return 0;

    switch (alumno.tipoAsistencia) {
      case 'completo':
        return alumno.cantidad;
      case 'medio':
        return alumno.cantidad / 2;
      case 'dias':
        const dias = alumno.diasAsistencia ?? 0;
        return (alumno.cantidad / DIAS_MES) * dias;
      default:
        return alumno.cantidad;
    }
  }, []);

  // Solo contar alumnos activos en los cálculos
  const { total, proporcionalProfesor1, proporcionalProfesor2 } = useMemo(() => {
    const totalCalculado = alumnos.reduce((acc, al) => acc + calcularCantidadEfectiva(al), 0);
    const prop1 = config.proporcionProfesor1 / 100;
    const prop2 = (100 - config.proporcionProfesor1) / 100;

    return {
      total: totalCalculado,
      proporcionalProfesor1: totalCalculado * prop1,
      proporcionalProfesor2: totalCalculado * prop2,
    };
  }, [alumnos, config.proporcionProfesor1, calcularCantidadEfectiva]);

  return {
    alumnos,
    isLoading,
    agregarAlumno,
    editarAlumno,
    toggleActivo,
    cambiarAsistencia,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionalProfesor1,
    proporcionalProfesor2,
    config,
    actualizarConfig,
    calcularCantidadEfectiva,
  };
}
