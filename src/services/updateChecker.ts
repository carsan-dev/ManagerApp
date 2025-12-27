import { Alert, Platform, NativeModules, AppState, AppStateStatus } from 'react-native';
import {
  getRemoteConfig,
  setDefaults,
  setConfigSettings,
  fetchAndActivate,
  getString,
  getBoolean,
} from '@react-native-firebase/remote-config';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { version as currentVersion } from '../../package.json';

const { InstallPermissionModule } = NativeModules;

interface UpdateConfig {
  latestVersion: string;
  forceUpdate: boolean;
  updateUrl: string;
  updateMessage: string;
}

const DEFAULT_CONFIG: UpdateConfig = {
  latestVersion: '1.0.0',
  forceUpdate: false,
  updateUrl: '',
  updateMessage: 'Hay una nueva versión disponible con mejoras y correcciones.',
};

// Callback para mostrar progreso de descarga
type ProgressCallback = (progress: number) => void;

type DownloadState = {
  isDownloading: boolean;
  progress: number;
  version: string;
};

type DownloadStateCallback = (state: DownloadState) => void;

class UpdateChecker {
  private initialized = false;
  private isDownloading = false;
  private pendingUpdate: { url: string; version: string; onProgress?: ProgressCallback } | null = null;
  private appStateSubscription: any = null;
  private downloadStateListeners: DownloadStateCallback[] = [];
  private currentDownloadVersion = '';

