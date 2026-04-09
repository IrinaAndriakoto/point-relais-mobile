# Point Relais Mobile - QWEN Context

## Project Overview

**Point Relais Mobile** is a cross-platform mobile application built with **Expo** (SDK ~54) and **React Native**. The app implements a "point relais" (pickup point) system with QR code scanning capabilities. It uses **Expo Router** for file-based routing and supports iOS, Android, and web platforms.

### Core Features

- **Home Screen** — Welcome screen with onboarding steps
- **QR Code Scanner** — Camera-based QR scanning with torch control, haptic feedback, and result display
- **Transaction History** — Placeholder screen for viewing scan history (stubbed, awaiting implementation)
- **Dark/Light Mode** — Automatic theme switching based on device settings
- **Custom Splash Screen** — 3-second branded splash screen on app launch

### Architecture

```
app/
  _layout.tsx          # Root layout with theme provider & splash screen
  modal.tsx            # Modal presentation screen
  (tabs)/
    _layout.tsx        # Bottom tab navigator layout
    index.tsx          # Home screen
    scanqr.tsx         # QR code scanner screen
    historique.tsx     # Transaction history screen (stub)
components/
  ui/                  # Reusable UI primitives
  themed-text.tsx      # Themed text component
  themed-view.tsx      # themed view component
  parallax-scroll-view.tsx
  haptic-tab.tsx       # Tab button with haptic feedback
  hello-wave.tsx
  external-link.tsx
constants/
  theme.ts             # Color palette & font definitions
hooks/
  use-color-scheme.ts  # Color scheme detection
  use-color-scheme.web.ts
  use-theme-color.ts
```

## Technologies & Dependencies

| Category | Technology |
|---|---|
| **Framework** | Expo SDK ~54.0, React Native 0.81 |
| **Language** | TypeScript ~5.9, React 19.1 |
| **Routing** | Expo Router ~6.0 (file-based) |
| **Navigation** | React Navigation v7 (bottom tabs) |
| **Camera** | expo-camera (QR scanning) |
| **Animations** | react-native-reanimated ~4.1, react-native-gesture-handler |
| **Linting** | ESLint with `eslint-config-expo` |
| **New Architecture** | Enabled (`newArchEnabled: true`) |

## Building & Running

### Prerequisites

- Node.js (LTS recommended)
- npm (or yarn/pnpm)
- For native builds: Xcode (iOS) or Android Studio (Android)

### Commands

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Platform-specific start
npm run android   # Start on Android emulator/device
npm run ios       # Start on iOS simulator
npm run web       # Start on web browser

# Lint the codebase
npm run lint

# Reset to a fresh project (moves current app/ to app-example/)
npm run reset-project
```

### Development Workflow

1. Run `npx expo start` to launch the dev server
2. Open the app on a device via **Expo Go** or a **development build**
3. Edit files in `app/` or `components/` — changes hot-reload automatically

## Development Conventions

### Code Style

- **TypeScript** with `strict` mode enabled
- **Path aliases**: `@/*` maps to the project root (e.g., `@/components/themed-text`)
- **ESLint**: Configured with `eslint-config-expo` flat config
- **File naming**: kebab-case for files, PascalCase for components

### Component Patterns

- Themed components (`ThemedText`, `ThemedView`) should be used for consistent dark/light mode support
- Colors are defined in `constants/theme.ts` and accessed via `useColorScheme()` hook
- Screens use `expo-router`'s `<Link>` and `<Stack>` for navigation
- Camera features require permission handling with `useCameraPermissions()`

### Routing

- File-based routing via Expo Router
- Tab navigation defined in `app/(tabs)/_layout.tsx`
- Modal screens use `presentation: "modal"` option
- Typed routes enabled (`typedRoutes: true`)

### React Compiler

- Enabled (`reactCompiler: true`) for automatic memoization optimizations

## Key Configuration Files

| File | Purpose |
|---|---|
| `app.json` | Expo app config (name, icon, splash screen, plugins, experiments) |
| `package.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript configuration with strict mode and path aliases |
| `eslint.config.js` | ESLint flat config with Expo preset |
| `.gitignore` | Standard Expo/React Native ignore patterns |

## Notes for Development

- The **Historique** screen is currently a stub and needs implementation for storing/displaying scan history
- The QR scanner uses `expo-camera` with barcode scanning limited to QR codes only
- Splash screen displays for 3 seconds before transitioning to the app
- The app scheme `pointrelaismobile` is used for deep linking
