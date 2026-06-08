# 🌿 GardenMind

> Your AI-powered plant care companion — identify plants, diagnose problems, and grow smarter with a personalised garden calendar.

![GardenMind Banner](https://img.shields.io/badge/GardenMind-AI%20Plant%20Care-4a7c59?style=for-the-badge&logo=leaf)
![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20AI-orange?style=flat-square)
![React](https://img.shields.io/badge/React-Frontend-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

-----

## 🌱 What is GardenMind?

GardenMind is an AI-powered gardening assistant that helps you identify plants, diagnose pests and diseases from photos, and build a personalised planting calendar based on your local frost dates and climate. Whether you’re a first-time grower or an experienced gardener, GardenMind gives you expert-level guidance tailored to your garden.

-----

## ✨ Features

### 📸 Photo Identification

Upload a photo of any plant and GardenMind will instantly identify:

- Plant species and common name
- Active pests or infestations
- Visible diseases or deficiencies
- An overall health score (1–10)

### 🌡️ Environment-Aware Care Recommendations

GardenMind uses your location and live weather data to give care advice that actually matches your conditions — not generic tips:

- Watering schedules adjusted for humidity and rainfall
- Sun/shade guidance based on current daylight hours
- Frost risk alerts and temperature warnings
- Seasonal care tasks triggered automatically

### 📅 Personalised Planting Calendar

Enter your location and GardenMind calculates your frost dates to generate a month-by-month planting schedule:

- When to sow seeds indoors
- When to transplant outdoors
- Harvest windows
- Colour-coded task lanes for easy scanning

### 🌸 Companion Planting & Garden Design

Get intelligent recommendations for what to grow together:

- Pest-repelling plant pairings
- Productivity-boosting combinations
- Aesthetic layouts based on colour, height, and texture
- Visual garden layout suggestions

### 🔔 Seasonal Alerts

Never miss a critical care window:

- Browser push notifications for upcoming tasks
- Frost warnings based on your local forecast
- Automated reminders (e.g. “Start tomato seeds indoors — 6 weeks to last frost”)
- Optional weekly email digest

-----

## 🛠️ Tech Stack

|Layer        |Technology                                  |
|-------------|--------------------------------------------|
|Frontend     |React + Tailwind CSS                        |
|AI Engine    |Anthropic Claude API (Vision + Text)        |
|Weather      |Open-Meteo API (free, no key needed)        |
|Frost Dates  |NOAA dataset / ZIP lookup                   |
|Database     |Supabase (optional, for persistent profiles)|
|Email Alerts |Resend                                      |
|Notifications|Browser Push Notifications API              |

-----

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- An [Anthropic API key](https://console.anthropic.com)
- Optional: [Supabase](https://supabase.com) project (for saving garden profiles)
- Optional: [Resend](https://resend.com) API key (for email alerts)

### Installation

```bash
# Clone the repository
git clone https://github.com/ananyaraghav07-cmyk/GardenMind.git
cd GardenMind

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional — for persistent garden profiles
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional — for email alerts
RESEND_API_KEY=your_resend_api_key
```

> ⚠️ **Never commit your `.env.local` file.** API keys should always stay server-side.

### Run the App

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

-----

## 📁 Project Structure

```
GardenMind/
├── components/
│   ├── PhotoUpload/        # Plant identification via Claude Vision
│   ├── CareRecommendations/ # Weather-aware care tips
│   ├── PlantingCalendar/   # Frost date calendar UI
│   ├── CompanionPlanting/  # Pairing engine + garden layout
│   └── AlertsPanel/        # Seasonal notifications
├── pages/
│   ├── api/
│   │   ├── identify.js     # Claude Vision API route
│   │   ├── weather.js      # Open-Meteo proxy
│   │   └── calendar.js     # Frost date + calendar generation
│   └── index.js
├── lib/
│   ├── claude.js           # Anthropic API client
│   ├── weather.js          # Weather utilities
│   └── frostDates.js       # Frost date lookup logic
├── public/
└── styles/
```

-----

## 🤖 How the AI Works

GardenMind uses Claude’s vision and language capabilities through carefully crafted prompts:

**Plant Identification:**

```
Analyze this garden photo. Return JSON:
{ species, commonName, confidence, pestsFound[], diseasesFound[], healthScore }
```

**Care Recommendations:**

```
The plant is [species]. Current conditions: [temp]°C, [humidity]%,
[season], timezone [tz]. Give 5 specific care actions for this week.
```

**Planting Calendar:**

```
My last frost date is [date] and first fall frost is [date].
I want to grow [plants]. Create a monthly sow/transplant/harvest calendar.
```

**Companion Planting:**

```
I'm growing [plants]. Recommend companions for pest control,
productivity, and aesthetics — include a height/colour layout.
```

-----

## 🗺️ Roadmap

- [x] Plant identification from photos
- [x] Weather-aware care recommendations
- [x] Personalised planting calendar
- [x] Companion planting engine
- [x] Seasonal alerts
- [ ] Plant journal / health history log
- [ ] Share your garden with friends
- [ ] Offline mode with cached recommendations
- [ ] Mobile app (React Native)
- [ ] Community plant library

-----

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you’d like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "Add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

-----

## 📄 License

This project is licensed under the MIT License — see the <LICENSE> file for details.

-----

## 🙏 Acknowledgements

- [Anthropic](https://anthropic.com) for the Claude API
- [Open-Meteo](https://open-meteo.com) for free weather data
- [NOAA](https://www.noaa.gov) for frost date datasets

-----

<p align="center">Made with 🌱 by <a href="https://github.com/ananyaraghav07-cmyk">ananyaraghav07</a></p>
