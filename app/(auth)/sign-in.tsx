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
import { useSignIn } from '@clerk/expo';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

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

export default function SignInScreen() {
  // Clerk Expo v3 / @clerk/react v6 returns SignInSignalValue: { signIn, errors, fetchStatus }
  const { signIn, fetchStatus } = useSignIn() as unknown as {
    signIn: {
      status: string;
      create: (params: { identifier: string }) => Promise<{ error: ClerkErrorLike }>;
      emailCode: {
        sendCode: (params?: { emailAddress?: string }) => Promise<{ error: ClerkErrorLike }>;
        verifyCode: (params: { code: string }) => Promise<{ error: ClerkErrorLike }>;
      };
      finalize: () => Promise<{ error: ClerkErrorLike }>;
    } | null;
    fetchStatus: 'idle' | 'fetching';
  };
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const showError = (message: string) => {
    setError(message);
    Alert.alert('Sign In Error', message);
  };

  const handleEmailSignIn = async () => {
    if (!signIn || fetchStatus === 'fetching') {
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
      // Step 1: Create sign-in with email identifier
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });

      if (createError) {
        showError(getClerkError(createError, 'Could not find account. Please check your email or sign up.'));
        return;
      }

      // Step 2: Send the email OTP code
      const { error: sendError } = await signIn.emailCode.sendCode();

      if (sendError) {
        showError(getClerkError(sendError, 'Failed to send verification code. Please try again.'));
        return;
      }

      setPendingVerification(true);
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      showError(getErrorMessage(err, 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signIn) return;
    setError('');
    setLoading(true);

    try {
      // Step 3: Verify the OTP code
      const { error: verifyError } = await signIn.emailCode.verifyCode({ code });

      if (verifyError) {
        showError(getClerkError(verifyError, 'Invalid or expired code. Please try again.'));
        return;
      }

      // Step 4: Finalize to create the session
      if (signIn.status === 'complete') {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          showError(getClerkError(finalizeError, 'Could not complete sign in. Please try again.'));
        }
      } else {
        showError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Verify code error:', err);
      showError(getErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { createdSessionId, setActive: setActiveSession } =
        await startGoogleAuthenticationFlow();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      showError(getErrorMessage(err, 'Google sign in failed. Please try again.'));
    } finally {
      setGoogleLoading(false);
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
          <Text style={styles.title}>Check Your Email</Text>
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
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
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
        <Text style={styles.subtitle}>Driver Sign In</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
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
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>Continue with Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={styles.link}>
            Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text>
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