  async init() {
    if (this.initialized){
      return;
    }

    try {
      const config = getRemoteConfig();

      await setDefaults(config, {
        latest_version: DEFAULT_CONFIG.latestVersion,
        force_update: DEFAULT_CONFIG.forceUpdate,
        update_url: DEFAULT_CONFIG.updateUrl,
        update_message: DEFAULT_CONFIG.updateMessage,
      });

      await setConfigSettings(config, {
        minimumFetchIntervalMillis: 3600000, // 1 hora en producción
      });

      await fetchAndActivate(config);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing remote config:', error);
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2){
        return 1;
      }
      if (p1 < p2){
        return -1;
      }
    }
    return 0;
  }

  async checkForUpdate(onProgress?: ProgressCallback): Promise<void> {
    if (Platform.OS !== 'android'){
      return;
    }

    try {
      await this.init();

      const config = getRemoteConfig();
      const latestVersion = getString(config, 'latest_version');
      const forceUpdate = getBoolean(config, 'force_update');
      const updateUrl = getString(config, 'update_url');
      const updateMessage = getString(config, 'update_message');

      // Comparar versiones
      if (this.compareVersions(latestVersion, currentVersion) > 0) {
        this.showUpdateAlert(latestVersion, forceUpdate, updateUrl, updateMessage, onProgress);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  private showUpdateAlert(
    latestVersion: string,
    forceUpdate: boolean,
    updateUrl: string,
    updateMessage: string,
    onProgress?: ProgressCallback
  ) {
    const buttons: any[] = [];

    if (!forceUpdate) {
      buttons.push({
        text: 'Más tarde',
        style: 'cancel',
      });
    }

    buttons.push({
      text: 'Descargar e instalar',
      onPress: () => {
        if (updateUrl) {
          this.downloadAndInstall(updateUrl, latestVersion, onProgress).catch(console.error);
        } else {
          Alert.alert('Error', 'URL de actualización no disponible');
        }
      },
    });

    Alert.alert(
      `Nueva versión ${latestVersion}`,
      updateMessage || 'Hay una nueva versión disponible.',
      buttons,
      { cancelable: !forceUpdate }
    );
  }

  private async checkInstallPermission(): Promise<boolean> {
    try {
      if (InstallPermissionModule) {
        const canInstall = await InstallPermissionModule.canInstallApks();
        return canInstall;
      }
      return true;
    } catch (error) {
      console.error('Error checking install permission:', error);
      return true;
    }
  }

  private async requestInstallPermission(): Promise<void> {
    try {
      if (InstallPermissionModule) {
        await InstallPermissionModule.openInstallPermissionSettings();
      }
    } catch (error) {
      console.error('Error opening install permission settings:', error);
    }
  }

  private setupAppStateListener(): void {
    if (this.appStateSubscription) {
      return;
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && this.pendingUpdate) {
        this.handleAppResume();
      }
    });
  }

  private removeAppStateListener(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private async handleAppResume(): Promise<void> {
    if (!this.pendingUpdate) {
      return;
    }

    const canInstall = await this.checkInstallPermission();
    if (canInstall) {
      const { url, version, onProgress } = this.pendingUpdate;
      this.pendingUpdate = null;
      this.removeAppStateListener();

      // Pequeño delay para que la UI esté lista
      setTimeout(() => {
        this.downloadAndInstall(url, version, onProgress).catch(console.error);
      }, 500);
    } else {
      // Permiso sigue sin activar
      Alert.alert(
        'Permiso no activado',
        'No has activado el permiso de instalación. ¿Quieres intentarlo de nuevo?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              this.pendingUpdate = null;
              this.removeAppStateListener();
            },
          },
          {
            text: 'Abrir ajustes',
            onPress: () => { this.requestInstallPermission().catch(console.error); },
          },
        ]
      );
    }
  }

  private async downloadAndInstall(
    url: string,
    version: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (this.isDownloading) {
      Alert.alert('Descarga en curso', 'Ya se está descargando una actualización.');
      return;
    }

    // Verificar permiso de instalación
    const canInstall = await this.checkInstallPermission();
    if (!canInstall) {
      // Guardar datos para reintentar cuando vuelva
      this.pendingUpdate = { url, version, onProgress };
      this.setupAppStateListener();

      Alert.alert(
        'Permiso requerido',
        'Para instalar actualizaciones, necesitas habilitar la instalación de apps de fuentes desconocidas para Sports Manager.\n\nCuando lo actives y vuelvas, la descarga comenzará automáticamente.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              this.pendingUpdate = null;
              this.removeAppStateListener();
            },
          },
          {
            text: 'Abrir ajustes',
            onPress: () => { this.requestInstallPermission().catch(console.error); },
          },
        ]
      );
      return;
    }

    this.isDownloading = true;
    this.currentDownloadVersion = version;
    this.emitDownloadState(0);

    const fileName = `SportsManager_${version}.apk`;
    const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

    try {
      // Descargar el APK
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: downloadPath,
        addAndroidDownloads: {
          useDownloadManager: false,
          notification: false,
          mime: 'application/vnd.android.package-archive',
          title: `SportsManager ${version}`,
          description: 'Descargando actualización...',
          mediaScannable: false,
        },
      })
        .fetch('GET', url)
        .progress((received, total) => {
          const progress = Math.round((Number(received) / Number(total)) * 100);
          this.emitDownloadState(progress);
          if (onProgress) {
            onProgress(progress);
          }
        });

      this.isDownloading = false;
      this.emitDownloadState(100);

      // Instalar el APK
      if (res && res.path()) {
        await this.installApk(res.path());
      }
    } catch (error: any) {
      this.isDownloading = false;
      this.emitDownloadState(0);
      console.error('Error downloading update:', error);
      Alert.alert(
        'Error de descarga',
        'No se pudo descargar la actualización. Verifica tu conexión e inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  }

  private async installApk(filePath: string): Promise<void> {
    try {
      await ReactNativeBlobUtil.android.actionViewIntent(
        filePath,
        'application/vnd.android.package-archive'
      );
    } catch (error) {
      console.error('Error installing APK:', error);
      Alert.alert(
        'Instalación',
        'El APK se ha descargado. Ábrelo desde tus descargas para instalarlo.',
        [{ text: 'OK' }]
      );
    }
  }

  getCurrentVersion(): string {
    return currentVersion;
  }

  // Suscribirse a cambios de estado de descarga
  onDownloadStateChange(callback: DownloadStateCallback): () => void {
    this.downloadStateListeners.push(callback);
    return () => {
      this.downloadStateListeners = this.downloadStateListeners.filter(cb => cb !== callback);
    };
  }

  private emitDownloadState(progress: number): void {
    const state: DownloadState = {
      isDownloading: this.isDownloading,
      progress,
      version: this.currentDownloadVersion,
    };
    this.downloadStateListeners.forEach(cb => cb(state));
  }
}

export const updateChecker = new UpdateChecker();
