const { withGradleProperties } = require('expo/config-plugins');

/**
 * Expo config plugin that adds keystore signing properties to gradle.properties.
 * These are read by the release signingConfig in build.gradle.
 */
module.exports = function withKeystoreGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    // Increase JVM memory to avoid OutOfMemoryError during release lint
    const jvmArgsIdx = props.findIndex(
      (p) => p.type === 'property' && p.key === 'org.gradle.jvmargs'
    );
    if (jvmArgsIdx !== -1) {
      props[jvmArgsIdx].value = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';
    }

    const keystoreProps = {
      MYAPP_UPLOAD_STORE_FILE: '../../my-upload-key.keystore',
      MYAPP_UPLOAD_KEY_ALIAS: 'my-key-alias',
      MYAPP_UPLOAD_STORE_PASSWORD: 'towMyCarCriticalS600Anu',
      MYAPP_UPLOAD_KEY_PASSWORD: 'towMyCarCriticalS600Anu',
    };

    for (const [key, value] of Object.entries(keystoreProps)) {
      const existing = props.find((p) => p.type === 'property' && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    }

    return config;
  });
};
