# Weather App (But Actually Cool) 🌦️

A modern weather dashboard built with React + TypeScript featuring geolocation support, animated weather backgrounds, 7-day forecast charts, saved cities, and severe weather alerts.

This project is designed as both a practical daily-use app and a portfolio-ready example of clean UI, scalable architecture, and modern frontend state management.

---

## ✨ Features

- 📍 **Geolocation Forecast**
  - Uses browser geolocation to load local weather
  - Falls back to a default city when location is unavailable

- 🎨 **Weather Scene Backgrounds**
  - Dynamic background system based on current conditions
  - Designed to support animated effects (cloud drift, rain particles, snow, night sky, etc.)

- 📈 **7-Day Forecast Charts**
  - High/Low temperature trend chart
  - Expandable support for precipitation and wind charts

- ⭐ **Saved Cities**
  - Save frequently checked locations
  - Stored locally using LocalStorage (offline-friendly)

- ⚠️ **Severe Weather Alerts**
  - Alert banner system ready for real API integration
  - Designed for expandable detail panels and severity indicators

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
- **Framer Motion**

---

## 📂 Project Structure

```txt
src/
  api/ # API clients + schemas + provider adapters
  components/ # Reusable UI components
  features/ # Route-based feature modules
  hooks/ # Custom hooks (geolocation, localStorage, etc.)
  store/ # LocalStorage-based stores
  utils/ # Helper functions (formatting, condition mapping, etc.)

  App.tsx
  main.tsx
  index.css
```
