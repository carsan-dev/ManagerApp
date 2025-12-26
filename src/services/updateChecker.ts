import { Alert, Linking, Platform } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';
import { version as currentVersion } from '../../package.json';

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

class UpdateChecker {
  private initialized = false;

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

  async checkForUpdate(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await this.init();

      const latestVersion = remoteConfig().getString('latest_version');
      const forceUpdate = remoteConfig().getBoolean('force_update');
      const updateUrl = remoteConfig().getString('update_url');
      const updateMessage = remoteConfig().getString('update_message');

      // Comparar versiones
      if (this.compareVersions(latestVersion, currentVersion) > 0) {
        this.showUpdateAlert(latestVersion, forceUpdate, updateUrl, updateMessage);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  private showUpdateAlert(
    latestVersion: string,
    forceUpdate: boolean,
    updateUrl: string,
    updateMessage: string
  ) {
    const buttons: any[] = [];

    if (!forceUpdate) {
      buttons.push({
        text: 'Más tarde',
        style: 'cancel',
      });
    }

    buttons.push({
      text: 'Actualizar',
      onPress: () => {
        if (updateUrl) {
          Linking.openURL(updateUrl).catch((err) =>
            console.error('Error opening update URL:', err)
          );
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

  getCurrentVersion(): string {
    return currentVersion;
  }
}

export const updateChecker = new UpdateChecker();
