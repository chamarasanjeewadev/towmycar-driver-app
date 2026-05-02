import { useState, useEffect } from 'react';
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
import { useSignIn } from '@clerk/expo';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ENV } from '@/env';
import { consumePendingAuthError } from '@/lib/auth/pending-error';

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
      create: (params: { identifier: string; password?: string }) => Promise<{ error: ClerkErrorLike }>;
      emailCode: {
        sendCode: (params?: { emailAddress?: string }) => Promise<{ error: ClerkErrorLike }>;
        verifyCode: (params: { code: string }) => Promise<{ error: ClerkErrorLike }>;
      };
      finalize: () => Promise<{ error: ClerkErrorLike }>;
    } | null;
    fetchStatus: 'idle' | 'fetching';
  };
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle({
    androidClientId: ENV.CLERK_GOOGLE_WEB_CLIENT_ID,
    iosClientId: ENV.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
  });
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    const err = consumePendingAuthError();
    if (err) setError(err);
  }, []);

  const handleLogoTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 2000) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= 5) {
        setPasswordMode(true);
        setTapCount(0);
        Alert.alert('Password mode enabled');
      }
    }
    setLastTapTime(now);
  };

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

  const handlePasswordSignIn = async () => {
    if (!signIn || fetchStatus === 'fetching') {
      showError('Authentication is loading. Please wait and try again.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (createError) {
        showError(getClerkError(createError, 'Invalid email or password. Please try again.'));
        return;
      }

      if (signIn.status === 'complete') {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          showError(getClerkError(finalizeError, 'Could not complete sign in. Please try again.'));
        }
      } else {
        showError('Sign in incomplete. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Password sign in error:', err);
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

  const handleAppleSignIn = async () => {
    setError('');
    setAppleLoading(true);

    try {
      const { createdSessionId, setActive: setActiveSession } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
      }
    } catch (err: unknown) {
      console.error('Apple sign in error:', err);
      showError(getErrorMessage(err, 'Apple sign in failed. Please try again.'));
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
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
          <Image
            source={require('@/assets/images/towmycar-driver-blue-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>TowMyCar</Text>
        <Text style={styles.subtitle}>Driver Sign In</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {Platform.OS === 'ios' && (
          <View style={appleLoading ? styles.appleButtonDisabled : undefined}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          </View>
        )}

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

        {passwordMode && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={passwordMode ? handlePasswordSignIn : handleEmailSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>
              {passwordMode ? 'Sign In with Password' : 'Continue with Email'}
            </Text>
          )}
        </TouchableOpacity>

        {passwordMode ? (
          <TouchableOpacity onPress={() => { setPasswordMode(false); setPassword(''); }}>
            <Text style={styles.toggleLink}>Switch to email code</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setPasswordMode(true)}>
            <Text style={styles.toggleLink}>Sign in with password instead</Text>
          </TouchableOpacity>
        )}

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
  toggleLink: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 8,
  },
  dividerText: {
    color: Colors.textMuted,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
