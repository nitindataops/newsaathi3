# 🌾 Kisan Saathi - Android Application

## Aapki Fasal, Aapka Bazaar (आपकी फसल, आपका बाज़ार)

**Kisan Saathi** is an Android application built using Kotlin and Jetpack Compose designed to connect Indian farmers directly with trusted buyers, mills, and food processors with transparent Mandi benchmark prices, AI crop quality grading, and farm-to-fork batch traceability.

---

## 🚀 Architecture & Tech Stack

- **Platform:** Native Android (Min SDK 26, Target SDK 35)
- **UI Toolkit:** Jetpack Compose with Material Design 3 (M3)
- **Programming Language:** Kotlin
- **Persistence:** Room Database (Offline-first local caching for crops, mandi rates, orders, and processing batches)
- **Architecture Pattern:** MVVM (Model-View-ViewModel) with Kotlin Coroutines & Flow
- **Image Loading:** Coil Compose
- **Design:** Modern agricultural theme with deep emerald green `#245C3A`, golden wheat harvest `#D6A63A`, and warm neutral `#FBFAF4`

---

## ✨ Core Features Ported

1. **🌾 Farmer Hub & Listing Management:**
   - Real-time crop inventory management (Chana, Sharbati Wheat, Basmati Rice, Mustard)
   - Add new crop listings with variety, quantity, expected rate, storage location, and AGMARK grade
   - Profile verification with masked Aadhaar (`XXXX-XXXX-8492`), UP Bhulekh land verification, and Kisan Credit Card (KCC) limit
   - Incoming buyer orders and enquiries

2. **📈 Live Mandi Daily Rates (Agmarknet):**
   - Live modal, min, and max rates across UP APMC mandis (Rampur, Moradabad, Bareilly, Sambhal, Aligarh)
   - Real-time comparison with Central Government Minimum Support Price (MSP)
   - Search by crop or mandi district with trend indicators

3. **🛒 Buyer Direct Marketplace:**
   - Direct procurement for food processors, wholesalers, and millers
   - Category filtering (Pulses, Cereals, Oilseeds) and quality tier classification (PREMIUM / STANDARD)
   - Interactive quantity slider with instant total calculation
   - Mandi Escrow secured checkout and order tracking

4. **🤖 Gemini AI Crop Quality Diagnostic:**
   - Optical crop scan for grain size uniformity, moisture percentage, and foreign matter
   - Automated AGMARK quality tier grading (A+, A, Premium, Standard)
   - Data-backed pricing advisory notes

5. **📦 Processing & QR Traceability:**
   - Track batches through cleaning, grading, dal milling, and optical sorting
   - Input vs. output processing recovery yield % calculations
   - Farm-to-fork batch QR traceability verification

6. **🌐 Bilingual Experience:**
   - Full support for Hindi (हिन्दी) and English

---

## 📁 Project Structure

```
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/example/kisansaathi/
│       │   ├── KisanSaathiApplication.kt
│       │   ├── MainActivity.kt
│       │   ├── KisanSaathiApp.kt
│       │   ├── theme/
│       │   │   ├── Color.kt
│       │   │   ├── Theme.kt
│       │   │   └── Type.kt
│       │   ├── data/
│       │   │   ├── model/Models.kt
│       │   │   ├── local/
│       │   │   │   ├── Entities.kt
│       │   │   │   ├── Daos.kt
│       │   │   │   └── KisanDatabase.kt
│       │   │   └── repository/KisanRepository.kt
│       │   └── ui/
│       │       ├── navigation/NavRoutes.kt
│       │       ├── viewmodel/KisanViewModel.kt
│       │       └── screens/
│       │           ├── HomeScreen.kt
│       │           ├── FarmerDashboardScreen.kt
│       │           ├── MandiPricesScreen.kt
│       │           ├── BuyerMarketplaceScreen.kt
│       │           ├── AiCropAdvisoryScreen.kt
│       │           ├── ProcessingTraceabilityScreen.kt
│       │           └── ProfileScreen.kt
│       └── res/
│           ├── values/
│           │   ├── strings.xml
│           │   ├── colors.xml
│           │   └── themes.xml
│           ├── drawable/
│           └── mipmap-anydpi-v26/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/libs.versions.toml
└── metadata.json
```

---

## 🛠️ Building & Running

In Android Studio:
1. Open the project root directory.
2. Allow Gradle sync to complete.
3. Select `app` run configuration and click **Run** (or `gradle assembleDebug`).
