import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alumno, Pagador } from '../types';

const ALUMNOS_KEY = 'alumnos';
const CONFIG_KEY = 'config';

export const MAX_PAGADORES = 5;

export const PRESETS_PROPORCION: Record<number, { label: string; valores: number[] }[]> = {
  1: [{ label: '100%', valores: [100] }],
  2: [
    { label: '50/50', valores: [50, 50] },
    { label: '60/40', valores: [60, 40] },
    { label: '70/30', valores: [70, 30] },
    { label: '80/20', valores: [80, 20] },
  ],
  3: [
    { label: '33/33/34', valores: [33, 33, 34] },
    { label: '40/30/30', valores: [40, 30, 30] },
    { label: '50/25/25', valores: [50, 25, 25] },
    { label: '50/30/20', valores: [50, 30, 20] },
  ],
  4: [
    { label: '25/25/25/25', valores: [25, 25, 25, 25] },
    { label: '40/20/20/20', valores: [40, 20, 20, 20] },
    { label: '30/30/20/20', valores: [30, 30, 20, 20] },
    { label: '35/25/25/15', valores: [35, 25, 25, 15] },
  ],
  5: [
    { label: '20/20/20/20/20', valores: [20, 20, 20, 20, 20] },
    { label: '30/20/20/15/15', valores: [30, 20, 20, 15, 15] },
    { label: '25/25/20/15/15', valores: [25, 25, 20, 15, 15] },
    { label: '40/20/15/15/10', valores: [40, 20, 15, 15, 10] },
  ],
};

// Tipo para datos antiguos (migración)
type LegacyAppConfig = {
  nombreProfesor1?: string;
  nombreProfesor2?: string;
  proporcionProfesor1?: number;
};

export type AppConfig = {
  pagadores: Pagador[];
  usarProporcionManual: boolean;
};

const DEFAULT_CONFIG: AppConfig = {
  pagadores: [
    { nombre: 'Profesor 1', proporcion: 60 },
    { nombre: 'Profesor 2', proporcion: 40 },
  ],
  usarProporcionManual: false,
};

// Migrar datos del formato antiguo al nuevo
function migrateConfig(data: LegacyAppConfig & Partial<AppConfig>): AppConfig {
  // Si ya tiene el nuevo formato, devolverlo
  if (data.pagadores && Array.isArray(data.pagadores)) {
    return {
      pagadores: data.pagadores,
      usarProporcionManual: data.usarProporcionManual ?? false,
    };
  }

  // Migrar desde formato antiguo
  const proporcion1 = data.proporcionProfesor1 ?? 60;
  return {
    pagadores: [
      { nombre: data.nombreProfesor1 ?? 'Profesor 1', proporcion: proporcion1 },
      { nombre: data.nombreProfesor2 ?? 'Profesor 2', proporcion: 100 - proporcion1 },
    ],
    usarProporcionManual: false,
  };
}

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
      if (!data) {
        return DEFAULT_CONFIG;
      }
      const parsed = JSON.parse(data);
      const migrated = migrateConfig(parsed);

      // Si se migró, guardar el nuevo formato
      if (!parsed.pagadores) {
        await this.saveConfig(migrated);
      }

      return migrated;
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
