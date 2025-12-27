import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Switch,
  Menu,
  Chip,
  Dialog,
  Portal,
  IconButton,
  Surface,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
  interpolate,
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TipoAsistencia, Alumno, Profesor } from '../types';
import { useAlumnos } from '../hooks/useAlumnos';
import { colors, spacing, shadows } from '../theme';
import { AuthService } from '../services/auth';
import { MAX_PROFESORES, PRESETS_PROPORCION } from '../services/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// Card component for each student
const AlumnoCard: React.FC<{
  alumno: Alumno;
  index: number;
  onToggleActivo: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeAsistencia: (tipo: TipoAsistencia) => void;
  onOpenDiasDialog: () => void;
  cantidadEfectiva: number;
  menuVisible: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}> = ({
  alumno,
  index,
  onToggleActivo,
  onEdit,
  onDelete,
  onChangeAsistencia,
  onOpenDiasDialog,
  cantidadEfectiva,
  menuVisible,
  onOpenMenu,
  onCloseMenu,
}) => {
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

  const getAsistenciaColor = (tipo: TipoAsistencia): string => {
    switch (tipo) {
      case 'completo':
        return colors.success;
      case 'medio':
        return colors.warning;
      case 'dias':
        return colors.info;
      default:
        return colors.success;
    }
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 50).springify()}
      exiting={SlideOutLeft.springify()}
      layout={LinearTransition.springify()}
    >
      <Surface style={[styles.card, !alumno.activo && styles.cardInactive]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text
              style={[styles.cardName, !alumno.activo && styles.textInactive]}
              numberOfLines={1}
            >
              {alumno.nombre}
            </Text>
            <View style={styles.amountContainer}>
              <Text style={[styles.cardAmount, !alumno.activo && styles.textInactive]}>
                {alumno.cantidad.toFixed(2)}€
              </Text>
              {alumno.tipoAsistencia !== 'completo' && alumno.activo && (
                <Text style={styles.effectiveAmount}>
                  → {cantidadEfectiva.toFixed(2)}€
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={alumno.activo}
            onValueChange={onToggleActivo}
            color={colors.primary}
          />
        </View>

        <View style={styles.cardFooter}>
          <Menu
            visible={menuVisible}
            onDismiss={onCloseMenu}
            anchor={
              <Chip
                onPress={onOpenMenu}
                style={[
                  styles.asistenciaChip,
                  { backgroundColor: `${getAsistenciaColor(alumno.tipoAsistencia)}20` },
                ]}
                textStyle={[
                  styles.asistenciaChipText,
                  { color: getAsistenciaColor(alumno.tipoAsistencia) },
                ]}
              >
                {getAsistenciaLabel(alumno.tipoAsistencia, alumno.diasAsistencia)}
              </Chip>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => {
                onChangeAsistencia('completo');
                onCloseMenu();
              }}
              title="Mes completo"
              leadingIcon="calendar-check"
            />
            <Menu.Item
              onPress={() => {
                onChangeAsistencia('medio');
                onCloseMenu();
              }}
              title="Medio mes"
              leadingIcon="calendar-minus"
            />
            <Menu.Item
              onPress={() => {
                onOpenDiasDialog();
                onCloseMenu();
              }}
              title="Días específicos"
              leadingIcon="calendar-edit"
            />
          </Menu>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
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
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  // Config dialog state
  const [tempProfesores, setTempProfesores] = useState<Profesor[]>([]);
  const [tempNumProfesores, setTempNumProfesores] = useState('2');
  const [tempUsarManual, setTempUsarManual] = useState(false);
  const [tempProporciones, setTempProporciones] = useState<string[]>([]);

  // Header animation
  const headerOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.9);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    statsScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, [headerOpacity, statsScale]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const statsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
    opacity: interpolate(statsScale.value, [0.9, 1], [0, 1]),
  }));

  const {
    alumnos,
    agregarAlumno,
    editarAlumno,
    toggleActivo,
    cambiarAsistencia,
    eliminarAlumno,
    eliminarTodos,
    total,
    proporcionales,
    config,
    actualizarConfig,
    actualizarProfesores,
    calcularCantidadEfectiva,
  } = useAlumnos();

  const handleAgregarAlumno = () => {
    const cantidad = cantidadInput.trim() === '' ? 0 : Number.parseFloat(cantidadInput.trim());
    if (agregarAlumno(alumnoInput, cantidad)) {
      setAlumnoInput('');
      setCantidadInput('');
    }
  };

  const handleGuardarEdicion = () => {
    if (!editandoAlumno) {
      return;
    }
    const cantidad = nuevaCantidad.trim() === '' ? 0 : Number.parseFloat(nuevaCantidad.trim());
    if (editarAlumno(editandoAlumno, cantidad)) {
      setEditandoAlumno(null);
      setNuevaCantidad('');
      setEditDialogVisible(false);
    }
  };

  const handleCambiarAsistencia = (nombre: string, tipo: TipoAsistencia) => {
    if (tipo === 'dias') {
      setDialogDias(nombre);
      setDiasInput('');
    } else {
      cambiarAsistencia(nombre, tipo);
    }
  };

  const handleConfirmarDias = () => {
    if (dialogDias) {
      const dias = Number.parseInt(diasInput, 10);
      if (!Number.isNaN(dias) && dias > 0 && dias <= 30) {
        cambiarAsistencia(dialogDias, 'dias', dias);
      }
      setDialogDias(null);
      setDiasInput('');
    }
  };

  const handleAbrirConfig = () => {
    setTempProfesores([...config.profesores]);
    setTempNumProfesores(config.profesores.length.toString());
    setTempUsarManual(config.usarProporcionManual);
    setTempProporciones(config.profesores.map(p => p.proporcion.toString()));
    setConfigVisible(true);
  };

  const handleCambiarNumProfesores = (numStr: string) => {
    const num = Number.parseInt(numStr, 10);
    setTempNumProfesores(numStr);

    // Ajustar el array de profesores
    const nuevosProfesores: Profesor[] = [];
    for (let i = 0; i < num; i++) {
      if (tempProfesores[i]) {
        nuevosProfesores.push(tempProfesores[i]);
      } else {
        nuevosProfesores.push({
          nombre: `Persona ${i + 1}`,
          proporcion: 0,
        });
      }
    }

    // Aplicar primer preset por defecto
    const presets = PRESETS_PROPORCION[num];
    if (presets && presets.length > 0) {
      presets[0].valores.forEach((valor, index) => {
        if (nuevosProfesores[index]) {
          nuevosProfesores[index].proporcion = valor;
        }
      });
    }

    setTempProfesores(nuevosProfesores);
    setTempProporciones(nuevosProfesores.map(p => p.proporcion.toString()));
  };

  const handleAplicarPreset = (valores: number[]) => {
    const nuevosProfesores = tempProfesores.map((p, index) => ({
      ...p,
      proporcion: valores[index] ?? 0,
    }));
    setTempProfesores(nuevosProfesores);
    setTempProporciones(valores.map(v => v.toString()));
  };

  const handleCambiarNombreProfesor = (index: number, nombre: string) => {
    const nuevosProfesores = [...tempProfesores];
    nuevosProfesores[index] = { ...nuevosProfesores[index], nombre };
    setTempProfesores(nuevosProfesores);
  };

  const handleCambiarProporcionManual = (index: number, valor: string) => {
    const nuevasProporciones = [...tempProporciones];
    nuevasProporciones[index] = valor;
    setTempProporciones(nuevasProporciones);
  };

  const validarProporciones = (): boolean => {
    if (!tempUsarManual) {
      return true;
    }

    const suma = tempProporciones.reduce((acc, val) => {
      const num = Number.parseFloat(val);
      return acc + (Number.isNaN(num) ? 0 : num);
    }, 0);

    return Math.abs(suma - 100) < 0.01;
  };

  const handleGuardarConfig = () => {
    if (tempUsarManual && !validarProporciones()) {
      Alert.alert('Error', 'Las proporciones deben sumar exactamente 100%');
      return;
    }

    // Aplicar proporciones manuales si está activo
    const profesoresFinales = tempProfesores.map((p, idx) => ({
      ...p,
      nombre: p.nombre.trim() || `Persona ${idx + 1}`,
      proporcion: tempUsarManual
        ? (Number.parseFloat(tempProporciones[idx]) || 0)
        : p.proporcion,
    }));

    actualizarProfesores(profesoresFinales);
    actualizarConfig({ usarProporcionManual: tempUsarManual });
    setConfigVisible(false);
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const openEditDialog = (nombre: string, cantidad: number) => {
    setEditandoAlumno(nombre);
    setNuevaCantidad(cantidad.toString());
    setEditDialogVisible(true);
  };

  const alumnosActivos = alumnos.filter(a => a.activo).length;
  const numProfesores = Number.parseInt(tempNumProfesores, 10);
  const presetsActuales = PRESETS_PROPORCION[numProfesores] || [];

  // Calcular suma actual de proporciones para mostrar
  const sumaActual = tempProporciones.reduce((acc, val) => {
    const num = Number.parseFloat(val);
    return acc + (Number.isNaN(num) ? 0 : num);
  }, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle]}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.header, headerAnimStyle]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Sports Manager</Text>
              <Text style={styles.headerSubtitle}>
                {alumnosActivos} alumno{alumnosActivos === 1 ? '' : 's'} activo{alumnosActivos === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="cog"
                iconColor={colors.textSecondary}
                size={22}
                onPress={handleAbrirConfig}
              />
              <IconButton
                icon="logout"
                iconColor={colors.textSecondary}
                size={22}
                onPress={handleLogout}
              />
            </View>
          </View>

          {/* Stats Cards - Dynamic */}
          <Animated.View style={[styles.statsContainer, statsAnimStyle]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.statsScrollContent,
                proporcionales.length <= 2 && styles.statsScrollContentCentered,
              ]}
            >
              <Surface style={styles.statCard}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{total.toFixed(2)}€</Text>
              </Surface>
              {proporcionales.map((p, idx) => (
                <Surface
                  key={`stat-${p.nombre}-${p.proporcion}`}
                  style={[styles.statCard, idx === 0 && styles.statCardPrimary]}
                >
                  <Text style={idx === 0 ? styles.statLabelPrimary : styles.statLabel}>
                    {p.nombre}
                  </Text>
                  <Text style={idx === 0 ? styles.statValuePrimary : styles.statValue}>
                    {p.cantidad.toFixed(2)}€
                  </Text>
                  <Text style={idx === 0 ? styles.statPercent : styles.statPercentSecondary}>
                    {p.proporcion}%
                  </Text>
                </Surface>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Student Form */}
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          style={styles.formContainer}
        >
          <Surface style={styles.formCard}>
            <Text style={styles.formTitle}>Agregar alumno</Text>
            <TextInput
              label="Nombre del alumno"
              value={alumnoInput}
              onChangeText={setAlumnoInput}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textSecondary,
                  surface: colors.surface,
                },
              }}
            />
            <TextInput
              label="Cantidad mensual (€)"
              value={cantidadInput}
              onChangeText={setCantidadInput}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textSecondary,
                  surface: colors.surface,
                },
              }}
            />
            <Button
              mode="contained"
              onPress={handleAgregarAlumno}
              style={styles.addButton}
              contentStyle={styles.addButtonContent}
              labelStyle={styles.addButtonLabel}
            >
              Agregar alumno
            </Button>
          </Surface>
        </Animated.View>

        {/* Students List */}
        {alumnos.length > 0 && (
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Lista de alumnos</Text>
              <TouchableOpacity onPress={eliminarTodos}>
                <Text style={styles.resetText}>Restablecer</Text>
              </TouchableOpacity>
            </View>

            {alumnos.map((alumno, index) => (
              <AlumnoCard
                key={alumno.nombre}
                alumno={alumno}
                index={index}
                onToggleActivo={() => toggleActivo(alumno.nombre)}
                onEdit={() => openEditDialog(alumno.nombre, alumno.cantidad)}
                onDelete={() => eliminarAlumno(alumno.nombre)}
                onChangeAsistencia={(tipo) =>
                  handleCambiarAsistencia(alumno.nombre, tipo)
                }
                onOpenDiasDialog={() => {
                  setDialogDias(alumno.nombre);
                  setDiasInput('');
                }}
                cantidadEfectiva={calcularCantidadEfectiva(alumno)}
                menuVisible={menuVisible === alumno.nombre}
                onOpenMenu={() => setMenuVisible(alumno.nombre)}
                onCloseMenu={() => setMenuVisible(null)}
              />
            ))}

            {/* Generate PDF Button */}
            <Animated.View
              entering={FadeIn.delay(alumnos.length * 50 + 200).duration(400)}
            >
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Pdf', { alumnos })}
                style={styles.pdfButton}
                contentStyle={styles.pdfButtonContent}
                labelStyle={styles.pdfButtonLabel}
                icon="file-pdf-box"
              >
                Generar PDF
              </Button>
            </Animated.View>
          </View>
        )}

        {alumnos.length === 0 && (
          <Animated.View
            entering={FadeIn.delay(500).duration(500)}
            style={styles.emptyState}
          >
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin alumnos</Text>
            <Text style={styles.emptyText}>
              Agrega tu primer alumno usando el formulario de arriba
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        {/* Days Dialog */}
        <Dialog
          visible={dialogDias !== null}
          onDismiss={() => setDialogDias(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Días de asistencia
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Número de días (1-30)"
              value={diasInput}
              onChangeText={setDiasInput}
              keyboardType="numeric"
              mode="outlined"
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textSecondary,
                  surface: colors.surface,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogDias(null)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button onPress={handleConfirmarDias} textColor={colors.primary}>
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Editar cantidad
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogSubtitle}>{editandoAlumno}</Text>
            <TextInput
              label="Nueva cantidad (€)"
              value={nuevaCantidad}
              onChangeText={setNuevaCantidad}
              keyboardType="numeric"
              mode="outlined"
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
              textColor={colors.textPrimary}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textSecondary,
                  surface: colors.surface,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setEditDialogVisible(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button onPress={handleGuardarEdicion} textColor={colors.primary}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Config Dialog */}
        <Dialog
          visible={configVisible}
          onDismiss={() => setConfigVisible(false)}
          style={styles.configDialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Configuración</Dialog.Title>
          <Dialog.ScrollArea style={styles.configScrollArea}>
            <ScrollView>
              {/* Número de personas */}
              <Text style={styles.configSectionTitle}>Número de personas</Text>
              <View style={styles.numPersonasContainer}>
                {Array.from({ length: MAX_PROFESORES }, (_, i) => {
                  const value = (i + 1).toString();
                  const isSelected = tempNumProfesores === value;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleCambiarNumProfesores(value)}
                      style={[
                        styles.numPersonaButton,
                        isSelected && styles.numPersonaButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.numPersonaButtonText,
                          isSelected && styles.numPersonaButtonTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Nombres */}
              <Text style={styles.configSectionTitle}>Nombres</Text>
              {tempProfesores.map((profesor, idx) => (
                <TextInput
                  key={`nombre-persona-${idx + 1}`}
                  label={`Persona ${idx + 1}`}
                  value={profesor.nombre}
                  onChangeText={(text) => handleCambiarNombreProfesor(idx, text)}
                  mode="outlined"
                  style={styles.dialogInput}
                  outlineColor={colors.cardBorder}
                  activeOutlineColor={colors.primary}
                  textColor={colors.textPrimary}
                  theme={{
                    colors: {
                      onSurfaceVariant: colors.textSecondary,
                      surface: colors.surface,
                    },
                  }}
                />
              ))}

              {/* Proporciones */}
              <Text style={styles.configSectionTitle}>Proporciones</Text>

              {/* Toggle Manual */}
              <View style={styles.manualToggleContainer}>
                <Text style={styles.manualToggleLabel}>Porcentaje manual</Text>
                <Switch
                  value={tempUsarManual}
                  onValueChange={setTempUsarManual}
                  color={colors.primary}
                />
              </View>

              {tempUsarManual ? (
                /* Inputs manuales */
                <View>
                  {tempProfesores.map((profesor, idx) => (
                    <View key={`manual-${idx + 1}`} style={styles.manualInputRow}>
                      <Text style={styles.manualInputLabel}>{profesor.nombre}:</Text>
                      <TextInput
                        value={tempProporciones[idx]}
                        onChangeText={(text) => handleCambiarProporcionManual(idx, text)}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.manualInput}
                        outlineColor={colors.cardBorder}
                        activeOutlineColor={colors.primary}
                        textColor={colors.textPrimary}
                        right={<TextInput.Affix text="%" />}
                        theme={{
                          colors: {
                            onSurfaceVariant: colors.textSecondary,
                            surface: colors.surface,
                          },
                        }}
                      />
                    </View>
                  ))}
                  <Text
                    style={[
                      styles.sumaTotalText,
                      Math.abs(sumaActual - 100) < 0.01
                        ? styles.sumaValida
                        : styles.sumaInvalida,
                    ]}
                  >
                    Total: {sumaActual.toFixed(1)}%
                    {Math.abs(sumaActual - 100) >= 0.01 && ' (debe ser 100%)'}
                  </Text>
                </View>
              ) : (
                /* Presets */
                <View style={styles.presetsContainer}>
                  {presetsActuales.map((preset) => {
                    const esActivo = preset.valores.every(
                      (v, i) => tempProfesores[i]?.proporcion === v
                    );
                    return (
                      <Button
                        key={preset.label}
                        mode={esActivo ? 'contained' : 'outlined'}
                        onPress={() => handleAplicarPreset(preset.valores)}
                        style={styles.presetButton}
                        compact
                        labelStyle={
                          esActivo
                            ? styles.presetButtonLabelActive
                            : styles.presetButtonLabel
                        }
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </View>
              )}

              {/* Mostrar proporciones actuales */}
              {tempUsarManual ? null : (
                <Text style={styles.proportionSummary}>
                  {tempProfesores.map(p => `${p.proporcion}%`).join(' / ')}
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => setConfigVisible(false)}
              textColor={colors.textSecondary}
            >
              Cancelar
            </Button>
            <Button onPress={handleGuardarConfig} textColor={colors.primary}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientEnd,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
  },
  statsContainer: {
    marginHorizontal: -spacing.lg,
  },
  statsScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statsScrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  statCard: {
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelPrimary: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statValuePrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statPercent: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  statPercentSecondary: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  formContainer: {
    marginBottom: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.medium,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  addButtonContent: {
    paddingVertical: spacing.xs,
  },
  addButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContainer: {
    gap: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resetText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  effectiveAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  textInactive: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  asistenciaChip: {
    borderRadius: 8,
  },
  asistenciaChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContent: {
    backgroundColor: colors.surface,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.xs,
  },
  editText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  pdfButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    marginTop: spacing.lg,
    ...shadows.medium,
  },
  pdfButtonContent: {
    paddingVertical: spacing.sm,
  },
  pdfButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  configDialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: '80%',
  },
  configScrollArea: {
    paddingHorizontal: spacing.lg,
  },
  dialogTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  dialogSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  dialogInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceLight,
  },
  configSectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  numPersonasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  numPersonaButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  numPersonaButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  numPersonaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  numPersonaButtonTextSelected: {
    color: colors.textPrimary,
  },
  manualToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  manualToggleLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  presetButton: {
    borderColor: colors.primary,
    borderRadius: 8,
  },
  presetButtonLabel: {
    color: colors.primary,
    fontSize: 12,
  },
  presetButtonLabelActive: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  proportionSummary: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  manualInputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  manualInput: {
    width: 100,
    backgroundColor: colors.surfaceLight,
  },
  sumaTotalText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sumaValida: {
    color: colors.success,
  },
  sumaInvalida: {
    color: colors.error,
  },
});

export default HomeScreen;
