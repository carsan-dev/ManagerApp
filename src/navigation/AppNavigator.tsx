import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { theme } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PdfScreen from '../screens/PdfScreen';
import LoginScreen from '../screens/LoginScreen';
import { AuthService, User } from '../services/auth';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Lista de Alumnos',
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => AuthService.signOut()}
                  style={{ marginRight: 16 }}
                >
                  <Text style={{ color: '#fff' }}>Salir</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="Pdf"
            component={PdfScreen}
            options={{ title: 'Generar PDF' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
