import Constants from 'expo-constants';

// `extra` is populated from app.config.js at Expo config time — reliable in all build types.
// Key names match the env var names exactly, which is also what @clerk/expo reads internally.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const ENV = {
  CLERK_PUBLISHABLE_KEY:
    extra.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
  API_BASE_URL:
    extra.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  CLERK_GOOGLE_WEB_CLIENT_ID:
    extra.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID ?? process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID ?? '',
  EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID:
    extra.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID ?? process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID ?? '',
};
