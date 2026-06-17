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
  exchangeRate: 94,
  updatedAt: "2026-06-17T19:20:27+00:00",
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
        sq: "Opsion premium për performancë më të lartë.",
        en: "Premium option for stronger performance."
      },
      price: 209
    },
    {
      id: "95",
      octane: "95",
      icon: "fa-car-side",
      accent: "amber",
      theme: "green",
      yesterdayPrice: 166,
      name: {
        sq: "Benzinë",
        en: "Gasoline"
      },
      description: {
        sq: "Zgjedhja praktike për përdorim të përditshëm.",
        en: "Practical choice for everyday use."
      },
      price: 166
    },
    {
      id: "diesel",
      octane: "10 PPM",
      icon: "fa-gas-pump",
      accent: "amber",
      theme: "navy",
      yesterdayPrice: 176,
      name: {
        sq: "Naftë",
        en: "Diesel"
      },
      description: {
        sq: "Ideale për automjete, furgonë dhe flota.",
        en: "Ideal for vehicles, vans, and fleets."
      },
      price: 176
    },
    {
      id: "diesel-shell",
      octane: "DIESEL",
      icon: "fa-truck-front",
      accent: "red",
      theme: "yellow",
      yesterdayPrice: 198,
      name: {
        sq: "EXTRA DIEZEL SHELL",
        en: "EXTRA DIESEL SHELL"
      },
      description: {
        sq: "Për flota dhe udhëtime të gjata.",
        en: "For fleets and long-distance trips."
      },
      price: 198
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
        sq: "Alternativë ekonomike për përdorim të rregullt.",
        en: "Economic alternative for regular use."
      },
      price: 65
    }
  ]
};











