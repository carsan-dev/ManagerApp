import {
  getAuth,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StorageService } from './storage';

// Configurar Google Sign-In
GoogleSignin.configure({
  webClientId: '517536962770-mv8cm5lvtgmvm6bmdjp0vsmppsktlbfh.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['email', 'profile'],
});

export type User = FirebaseAuthTypes.User | null;

const auth = getAuth();

export const AuthService = {
  async signInWithGoogle(): Promise<User> {
    try {
      // Verificar que Google Play Services está disponible
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Iniciar sesión con Google
      const signInResult = await GoogleSignin.signIn();

      // Obtener el token de ID
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('No se pudo obtener el token de Google');
      }

      // Crear credencial de Firebase con el token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Iniciar sesión en Firebase
      const userCredential = await signInWithCredential(auth, googleCredential);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error en signInWithGoogle:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      // Borrar datos locales primero
      await StorageService.clearAllData();
      await GoogleSignin.signOut();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error en signOut:', error);
      throw error;
    }
  },

  getCurrentUser(): User {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: User) => void): () => void {
    return firebaseOnAuthStateChanged(auth, callback);
  },
};
