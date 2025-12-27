import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from '@react-native-firebase/firestore';
import { Alumno, AppConfig, SyncedData } from '../types';

const USERS_COLLECTION = 'users';
const DATA_DOCUMENT = 'data';

const DEFAULT_CONFIG: AppConfig = {
  profesores: [
    { nombre: 'Profesor 1', proporcion: 60 },
    { nombre: 'Profesor 2', proporcion: 40 },
  ],
  usarProporcionManual: false,
};

export const FirebaseSyncService = {
  async fetchFromCloud(uid: string): Promise<SyncedData | null> {
    try {
      const db = getFirestore();
      const docRef = doc(collection(doc(collection(db, USERS_COLLECTION), uid), 'userData'), DATA_DOCUMENT);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data() as SyncedData;
      return data;
    } catch (error) {
      console.error('Error fetching from cloud:', error);
      return null;
    }
  },

  async syncToCloud(uid: string, data: SyncedData): Promise<boolean> {
    try {
      const db = getFirestore();
      const docRef = doc(collection(doc(collection(db, USERS_COLLECTION), uid), 'userData'), DATA_DOCUMENT);
      await setDoc(docRef, data, { merge: true });
      return true;
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      return false;
    }
  },

  mergeData(
    localAlumnos: Alumno[],
    localConfig: AppConfig,
    localTimestamp: number,
    cloudData: SyncedData | null
  ): { alumnos: Alumno[]; config: AppConfig; needsCloudUpdate: boolean; needsLocalUpdate: boolean } {
    // Si no hay datos en la nube, usar los locales y subir a la nube
    if (!cloudData) {
      return {
        alumnos: localAlumnos,
        config: localConfig,
        needsCloudUpdate: localAlumnos.length > 0 || localConfig !== DEFAULT_CONFIG,
        needsLocalUpdate: false,
      };
    }

    // Si no hay datos locales, usar los de la nube
    if (localAlumnos.length === 0 && localTimestamp === 0) {
      return {
        alumnos: cloudData.alumnos,
        config: cloudData.config,
        needsCloudUpdate: false,
        needsLocalUpdate: true,
      };
    }

    // Comparar timestamps - usar el más reciente
    if (cloudData.lastUpdated > localTimestamp) {
      return {
        alumnos: cloudData.alumnos,
        config: cloudData.config,
        needsCloudUpdate: false,
        needsLocalUpdate: true,
      };
    }

    // Los datos locales son más recientes o iguales
    return {
      alumnos: localAlumnos,
      config: localConfig,
      needsCloudUpdate: localTimestamp > cloudData.lastUpdated,
      needsLocalUpdate: false,
    };
  },

  createSyncedData(alumnos: Alumno[], config: AppConfig): SyncedData {
    // Función para eliminar todos los undefined recursivamente
    const removeUndefined = (obj: any): any => {
      if (obj === undefined) {
        return null;
      }
      if (obj === null) {
        return null;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item));
      }
      if (typeof obj === 'object' && obj !== null) {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    return {
      alumnos: removeUndefined(alumnos) || [],
      config: removeUndefined(config) || DEFAULT_CONFIG,
      lastUpdated: Date.now(),
    };
  },
};
