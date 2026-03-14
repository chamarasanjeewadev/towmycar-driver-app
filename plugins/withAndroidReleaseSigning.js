const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Expo config plugin that adds release signing config to android/app/build.gradle.
 * Runs automatically during `npx expo prebuild` — no manual build.gradle edits needed.
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // 1. Add release signing config inside the existing signingConfigs block
    if (!buildGradle.includes('signingConfigs.release')) {
      const releaseConfig = `
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`;

      // Insert release config after the debug config closing brace inside signingConfigs
      buildGradle = buildGradle.replace(
        /(signingConfigs\s*\{[^}]*debug\s*\{[^}]*\})/s,
        `$1\n${releaseConfig}`
      );
    }

    // 2. Replace signingConfig in the release buildType block
    //    Find the release block inside buildTypes and swap debug -> release
    //    We find "release {" after "buildTypes {" then replace signingConfigs.debug within it
    const buildTypesMatch = buildGradle.match(/buildTypes\s*\{/);
    if (buildTypesMatch) {
      const buildTypesStart = buildTypesMatch.index;
      const afterBuildTypes = buildGradle.substring(buildTypesStart);

      // Find the release block within buildTypes
      const updatedBuildTypes = afterBuildTypes.replace(
        /(release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release'
      );

      buildGradle =
        buildGradle.substring(0, buildTypesStart) + updatedBuildTypes;
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};
