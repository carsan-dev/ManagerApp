// HomeScreen.tsx

import React, {useState, useEffect} from 'react';
import {View, ScrollView, Alert, TouchableOpacity} from 'react-native';
import {
  TextInput,
  Button,
  List,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Pdf: {alumnos: string[]};
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [alumno, setAlumno] = useState('');
  const [alumnos, setAlumnos] = useState<string[]>([]);
  const theme = useTheme();

  // Cargar alumnos al iniciar
  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const alumnosGuardados = await AsyncStorage.getItem('alumnos');
        if (alumnosGuardados) {
          setAlumnos(JSON.parse(alumnosGuardados));
        }
      } catch (error) {
        console.error(error);
      }
    };

    cargarAlumnos();
  }, []);

  // Guardar alumnos cuando cambie la lista
  useEffect(() => {
    const guardarAlumnos = async () => {
      try {
        await AsyncStorage.setItem('alumnos', JSON.stringify(alumnos));
      } catch (error) {
        console.error(error);
      }
    };

    guardarAlumnos();
  }, [alumnos]);

  const agregarAlumno = () => {
    const nombre = alumno.trim();
    if (nombre === '') {
      Alert.alert('Error', 'El nombre del alumno no puede estar vacío.');
    } else if (alumnos.includes(nombre)) {
      Alert.alert('Error', 'El alumno ya está en la lista.');
    } else {
      setAlumnos([...alumnos, nombre]);
      setAlumno('');
    }
  };

  const eliminarAlumno = (nombre: string) => {
    Alert.alert(
      'Eliminar alumno',
      `¿Estás seguro de que deseas eliminar a ${nombre}?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setAlumnos(alumnos.filter(al => al !== nombre));
          },
        },
      ],
    );
  };

  const eliminarTodos = () => {
    Alert.alert(
      'Eliminar todos los alumnos',
      '¿Estás seguro de que deseas eliminar todos los datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('alumnos');
              setAlumnos([]);
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos.');
              console.error('Error al eliminar alumnos:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1, padding: 16}}>
      <TextInput
        label="Nombre del alumno"
        value={alumno}
        onChangeText={text => setAlumno(text)}
        mode="outlined"
        style={{marginBottom: 16}}
      />
      <Button
        mode="contained"
        onPress={agregarAlumno}
        style={{marginBottom: 16}}>
        Agregar
      </Button>
      <Button mode="outlined" onPress={eliminarTodos} style={{marginTop: 16}}>
        Restablecer datos
      </Button>

      {alumnos.length > 0 && (
        <>
          <List.Section>
            {alumnos.map((nombre, index) => (
              <View key={index}>
                <List.Item
                  title={nombre}
                  right={() => (
                    <TouchableOpacity onPress={() => eliminarAlumno(nombre)}>
                      <Text
                        style={{
                          color: theme.colors.error,
                          fontWeight: 'bold',
                          fontSize: 16,
                        }}>
                        X
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <Divider />
              </View>
            ))}
          </List.Section>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Pdf', {alumnos})}
            style={{marginTop: 16}}>
            Generar PDF
          </Button>
        </>
      )}
    </ScrollView>
  );
};

export default HomeScreen;
