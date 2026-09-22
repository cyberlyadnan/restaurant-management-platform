# OrderRestro Mobile App (React Native CLI)

Enterprise cross-platform mobile POS & KDS terminal client for **Android** and **iOS**, built with React Native CLI, TypeScript, and modern mobile architecture.

---

## Architecture Overview

```
apps/mobile/
├── android/                 # Native Android project (Gradle, AndroidManifest, MainActivity)
├── ios/                     # Native iOS project (Xcode project, Podfile)
├── src/
│   ├── api/                 # Axios client with JWT auto-injection & dynamic server URL
│   ├── config/              # Environment config (API/WS endpoints & AsyncStorage keys)
│   ├── context/             # AuthContext (sessions, branches) & CartContext (POS state)
│   ├── components/          # Reusable UI components (DishCard, TableCard, FullCartModal, DietaryBadge)
│   ├── screens/             # Core terminal screens
│   │   ├── LoginScreen.tsx      # Staff sign-in & 1-tap demo logins
│   │   ├── TablesScreen.tsx     # Floor plan & table occupancy with live timers
│   │   ├── PosScreen.tsx        # Zomato-style ordering, in-place steppers & floating cart
│   │   ├── KdsScreen.tsx        # Kitchen Display System & ticket bump station
│   │   ├── CheckoutScreen.tsx   # Visual payment methods (Cash/Card/UPI/Wallet) & split bill
│   │   └── SettingsScreen.tsx   # Branch switcher & server IP configuration
│   ├── navigation/          # Bottom tab navigator (Tables, POS, KDS, Settings) & modal stack
│   └── theme/               # Dark-mode restaurant theme tokens
├── App.tsx                  # Root component with providers (QueryClient, Auth, Cart, SafeArea)
├── metro.config.js          # Monorepo-aware Metro bundler configuration
└── package.json
```

---

## Features

1. **Tables & Floor Plan (`TablesScreen`)**:
   - Color-coded table states (`Available`, `Occupied`, `Reserved`, `Cleaning`).
   - Active dining session timers.
   - Quick **Start Order** (routes directly to POS with table pre-selected) and **Bill Table**.
2. **Zomato-Style POS Ordering (`PosScreen`)**:
   - Search bar + dietary quick filters (`All`, `Veg Only`, `Non-Veg`, `Combos`).
   - Horizontal category scroll tabs.
   - Food cards with the iconic `+ ADD` button and in-place quantity stepper `[ − ] [ qty ] [ + ]`.
   - Floating bottom cart bar: `🛒 X items • ₹Total | View Cart →`.
3. **Full Cart Review (`FullCartModal`)**:
   - Slide-up modal with itemized dish review, modifier tags, and item steppers.
   - Kitchen cooking notes with quick preset chips (`Extra Spicy`, `Less Salt`, `No Onion/Garlic`).
   - Detailed bill summary (subtotal, taxes, grand total).
   - One-tap `Confirm & Send to Kitchen (KOT)`.
4. **Kitchen Display System (`KdsScreen`)**:
   - Real-time kitchen tickets with ticket number, table, and item quantities.
   - Bump bar status workflow: `Start Cooking` ➔ `Mark Ready` ➔ `Bump/Served`.
5. **Billing & Checkout (`CheckoutScreen`)**:
   - Visual payment tiles: 💵 Cash, 💳 Card, 📱 UPI / QR, 👛 Wallet.
   - 1-touch discount percentage chips (`0%`, `5%`, `10%`, `15%`, `20%`).
   - 1-touch tip chips (`None`, `+₹50`, `+₹100`, `+₹200`).
   - Split bill stepper (`1p`, `2p`, `3p`, `4p`).
6. **Branch & Server Configuration (`SettingsScreen`)**:
   - Switch active restaurant branch on the fly.
   - Configure backend IP address directly inside the app without rebuilding.

---

## Quick Start Guide

### Prerequisites
- Node.js >= 22
- JDK 17+ and Android Studio (with Android SDK & emulator configured)
- For iOS: macOS with Xcode & CocoaPods

### Running on Android

1. Start the Metro bundler from repository root:
   ```bash
   pnpm --filter @nodedr-restaurant/mobile start
   ```

2. In another terminal, launch the app on your Android emulator or connected device:
   ```bash
   pnpm --filter @nodedr-restaurant/mobile android
   ```

*Note for Android Emulator*: By default, the app connects to the local backend at `http://10.0.2.2:4000/api/v1`. If you are using a physical Android device connected via Wi-Fi, go to the **Settings** tab in the app and set your computer's LAN IP (e.g. `http://192.168.1.100:4000/api/v1`).

### Running on iOS

1. Install CocoaPods:
   ```bash
   cd apps/mobile/ios
   pod install
   cd ../../..
   ```

2. Run on simulator:
   ```bash
   pnpm --filter @nodedr-restaurant/mobile ios
   ```

---

## Pre-Configured Demo Credentials

The login screen includes one-tap quick-fill chips for all demo roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@demo.local` | `Password123!` |
| **Waiter** | `waiter@demo.local` | `Password123!` |
| **Chef** | `chef@demo.local` | `Password123!` |
| **Kitchen** | `kitchen@demo.local` | `Password123!` |
| **Cashier** | `cashier@demo.local` | `Password123!` |
