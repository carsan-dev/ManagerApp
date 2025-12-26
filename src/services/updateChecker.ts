import { Alert, Platform, Linking, NativeModules } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';
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

class UpdateChecker {
  private initialized = false;
  private isDownloading = false;

  async init() {
    if (this.initialized) return;

    try {
      await remoteConfig().setDefaults({
        latest_version: DEFAULT_CONFIG.latestVersion,
        force_update: DEFAULT_CONFIG.forceUpdate,
        update_url: DEFAULT_CONFIG.updateUrl,
        update_message: DEFAULT_CONFIG.updateMessage,
      });

      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 3600000, // 1 hora en producción
      });

      await remoteConfig().fetchAndActivate();
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
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  async checkForUpdate(onProgress?: ProgressCallback): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await this.init();

      const latestVersion = remoteConfig().getString('latest_version');
      const forceUpdate = remoteConfig().getBoolean('force_update');
      const updateUrl = remoteConfig().getString('update_url');
      const updateMessage = remoteConfig().getString('update_message');

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
          this.downloadAndInstall(updateUrl, latestVersion, onProgress);
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
      Alert.alert(
        'Permiso requerido',
        'Para instalar actualizaciones, necesitas habilitar la instalación de apps de fuentes desconocidas para Sports Manager.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir ajustes',
            onPress: () => this.requestInstallPermission(),
          },
        ]
      );
      return;
    }

    this.isDownloading = true;
    const fileName = `SportsManager_${version}.apk`;
    const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

    try {
      // Mostrar alerta de inicio de descarga
      Alert.alert(
        'Descargando actualización',
        'La descarga ha comenzado. Recibirás una notificación cuando termine.',
        [{ text: 'OK' }]
      );

      // Descargar el APK
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: downloadPath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: `Actualizando Sports Manager a v${version}`,
          description: 'Descargando actualización...',
          mime: 'application/vnd.android.package-archive',
          mediaScannable: true,
        },
      })
        .fetch('GET', url)
        .progress((received, total) => {
          const progress = Math.round((received / total) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        });

      this.isDownloading = false;

      // Instalar el APK
      if (res && res.path()) {
        await this.installApk(res.path());
      }
    } catch (error: any) {
      this.isDownloading = false;
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
}

export const updateChecker = new UpdateChecker();
