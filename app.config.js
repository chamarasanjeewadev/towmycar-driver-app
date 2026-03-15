const { config: loadDotenv } = require('dotenv');

// Explicitly load .env files so vars are available in local EAS builds
// (eas.json `env` section is not applied for `eas build --local`)
loadDotenv();
// Also try profile-specific env file (e.g. .env.production)
if (process.env.APP_VARIANT) {
  loadDotenv({ path: `.env.${process.env.APP_VARIANT}`, override: false });
}

const IS_DEV = process.env.APP_VARIANT === 'development';

/** @type {import('@expo/config').ExpoConfig} */
const config = require('./app.json');

module.exports = {
  ...config.expo,
  extra: {
    ...config.expo.extra,
    // Clerk's useSignInWithGoogle reads these exact keys from Constants.expoConfig.extra
    // as a fallback when process.env vars are not inlined by Metro (e.g. eas build --local)
    EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID,
    // Also expose other vars for our own ENV helper
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    // Hardcoded: reversed iOS OAuth client ID — registers the Google Sign-In URL scheme in Info.plist
    EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: 'com.googleusercontent.apps.173382114365-1b1n3e4bimvtb1dlio8dckhrn0gekj80',
    eas: {
      projectId: '0bbafa43-9ca9-419a-9065-297f08f352fa',
    },
  },
};
