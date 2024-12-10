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
  Pdf: {alumnos: Alumno[]};
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

type Alumno = {
  nombre: string;
  cantidad: number;
};

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [alumno, setAlumno] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [editandoAlumno, setEditandoAlumno] = useState<string | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState<string>('');
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
        console.error('Error al cargar alumnos:', error);
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
        console.error('Error al guardar alumnos:', error);
      }
    };

    guardarAlumnos();
  }, [alumnos]);

  const agregarAlumno = () => {
    const nombre = alumno.trim();
    const cantidadNum = cantidad.trim() === '' ? 0 : parseFloat(cantidad.trim());

    if (nombre === '') {
      Alert.alert('Error', 'El nombre del alumno no puede estar vacío.');
    } else if (alumnos.some(al => al.nombre === nombre)) {
      Alert.alert('Error', 'El alumno ya está en la lista.');
    } else {
      setAlumnos([...alumnos, {nombre, cantidad: cantidadNum}]);
      setAlumno('');
      setCantidad('');
    }
  };

  const guardarEdicion = (nombre: string) => {
    const cantidadNum = parseFloat(nuevaCantidad.trim());

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor que 0.');
    } else {
      setAlumnos(
        alumnos.map(al =>
          al.nombre === nombre ? {...al, cantidad: cantidadNum} : al,
        ),
      );
      setEditandoAlumno(null);
      setNuevaCantidad('');
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
            setAlumnos(alumnos.filter(al => al.nombre !== nombre));
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
        {text: 'Cancelar', style: 'cancel'},
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

  const total = alumnos.reduce((acc, al) => acc + al.cantidad, 0);
  const proporcionalMinerva = total * 0.6;
  const proporcionalLola = total * 0.4;

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1, padding: 16}}>
      <TextInput
        label="Nombre del alumno"
        value={alumno}
        onChangeText={text => setAlumno(text)}
        mode="outlined"
        style={{marginBottom: 16}}
      />
      <TextInput
        label="Cantidad mensual (€)"
        value={cantidad}
        onChangeText={text => setCantidad(text)}
        mode="outlined"
        keyboardType="numeric"
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
            {alumnos.map((alumno, index) => (
              <View key={index}>
                <List.Item
                  title={() =>
                    editandoAlumno === alumno.nombre ? (
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TextInput
                          value={nuevaCantidad}
                          onChangeText={text => setNuevaCantidad(text)}
                          keyboardType="numeric"
                          placeholder="Nueva cantidad (€)"
                          mode="outlined"
                          style={{flex: 1, marginRight: 8}}
                        />
                        <Button
                          onPress={() => guardarEdicion(alumno.nombre)}
                          mode="contained"
                          compact>
                          Guardar
                        </Button>
                        <Button
                          onPress={() => setEditandoAlumno(null)}
                          mode="text"
                          compact>
                          Cancelar
                        </Button>
                      </View>
                    ) : (
                      <Text>{`${alumno.nombre} - ${alumno.cantidad.toFixed(
                        2,
                      )}€`}</Text>
                    )
                  }
                  right={() =>
                    editandoAlumno === alumno.nombre ? null : (
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditandoAlumno(alumno.nombre);
                            setNuevaCantidad(alumno.cantidad.toString());
                          }}
                          style={{marginRight: 16}}>
                          <Text style={{color: theme.colors.primary}}>
                            Editar 
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => eliminarAlumno(alumno.nombre)}>
                          <Text
                            style={{
                              color: theme.colors.error,
                            }}>
                            Eliminar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )
                  }
                />
                <Divider />
              </View>
            ))}
          </List.Section>
          <View style={{marginTop: 16}}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
              }}>
              Total: {total.toFixed(2)} €
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.primary,
                marginBottom: 8,
                textAlign: 'center',
              }}>
              Cantidad Proporcional Minerva: {proporcionalMinerva.toFixed(2)} €
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.primary,
                textAlign: 'center',
              }}>
              Cantidad Proporcional Lola: {proporcionalLola.toFixed(2)} €
            </Text>
          </View>
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
