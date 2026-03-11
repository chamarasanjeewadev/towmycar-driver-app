# App Store & Play Store Publishing Guide

Local builds only — no EAS cloud charges required.

## Prerequisites

- Mac with Xcode and Android Studio installed
- Apple Developer account
- Google Play Developer account
- Free Expo account (expo.dev)

---

## 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login              # log in to your free expo.dev account
eas build:configure    # generates eas.json in project root
```

---

## 2. Update `app.json`

Required fields for store submission (already done — see `app.json`):

- `ios.bundleIdentifier` — must match App Store Connect app
- `ios.buildNumber` — increment each submission (e.g. "1", "2")
- `android.package` — must match Play Console app
- `android.versionCode` — increment each submission (integer)

---

## 3. Build Locally

EAS CLI runs builds on your Mac for free with `--local` flag.

```bash
# iOS — produces an .ipa file
eas build --platform ios --profile production --local

# Android — produces an .aab file (Play Store format)
eas build --platform android --profile production --local
```

**iOS signing:** EAS will prompt for Apple Developer credentials to handle code signing automatically.

**Android keystore:** EAS generates one automatically on first build.
> IMPORTANT: Back up the keystore — you need the same one for all future updates. Store it somewhere safe (e.g. password manager or secure cloud storage).

---

## 4. Submit to Stores

### Option A: EAS Submit (easiest)

```bash
# iOS
eas submit --platform ios --path ./build-xxx.ipa

# Android
eas submit --platform android --path ./build-xxx.aab
```

### Option B: Manual upload

- **iOS**: Use Xcode's **Transporter** app (free, from Mac App Store)
- **Android**: Upload `.aab` directly in Play Console → Production → Create release

---

## 5. App Store Connect Setup (iOS)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → + → New App
3. Bundle ID: `com.towmycar.driver`
4. Fill in:
   - App name, subtitle, description, keywords
   - Category: **Navigation** or **Travel**
   - Privacy Policy URL (required)
   - Age rating questionnaire
   - Screenshots: 6.7" iPhone (required), 6.1" iPhone, iPad (if tablet support)
5. Upload build via EAS or Transporter
6. Submit for review — typically 1-3 days

---

## 6. Google Play Console Setup (Android)

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app → fill in default language, app/game, free/paid
3. Store listing:
   - Short description (80 chars), full description
   - Screenshots: phone required, tablet optional
   - Feature graphic: 1024×500px
   - Category: **Maps & Navigation** or **Travel & Local**
   - Privacy Policy URL (required)
4. Content rating questionnaire (under Policy section)
5. Data safety form (declare what data you collect)
6. Production → Create release → Upload `.aab`
7. Submit for review — first review a few days, subsequent updates faster

---

## 7. Pre-Submission Checklist

- [ ] Privacy Policy URL live and accessible
- [ ] Screenshots taken for all required device sizes
- [ ] Clerk switched to **production** instance (not dev keys)
- [ ] Production API URL set in `env.ts`
- [ ] Test the production build on a real physical device
- [ ] Android keystore backed up securely
- [ ] Remove or disable debug logging for production
- [ ] `app.json` version and versionCode incremented from last release

---

## 8. Subsequent Releases

1. Increment `version` in `app.json` (e.g. `"1.0.1"`)
2. Increment `ios.buildNumber` (e.g. `"2"`)
3. Increment `android.versionCode` (e.g. `2`)
4. Build with `--local` flag
5. Submit via EAS submit or manual upload

---

## Useful Commands Reference

```bash
eas build --platform ios --local           # build iOS locally
eas build --platform android --local       # build Android locally
eas build --platform all --local           # build both
eas submit --platform ios                  # submit to App Store
eas submit --platform android              # submit to Play Store
eas credentials                            # manage signing credentials
```
