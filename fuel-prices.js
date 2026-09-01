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
  exchangeRate: 91,
  updatedAt: "2026-09-01T03:49:24+00:00",
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
    },
        {
      date: "2026-07-22",
      prices: {
        "100": 206,
        "95": 189,
        diesel: 205,
        "diesel-shell": 212,
        lpg: 66,
        ev: 38
      }
    },
                                {
      date: "2026-07-24",
      prices: {
        "100": 206,
        "95": 189,
        diesel: 205,
        "diesel-shell": 218,
        lpg: 66,
        ev: 38
      }
    },
        {
      date: "2026-08-01",
      prices: {
        "100": 211,
        "95": 199,
        diesel: 211,
        "diesel-shell": 224,
        lpg: 69,
        ev: 38
      }
    },
    {
      date: "2026-08-02",
      prices: {
        "100": 214,
        "95": 199,
        diesel: 211,
        "diesel-shell": 224,
        lpg: 69,
        ev: 38
      }
    },
    {
      date: "2026-08-05",
      prices: {
        "100": 214,
        "95": 189,
        diesel: 199,
        "diesel-shell": 224,
        lpg: 69,
        ev: 38
      }
    },
                        {
      date: "2026-08-13",
      prices: {
        "100": 214,
        "95": 198,
        diesel: 215,
        "diesel-shell": 224,
        lpg: 69,
        ev: 38
      }
    },
    {
      date: "2026-08-22",
      prices: {
        "100": 215,
        "95": 205,
        diesel: 219,
        "diesel-shell": 229,
        lpg: 69,
        ev: 38
      }
    },
    {
      date: "2026-09-01",
      prices: {
        "100": 215,
        "95": 205,
        diesel: 219,
        "diesel-shell": 229,
        lpg: 69,
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
      yesterdayPrice: 215,
      name: {
        sq: "Benzinë",
        en: "Gasoline"
      },
      description: {
        sq: "Opsion premium për performancë më të lartë.",
        en: "Premium option for stronger performance."
      },
      price: 215
    },
    {
      id: "95",
      octane: "95",
      icon: "fa-car-side",
      accent: "amber",
      theme: "green",
      yesterdayPrice: 205,
      name: {
        sq: "Benzinë",
        en: "Gasoline"
      },
      description: {
        sq: "Zgjedhja praktike për përdorim të përditshëm.",
        en: "Practical choice for everyday use."
      },
      price: 205
    },
    {
      id: "diesel",
      octane: "10 PPM",
      icon: "fa-gas-pump",
      accent: "amber",
      theme: "navy",
      yesterdayPrice: 219,
      name: {
        sq: "Naftë",
        en: "Diesel"
      },
      description: {
        sq: "Ideale për automjete, furgonë dhe flota.",
        en: "Ideal for vehicles, vans, and fleets."
      },
      price: 219
    },
    {
      id: "diesel-shell",
      octane: "DIESEL",
      icon: "fa-truck-front",
      accent: "red",
      theme: "yellow",
      yesterdayPrice: 229,
      name: {
        sq: "EXTRA DIEZEL SHELL",
        en: "EXTRA DIESEL SHELL"
      },
      description: {
        sq: "Për flota dhe udhëtime të gjata.",
        en: "For fleets and long-distance trips."
      },
      price: 229
    },
    {
      id: "lpg",
      octane: "LPG",
      icon: "fa-fire-flame-simple",
      accent: "red",
      theme: "sky",
      yesterdayPrice: 69,
      name: {
        sq: "Auto Gas",
        en: "Auto Gas"
      },
      description: {
        sq: "Alternativë ekonomike për përdorim të rregullt.",
        en: "Economic alternative for regular use."
      },
      price: 69
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
        sq: "Karikim për automjete elektrike me çmim për kilovat.",
        en: "Charging for electric vehicles priced per kilowatt."
      },
      price: 38
    }
  ]
};












