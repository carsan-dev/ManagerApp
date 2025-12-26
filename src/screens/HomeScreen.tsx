import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  List,
  Text,
  Divider,
  useTheme,
  Switch,
  Menu,
  Chip,
  Dialog,
  Portal,
} from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TipoAsistencia } from '../types';
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
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [dialogDias, setDialogDias] = useState<string | null>(null);
  const [diasInput, setDiasInput] = useState('');
  const [configVisible, setConfigVisible] = useState(false);
  const [tempNombre1, setTempNombre1] = useState('');
  const [tempNombre2, setTempNombre2] = useState('');
  const theme = useTheme();

  const {
    alumnos,
    agregarAlumno,
    editarAlumno,
    toggleActivo,
    cambiarAsistencia,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionalProfesor1,
    proporcionalProfesor2,
    config,
    actualizarConfig,
    calcularCantidadEfectiva,
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

  const handleCambiarAsistencia = (nombre: string, tipo: TipoAsistencia) => {
    setMenuVisible(null);
    if (tipo === 'dias') {
      setDialogDias(nombre);
      setDiasInput('');
    } else {
      cambiarAsistencia(nombre, tipo);
    }
  };

  const handleConfirmarDias = () => {
    if (dialogDias) {
      const dias = parseInt(diasInput, 10);
      if (!isNaN(dias) && dias > 0 && dias <= 30) {
        cambiarAsistencia(dialogDias, 'dias', dias);
      }
      setDialogDias(null);
      setDiasInput('');
    }
  };

  const handleAbrirConfig = () => {
    setTempNombre1(config.nombreProfesor1);
    setTempNombre2(config.nombreProfesor2);
    setConfigVisible(true);
  };

  const handleGuardarConfig = () => {
    actualizarConfig({
      nombreProfesor1: tempNombre1.trim() || 'Profesor 1',
      nombreProfesor2: tempNombre2.trim() || 'Profesor 2',
    });
    setConfigVisible(false);
  };

  const getAsistenciaLabel = (tipo: TipoAsistencia, dias?: number): string => {
    switch (tipo) {
      case 'completo':
        return 'Completo';
      case 'medio':
        return 'Medio';
      case 'dias':
        return `${dias ?? 0}d`;
      default:
        return 'Completo';
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
        label="Cantidad mensual"
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

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={eliminarTodos} style={styles.halfButton}>
          Restablecer
        </Button>
        <Button mode="outlined" onPress={handleAbrirConfig} style={styles.halfButton}>
          Configurar
        </Button>
      </View>

      {alumnos.length > 0 && (
        <>
          <List.Section>
            {alumnos.map((alumno, index) => {
              const cantidadEfectiva = calcularCantidadEfectiva(alumno);
              const esInactivo = !alumno.activo;

              return (
                <View key={index} style={esInactivo ? styles.alumnoInactivo : undefined}>
                  <List.Item
                    title={() =>
                      editandoAlumno === alumno.nombre ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            value={nuevaCantidad}
                            onChangeText={setNuevaCantidad}
                            keyboardType="numeric"
                            placeholder="Nueva cantidad"
                            mode="outlined"
                            style={{ flex: 1, marginRight: 8 }}
                          />
                          <Button
                            onPress={() => handleGuardarEdicion(alumno.nombre)}
                            mode="contained"
                            compact
                          >
                            OK
                          </Button>
                          <Button
                            onPress={() => setEditandoAlumno(null)}
                            mode="text"
                            compact
                          >
                            X
                          </Button>
                        </View>
                      ) : (
                        <View>
                          <Text style={esInactivo ? styles.textoInactivo : undefined}>
                            {alumno.nombre} - {alumno.cantidad.toFixed(2)}€
                          </Text>
                          <View style={styles.chipRow}>
                            <Menu
                              visible={menuVisible === alumno.nombre}
                              onDismiss={() => setMenuVisible(null)}
                              anchor={
                                <Chip
                                  onPress={() => setMenuVisible(alumno.nombre)}
                                  compact
                                  style={styles.chip}
                                >
                                  {getAsistenciaLabel(alumno.tipoAsistencia, alumno.diasAsistencia)}
                                </Chip>
                              }
                            >
                              <Menu.Item
                                onPress={() => handleCambiarAsistencia(alumno.nombre, 'completo')}
                                title="Mes completo"
                              />
                              <Menu.Item
                                onPress={() => handleCambiarAsistencia(alumno.nombre, 'medio')}
                                title="Medio mes"
                              />
                              <Menu.Item
                                onPress={() => handleCambiarAsistencia(alumno.nombre, 'dias')}
                                title="Días específicos"
                              />
                            </Menu>
                            {alumno.tipoAsistencia !== 'completo' && (
                              <Text style={styles.cantidadEfectiva}>
                                → {cantidadEfectiva.toFixed(2)}€
                              </Text>
                            )}
                          </View>
                        </View>
                      )
                    }
                    right={() =>
                      editandoAlumno === alumno.nombre ? null : (
                        <View style={styles.rightContainer}>
                          <Switch
                            value={alumno.activo}
                            onValueChange={() => toggleActivo(alumno.nombre)}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setEditandoAlumno(alumno.nombre);
                              setNuevaCantidad(alumno.cantidad.toString());
                            }}
                            style={{ marginLeft: 8 }}
                          >
                            <Text style={{ color: theme.colors.primary }}>Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => eliminarAlumno(alumno.nombre)}
                            style={{ marginLeft: 8 }}
                          >
                            <Text style={{ color: theme.colors.error }}>X</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    }
                  />
                  <Divider />
                </View>
              );
            })}
          </List.Section>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.totalText}>
              Total: {total.toFixed(2)} €
            </Text>
            <Text style={[styles.propText, { color: theme.colors.primary }]}>
              {config.nombreProfesor1} ({config.proporcionProfesor1}%): {proporcionalProfesor1.toFixed(2)} €
            </Text>
            <Text style={[styles.propText, { color: theme.colors.primary }]}>
              {config.nombreProfesor2} ({100 - config.proporcionProfesor1}%): {proporcionalProfesor2.toFixed(2)} €
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

      <Portal>
        <Dialog visible={dialogDias !== null} onDismiss={() => setDialogDias(null)}>
          <Dialog.Title>Días de asistencia</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Número de días (1-30)"
              value={diasInput}
              onChangeText={setDiasInput}
              keyboardType="numeric"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogDias(null)}>Cancelar</Button>
            <Button onPress={handleConfirmarDias}>Confirmar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={configVisible} onDismiss={() => setConfigVisible(false)}>
          <Dialog.Title>Configuración</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre profesor 1"
              value={tempNombre1}
              onChangeText={setTempNombre1}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Nombre profesor 2"
              value={tempNombre2}
              onChangeText={setTempNombre2}
              mode="outlined"
              style={{ marginBottom: 16 }}
            />
            <Text style={{ marginBottom: 8 }}>
              Proporción: {config.proporcionProfesor1}% / {100 - config.proporcionProfesor1}%
            </Text>
            <View style={styles.proporcionButtons}>
              {[50, 60, 70, 80].map((valor) => (
                <Button
                  key={valor}
                  mode={config.proporcionProfesor1 === valor ? 'contained' : 'outlined'}
                  onPress={() => actualizarConfig({ proporcionProfesor1: valor })}
                  style={styles.proporcionButton}
                  compact
                >
                  {valor}/{100 - valor}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfigVisible(false)}>Cancelar</Button>
            <Button onPress={handleGuardarConfig}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  alumnoInactivo: {
    opacity: 0.5,
  },
  textoInactivo: {
    textDecorationLine: 'line-through',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  chip: {
    marginRight: 8,
  },
  cantidadEfectiva: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  propText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  proporcionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  proporcionButton: {
    margin: 4,
  },
});

export default HomeScreen;
