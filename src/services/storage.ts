import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alumno } from '../types';

const ALUMNOS_KEY = 'alumnos';

export const StorageService = {
  async getAlumnos(): Promise<Alumno[]> {
    try {
      const data = await AsyncStorage.getItem(ALUMNOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
      return [];
    }
  },

  async saveAlumnos(alumnos: Alumno[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ALUMNOS_KEY, JSON.stringify(alumnos));
    } catch (error) {
      console.error('Error al guardar alumnos:', error);
    }
  },

  async clearAlumnos(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ALUMNOS_KEY);
    } catch (error) {
      console.error('Error al eliminar alumnos:', error);
    }
  },
};
