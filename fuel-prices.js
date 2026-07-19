// =========================================================
// MICKA OIL FUEL PRICE DATA
// ---------------------------------------------------------
// Defines the live homepage fuel price board used by app.js.
// Update manually or through update-prices.ps1.
// =========================================================

// 01. HOMEPAGE PRICE BOARD CONFIGURATION
window.MICKA_HOME_FUEL_PRICE_BOARD = {
  station: {
    sq: "Tiranë",
    en: "Tirana"
  },
  exchangeRate: 93,
  updatedAt: "2026-07-15T16:43:36+00:00",
  history: [
    {
      date: "2026-06-01",
      prices: {
        "100": 209,
        "95": 172,
        diesel: 192,
        "diesel-shell": 208,
        lpg: 65,
        ev: 38
      }
    },
    {
      date: "2026-06-07",
      prices: {
        "100": 209,
        "95": 172,
        diesel: 190,
        "diesel-shell": 208,
        lpg: 65,
        ev: 38
      }
    },
    {
      date: "2026-07-15",
      prices: {
        "100": 205,
        "95": 189,
        diesel: 196,
        "diesel-shell": 208,
        lpg: 66,
        ev: 38
      }
    }
  ],
  products: [
    {
      id: "100",
      octane: "100",
      icon: "fa-gauge-high",
      accent: "red",
      theme: "red",
      yesterdayPrice: 209,
      name: {
        sq: "Benzinë",
        en: "Gasoline"
      },
      description: {
        sq: "Performancë premium dhe fuqi.",
        en: "Premium performance and power."
      },
      price: 205
    },
    {
      id: "95",
      octane: "95",
      icon: "fa-car-side",
      accent: "amber",
      theme: "green",
      yesterdayPrice: 172,
      name: {
        sq: "Benzinë",
        en: "Gasoline"
      },
      description: {
        sq: "Zgjedhje praktike për çdo ditë.",
        en: "A practical choice for every day."
      },
      price: 189
    },
    {
      id: "diesel",
      octane: "10 PPM",
      icon: "fa-gas-pump",
      accent: "amber",
      theme: "navy",
      yesterdayPrice: 190,
      name: {
        sq: "Naftë",
        en: "Diesel"
      },
      description: {
        sq: "Ideale për automjete dhe flota.",
        en: "Ideal for vehicles and fleets."
      },
      price: 196
    },
    {
      id: "diesel-shell",
      octane: "DIESEL",
      icon: "fa-truck-front",
      accent: "red",
      theme: "yellow",
      yesterdayPrice: 208,
      name: {
        sq: "EXTRA DIEZEL SHELL",
        en: "EXTRA DIESEL SHELL"
      },
      description: {
        sq: "Për flota dhe udhëtime të gjata.",
        en: "For fleets and long journeys."
      },
      price: 208
    },
    {
      id: "lpg",
      octane: "LPG",
      icon: "fa-fire-flame-simple",
      accent: "red",
      theme: "sky",
      yesterdayPrice: 65,
      name: {
        sq: "Auto Gas",
        en: "Auto Gas"
      },
      description: {
        sq: "Alternativë ekonomike dhe praktike.",
        en: "An economical, practical alternative."
      },
      price: 66
    },
    {
      id: "ev",
      octane: "EV",
      icon: "fa-charging-station",
      accent: "red",
      theme: "electric",
      yesterdayPrice: 38,
      name: {
        sq: "Karikim Elektrik",
        en: "EV Charging"
      },
      description: {
        sq: "Karikim i pastër me çmim për kW.",
        en: "Clean charging with pricing per kW."
      },
      price: 38
    }
  ]
};












