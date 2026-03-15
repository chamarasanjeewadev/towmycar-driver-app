import { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { tokenCache } from '@/lib/auth/token-cache';
import { setAuthTokenGetter } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { ENV } from '@/env';

// Configure foreground notification behavior (must be at module scope)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthRouter() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      setAuthTokenGetter(() => getToken());
    }
  }, [isLoaded, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(app)/dashboard');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return <Slot />;
}

function CustomSplash({ onReady }: { onReady: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;

  const hide = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(onReady);
  };

  return (
    <Animated.View style={[styles.splash, { opacity }]} pointerEvents="none">
      <Image
        source={require('@/assets/images/towmycar-driver-blue-logo.png')}
        style={styles.splashLogo}
        resizeMode="contain"
        onLoad={hide}
      />
    </Animated.View>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Check for OTA updates on startup, then hide native splash
  useEffect(() => {
    async function checkForUpdate() {
      try {
        if (!Updates.isEnabled) return;
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return; // reloadAsync restarts the app — nothing below runs
        }
      } catch {
        // Non-fatal: proceed with cached bundle
      } finally {
        SplashScreen.hideAsync();
      }
    }
    checkForUpdate();
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <ClerkProvider
          publishableKey={ENV.CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <ClerkLoaded>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <AuthRouter />
              </ToastProvider>
            </QueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>

        {showCustomSplash && (
          <CustomSplash
            onReady={() => {
              setSplashDone(true);
              setShowCustomSplash(false);
            }}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B1D33',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 280,
    height: 200,
  },
});
