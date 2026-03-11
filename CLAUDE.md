# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile app built with Expo and TypeScript. The app uses file-based routing (Expo Router) similar to Next.js, where files in the `app/` directory automatically become routes.

**Key Tech Stack:**
- Expo 54 (framework for React Native development)
- Expo Router 6 (file-based routing)
- React 19.1.0 & React Native 0.81.5
- TypeScript 5.9 (strict mode enabled)
- React Navigation (bottom tabs, native stack)
- Reanimated 4.1 & React Native Gesture Handler (animations & gestures)

## Development Commands

```bash
# Start the development server (interactive menu for iOS/Android/Web)
npm start

# Start on specific platforms
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser

# Linting
npm lint             # Run ESLint (use Expo's config)

# Reset to blank project
npm run reset-project
```

**Development Flow:**
1. Run `npm start` to launch the Expo CLI dev server
2. Press `i` for iOS simulator, `a` for Android emulator, or `w` for web
3. App hot-reloads on file changes
4. Use `npm lint` to check for issues before committing

## Project Structure

```
app/                 # File-based routing (Expo Router)
  _layout.tsx       # Root layout
  index.tsx         # Home screen (/ route)
  (tabs)/           # Tab-based navigation (can be created)
assets/             # Images, fonts, etc.
components/         # Reusable UI components
public/             # Static assets (web)
```

**Path Aliases:**
- `@/*` resolves to project root (e.g., `@/components`, `@/utils`)

## Architecture Notes

- **Expo Router (File-based Routing):** Each file in `app/` becomes a route. Directories with `(name)` are layout groups (don't affect URL structure).
- **Stack vs Tabs Navigation:** Currently using Stack layout (simple navigation stack). Can switch to tab-based navigation by creating an `app/(tabs)` directory with tabs layout.
- **New React Architecture:** Enabled in app.json (`newArchEnabled: true`). This enables the new React Native architecture for better performance.
- **React Compiler:** Enabled in experiments. This provides automatic memoization optimizations.
- **TypeScript Config:** `@/*` path alias, strict mode enabled. Extends Expo's TSConfig base.

## Common Development Tasks

**Adding a new screen:**
Create a new file in `app/` directory. For example:
- `app/about.tsx` creates an `/about` route
- `app/(tabs)/_layout.tsx` + `app/(tabs)/index.tsx` creates a tab-based section

**Styling:**
- Use React Native's `StyleSheet.create()` for styles (no CSS)
- Reanimated for animations, Gesture Handler for touch interactions

**Navigation:**
- Use `expo-router` imports: `import { useRouter } from 'expo-router'`
- Link component: `import { Link } from 'expo-router'`

## Testing & Quality

- **Linting:** Uses `eslint-config-expo` (ESLint configuration for Expo projects)
- **No testing framework configured** - Add Jest/Vitest if needed
- Run `npm lint` regularly before commits

## Build & Platform-Specific Considerations

- **iOS:** Configured to support tablets
- **Android:** Uses adaptive icons (requires foreground and background images)
- **Web:** Outputs static HTML (configured in app.json)
- **Splash Screen:** Uses `expo-splash-screen` plugin (splash image in assets/images/splash-icon.png)

## Notes for Claude

- Always refer to Expo Router docs for routing questions (file-based routing is unintuitive for those unfamiliar with it)
- The app currently has minimal content - focus on adding features rather than refactoring
- When adding screens/routes, remember file names directly become route names
- Image/asset imports work with Expo Image component (`expo-image`)
