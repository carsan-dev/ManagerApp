import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import {
  TextInput,
  Button,
  List,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAlumnos } from '../hooks/useAlumnos';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [alumnoInput, setAlumnoInput] = useState('');
  const [cantidadInput, setCantidadInput] = useState('');
  const [editandoAlumno, setEditandoAlumno] = useState<string | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState<string>('');
  const theme = useTheme();

  const {
    alumnos,
    agregarAlumno,
    editarAlumno,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionalMinerva,
    proporcionalLola,
  } = useAlumnos();

  const handleAgregarAlumno = () => {
    const cantidad = cantidadInput.trim() === '' ? 0 : parseFloat(cantidadInput.trim());
    if (agregarAlumno(alumnoInput, cantidad)) {
      setAlumnoInput('');
      setCantidadInput('');
    }
  };

  const handleGuardarEdicion = (nombre: string) => {
    const cantidad = nuevaCantidad.trim() === '' ? 0 : parseFloat(nuevaCantidad.trim());
    if (editarAlumno(nombre, cantidad)) {
      setEditandoAlumno(null);
      setNuevaCantidad('');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
      <TextInput
        label="Nombre del alumno"
        value={alumnoInput}
        onChangeText={setAlumnoInput}
        mode="outlined"
        style={{ marginBottom: 16 }}
      />
      <TextInput
        label="Cantidad mensual (€)"
        value={cantidadInput}
        onChangeText={setCantidadInput}
        mode="outlined"
        keyboardType="numeric"
        style={{ marginBottom: 16 }}
      />
      <Button
        mode="contained"
        onPress={handleAgregarAlumno}
        style={{ marginBottom: 16 }}
      >
        Agregar
      </Button>
      <Button mode="outlined" onPress={eliminarTodos} style={{ marginTop: 16 }}>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          value={nuevaCantidad}
                          onChangeText={setNuevaCantidad}
                          keyboardType="numeric"
                          placeholder="Nueva cantidad (€)"
                          mode="outlined"
                          style={{ flex: 1, marginRight: 8 }}
                        />
                        <Button
                          onPress={() => handleGuardarEdicion(alumno.nombre)}
                          mode="contained"
                          compact
                        >
                          Guardar
                        </Button>
                        <Button
                          onPress={() => setEditandoAlumno(null)}
                          mode="text"
                          compact
                        >
                          Cancelar
                        </Button>
                      </View>
                    ) : (
                      <Text>{`${alumno.nombre} - ${alumno.cantidad.toFixed(2)}€`}</Text>
                    )
                  }
                  right={() =>
                    editandoAlumno === alumno.nombre ? null : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => {
                            setEditandoAlumno(alumno.nombre);
                            setNuevaCantidad(alumno.cantidad.toString());
                          }}
                          style={{ marginRight: 16 }}
                        >
                          <Text style={{ color: theme.colors.primary }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => eliminarAlumno(alumno.nombre)}>
                          <Text style={{ color: theme.colors.error }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  }
                />
                <Divider />
              </View>
            ))}
          </List.Section>
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Total: {total.toFixed(2)} €
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.primary,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Cantidad Proporcional Minerva: {proporcionalMinerva.toFixed(2)} €
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.primary,
                textAlign: 'center',
              }}
            >
              Cantidad Proporcional Lola: {proporcionalLola.toFixed(2)} €
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Pdf', { alumnos })}
            style={{ marginTop: 16 }}
          >
            Generar PDF
          </Button>
        </>
      )}
    </ScrollView>
  );
};

export default HomeScreen;
