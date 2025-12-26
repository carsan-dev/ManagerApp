import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { AuthService } from '../services/auth';
import { colors, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const LoginScreen: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(-180);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const decorCircle1 = useSharedValue(0);
  const decorCircle2 = useSharedValue(0);
  const decorCircle3 = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoRotate.value = withSpring(0, { damping: 15, stiffness: 80 });

    titleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(300, withSpring(0, { damping: 12 }));

    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    subtitleTranslateY.value = withDelay(500, withSpring(0, { damping: 12 }));

    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    buttonScale.value = withDelay(700, withSpring(1, { damping: 10 }));

    // Decorative circles
    decorCircle1.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    decorCircle2.value = withDelay(400, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    decorCircle3.value = withDelay(600, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const circle1Style = useAnimatedStyle(() => ({
    opacity: interpolate(decorCircle1.value, [0, 1], [0, 0.15]),
    transform: [{ scale: decorCircle1.value }],
  }));

  const circle2Style = useAnimatedStyle(() => ({
    opacity: interpolate(decorCircle2.value, [0, 1], [0, 0.1]),
    transform: [{ scale: decorCircle2.value }],
  }));

  const circle3Style = useAnimatedStyle(() => ({
    opacity: interpolate(decorCircle3.value, [0, 1], [0, 0.08]),
    transform: [{ scale: decorCircle3.value }],
  }));

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 10 });

    try {
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      if (err.code === 'SIGN_IN_CANCELLED') {
        setError('Inicio de sesión cancelado');
      } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Google Play Services no disponible');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
      buttonScale.value = withSpring(1, { damping: 10 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <Animated.View style={[styles.decorCircle, styles.decorCircle1, circle1Style]} />
        <Animated.View style={[styles.decorCircle, styles.decorCircle2, circle2Style]} />
        <Animated.View style={[styles.decorCircle, styles.decorCircle3, circle3Style]} />

        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoGlow} />
          </Animated.View>

          {/* Title */}
          <Animated.View style={titleAnimatedStyle}>
            <Text style={styles.title}>Sports Manager</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={subtitleAnimatedStyle}>
            <Text style={styles.subtitle}>Gestión profesional de alumnos y pagos</Text>
          </Animated.View>

          {/* Divider line */}
          <Animated.View style={[styles.divider, subtitleAnimatedStyle]} />

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {/* Login button */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <Button
              mode="contained"
              onPress={handleGoogleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon={loading ? undefined : () => <Icon name="google" size={20} color={colors.textPrimary} />}
            >
              {loading ? 'Conectando...' : 'Iniciar sesión con Google'}
            </Button>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, buttonAnimatedStyle]}>
            <Text style={styles.footerText}>
              Acceso seguro con tu cuenta de Google
            </Text>
          </Animated.View>
        </View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <View style={styles.bottomLine} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: colors.primary,
  },
  decorCircle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  decorCircle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.3,
    left: -width * 0.4,
  },
  decorCircle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.3,
    right: -width * 0.3,
  },
  logoContainer: {
    marginBottom: spacing.xl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: colors.primary,
    opacity: 0.2,
    zIndex: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomLine: {
    width: 100,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
  },
});

export default LoginScreen;
