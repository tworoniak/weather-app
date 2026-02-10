# Weather App (But Actually Cool) 🌦️

A modern weather dashboard built with **React + TypeScript** featuring geolocation support, **animated weather scene backgrounds**, **daily + hourly forecast charts**, saved cities, and an alert system ready for real severe weather integration.

This project is designed as both a practical daily-use app and a portfolio-ready example of clean UI, scalable architecture, and modern frontend patterns.

---

## ✨ Features

### 📍 Geolocation Forecast

- Uses browser geolocation to load your local forecast
- Falls back to a default city when location is unavailable
- Reverse geocoding support to display a real city name instead of coordinates

### 🎨 Animated Weather Scene Backgrounds

- Full-page animated background system based on current conditions
- Scene mapping based on **condition + isDay**
- Includes presets such as:
  - Clear Day / Clear Night
  - Cloudy
  - Rain
  - Snow
  - Fog
  - Thunder (with lightning flash effect)

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
- Includes route-based city pages (`/city/:id`)
- Cross-tab and same-tab updates supported

### ⚠️ Alerts System (Ready for NWS Integration)

- Alert banner UI component already in place
- Designed for real severe weather integration (ex: NWS API)
- Supports expandable detail view patterns

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

Optional (planned / expandable):

- **Framer Motion** (for advanced scene crossfades)
- **NWS API** integration (severe weather alerts)

---

## 🌍 Data Providers

### Open-Meteo (Forecast API)

Weather data is powered by Open-Meteo:

- Daily forecast (7-day)
- Hourly forecast (next 48 hours)
- Current conditions

Example API request:

```txt
https://api.open-meteo.com/v1/forecast?latitude=39.0997&longitude=-94.5786&current=temperature_2m,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset&timezone=auto&forecast_days=7
```

---

## 📂 Project Structure

```txt
src/
  api/ # API clients, schemas, and provider adapters
    client.ts
    geocode.ts
    schemas.ts
    weather.ts

  assets/ # Static assets bundled by Vite
    react.svg

  components/ # Reusable UI components
    AlertsBanner.tsx
    CitySearch.tsx
    ForecastCharts.tsx
    WeatherScene.tsx

  features/ # Route-based feature modules (pages)
    city/
      CityPage.tsx
    dashboard/
      DashboardPage.tsx
    saved/
      SavedCitiesPage.tsx

  hooks/ # Custom hooks (geolocation, saved cities, etc.)
    useGeolocation.ts
    useLocalStorage.ts
    useSavedCities.ts

  store/ # LocalStorage-based stores
    savedCities.ts

  utils/ # Helper utilities
    conditionToScene.ts

  App.tsx # App layout + routes
  main.tsx # React bootstrap + Query Client provider
  index.css # Global styles (Tailwind)

```
