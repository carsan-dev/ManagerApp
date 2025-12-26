import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { AuthService } from '../services/auth';
import { theme } from '../theme';

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      if (err.code === 'SIGN_IN_CANCELLED') {
        setError('Inicio de sesión cancelado');
      } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Google Play Services no disponible');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sports Manager</Text>
        <Text style={styles.subtitle}>Gestión de alumnos y pagos</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            style={styles.button}
          >
            Iniciar sesión con Google
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;
