// screens/PdfScreen.tsx

import React, { useState } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import moment from 'moment';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Pdf: { alumnos: string[] };
};

type PdfScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Pdf'>;
type PdfScreenRouteProp = RouteProp<RootStackParamList, 'Pdf'>;

type Props = {
  navigation: PdfScreenNavigationProp;
  route: PdfScreenRouteProp;
};

const PdfScreen: React.FC<Props> = ({ route }) => {
  const { alumnos } = route.params;
  const [isGenerating, setIsGenerating] = useState(false);

  const generarPDF = async () => {
    setIsGenerating(true);

    // Obtener la temporada actual
    const añoActual = moment().year();
    const temporada = `${añoActual}`;

    // Crear la tabla en HTML
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr',
      'May', 'Jun', 'Jul', 'Ago',
      'Sep', 'Oct', 'Nov', 'Dic',
    ];

    const tablaHTML = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Temporada ${temporada}</h1>
        <table>
          <tr>
            <th>Alumnos</th>
            ${meses.map((mes) => `<th>${mes}</th>`).join('')}
          </tr>
          ${alumnos
            .map(
              (alumno) => `
              <tr>
                <td>${alumno}</td>
                ${meses.map(() => `<td></td>`).join('')}
              </tr>
            `,
            )
            .join('')}
        </table>
      </body>
      </html>
    `;

    // Generar el PDF
    const options = {
      html: tablaHTML,
      fileName: `Temporada_${temporada}`,
      directory: 'Documents', // Guardar en el directorio interno de documentos
    };

    try {
      const file = await RNHTMLtoPDF.convert(options);

      // Verificar que file.filePath no es undefined
      if (!file.filePath) {
        throw new Error('No se pudo generar el archivo PDF.');
      }

      const filePath = file.filePath;

      // Preparar el URI para compartir
      let uri = filePath;
      if (Platform.OS === 'android') {
        uri = `file://${filePath}`;
      }

      // Compartir el PDF
      await Share.open({
        url: uri,
        type: 'application/pdf',
        title: 'Compartir PDF',
      });

      setIsGenerating(false);
    } catch (error) {
      setIsGenerating(false);
      console.error(error);
      Alert.alert('Error', 'Ocurrió un error al generar el PDF.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      {isGenerating ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button mode="contained" onPress={generarPDF}>
          Generar y Compartir PDF
        </Button>
      )}
    </View>
  );
};

export default PdfScreen;
