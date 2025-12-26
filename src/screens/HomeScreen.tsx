import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
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
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TipoAsistencia, Alumno } from '../types';
import { useAlumnos } from '../hooks/useAlumnos';
import { colors, spacing, shadows } from '../theme';
import { AuthService } from '../services/auth';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const AnimatedSurface = Animated.createAnimatedComponent(Surface);

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
      layout={Layout.springify()}
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
  const [tempNombre1, setTempNombre1] = useState('');
  const [tempNombre2, setTempNombre2] = useState('');
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  // Header animation
  const headerOpacity = useSharedValue(0);
  const statsScale = useSharedValue(0.9);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    statsScale.value = withDelay(300, withSpring(1, { damping: 12 }));
  }, []);

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

  const handleGuardarEdicion = () => {
    if (!editandoAlumno) return;
    const cantidad = nuevaCantidad.trim() === '' ? 0 : parseFloat(nuevaCantidad.trim());
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
                {alumnosActivos} alumno{alumnosActivos !== 1 ? 's' : ''} activo{alumnosActivos !== 1 ? 's' : ''}
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

          {/* Stats Cards */}
          <Animated.View style={[styles.statsContainer, statsAnimStyle]}>
            <Surface style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{total.toFixed(2)}€</Text>
            </Surface>
            <Surface style={[styles.statCard, styles.statCardPrimary]}>
              <Text style={styles.statLabelPrimary}>{config.nombreProfesor1}</Text>
              <Text style={styles.statValuePrimary}>
                {proporcionalProfesor1.toFixed(2)}€
              </Text>
              <Text style={styles.statPercent}>{config.proporcionProfesor1}%</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <Text style={styles.statLabel}>{config.nombreProfesor2}</Text>
              <Text style={styles.statValue}>
                {proporcionalProfesor2.toFixed(2)}€
              </Text>
              <Text style={styles.statPercentSecondary}>
                {100 - config.proporcionProfesor1}%
              </Text>
            </Surface>
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
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Configuración</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre profesor 1"
              value={tempNombre1}
              onChangeText={setTempNombre1}
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
            <TextInput
              label="Nombre profesor 2"
              value={tempNombre2}
              onChangeText={setTempNombre2}
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
            <Text style={styles.proportionLabel}>
              Proporción: {config.proporcionProfesor1}% /{' '}
              {100 - config.proporcionProfesor1}%
            </Text>
            <View style={styles.proportionButtons}>
              {[50, 60, 70, 80].map((valor) => (
                <Button
                  key={valor}
                  mode={
                    config.proporcionProfesor1 === valor ? 'contained' : 'outlined'
                  }
                  onPress={() => actualizarConfig({ proporcionProfesor1: valor })}
                  style={styles.proportionButton}
                  compact
                  labelStyle={
                    config.proporcionProfesor1 === valor
                      ? styles.proportionButtonLabelActive
                      : styles.proportionButtonLabel
                  }
                >
                  {valor}/{100 - valor}
                </Button>
              ))}
            </View>
          </Dialog.Content>
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
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
    paddingBottom: spacing.xxl,
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
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  proportionLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  proportionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  proportionButton: {
    borderColor: colors.primary,
    borderRadius: 8,
  },
  proportionButtonLabel: {
    color: colors.primary,
    fontSize: 12,
  },
  proportionButtonLabelActive: {
    color: colors.textPrimary,
    fontSize: 12,
  },
});

export default HomeScreen;
