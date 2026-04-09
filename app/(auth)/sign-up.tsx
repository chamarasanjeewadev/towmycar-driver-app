import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSignUp } from '@clerk/expo';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { markNewDriverSignUp } from '@/lib/auth/pending-registration';

type ClerkErrorLike = { message?: string; longMessage?: string } | null;

function getClerkError(err: ClerkErrorLike, fallback: string): string {
  if (!err) return fallback;
  return err.longMessage ?? err.message ?? fallback;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message) || fallback;
  }
  return fallback;
}

export default function SignUpScreen() {
  // Clerk Expo v3 / @clerk/react v6 returns SignUpSignalValue: { signUp, errors, fetchStatus }
  const { signUp, fetchStatus } = useSignUp() as unknown as {
    signUp: {
      status: string;
      create: (params: { emailAddress: string; unsafeMetadata?: Record<string, unknown> }) => Promise<{ error: ClerkErrorLike }>;
      verifications: {
        sendEmailCode: () => Promise<{ error: ClerkErrorLike }>;
        verifyEmailCode: (params: { code: string }) => Promise<{ error: ClerkErrorLike }>;
      };
      finalize: () => Promise<{ error: ClerkErrorLike }>;
    } | null;
    fetchStatus: 'idle' | 'fetching';
  };
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const showError = (message: string) => {
    setError(message);
    Alert.alert('Sign Up Error', message);
  };

  const handleEmailSignUp = async () => {
    if (!signUp || fetchStatus === 'fetching') {
      showError('Authentication is loading. Please wait and try again.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Step 1: Create sign-up with email
      const { error: createError } = await signUp.create({
        emailAddress: email.trim(),
        unsafeMetadata: { role: 'driver' },
      });

      if (createError) {
        showError(getClerkError(createError, 'Sign up failed. Please try again.'));
        return;
      }

      // Step 2: Send email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        showError(getClerkError(sendError, 'Failed to send verification code. Please try again.'));
        return;
      }

      setPendingVerification(true);
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      showError(getErrorMessage(err, 'Sign up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    setError('');
    setLoading(true);

    try {
      // Step 3: Verify the code
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });

      if (verifyError) {
        showError(getClerkError(verifyError, 'Invalid or expired code. Please try again.'));
        return;
      }

      // Step 4: Finalize to create the session
      if (signUp.status === 'complete') {
        markNewDriverSignUp();
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          showError(getClerkError(finalizeError, 'Could not complete sign up. Please try again.'));
        }
      } else {
        showError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Verify error:', err);
      showError(getErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { createdSessionId, setActive: setActiveSession, signUp } =
        await startGoogleAuthenticationFlow({ unsafeMetadata: { role: 'driver' } });

      if (createdSessionId && setActiveSession) {
        if (signUp?.createdUserId) {
          markNewDriverSignUp();
        }
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.error('Google sign up error:', err);
      showError(getErrorMessage(err, 'Google sign up failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setError('');
    setAppleLoading(true);

    try {
      const { createdSessionId, setActive: setActiveSession, signUp } =
        await startAppleAuthenticationFlow({ unsafeMetadata: { role: 'driver' } });

      if (createdSessionId && setActiveSession) {
        if (signUp?.createdUserId) {
          markNewDriverSignUp();
        }
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.error('Apple sign up error:', err);
      showError(getErrorMessage(err, 'Apple sign up failed. Please try again.'));
    } finally {
      setAppleLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('@/assets/images/towmycar-driver-blue-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {email}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor={Colors.textMuted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPendingVerification(false)}>
            <Text style={styles.link}>Use a different email</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('@/assets/images/towmycar-driver-blue-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>TowMyCar</Text>
        <Text style={styles.subtitle}>Create Driver Account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {Platform.OS === 'ios' && (
          <View style={appleLoading ? styles.appleButtonDisabled : undefined}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleAppleSignUp}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEmailSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>Continue with Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    width: 220,
    height: 165,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: Colors.google,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  appleButtonDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#3d0000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    overflow: 'hidden',
  },
  link: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
