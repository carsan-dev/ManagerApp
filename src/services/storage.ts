import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alumno } from '../types';

const ALUMNOS_KEY = 'alumnos';
const CONFIG_KEY = 'config';

export type AppConfig = {
  nombreProfesor1: string;
  nombreProfesor2: string;
  proporcionProfesor1: number;
};

const DEFAULT_CONFIG: AppConfig = {
  nombreProfesor1: 'Profesor 1',
  nombreProfesor2: 'Profesor 2',
  proporcionProfesor1: 60,
};

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

  async getConfig(): Promise<AppConfig> {
    try {
      const data = await AsyncStorage.getItem(CONFIG_KEY);
      return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      return DEFAULT_CONFIG;
    }
  },

  async saveConfig(config: AppConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  },
};
