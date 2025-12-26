import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Button, Text, ActivityIndicator, IconButton, SegmentedButtons } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import dayjs from 'dayjs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Alumno } from '../types';
import { colors, spacing, shadows } from '../theme';
import { logoBase64 } from '../assets/logo';

const { width, height } = Dimensions.get('window');

type PdfScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Pdf'>;
type PdfScreenRouteProp = RouteProp<RootStackParamList, 'Pdf'>;

type Props = {
  navigation: PdfScreenNavigationProp;
  route: PdfScreenRouteProp;
};

const PdfScreen: React.FC<Props> = ({ route, navigation }) => {
  const { alumnos } = route.params;
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [temporada, setTemporada] = useState('');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 500 });
    cardScale.value = withDelay(200, withSpring(1, { damping: 12 }));
  }, [cardOpacity, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const calcularCantidadEfectiva = (alumno: Alumno): number => {
    if (!alumno.activo) {
      return 0;
    }
    switch (alumno.tipoAsistencia) {
      case 'completo':
        return alumno.cantidad;
      case 'medio':
        return alumno.cantidad / 2;
      case 'dias':
        return (alumno.cantidad / 30) * (alumno.diasAsistencia ?? 0);
      default:
        return alumno.cantidad;
    }
  };

  const generarPDF = async () => {
    setIsGenerating(true);
    setProgress('Preparando datos...');

    const mesActual = dayjs().month();
    let añoInicio, añoFin;

    if (mesActual >= 8) {
      añoInicio = dayjs().year();
      añoFin = añoInicio + 1;
    } else {
      añoFin = dayjs().year();
      añoInicio = añoFin - 1;
    }

    const temp = `${añoInicio}-${añoFin}`;
    setTemporada(temp);
    const fechaGeneracion = dayjs().format('DD/MM/YYYY HH:mm');

    const meses = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

    setProgress('Generando tabla...');

    const alumnosActivos = alumnos.filter(a => a.activo);

    const tablaRows = alumnosActivos.map((alumno, index) => {
      const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
      const mesesCols = meses.map(() => '<td class="mes-col"></td>').join('');
      return `
        <tr class="${rowClass}">
          <td class="nombre-col">${alumno.nombre}</td>
          <td class="cantidad-col">${alumno.cantidad.toFixed(2)}€</td>
          ${mesesCols}
        </tr>
      `;
    }).join('');

    const totalMensual = alumnosActivos.reduce((sum, a) => sum + calcularCantidadEfectiva(a), 0);
    const mesesHeaders = meses.map(m => `<th class="mes-col">${m}</th>`).join('');
    const mesesEmpty = meses.map(() => '<td class="mes-col"></td>').join('');

    const tablaHTML = `
      <table>
        <thead>
          <tr>
            <th class="nombre-col">Alumno</th>
            <th class="cantidad-col">Cuota</th>
            ${mesesHeaders}
          </tr>
        </thead>
        <tbody>
          ${tablaRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td class="nombre-col"><strong>TOTAL</strong></td>
            <td class="cantidad-col"><strong>${totalMensual.toFixed(2)}€</strong></td>
            ${mesesEmpty}
          </tr>
        </tfoot>
      </table>
    `;

    setProgress('Creando PDF...');

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            padding: 20px;
            color: #2d3748;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            padding: 24px 32px;
            color: white;
            display: flex;
            align-items: center;
          }
          .logo {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            overflow: hidden;
            flex-shrink: 0;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-info { flex: 1; margin-left: 20px; }
          .header-title {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .header-subtitle { font-size: 14px; opacity: 0.9; }
          .header-meta {
            text-align: right;
            font-size: 11px;
            opacity: 0.8;
          }
          .content { padding: 24px 32px; }
          .stats-row {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-card {
            flex: 1;
            background: #f8fafc;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .stat-card.primary {
            background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
            color: white;
            border: none;
          }
          .stat-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
            margin-bottom: 6px;
          }
          .stat-value { font-size: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          thead { background: linear-gradient(135deg, #1e1e32 0%, #2a2a42 100%); }
          th {
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 9px;
          }
          th.nombre-col { text-align: left; width: 22%; }
          th.cantidad-col { width: 10%; }
          th.mes-col { width: 5.6%; }
          td {
            padding: 10px 8px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }
          td.nombre-col { text-align: left; font-weight: 500; color: #1a202c; }
          td.cantidad-col { font-weight: 600; color: #6366F1; }
          .even-row { background-color: #f8fafc; }
          .odd-row { background-color: white; }
          .total-row { background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); }
          .total-row td { color: white; border-bottom: none; padding: 14px 8px; }
          .total-row td.cantidad-col { color: white; }
          .footer {
            background: #f8fafc;
            padding: 16px 32px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="data:image/png;base64,${logoBase64}" alt="Logo" />
            </div>
            <div class="header-info">
              <div class="header-title">Control de Pagos</div>
              <div class="header-subtitle">Temporada ${temp}</div>
            </div>
            <div class="header-meta">
              <div>Generado el</div>
              <div><strong>${fechaGeneracion}</strong></div>
            </div>
          </div>
          <div class="content">
            <div class="stats-row">
              <div class="stat-card">
                <div class="stat-label">Alumnos activos</div>
                <div class="stat-value">${alumnosActivos.length}</div>
              </div>
              <div class="stat-card primary">
                <div class="stat-label">Total mensual</div>
                <div class="stat-value">${totalMensual.toFixed(2)}€</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total alumnos</div>
                <div class="stat-value">${alumnos.length}</div>
              </div>
            </div>
            ${tablaHTML}
          </div>
          <div class="footer">
            Documento generado automáticamente por Sports Manager
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // A4 dimensions: 842 x 595 points
      const pdfWidth = orientation === 'horizontal' ? 842 : 595;
      const pdfHeight = orientation === 'horizontal' ? 595 : 842;

      const file = await RNHTMLtoPDF.convert({
        html: htmlCompleto,
        fileName: `Control_Pagos_${temp}`,
        directory: 'Documents',
        width: pdfWidth,
        height: pdfHeight,
      });

      if (!file.filePath) {
        throw new Error('No se pudo generar el archivo PDF.');
      }

      setPdfPath(file.filePath);
      setIsGenerating(false);
      setProgress('');
    } catch (error: any) {
      setIsGenerating(false);
      setProgress('');
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const handleShare = async () => {
    if (!pdfPath) {
      return;
    }

    try {
      const uri = Platform.OS === 'android' ? `file://${pdfPath}` : pdfPath;
      await Share.open({
        url: uri,
        type: 'application/pdf',
        title: 'Compartir PDF',
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error compartiendo:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (!pdfPath) {
      return;
    }

    try {
      if (Platform.OS === 'android') {
        const fileName = `Control_Pagos_${temporada}.pdf`;
        const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

        // Copy file to Downloads
        await ReactNativeBlobUtil.fs.cp(pdfPath, downloadPath);

        // Register with Android's MediaStore so it appears in Downloads
        await ReactNativeBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: 'Control de pagos PDF',
          mime: 'application/pdf',
          path: downloadPath,
          showNotification: true,
        });

        Alert.alert(
          'Descargado',
          `PDF guardado en Descargas como ${fileName}`,
          [{ text: 'OK' }]
        );
      } else {
        // iOS - use share to save
        handleShare();
      }
    } catch (error: any) {
      console.error('Error descargando:', error);
      Alert.alert('Error', 'No se pudo guardar el PDF: ' + error.message);
    }
  };

  const handlePrint = async () => {
    if (!pdfPath) {
      return;
    }

    try {
      const uri = Platform.OS === 'android' ? `file://${pdfPath}` : pdfPath;
      // Use share with print option
      await Share.open({
        url: uri,
        type: 'application/pdf',
        title: 'Imprimir PDF',
        showAppsToView: true,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error imprimiendo:', error);
      }
    }
  };

  const handleNewPdf = () => {
    setPdfPath(null);
    setTemporada('');
  };

  const alumnosActivos = alumnos.filter(a => a.activo).length;

  // Preview Mode
  if (pdfPath) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle]}
          style={styles.previewHeader}
        >
          <View style={styles.previewHeaderContent}>
            <IconButton
              icon="arrow-left"
              iconColor={colors.textPrimary}
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.previewTitle}>Vista previa</Text>
            <IconButton
              icon="refresh"
              iconColor={colors.textPrimary}
              size={24}
              onPress={handleNewPdf}
            />
          </View>
        </LinearGradient>

        <View style={styles.pdfContainer}>
          <Pdf
            source={{ uri: `file://${pdfPath}` }}
            style={styles.pdf}
            enablePaging={true}
            horizontal={false}
            fitPolicy={0}
            onError={(error) => {
              console.error('PDF Error:', error);
            }}
          />
        </View>

        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.actionBar}
        >
          <View style={styles.actionButton}>
            <IconButton
              icon="share-variant"
              iconColor={colors.textPrimary}
              size={28}
              style={styles.actionIconButton}
              onPress={handleShare}
            />
            <Text style={styles.actionLabel}>Compartir</Text>
          </View>

          <View style={styles.actionButton}>
            <IconButton
              icon="download"
              iconColor={colors.textPrimary}
              size={28}
              style={[styles.actionIconButton, styles.actionIconButtonPrimary]}
              onPress={handleDownload}
            />
            <Text style={styles.actionLabel}>Descargar</Text>
          </View>

          <View style={styles.actionButton}>
            <IconButton
              icon="printer"
              iconColor={colors.textPrimary}
              size={28}
              style={styles.actionIconButton}
              onPress={handlePrint}
            />
            <Text style={styles.actionLabel}>Imprimir</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Generate Mode
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, cardStyle]}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              style={styles.iconGradient}
            >
              <Text style={styles.iconText}>📄</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>Generar PDF</Text>
          <Text style={styles.subtitle}>
            Control de pagos para {alumnosActivos} alumno{alumnosActivos === 1 ? '' : 's'} activo{alumnosActivos === 1 ? '' : 's'}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Alumnos</Text>
              <Text style={styles.infoValue}>{alumnos.length}</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardPrimary]}>
              <Text style={styles.infoLabelPrimary}>Activos</Text>
              <Text style={styles.infoValuePrimary}>{alumnosActivos}</Text>
            </View>
          </View>

          <View style={styles.orientationContainer}>
            <Text style={styles.orientationLabel}>Orientación</Text>
            <SegmentedButtons
              value={orientation}
              onValueChange={setOrientation}
              buttons={[
                { value: 'horizontal', label: 'Horizontal', icon: 'phone-rotate-landscape' },
                { value: 'vertical', label: 'Vertical', icon: 'phone-rotate-portrait' },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: colors.primary,
                  onSecondaryContainer: colors.textPrimary,
                  onSurface: colors.textSecondary,
                },
              }}
            />
          </View>

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.progressText}>{progress}</Text>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={generarPDF}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="file-pdf-box"
            >
              Generar PDF
            </Button>
          )}

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
          >
            Volver
          </Button>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientEnd,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.large,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  orientationContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  orientationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  segmentedButtons: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  infoCardPrimary: {
    backgroundColor: colors.primary,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  infoLabelPrimary: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoValuePrimary: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  progressText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  button: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 12,
    ...shadows.medium,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  backButton: {
    marginTop: spacing.md,
  },
  backButtonLabel: {
    color: colors.textSecondary,
  },
  // Preview styles
  previewHeader: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: spacing.md,
  },
  previewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: colors.surfaceLight,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    ...shadows.medium,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconButton: {
    backgroundColor: colors.surfaceLight,
    margin: 0,
  },
  actionIconButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default PdfScreen;
