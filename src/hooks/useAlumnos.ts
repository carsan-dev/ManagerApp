import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Alumno } from '../types';
import { StorageService } from '../services/storage';

export function useAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarAlumnos = async () => {
      const data = await StorageService.getAlumnos();
      setAlumnos(data);
      setIsLoading(false);
    };
    cargarAlumnos();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      StorageService.saveAlumnos(alumnos);
    }
  }, [alumnos, isLoading]);

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

    setAlumnos(prev => [...prev, { nombre: nombreTrimmed, cantidad }]);
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

  const total = alumnos.reduce((acc, al) => acc + al.cantidad, 0);
  const proporcionalMinerva = total * 0.6;
  const proporcionalLola = total * 0.4;

  return {
    alumnos,
    isLoading,
    agregarAlumno,
    editarAlumno,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionalMinerva,
    proporcionalLola,
  };
}
