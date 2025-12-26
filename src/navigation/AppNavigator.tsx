import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { theme } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PdfScreen from '../screens/PdfScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Lista de Alumnos' }}
      />
      <Stack.Screen
        name="Pdf"
        component={PdfScreen}
        options={{ title: 'Generar PDF' }}
      />
    </Stack.Navigator>
  );
};
