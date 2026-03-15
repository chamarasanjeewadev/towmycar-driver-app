const { withDangerousMod } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const FIX_TAG = '# withFirebaseiOSFix';

/**
 * Adds `use_modular_headers!` to the Podfile.
 *
 * Required because FirebaseCoreInternal (Swift) depends on GoogleUtilities (ObjC),
 * which needs a module map to be importable from Swift when building as static libs.
 * `use_modular_headers!` generates these module maps without the link-mode issues
 * of `use_frameworks! :linkage => :static`.
 */
module.exports = function withFirebaseiOSFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes(FIX_TAG)) {
        return config;
      }

      // Insert `use_modular_headers!` right after the `platform :ios` line.
      // It must be at the top level (outside any target block).
      contents = contents.replace(
        /(platform :ios,[^\n]+\n)/,
        `$1\nuse_modular_headers! ${FIX_TAG}\n`
      );

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
