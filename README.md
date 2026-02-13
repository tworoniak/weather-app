# Weather App (But Actually Cool) 🌦️

A modern weather dashboard built with **React + TypeScript** featuring geolocation support, **animated weather scene backgrounds**, **daily + hourly forecast charts**, saved cities, **recent searches**, and **live severe weather alerts via the National Weather Service (NWS)**.

Designed as both a practical daily-use app and a portfolio-ready example of clean UI, scalable architecture, and modern frontend patterns.

---

## ✨ Features

### 📍 Location System (Global Active Location)

The app uses a single **active location** state shared across the Dashboard + Alerts pages:

- **Geo** — browser geolocation (GPS-based)
- **Saved City** — from your saved list
- **Recent Search** — quick access without saving
- **Fallback** — Kansas City when location is unavailable

Includes **reverse geocoding** so geo mode can display a real city name instead of coordinates.

### 🎨 Animated Weather Scene Backgrounds

- Full-page background scene system based on current conditions
- Scene mapping based on **condition + isDay**
- Includes presets such as:
  - Clear Day / Clear Night
  - Cloudy
  - Rain
  - Snow
  - Fog
  - Thunder (lightning flash effect)

### 📈 Forecast Charts (Daily + Hourly)

- **7-day High/Low temperature trend chart**
- Hourly toggle system:
  - Temperature
  - Precipitation probability
  - Wind speed

Built with **Recharts**, designed to be expandable for more data types later.

### ⭐ Saved Cities

- Search and save frequently checked locations
- Stored locally via **LocalStorage**
- City routes (`/city/:id`)
- Cross-tab and same-tab updates supported
- **Location picker drawer** shows cached previews and tiny high/low sparklines when available

### 🕘 Recent Searches

- Recent searched cities are stored locally (no save required)
- Quick-select from the location drawer
- Clearable list (LocalStorage)

### ⚠️ Severe Weather Alerts (Live via NWS)

- Dedicated Alerts page (`/alerts`)
- Live alerts from the **National Weather Service** endpoint:
  - Severity (Extreme/Severe/Moderate/Minor/Unknown)
  - Urgency + certainty
  - Effective/expires timestamps
  - Description + instructions
- Filtering + search:
  - Text search
  - Severity chips
  - Hide expired toggle

---

## 🛠️ Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **TailwindCSS**
- **TanStack Query (React Query)**
- **Axios**
- **Zod**
- **Recharts**
- **Lucide Icons**

---

## 🌍 Data Providers

### Open-Meteo (Forecast API)

Weather data is powered by Open-Meteo:

- Current conditions
- Daily forecast (7-day)
- Hourly forecast (next 48 hours)

Example API request:

````txt
https://api.open-meteo.com/v1/forecast?latitude=39.0997&longitude=-94.5786&current=temperature_2m,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset&timezone=auto&forecast_days=7

---

## 📂 Project Structure

```txt
src/
  api/ # API clients, schemas, and provider adapters
    client.ts
    geocode.ts
    nws.ts
    schemas.ts
    weather.ts

  components/ # Reusable UI components
    AlertsBanner.tsx
    AlertsIndicator.tsx
    CitySearch.tsx
    ForecastCharts.tsx
    LocationPickerDrawer.tsx
    WeatherScene.tsx

  features/ # Route-based feature modules (pages)
    alerts/
      AlertsPage.tsx
    city/
      CityPage.tsx
    dashboard/
      DashboardPage.tsx
    saved/
      SavedCitiesPage.tsx

  hooks/ # Custom hooks (geolocation, saved cities, active location, etc.)
    useActiveLocation.ts
    useGeolocation.ts
    useLocalStorage.ts
    useRecentSearches.ts
    useSavedCities.ts
    useWeatherCachePreview.ts

  store/ # LocalStorage-based stores
    recentSearches.ts
    savedCities.ts

  utils/ # Helper utilities
    conditionToScene.ts

  App.tsx # App layout + routes
  main.tsx # React bootstrap + Query Client provider
  index.css # Global styles (Tailwind)


````
