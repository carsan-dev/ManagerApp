import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PdfScreen from '../screens/PdfScreen';
import LoginScreen from '../screens/LoginScreen';
import { AuthService, User } from '../services/auth';
import { updateChecker } from '../services/updateChecker';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Verificar actualizaciones cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      updateChecker.checkForUpdate();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Pdf" component={PdfScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gradientStart,
  },
});
