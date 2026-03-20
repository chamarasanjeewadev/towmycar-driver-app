const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Adds tools:replace to Firebase messaging meta-data entries in AndroidManifest.xml.
 *
 * Both expo-notifications and @react-native-firebase/messaging declare the same
 * meta-data keys (default_notification_channel_id, default_notification_color)
 * with different values, causing a manifest merger conflict. This plugin adds
 * tools:replace attributes so our values take precedence.
 *
 * IMPORTANT: This plugin must be listed BEFORE expo-notifications in app.json plugins
 * because Expo config plugin mods are stacked (last added = first to run).
 * By listing this first, it becomes the innermost mod and runs AFTER expo-notifications.
 */
module.exports = function withFirebaseMessagingManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    const metaData = mainApplication['meta-data'] || [];

    for (const item of metaData) {
      const attrs = item.$;
      if (!attrs) continue;
      const name = attrs['android:name'];

      if (name === 'com.google.firebase.messaging.default_notification_channel_id') {
        attrs['tools:replace'] = 'android:value';
      } else if (name === 'com.google.firebase.messaging.default_notification_color') {
        attrs['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
};
