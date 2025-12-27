import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { Alumno, TipoAsistencia, Profesor } from '../types';
import { StorageService, AppConfig } from '../services/storage';
import { FirebaseSyncService } from '../services/firebaseSync';
import { AuthService } from '../services/auth';

const DIAS_MES = 30;
const SYNC_DEBOUNCE_MS = 1000;

export type ProporcionalProfesor = {
  nombre: string;
  cantidad: number;
  proporcion: number;
};

export function useAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    profesores: [
      { nombre: 'Profesor 1', proporcion: 60 },
      { nombre: 'Profesor 2', proporcion: 40 },
    ],
    usarProporcionManual: false,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<number>(0);
  const initialSyncDoneRef = useRef<boolean>(false);

  // Sincronizar datos a la nube con debounce
  const syncToCloud = useCallback(async (alumnosToSync: Alumno[], configToSync: AppConfig) => {
    const user = AuthService.getCurrentUser();
    if (!user) {
      return;
    }

    setIsSyncing(true);
    try {
      const timestamp = Date.now();
      const syncedData = FirebaseSyncService.createSyncedData(alumnosToSync, configToSync);
      const success = await FirebaseSyncService.syncToCloud(user.uid, syncedData);
      if (success) {
        await StorageService.saveTimestamp(timestamp);
        lastSyncedRef.current = timestamp;
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Debounced sync
  const debouncedSync = useCallback((alumnosToSync: Alumno[], configToSync: AppConfig) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncToCloud(alumnosToSync, configToSync);
    }, SYNC_DEBOUNCE_MS);
  }, [syncToCloud]);

  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar datos locales primero
      const [alumnosData, configData, localTimestamp] = await Promise.all([
        StorageService.getAlumnos(),
        StorageService.getConfig(),
        StorageService.getTimestamp(),
      ]);

      // Migrar datos antiguos si no tienen los nuevos campos
      const datosMigrados = alumnosData.map(alumno => ({
        ...alumno,
        activo: alumno.activo ?? true,
        tipoAsistencia: alumno.tipoAsistencia ?? 'completo' as TipoAsistencia,
        diasAsistencia: alumno.diasAsistencia,
      }));

      // Intentar sincronizar con la nube si hay usuario
      const user = AuthService.getCurrentUser();
      if (user) {
        try {
          const cloudData = await FirebaseSyncService.fetchFromCloud(user.uid);
          const merged = FirebaseSyncService.mergeData(
            datosMigrados,
            configData,
            localTimestamp,
            cloudData
          );

          setAlumnos(merged.alumnos);
          setConfig(merged.config);

          // Guardar localmente si los datos de la nube eran más recientes
          if (merged.needsLocalUpdate) {
            await StorageService.saveAlumnos(merged.alumnos);
            await StorageService.saveConfig(merged.config);
            if (cloudData) {
              await StorageService.saveTimestamp(cloudData.lastUpdated);
              lastSyncedRef.current = cloudData.lastUpdated;
            }
          }

          // Subir a la nube si los datos locales eran más recientes
          if (merged.needsCloudUpdate) {
            const timestamp = Date.now();
            const syncedData = FirebaseSyncService.createSyncedData(merged.alumnos, merged.config);
            await FirebaseSyncService.syncToCloud(user.uid, syncedData);
            await StorageService.saveTimestamp(timestamp);
            lastSyncedRef.current = timestamp;
          }
          initialSyncDoneRef.current = true;
        } catch (error) {
          console.error('Error during initial sync:', error);
          // En caso de error, usar datos locales
          setAlumnos(datosMigrados);
          setConfig(configData);
        }
      } else {
        setAlumnos(datosMigrados);
        setConfig(configData);
      }

      setIsLoading(false);
    };
    cargarDatos();
  }, []);

  // Listener para sincronizar cuando el usuario inicie sesión o Firebase Auth esté listo
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      // Si ya hicimos sync inicial o estamos cargando, no hacer nada
      if (initialSyncDoneRef.current || isLoading) {
        return;
      }

      if (user && alumnos.length > 0) {
        // Usuario disponible y hay datos locales - sincronizar
        try {
          const localTimestamp = await StorageService.getTimestamp();
          const cloudData = await FirebaseSyncService.fetchFromCloud(user.uid);

          if (!cloudData && localTimestamp === 0) {
            // Primera vez - subir datos locales a la nube
            const timestamp = Date.now();
            const syncedData = FirebaseSyncService.createSyncedData(alumnos, config);
            await FirebaseSyncService.syncToCloud(user.uid, syncedData);
            await StorageService.saveTimestamp(timestamp);
            lastSyncedRef.current = timestamp;
            initialSyncDoneRef.current = true;
          }
        } catch (error) {
          console.error('Error syncing on auth change:', error);
        }
      }
    });

    return unsubscribe;
  }, [alumnos, config, isLoading]);

  // Guardar alumnos localmente y sincronizar a la nube
  useEffect(() => {
    if (!isLoading) {
      StorageService.saveAlumnos(alumnos);
      debouncedSync(alumnos, config);
    }
  }, [alumnos, isLoading, config, debouncedSync]);

  // Guardar config localmente y sincronizar a la nube
  useEffect(() => {
    if (!isLoading) {
      StorageService.saveConfig(config);
      debouncedSync(alumnos, config);
    }
  }, [config, isLoading, alumnos, debouncedSync]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const actualizarConfig = useCallback((nuevoConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...nuevoConfig }));
  }, []);

  const actualizarProfesores = useCallback((profesores: Profesor[]) => {
    setConfig(prev => ({ ...prev, profesores }));
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
    if (Number.isNaN(nuevaCantidad) || nuevaCantidad < 0) {
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
    if (!alumno.activo) {
      return 0;
    }

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

  // Calcular totales y proporciones para cada profesor
  const { total, proporcionales } = useMemo(() => {
    const totalCalculado = alumnos.reduce((acc, al) => acc + calcularCantidadEfectiva(al), 0);

    const porProfesor: ProporcionalProfesor[] = config.profesores.map(p => ({
      nombre: p.nombre,
      cantidad: totalCalculado * (p.proporcion / 100),
      proporcion: p.proporcion,
    }));

    return {
      total: totalCalculado,
      proporcionales: porProfesor,
    };
  }, [alumnos, config.profesores, calcularCantidadEfectiva]);

  return {
    alumnos,
    isLoading,
    isSyncing,
    agregarAlumno,
    editarAlumno,
    toggleActivo,
    cambiarAsistencia,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionales,
    config,
    actualizarConfig,
    actualizarProfesores,
    calcularCantidadEfectiva,
  };
}
