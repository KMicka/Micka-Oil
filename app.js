// =========================================================
// MICKA OIL WEBSITE SCRIPTS
// ---------------------------------------------------------
// 01. Preloader
// 02. Mobile menu
// 03. Language switch hooks
// 04. Homepage slider
// 05. Legacy gallery coverflow hooks
// 06. Location data, maps, and location cards
// 07. Home fuel price board and calculator
// 08. Shared page helpers: footer year, fade-in, counters
// 09. Floating actions and loyalty card details
// =========================================================

// =========================================================
// 01. PRELOADER
// =========================================================
window.addEventListener("DOMContentLoaded", () => {
  const preloader = document.getElementById("preloader");
  const video = document.getElementById("preloadVideo");
  const heroVideo = document.getElementById("heroVideo");
  const isHomePage = document.body.classList.contains("home-page");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasSeenPreloader = sessionStorage.getItem("mickaPreloaderSeen") === "1";
  const saveDataEnabled = navigator.connection && navigator.connection.saveData;

  const startHeroVideo = () => {
    if (!heroVideo) return;
    heroVideo.currentTime = 0;
    heroVideo.play().catch(() => {});
  };

  if (!preloader) {
    startHeroVideo();
    return;
  }
  if (!isHomePage || hasSeenPreloader || prefersReducedMotion || saveDataEnabled || document.visibilityState === "hidden") {
    preloader.remove();
    startHeroVideo();
    return;
  }

  let isHidden = false;
  const hidePreloader = () => {
    if (isHidden) return;
    isHidden = true;
    sessionStorage.setItem("mickaPreloaderSeen", "1");
    preloader.classList.add("hidden");
    startHeroVideo();

    setTimeout(() => {
      preloader.remove();
    }, 450);
  };

  const safetyTimer = setTimeout(hidePreloader, 2200);

  if (!video) {
    hidePreloader();
    return;
  }

  video.preload = "metadata";
  video.play().catch((err) => {
    console.warn("Preloader video failed to play:", err);
  });

  video.addEventListener("ended", () => {
    clearTimeout(safetyTimer);
    hidePreloader();
  }, { once: true });

  video.addEventListener("error", () => {
    clearTimeout(safetyTimer);
    hidePreloader();
  }, { once: true });

  video.addEventListener("stalled", () => {
    clearTimeout(safetyTimer);
    hidePreloader();
  }, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      clearTimeout(safetyTimer);
      hidePreloader();
    }
  });
});

// Full-screen cinematic video hero controls.
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("videoHero");
  const video = document.getElementById("heroVideo");
  const playButton = document.getElementById("heroPlayButton");
  const muteButton = document.getElementById("heroMuteButton");
  const fullscreenButton = document.getElementById("heroFullscreenButton");
  const progress = document.getElementById("heroProgress");
  if (!hero || !video) return;

  playButton?.addEventListener("click", async () => {
    if (video.paused) await video.play(); else video.pause();
    const paused = video.paused;
    playButton.innerHTML = `<i class="fa-solid fa-${paused ? "play" : "pause"}"></i>`;
    playButton.setAttribute("aria-label", paused ? "Luaj videon" : "Ndalo videon");
  });

  muteButton?.addEventListener("click", () => {
    video.muted = !video.muted;
    muteButton.innerHTML = `<i class="fa-solid fa-volume-${video.muted ? "xmark" : "high"}"></i>`;
    muteButton.setAttribute("aria-label", video.muted ? "Aktivizo zërin" : "Çaktivizo zërin");
  });

  fullscreenButton?.addEventListener("click", async () => {
    if (!document.fullscreenElement) await hero.requestFullscreen?.(); else await document.exitFullscreen?.();
  });

  video.addEventListener("timeupdate", () => {
    if (progress && video.duration) progress.style.width = `${(video.currentTime / video.duration) * 100}%`;
  });
});

// =========================================================
// 02. MOBILE MENU
// =========================================================
const menu = document.querySelector("#mobile-menu");
const menuLinks = document.querySelector(".navbar__menu");

function closeMenu() {
  if (!menu || !menuLinks) return;
  menu.classList.remove("is-active");
  menuLinks.classList.remove("active");
  menu.setAttribute("aria-expanded", "false");
}

if (menu && menuLinks) {
  menu.addEventListener("click", () => {
    const willOpen = !menuLinks.classList.contains("active");
    menu.classList.toggle("is-active");
    menuLinks.classList.toggle("active");
    menu.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  // Close menu after clicking a link (mobile)
  menuLinks.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    closeMenu();
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Close if resized to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

const normalizeNavbarPage = (pathname) => {
  const page = pathname.replace(/\/$/, "").split("/").pop() || "index";
  return decodeURIComponent(page).replace(/\.html$/i, "").toLowerCase();
};

document.querySelectorAll(".navbar__link").forEach((link) => {
  const currentPage = normalizeNavbarPage(window.location.pathname);
  const linkPage = normalizeNavbarPage(new URL(link.href, window.location.href).pathname);
  const isCurrentPage = currentPage === linkPage;
  link.classList.toggle("active", isCurrentPage);
  if (isCurrentPage) {
    link.setAttribute("aria-current", "page");
  } else {
    link.removeAttribute("aria-current");
  }
});

// =========================================================
// 03. LANGUAGE SWITCH HOOKS
// =========================================================
const toggle = document.getElementById("langToggle");
if (toggle) {
  toggle.addEventListener("change", () => {
    renderHomeFuelPrices();

    // Re-render location cards if on location page
    const cardsGrid = document.getElementById("cardsGrid");
    if (cardsGrid && window.currentMap && window.currentInfoWindow) {
      generateLocationCards(window.currentMap, window.currentInfoWindow);
    }
  });
}

// =========================================================
// 04. HOMEPAGE SLIDER
// =========================================================
let items = document.querySelectorAll(".list .item");
let thumbs = document.querySelectorAll(".thumbnail .item");
let next = document.getElementById("next");
let prev = document.getElementById("prev");
let active = 0;
let autoplay;

function changeSlide(index) {
  if (!items.length || !thumbs.length) return;
  const nextIndex = (index + items.length) % items.length;
  const direction = nextIndex > active || (active === items.length - 1 && nextIndex === 0) ? "next" : "prev";

  items.forEach((item, i) => {
    item.classList.remove("active", "is-entering-next", "is-entering-prev", "is-leaving-next", "is-leaving-prev");
    if (i === active && i !== nextIndex) {
      item.classList.add(direction === "next" ? "is-leaving-next" : "is-leaving-prev");
    }
    if (thumbs[i]) thumbs[i].classList.remove("active");
  });

  items[nextIndex].classList.add("active", direction === "next" ? "is-entering-next" : "is-entering-prev");
  if (thumbs[nextIndex]) thumbs[nextIndex].classList.add("active");
  active = nextIndex;

  window.setTimeout(() => {
    items.forEach((item) => {
      item.classList.remove("is-entering-next", "is-entering-prev", "is-leaving-next", "is-leaving-prev");
    });
  }, 850);
}

function startAutoplay() {
  if (!next || !items.length) return;
  stopAutoplay();
  autoplay = setInterval(() => next.click(), 7000);
}

function stopAutoplay() {
  clearInterval(autoplay);
}

if (next && prev && items.length && thumbs.length) {
  next.onclick = () => {
    active = (active + 1) % items.length;
    changeSlide(active);
  };

  prev.onclick = () => {
    active = (active - 1 + items.length) % items.length;
    changeSlide(active);
  };

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener("click", () => changeSlide(i));
  });

  startAutoplay();

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stopAutoplay() : startAutoplay();
  });
}

// =========================================================
// 05A. LOCATION DATA WITH TRANSLATIONS
// =========================================================
const locationsData = {
  sq: {
    hours_247: "E Hënë - E Diel: 24 orë",
    hours_7_22: "E Hënë - E Diel: 07:00 - 22:00",
    hours_6_23: "E Hënë - E Diel: 06:00 - 23:00",
    service_premium: "Benzinë Premium",
    service_diesel: "Naftë",
    service_lpg: "LPG",
    service_market: "Market",
    service_local: "Lokal",
    service_auto: "Shërbim Auto",
    service_diesel_extra: "Diezel",
    map_address: "Adresa",
    map_phone: "Tel",
    map_hours: "Orari",
    map_services: "Shërbime",
    map_directions: "Merr Udhëzime →"
  },
  en: {
    hours_247: "Mon - Sun: 24 hours",
    hours_7_22: "Mon - Sun: 07:00 - 22:00",
    hours_6_23: "Mon - Sun: 06:00 - 23:00",
    service_premium: "Premium Gasoline",
    service_diesel: "Diesel",
    service_lpg: "LPG",
    service_market: "Market",
    service_local: "Cafe",
    service_auto: "Auto Service",
    service_diesel_extra: "Diesel",
    map_address: "Address",
    map_phone: "Phone",
    map_hours: "Hours",
    map_services: "Services",
    map_directions: "Get Directions →"
  }
};

const locations = [
  {
    id: 1,
    title: "Micka Oil - Tiranë",
    city: "Tiranë",
    area: "Micka Oil, Tiranë",
    pos: { lat: 41.319179, lng: 19.7820566 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil/@41.319179,19.7794763,17z/data=!3m1!4b1!4m6!3m5!1s0x135031390f8194fd:0xb1fad2bf35258243!8m2!3d41.319179!4d19.7820566!16s%2Fg%2F11rc2l7h3j",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_lpg", "service_market", "service_local"]
  },
  {
    id: 2,
    title: "Micka Oil - Kavajë",
    city: "Kavajë",
    area: "Micka Oil, Kavajë",
    pos: { lat: 41.2034413, lng: 19.5358109 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil,+Kavaj%C3%AB/@41.2034413,19.5332306,17z/data=!3m1!4b1!4m6!3m5!1s0x134fdf80f1ba7d65:0x274563fd7005fb95!8m2!3d41.2034413!4d19.5358109!16s%2Fg%2F11nx1z2595",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_lpg", "service_local", "service_auto"]
  },
  {
    id: 3,
    title: "Micka Oil - Memaliaj",
    city: "Memaliaj",
    area: "Micka Oil Memaliaj",
    pos: { lat: 40.3530125, lng: 19.9697344 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil+Memaliaj/@40.3530125,19.9671541,17z/data=!3m1!4b1!4m6!3m5!1s0x135ae997460e9fad:0x16cb7ff0744885dc!8m2!3d40.3530125!4d19.9697344!16s%2Fg%2F11nnw52_ht",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_lpg"]
  },
  {
    id: 4,
    title: "Micka Oil - Patos",
    city: "Patos",
    area: "Micka Oil - Patos",
    pos: { lat: 40.6847698, lng: 19.6162763 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil+-+Patos/@40.6847698,19.613696,17z/data=!3m1!4b1!4m6!3m5!1s0x135ab30040f02841:0x58114a9b13635cec!8m2!3d40.6847698!4d19.6162763!16s%2Fg%2F11z7slcqw8",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_diesel_extra", "service_lpg"]
  },
  {
    id: 5,
    title: "Micka Oil - Gjirokastër",
    city: "Gjirokastër",
    area: "Micka Oil Gjirokastër",
    pos: { lat: 40.0774102, lng: 20.1508764 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil+Gjirokaster/@40.0774102,20.1482961,17z/data=!3m1!4b1!4m6!3m5!1s0x135b03003d5d7825:0x416faebfbe2a6f3d!8m2!3d40.0774102!4d20.1508764!16s%2Fg%2F11zbsyvxbf",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_lpg", "service_market"]
  },
  {
    id: 6,
    title: "Micka Oil - Prush",
    city: "Prush",
    area: "Micka Oil Prush",
    pos: { lat: 41.3240625, lng: 19.7368125 },
    mapsUrl: "https://www.google.com/maps/place/Micka+Oil+Prush/@41.3240625,19.7342322,17z/data=!3m1!4b1!4m6!3m5!1s0x13502f04ecfaf9f7:0x7407e22232a1fb7f!8m2!3d41.3240625!4d19.7368125!16s%2Fg%2F11nnw4_kvd",
    phone: "+355 69 827 0125",
    hoursKey: "hours_247",
    services: ["service_premium", "service_diesel", "service_lpg"]
  }
];

const futureLocations = [
  {
    id: "future-1",
    city: {
      sq: "Vendndodhje e re",
      en: "New location"
    },
    area: {
      sq: "Në zhvillim",
      en: "In development"
    },
    status: {
      sq: "Së shpejti",
      en: "Coming soon"
    },
    text: {
      sq: "Kjo pikë do të shtohet sapo të konfirmohen koordinatat, shërbimet dhe oraret.",
      en: "This station will be added once coordinates, services, and hours are confirmed."
    }
  },
  {
    id: "future-2",
    city: {
      sq: "Vendndodhje e re",
      en: "New location"
    },
    area: {
      sq: "Në planifikim",
      en: "In planning"
    },
    status: {
      sq: "Së shpejti",
      en: "Coming soon"
    },
    text: {
      sq: "Rezervuar për zgjerimin e ardhshëm të rrjetit Micka Oil.",
      en: "Reserved for the next Micka Oil network expansion."
    }
  }
];

// =========================================================
// 06B. SHARED LANGUAGE HELPER
// =========================================================
function getCurrentLanguage() {
  return localStorage.getItem('language') || 'sq';
}

// Home price board data is primarily loaded from fuel-prices.js.
// Keep this fallback aligned so prices stay consistent if that file fails to load.
const defaultHomeFuelPriceBoard = {
  station: {
    sq: "Tiranë",
    en: "Tirana"
  },
  exchangeRate: 92,
  updatedAt: "2026-08-02T08:08:33+00:00",
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
    }
  ],
  products: [
    {
      id: "100",
      octane: "100",
      icon: "fa-gauge-high",
      accent: "red",
      theme: "red",
      yesterdayPrice: 211,
      name: { sq: "Benzinë", en: "Gasoline" },
      description: {
        sq: "Performancë premium dhe fuqi.",
        en: "Premium performance and power."
      },
      price: 214
    },
    {
      id: "95",
      octane: "95",
      icon: "fa-car-side",
      accent: "amber",
      theme: "green",
      yesterdayPrice: 199,
      name: { sq: "Benzinë", en: "Gasoline" },
      description: {
        sq: "Zgjedhje praktike për çdo ditë.",
        en: "A practical choice for every day."
      },
      price: 199
    },
    {
      id: "diesel",
      octane: "10 PPM",
      icon: "fa-gas-pump",
      accent: "amber",
      theme: "navy",
      yesterdayPrice: 211,
      name: { sq: "Naftë", en: "Diesel" },
      description: {
        sq: "Ideale për automjete dhe flota.",
        en: "Ideal for vehicles and fleets."
      },
      price: 211
    },
    {
      id: "diesel-shell",
      octane: "DIESEL",
      icon: "fa-truck-front",
      accent: "red",
      theme: "yellow",
      yesterdayPrice: 224,
      name: {
        sq: "EXTRA DIEZEL SHELL",
        en: "EXTRA DIESEL SHELL"
      },
      description: {
        sq: "Për flota dhe udhëtime të gjata.",
        en: "For fleets and long journeys."
      },
      price: 224
    },
    {
      id: "lpg",
      octane: "LPG",
      icon: "fa-fire-flame-simple",
      accent: "red",
      theme: "sky",
      yesterdayPrice: 69,
      name: { sq: "Auto Gas", en: "Auto Gas" },
      description: {
        sq: "Alternativë ekonomike dhe praktike.",
        en: "An economical, practical alternative."
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
      name: { sq: "Karikim Elektrik", en: "EV Charging" },
      description: {
        sq: "Karikim i pastër me çmim për kW.",
        en: "Clean charging with pricing per kW."
      },
      price: 38
    }
  ]
};

const homeFuelPriceBoard = window.MICKA_HOME_FUEL_PRICE_BOARD || defaultHomeFuelPriceBoard;

let selectedHomeFuelId = "95";
let selectedHomeFuelLiters = 35;
let selectedPriceHistoryRange = 7;

function getPriceBoardTimestamp(lang) {
  const timestamp = homeFuelPriceBoard.updatedAt ? new Date(homeFuelPriceBoard.updatedAt) : new Date();
  const safeTimestamp = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;

  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(safeTimestamp);
}

function getHomeFuelProduct() {
  return homeFuelPriceBoard.products.find((product) => product.id === selectedHomeFuelId) || homeFuelPriceBoard.products[0];
}

function getHomeFuelDisplayName(product, lang) {
  const label = product.name[lang] || product.name.sq;
  
  if (product.id === "ev") return label;
  if (product.id === "lpg") return label;
  if (product.id === "diesel-shell") return label.replace(" ", "\n");
  return `${label} ${product.octane}`;
}

function formatHomeFuelAmount(value, lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "sq-AL").format(value);
}

function getHomeFuelExchangeRate() {
  const parsedRate = Number(homeFuelPriceBoard.exchangeRate);
  return Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 98.5;
}

function formatHomeFuelEuroAmount(value, lang, minimumFractionDigits = 2, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "sq-AL", {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

function getHomeFuelEuroPrice(price) {
  return price / getHomeFuelExchangeRate();
}

function getHomeFuelExchangeRateLabel(lang) {
  const rate = formatHomeFuelEuroAmount(getHomeFuelExchangeRate(), lang, 1, 2);
  return lang === "en" ? `1 EUR = ${rate} ALL` : `1 EUR = ${rate} Lek`;
}

function getHomeFuelPricePairMarkup(lekValue, euroValue, lang, compact = false, stacked = false) {
  const lekLabel = lang === "en" ? "ALL" : "Lek";
  const euroLabel = "EUR";
  const wrapperClass = `${compact ? "price-pair price-pair--compact" : "price-pair"}${stacked ? " price-pair--stacked" : ""}`;
  const lekText = formatHomeFuelAmount(lekValue, lang);
  const euroText = compact ? formatHomeFuelEuroAmount(euroValue, lang) : formatHomeFuelEuroAmount(euroValue, lang);
  const dividerMarkup = stacked ? "" : '<span class="price-pair__divider" aria-hidden="true"></span>';

  return `
    <span class="${wrapperClass}">
      <span class="price-pair__item">
        <strong>${lekText}</strong>
        <span>${lekLabel}</span>
      </span>
      ${dividerMarkup}
      <span class="price-pair__item">
        <strong>${euroText}</strong>
        <span>${euroLabel}</span>
      </span>
    </span>
  `;
}

function getHomeFuelPriceChange(product) {
  const currentPrice = Number(product.price);
  const history = Array.isArray(homeFuelPriceBoard.history) ? homeFuelPriceBoard.history : [];
  const recordedPrices = history
    .filter((entry) => entry && entry.date && entry.prices)
    .map((entry) => ({
      timestamp: getHomeFuelHistoryTimestamp(entry.date),
      value: Number(entry.prices[product.id])
    }))
    .filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.value))
    .sort((a, b) => a.timestamp - b.timestamp);

  let previousPrice = Number(product.yesterdayPrice ?? currentPrice);
  for (let index = recordedPrices.length - 1; index >= 0; index -= 1) {
    if (recordedPrices[index].value !== currentPrice) {
      previousPrice = recordedPrices[index].value;
      break;
    }
  }

  const delta = currentPrice - previousPrice;
  const unit = product.id === "ev" ? "kW" : "L";

  if (delta > 0) {
    return {
      direction: "up",
      icon: "fa-arrow-up",
      value: `+${delta}/${unit}`
    };
  }

  if (delta < 0) {
    return {
      direction: "down",
      icon: "fa-arrow-down",
      value: `${delta}/${unit}`
    };
  }

  return {
    direction: "flat",
    icon: "fa-minus",
    value: `0/${unit}`
  };
}

function getHomeFuelHistoryTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return Number.NaN;
  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  return new Date(normalized).getTime();
}

function formatHomeFuelHistoryDate(value, lang, includeTime = false) {
  const timestamp = getHomeFuelHistoryTimestamp(value);
  if (!Number.isFinite(timestamp)) return value;
  const options = includeTime
    ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit" };
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "sq-AL", options).format(new Date(timestamp));
}

function syncHomeFuelCalculator(lang) {
  const selectedFuel = getHomeFuelProduct();
  const quantityInput = document.getElementById("priceQtyInput");
  const selectedFuelEl = document.getElementById("priceSelectedFuel");
  const totalEl = document.getElementById("priceEstimatedTotal");
  const perLiterEl = document.getElementById("pricePerLiterNote");
  const exchangeRateEl = document.getElementById("priceExchangeRateValue");
  const quantityLabelEl = document.querySelector('label[for="priceQtyInput"] > span');
  const quantityUnitEl = document.querySelector(".price-qty__unit");
  const total = selectedFuel.price * selectedHomeFuelLiters;
  const euroTotal = total / getHomeFuelExchangeRate();

  if (quantityInput && document.activeElement !== quantityInput) {
    quantityInput.value = `${selectedHomeFuelLiters}`;
  }

  if (selectedFuelEl) {
    selectedFuelEl.textContent = getHomeFuelDisplayName(selectedFuel, lang);
  }

  if (totalEl) {
    totalEl.innerHTML = getHomeFuelPricePairMarkup(total, euroTotal, lang, true, true);
  }

  if (exchangeRateEl) {
    exchangeRateEl.textContent = getHomeFuelExchangeRateLabel(lang);
  }

  if (quantityLabelEl) {
    quantityLabelEl.textContent = selectedFuel.id === "ev"
      ? (lang === "en" ? "Amount (kW)" : "Sasia (kW)")
      : (lang === "en" ? "Amount (Liters)" : "Sasia (Litra)");
  }

  if (quantityUnitEl) {
    quantityUnitEl.textContent = selectedFuel.id === "ev"
      ? "kW"
      : (lang === "en" ? "Liters" : "Litra");
  }

  if (perLiterEl) {
    const unitLabel = selectedFuel.id === "ev"
      ? (lang === "en" ? "kilowatt" : "kilovat")
      : (lang === "en" ? "liter" : "litër");
    perLiterEl.textContent = lang === "en"
      ? `Price per ${unitLabel}: ${selectedFuel.price} ALL`
      : `Çmimi për ${unitLabel}: ${selectedFuel.price} Lek`;
  }
}

function setupHomeFuelCalculatorControls() {
  const quantityInput = document.getElementById("priceQtyInput");
  const minusBtn = document.getElementById("priceQtyMinus");
  const plusBtn = document.getElementById("priceQtyPlus");

  if (quantityInput && !quantityInput.dataset.bound) {
    quantityInput.dataset.bound = "true";

    quantityInput.addEventListener("input", () => {
      if (quantityInput.value.trim() === "") return;
      const nextValue = Number.parseInt(quantityInput.value, 10);
      selectedHomeFuelLiters = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1;
      syncHomeFuelCalculator(getCurrentLanguage());
    });

    quantityInput.addEventListener("change", () => {
      const nextValue = Number.parseInt(quantityInput.value, 10);
      selectedHomeFuelLiters = Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1;
      quantityInput.value = `${selectedHomeFuelLiters}`;
      syncHomeFuelCalculator(getCurrentLanguage());
    });
  }

  if (minusBtn && !minusBtn.dataset.bound) {
    minusBtn.dataset.bound = "true";
    minusBtn.addEventListener("click", () => {
      selectedHomeFuelLiters = Math.max(1, selectedHomeFuelLiters - 1);
      syncHomeFuelCalculator(getCurrentLanguage());
    });
  }

  if (plusBtn && !plusBtn.dataset.bound) {
    plusBtn.dataset.bound = "true";
    plusBtn.addEventListener("click", () => {
      selectedHomeFuelLiters += 1;
      syncHomeFuelCalculator(getCurrentLanguage());
    });
  }
}

function bindHomeFuelPriceCards() {
  document.querySelectorAll(".price-card[data-fuel-id]").forEach((card) => {
    card.addEventListener("click", () => {
      selectedHomeFuelId = card.dataset.fuelId || selectedHomeFuelId;
      renderHomeFuelPrices();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectedHomeFuelId = card.dataset.fuelId || selectedHomeFuelId;
      renderHomeFuelPrices();
    });
  });
}

function getHomeFuelHistoryPoints(rangeDays) {
  const byDate = new Map();
  const history = Array.isArray(homeFuelPriceBoard.history) ? homeFuelPriceBoard.history : [];

  history.forEach((entry) => {
    if (!entry || !entry.date || !entry.prices) return;
    byDate.set(entry.date, entry.prices);
  });

  const currentDate = getPriceBoardTimestamp("en").split("/").reverse().join("-");
  const fallbackDate = homeFuelPriceBoard.updatedAt || currentDate;
  const currentPrices = Object.fromEntries(homeFuelPriceBoard.products.map((product) => [product.id, product.price]));
  const latestRecordedPrices = [...byDate.values()].at(-1);
  const latestMatchesCurrent = latestRecordedPrices
    && homeFuelPriceBoard.products.every((product) => Number(latestRecordedPrices[product.id]) === Number(product.price));
  if (!latestMatchesCurrent) {
    byDate.set(fallbackDate, currentPrices);
  }

  return [...byDate.entries()]
    .map(([date, prices]) => ({ date, prices }))
    .filter((entry) => Number.isFinite(getHomeFuelHistoryTimestamp(entry.date)))
    .sort((a, b) => getHomeFuelHistoryTimestamp(a.date) - getHomeFuelHistoryTimestamp(b.date))
    .slice(-rangeDays);
}

function getHistoryColor(product) {
  const colors = {
    "100": "#ef443a",
    "95": "#69d36a",
    diesel: "#407fe9",
    "diesel-shell": "#f0c33f",
    lpg: "#61d4e4",
    ev: "#b875ff"
  };
  return colors[product.id] || "#ffffff";
}

function renderHomeFuelHistory() {
  const chart = document.getElementById("priceHistoryChart");
  if (!chart) return;

  const lang = getCurrentLanguage();
  const points = getHomeFuelHistoryPoints(selectedPriceHistoryRange);
  const product = getHomeFuelProduct();

  if (points.length < 2) {
    chart.innerHTML = `<p class="price-history__empty">${lang === "en" ? "History will appear after the next price update." : "Historiku do të shfaqet pas përditësimit të radhës."}</p>`;
    return;
  }

  const series = points
    .map((point) => ({ date: point.date, value: Number(point.prices[product.id]) }))
    .filter((point) => Number.isFinite(point.value));

  if (series.length < 2) {
    chart.innerHTML = `<p class="price-history__empty">${lang === "en" ? "More updates are needed for this product." : "Nevojiten më shumë përditësime për këtë produkt."}</p>`;
    return;
  }

  const width = 1040;
  const height = 300;
  const pad = { top: 28, right: 30, bottom: 42, left: 62 };
  const values = series.map((point) => point.value);
  const observedMin = Math.min(...values);
  const observedMax = Math.max(...values);
  const observedRange = Math.max(observedMax - observedMin, 1);
  const chartPadding = Math.max(2, Math.ceil(observedRange * 0.35));
  const minValue = Math.max(0, observedMin - chartPadding);
  const maxValue = observedMax + chartPadding;
  const xFor = (index) => pad.left + (index / Math.max(series.length - 1, 1)) * (width - pad.left - pad.right);
  const yFor = (value) => pad.top + ((maxValue - value) / Math.max(maxValue - minValue, 1)) * (height - pad.top - pad.bottom);
  const yTicks = Array.from({ length: 4 }, (_, index) => Math.round(minValue + ((maxValue - minValue) * index) / 3));
  const color = getHistoryColor(product);
  const coords = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`).join(" ");
  const areaPoints = `${pad.left},${height - pad.bottom} ${coords} ${width - pad.right},${height - pad.bottom}`;
  const dots = series.map((point, index) => `
    <circle cx="${xFor(index).toFixed(1)}" cy="${yFor(point.value).toFixed(1)}" r="5.5" fill="${color}" stroke="#111820" stroke-width="3">
      <title>${getHomeFuelDisplayName(product, lang)}: ${point.value} - ${formatHomeFuelHistoryDate(point.date, lang, point.date.includes("T"))}</title>
    </circle>
  `).join("");

  const tickMarkup = yTicks.map((tick) => `
    <g>
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${yFor(tick).toFixed(1)}" y2="${yFor(tick).toFixed(1)}" />
      <text x="${pad.left - 12}" y="${(yFor(tick) + 4).toFixed(1)}">${tick}</text>
    </g>
  `).join("");

  const labelStep = Math.max(1, Math.ceil(series.length / 6));
  const xLabels = series.map((point, index) => {
    if (index % labelStep !== 0 && index !== series.length - 1) return "";
    const label = formatHomeFuelHistoryDate(point.date, lang, point.date.includes("T"));
    return `<text x="${xFor(index).toFixed(1)}" y="${height - 12}" text-anchor="middle">${label}</text>`;
  }).join("");

  const firstValue = series[0].value;
  const latestValue = series[series.length - 1].value;
  const change = latestValue - firstValue;
  const changeDirection = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const changeLabel = `${change > 0 ? "+" : ""}${change} Lek`;
  const unitLabel = product.id === "ev" ? "LEK / KW" : "LEK / LITËR";
  const selectedName = getHomeFuelDisplayName(product, lang).replace("\n", " ");
  const labels = lang === "en"
    ? { current: "Current", change: "Period change", range: "Low / high" }
    : { current: "Aktualisht", change: "Ndryshimi", range: "Minimum / maksimum" };

  chart.innerHTML = `
    <div class="price-history__overview">
      <div class="price-history__selected" style="--history-color:${color}">
        <i aria-hidden="true"></i>
        <div><span>${selectedName}</span><strong>${latestValue} <small>${unitLabel}</small></strong></div>
      </div>
      <div class="price-history__stats">
        <div><span>${labels.current}</span><strong>${latestValue} Lek</strong></div>
        <div class="price-history__stat--${changeDirection}"><span>${labels.change}</span><strong>${changeLabel}</strong></div>
        <div><span>${labels.range}</span><strong>${observedMin} / ${observedMax}</strong></div>
      </div>
    </div>
    <div class="price-history__canvas">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${lang === "en" ? "Fuel price history chart" : "Grafiku i historikut të çmimeve"}">
        <defs>
          <linearGradient id="priceHistoryFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.34" />
            <stop offset="100%" stop-color="${color}" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <g class="price-history__grid">${tickMarkup}</g>
        <polygon points="${areaPoints}" fill="url(#priceHistoryFill)" />
        <g class="price-history__lines">
          <polyline points="${coords}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          ${dots}
        </g>
        <g class="price-history__dates">${xLabels}</g>
      </svg>
    </div>
  `;
}

function bindHomeFuelHistoryControls() {
  document.querySelectorAll("[data-history-range]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      selectedPriceHistoryRange = Number(button.dataset.historyRange) || 7;
      document.querySelectorAll("[data-history-range]").forEach((tab) => {
        tab.classList.toggle("is-active", tab === button);
      });
      renderHomeFuelHistory();
    });
  });
}

function renderHomeFuelPrices() {
  const priceGrid = document.getElementById("priceGrid");
  if (!priceGrid) return;

  const lang = getCurrentLanguage();
  const stationValue = document.querySelector('[data-lang="home_prices_station_value"]');
  const updatedValue = document.getElementById("priceBoardUpdated");

  priceGrid.innerHTML = homeFuelPriceBoard.products.map((product) => {
    const priceChange = getHomeFuelPriceChange(product);
    const isShellDiesel = product.id === "diesel-shell";
    const isLpg = product.id === "lpg";
    const badgeLabel = product.id === "100" || product.id === "diesel-shell" ? "PREMIUM" : "STANDARD";
    const titleMap = lang === "en"
      ? {
          "100": 'GASOLINE<span class="price-card__variant">100</span>',
          "95": 'GASOLINE<span class="price-card__variant">95</span>',
          diesel: 'DIESEL<span class="price-card__variant">10 PPM</span>',
          "diesel-shell": '<span class="price-card__title-line">EXTRA DIESEL</span><span class="price-card__shell-word">SHELL</span>',
          lpg: 'AUTO GAS<span class="price-card__variant">LPG</span>',
          ev: 'EV<span class="price-card__variant">CHARGING</span>'
        }
      : {
          "100": 'BENZINË<span class="price-card__variant">100</span>',
          "95": 'BENZINË<span class="price-card__variant">95</span>',
          diesel: 'NAFTË<span class="price-card__variant">10 PPM</span>',
          "diesel-shell": '<span class="price-card__title-line">EXTRA DIEZEL</span><span class="price-card__shell-word">SHELL</span>',
          lpg: 'AUTO GAS<span class="price-card__variant">LPG</span>',
          ev: 'KARIKIM<span class="price-card__variant">ELEKTRIK</span>'
        };
    const titleMarkup = titleMap[product.id] || getHomeFuelDisplayName(product, lang).toLocaleUpperCase(lang === "en" ? "en-US" : "sq-AL");
    const iconClass = isShellDiesel ? "fa-crown" : product.icon;
    const unitLabel = product.id === "ev"
      ? (lang === "en" ? "ALL / KW" : "LEK / KW")
      : (lang === "en" ? "ALL / LITER" : "LEK / LITËR");
    const noteIconMap = {
      "100": "fa-shield-halved",
      "95": "fa-leaf",
      diesel: "fa-truck",
      "diesel-shell": "fa-shield-halved",
      lpg: "fa-leaf",
      ev: "fa-bolt"
    };
    const noteIcon = noteIconMap[product.id] || "fa-circle-info";

    return `
      <article
        class="price-card price-card--${product.accent} price-card--${product.theme || product.accent}${selectedHomeFuelId === product.id ? " is-active" : ""}"
        data-fuel-id="${product.id}"
        tabindex="0"
        role="button"
        aria-pressed="${selectedHomeFuelId === product.id ? "true" : "false"}"
      >
        ${selectedHomeFuelId === product.id ? `
          <span class="price-card__selected-flag">
            <i class="fa-solid fa-check" aria-hidden="true"></i>
            ${lang === "en" ? "SELECTED" : "ZGJEDHUR"}
          </span>
        ` : ""}
        <div class="price-card__corner-pill">${product.octane}</div>
        <div class="price-card__medallion" aria-hidden="true">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="price-card__content">
          <h3>${titleMarkup}</h3>
          <div class="price-card__badge${isLpg ? " price-card__badge--placeholder" : ""}">${badgeLabel}</div>
          <div class="price-card__divider" aria-hidden="true"></div>
          <div class="price-card__price-row">
            <strong>${formatHomeFuelAmount(product.price, lang)}</strong>
            <span class="price-card__change price-card__change--${priceChange.direction}">
              <i class="fa-solid ${priceChange.icon}" aria-hidden="true"></i>
              <span>${priceChange.value}</span>
            </span>
          </div>
          <div class="price-card__unit">${unitLabel}</div>
          <div class="price-card__footer-line" aria-hidden="true"></div>
          <p>
            <span class="price-card__note-icon" aria-hidden="true"><i class="fa-solid ${noteIcon}"></i></span>
            <span>${product.description[lang] || product.description.sq}</span>
          </p>
        </div>
      </article>
    `;
  }).join("");

  if (stationValue) {
    stationValue.textContent = homeFuelPriceBoard.station[lang] || homeFuelPriceBoard.station.sq;
  }

  if (updatedValue) {
    updatedValue.textContent = getPriceBoardTimestamp(lang);
  }

  setupHomeFuelCalculatorControls();
  bindHomeFuelPriceCards();
  syncHomeFuelCalculator(lang);
  bindHomeFuelHistoryControls();
  renderHomeFuelHistory();
  enhancePremiumGeneratedContent(priceGrid);
}

window.renderHomeFuelPrices = renderHomeFuelPrices;

// =========================================================
// 06C. LOCATION PAGE MAP
// =========================================================
function stabilizeMapViewport(map, mapEl, options = {}) {
  if (!map || !mapEl || !window.google?.maps) return;

  const fitLocations = options.fitLocations !== false;
  let resizeTimer;

  const refreshMap = () => {
    google.maps.event.trigger(map, "resize");

    if (!fitLocations || !locations.length) return;

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((location) => bounds.extend(location.pos));
    map.fitBounds(bounds, window.innerWidth <= 700 ? 42 : 80);

    google.maps.event.addListenerOnce(map, "idle", () => {
      const maximumZoom = window.innerWidth <= 700 ? 8 : 9;
      if (map.getZoom() > maximumZoom) map.setZoom(maximumZoom);
    });
  };

  const queueRefresh = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshMap, 120);
  };

  google.maps.event.addListenerOnce(map, "idle", queueRefresh);
  requestAnimationFrame(() => requestAnimationFrame(queueRefresh));
  window.addEventListener("resize", queueRefresh, { passive: true });
  window.addEventListener("orientationchange", queueRefresh, { passive: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(queueRefresh);
    observer.observe(mapEl);
  }
}

function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    console.warn("Map element not found");
    return;
  }

  if (!window.google || !window.google.maps) {
    console.error("Google Maps API not loaded. Make sure to include the Google Maps script in your HTML.");
    mapEl.innerHTML = '<div class="map-error"><p>Map currently unavailable. Please try again later.</p></div>';
    return;
  }

  const currentLang = getCurrentLanguage();
  const t = locationsData[currentLang];
  const isMobileViewport = window.innerWidth <= 700;
  const isHomePageMap = !!document.body && document.body.classList.contains("home-page");

  // Center of Albania
  const center = isMobileViewport && isHomePageMap
    ? { lat: 41.03, lng: 20.18 }
    : { lat: 41.15, lng: 19.85 };
  const zoomLevel = isMobileViewport && isHomePageMap ? 7 : 8;

  try {
    const map = new google.maps.Map(mapEl, {
      zoom: zoomLevel,
      center: center,
      mapTypeControl: false,
      streetViewControl: false,
      gestureHandling: isMobileViewport && isHomePageMap ? "greedy" : "auto",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    const infoWindow = new google.maps.InfoWindow();

    // Create markers
    locations.forEach((loc) => {
      const marker = new google.maps.Marker({
        position: loc.pos,
        map: map,
        title: loc.title,
        animation: google.maps.Animation.DROP,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='50' viewBox='0 0 40 50'%3E%3Cpath fill='%23e40909' d='M20,0 C9,0 0,9 0,20 C0,35 20,50 20,50 S40,35 40,20 C40,9 31,0 20,0 Z'/%3E%3Ccircle cx='20' cy='20' r='8' fill='white'/%3E%3C/svg%3E",
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        }
      });

      // Store marker for later use
      loc.marker = marker;

      // Get translated services
      const translatedServices = loc.services.map(serviceKey => t[serviceKey]);
      const translatedHours = t[loc.hoursKey];
      const directionsUrl = loc.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${loc.pos.lat},${loc.pos.lng}`;

      // Info window content
      marker.addListener("click", () => {
        const content = `
          <div class="map-infowindow">
            <h3 class="map-infowindow__title">${loc.title}</h3>
            <p class="map-infowindow__item"><strong>📍 ${t.map_address}:</strong> ${loc.area}</p>
            <p class="map-infowindow__item"><strong>🕐 ${t.map_hours}:</strong> ${translatedHours}</p>
            <div class="map-infowindow__services">
              <strong>${t.map_services}:</strong>
              <div class="map-infowindow__service-tags">
                ${translatedServices.map(s => `<span class="map-infowindow__service-tag">${s}</span>`).join('')}
              </div>
            </div>
            <a href="${directionsUrl}" target="_blank" class="map-infowindow__directions">
              ${t.map_directions}
            </a>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    });

    stabilizeMapViewport(map, mapEl);

    // Generate cards if on location.html
    const cardsGrid = document.getElementById("cardsGrid");
    if (cardsGrid) {
      // Store map and infoWindow globally for re-generation
      window.currentMap = map;
      window.currentInfoWindow = infoWindow;
      generateLocationCards(map, infoWindow);
    }
  } catch (err) {
    console.error("Error initializing Google Maps:", err);
    mapEl.innerHTML = '<div class="map-error"><p>Map initialization failed. Please refresh the page.</p></div>';
  }
}

// =========================================================
// 06D. LOCATION CARDS
// =========================================================
function generateLocationCards(map, infoWindow) {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;

  const currentLang = getCurrentLanguage();
  const t = locationsData[currentLang];

  // Clear existing cards
  grid.innerHTML = '';

  locations.forEach((loc) => {
    const card = document.createElement("article");
    card.className = "location-card";
    
    const translatedServices = loc.services.map(serviceKey => t[serviceKey]);
    const translatedHours = t[loc.hoursKey];
    const directionsUrl = loc.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${loc.pos.lat},${loc.pos.lng}`;
    
    card.innerHTML = `
      <header class="location-card__header">
        <span class="location-card__marker" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></span>
        <div>
          <h3>${loc.city}</h3>
          <p class="area">${loc.area}</p>
        </div>
      </header>
      <div class="location-card__details">
        <p><i class="fa-solid fa-phone" aria-hidden="true"></i><span>${loc.phone}</span></p>
        <p><i class="fa-regular fa-clock" aria-hidden="true"></i><span>${translatedHours}</span></p>
      </div>
      
      <div class="location-card__services">
        <strong class="location-card__services-label">${t.map_services}:</strong>
        <div class="location-card__services-list">
          ${translatedServices.map((s) => `<span class="location-card__service-tag">${s}</span>`).join('')}
        </div>
      </div>

      <div class="location-actions">
        <button class="view-map-btn" data-id="${loc.id}" data-lang="location_view_map">Shiko Hartën</button>
        <a href="${directionsUrl}" 
           target="_blank" data-lang="location_directions">
           Udhëzime
        </a>
      </div>
    `;

    grid.appendChild(card);

    // View on map button
    const viewBtn = card.querySelector(".view-map-btn");
    viewBtn.addEventListener("click", () => {
      // Smooth scroll to map
      const mapEl = document.getElementById("map");
      mapEl?.scrollIntoView({ behavior: "smooth", block: "center" });

      // The station information remains usable even when Google Maps is
      // unavailable or has not finished loading yet.
      if (!map) return;

      // Zoom and center
      setTimeout(() => {
        map.setZoom(15);
        map.setCenter(loc.pos);
        
        // Open info window
        if (loc.marker) {
          google.maps.event.trigger(loc.marker, "click");
        }
      }, 600);
    });
  });

  futureLocations.forEach((loc) => {
    const card = document.createElement("article");
    card.className = "location-card location-card--future";
    card.innerHTML = `
      <span class="location-card__status">${loc.status[currentLang] || loc.status.sq}</span>
      <h3>${loc.city[currentLang] || loc.city.sq}</h3>
      <p class="area">${loc.area[currentLang] || loc.area.sq}</p>
      <p class="location-card__future-text">${loc.text[currentLang] || loc.text.sq}</p>
      <div class="location-card__services">
        <strong class="location-card__services-label">${currentLang === "en" ? "Planned slot" : "Hapësirë e planifikuar"}</strong>
        <div class="location-card__services-list">
          <span class="location-card__service-tag">${currentLang === "en" ? "Future network" : "Rrjet i ardhshëm"}</span>
          <span class="location-card__service-tag">${currentLang === "en" ? "Details pending" : "Detajet në pritje"}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  // Apply translations to the buttons we just created
  if (typeof applyTranslations === 'function') {
    applyTranslations(currentLang);
  }

  enhancePremiumGeneratedContent(grid);
}

// Render station information independently from the Google Maps API.
// initMap will regenerate the same cards later and connect their map actions.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => generateLocationCards(null, null), { once: true });
} else {
  generateLocationCards(null, null);
}

// Make initMap global for location pages
window.initMap = initMap;

// =========================================================
// 06E. HOME PAGE MAP OVERRIDE
// =========================================================
if (window.location.pathname.includes("index.html") || 
    window.location.pathname === "/" || 
    window.location.pathname.endsWith("/")) {
  
  // Override for home page - simpler version
  window.initMap = function() {
    const mapEl = document.getElementById("map");
    if (!mapEl) {
      console.warn("Map element not found");
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      mapEl.innerHTML = '<div class="map-error"><p>Map currently unavailable. Please try again later.</p></div>';
      return;
    }

    const currentLang = getCurrentLanguage();
    const t = locationsData[currentLang];

    const isMobileViewport = window.innerWidth <= 700;
    const center = isMobileViewport
      ? { lat: 41.03, lng: 20.18 }
      : { lat: 41.13, lng: 19.85 };

    try {
      const map = new google.maps.Map(mapEl, {
        zoom: isMobileViewport ? 7 : 8,
        center: center,
        mapTypeControl: false,
        streetViewControl: false,
        gestureHandling: isMobileViewport ? "greedy" : "auto"
      });

      const infoWindow = new google.maps.InfoWindow();

      // Only show markers on home page
      locations.forEach((loc) => {
        const marker = new google.maps.Marker({
          position: loc.pos,
          map: map,
          title: loc.title,
          animation: google.maps.Animation.DROP,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='42' viewBox='0 0 40 50'%3E%3Cpath fill='%23e40909' d='M20,0 C9,0 0,9 0,20 C0,35 20,50 20,50 S40,35 40,20 C40,9 31,0 20,0 Z'/%3E%3Ccircle cx='20' cy='20' r='8' fill='white'/%3E%3C/svg%3E",
            scaledSize: new google.maps.Size(32, 42),
            anchor: new google.maps.Point(16, 42)
          }
        });

        marker.addListener("click", () => {
          infoWindow.setContent(`
            <div class="map-infowindow map-infowindow--compact">
              <h3 class="map-infowindow__title map-infowindow__title--compact">${loc.city}</h3>
              <p class="map-infowindow__item map-infowindow__item--compact">${loc.area}</p>
              <a href="${loc.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${loc.pos.lat},${loc.pos.lng}`}"
                 target="_blank"
                 class="map-infowindow__directions">
                 ${t.map_directions}
              </a>
            </div>
          `);
          infoWindow.open(map, marker);
        });
      });

      stabilizeMapViewport(map, mapEl);
    } catch (err) {
      console.error("Error initializing Google Maps:", err);
      mapEl.innerHTML = '<div class="map-error"><p>Map initialization failed. Please refresh the page.</p></div>';
    }
  };
}

// Load Google Maps only when the map is close to being viewed.
function loadGoogleMapsWhenNeeded() {
  const mapEl = document.getElementById("map");
  if (!mapEl || window.google?.maps || document.getElementById("googleMapsApi")) return;

  const load = () => {
    if (window.google?.maps || document.getElementById("googleMapsApi")) return;
    const script = document.createElement("script");
    script.id = "googleMapsApi";
    script.async = true;
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDY4tNjAGmohA0ynY0Q2qH9yqwobtYlzg&callback=initMap&loading=async";
    document.head.appendChild(script);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: "650px 0px" });
    observer.observe(mapEl);
    return;
  }

  window.setTimeout(load, 1400);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadGoogleMapsWhenNeeded, { once: true });
} else {
  loadGoogleMapsWhenNeeded();
}

// =========================================================
// 08A. FOOTER YEAR
// =========================================================
renderHomeFuelPrices();

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// =========================================================
// 08B. FADE-IN ANIMATIONS
// =========================================================
function coordinatePremiumMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const revealGroups = [
    [".hero-copy", "reveal-left"],
    [".hero-spotlight", "reveal-right"],
    [".price-board__shell", "reveal-scale"],
    [".showcase-header", "reveal-soft"],
    [".products-hero-panel", "reveal-scale"],
    [".locations-intro", "reveal-soft"],
    [".home-proof__header", "reveal-soft"],
    [".contact-commercial__panel", "reveal-right"],
    [".contact-commercial__media", "reveal-left"],
    [".pg-header", "reveal-soft"],
    [".loyalty-hero", "reveal-scale"]
  ];

  revealGroups.forEach(([selector, variant]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add("fade-in", variant);
    });
  });

  const hoverSelectors = [
    ".service-card",
    ".product-card",
    ".price-card",
    ".proof-card",
    ".location-card",
    ".about-v2-value-card",
    ".about-v2-event__card",
    ".loyalty-card",
    ".loyalty-step",
    ".step-card",
    ".contact-commercial__quick-link",
    ".contact-commercial__points div"
  ];

  hoverSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.classList.add("premium-hover"));
  });

  const staggerContainers = [
    ".hero-metrics",
    ".spotlight-grid",
    ".price-grid",
    ".services-grid",
    ".products-grid",
    ".home-proof__grid",
    ".locations-grid",
    ".about-v2-values__grid",
    ".about-v2-timeline__track",
    ".loyalty-comparison",
    ".loyalty-steps-grid",
    ".next-steps"
  ];

  staggerContainers.forEach((selector) => {
    document.querySelectorAll(selector).forEach((container) => {
      const children = Array.from(container.children).filter((child) => !child.matches(".about-v2-timeline__line"));
      children.forEach((child, index) => {
        child.classList.add("fade-in", "reveal-soft", "motion-child");
        child.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);
      });
    });
  });
}

coordinatePremiumMotion();

function enhancePremiumGeneratedContent(root = document) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = root.querySelectorAll?.(".price-card, .location-card, .g-card") || [];

  targets.forEach((el, index) => {
    el.classList.add("premium-hover");
    if (!reduceMotion && !el.classList.contains("visible")) {
      el.classList.add("fade-in", "reveal-soft", "visible");
      el.style.setProperty("--reveal-delay", `${Math.min(index * 55, 330)}ms`);
    }
  });
}

const fadeEls = document.querySelectorAll(".fade-in");
if (fadeEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );
  fadeEls.forEach((el) => observer.observe(el));
}

// =========================================================
// 08C. HERO METRIC COUNTERS
// =========================================================
const heroMetricValues = document.querySelectorAll(".hero-metric-value");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const formatHeroMetricValue = (valueEl, value) => {
  const type = valueEl.dataset.counterType;

  if (type === "percent") return `${Math.round(value)}%`;
  if (type === "plus") return `${Math.round(value)}+`;
  if (type === "split") return `${Math.round(value)}${valueEl.dataset.counterRightText || ""}`;

  return `${Math.round(value)}`;
};

const animateHeroMetricValue = (valueEl) => {
  if (valueEl.dataset.animated === "true") return;
  valueEl.dataset.animated = "true";

  const type = valueEl.dataset.counterType;

  if (prefersReducedMotion) {
    if (type === "split") {
      valueEl.textContent = `${valueEl.dataset.counterLeftTarget || 0}${valueEl.dataset.counterRightText || ""}`;
    } else {
      valueEl.textContent = formatHeroMetricValue(valueEl, Number(valueEl.dataset.counterTarget || 0));
    }
    return;
  }

  const duration = type === "split" ? 1800 : 2000;
  const targetValue = type === "split"
    ? Number(valueEl.dataset.counterLeftTarget || 0)
    : Number(valueEl.dataset.counterTarget || 0);
  const startTime = performance.now();

  const easeOutExpo = (progress) => (
    progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
  );

  const tick = (now) => {
    const rawProgress = Math.min((now - startTime) / duration, 1);
    const easedProgress = easeOutExpo(rawProgress);
    const currentValue = targetValue * easedProgress;

    valueEl.textContent = formatHeroMetricValue(valueEl, currentValue);

    const pulseScale = 1 + (1 - rawProgress) * 0.18;
    valueEl.style.transform = `scale(${pulseScale}) translateY(${(1 - rawProgress) * -4}px)`;

    if (rawProgress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      valueEl.textContent = formatHeroMetricValue(valueEl, targetValue);
      valueEl.style.transform = "";
    }
  };

  window.requestAnimationFrame(tick);
};

if (heroMetricValues.length) {
  const metricObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const valueEl = entry.target;
        animateHeroMetricValue(valueEl);
        obs.unobserve(valueEl);
      });
    },
    { threshold: 0.55 }
  );

  heroMetricValues.forEach((valueEl) => metricObserver.observe(valueEl));
}

// =========================================================
// 09A. SCROLL TO TOP
// =========================================================
const scrollBtn = document.createElement("button");
scrollBtn.id = "scrollTopBtn";
scrollBtn.type = "button";
scrollBtn.setAttribute("aria-label", "Scroll to top");
scrollBtn.textContent = "↑";
document.body.appendChild(scrollBtn);

let scrollTopTicking = false;
window.addEventListener("scroll", () => {
  if (scrollTopTicking) return;
  scrollTopTicking = true;
  window.requestAnimationFrame(() => {
    scrollBtn.classList.toggle("show", window.scrollY > 600);
    scrollTopTicking = false;
  });
}, { passive: true });

scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// =========================================================
// 09B. HIDE FLOATING SOCIAL NEAR FOOTER
// =========================================================
const floatingSocial = document.getElementById("floatingSocial");
const footer = document.getElementById("siteFooter");

if (floatingSocial && footer) {
  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        floatingSocial.classList.toggle("hide-floating", e.isIntersecting);
      });
    },
    { threshold: 0.05 }
  );
  footerObserver.observe(footer);
}

// =========================================================
// 09C. LOYALTY CARDS - PERSISTENT DETAILS
// =========================================================
const toggles = document.querySelectorAll(".toggle-details");
const loyaltyItems = document.querySelectorAll(".loyalty-item");

function getLoyaltyToggleLabels() {
  const currentLang = getCurrentLanguage();
  const t = typeof translations !== "undefined" ? translations[currentLang] : null;

  return {
    open: t ? t.loyalty_btn_view : "Shiko Përfitimet",
    close: t ? t.loyalty_btn_close : "Mbyll Përfitimet",
  };
}

function closeAllLoyaltyDetails() {
  const labels = getLoyaltyToggleLabels();

  loyaltyItems.forEach(item => {
    item.querySelector(".loyalty-details")?.classList.remove("active");

    const button = item.querySelector(".toggle-details");
    if (button) {
      button.textContent = labels.open;
    }
  });
}

toggles.forEach(btn => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();

    const item = btn.closest(".loyalty-item");
    const details = item?.querySelector(".loyalty-details");
    if (!item || !details) return;

    const labels = getLoyaltyToggleLabels();
    const isOpen = details.classList.toggle("active");

    btn.textContent = isOpen ? labels.close : labels.open;
  });
});

loyaltyItems.forEach(item => {
  item.addEventListener("click", event => {
    event.stopPropagation();
  });
});

document.addEventListener("click", () => {
  closeAllLoyaltyDetails();
});

// =========================================================
// 05B. CURRENT GALLERY PAGE
// Masonry media rendering, video thumbnails, and fullscreen lightbox.
// =========================================================
(function initGalleryPage() {
  const grid = document.getElementById('gGrid');
  if (!document.body.classList.contains('gallery-page') || !grid) return;

  /* ─────────────────────────────────────────
     06A. GALLERY MEDIA DATA
  ───────────────────────────────────────── */
  const IMGS = [
    { src: 'images/kavaje naten 2.jpg', cap: 'Kavajë — Natë', tags: ['night','station'] },
    { src: 'images/vark funizim 06.jpeg', cap: 'Furnizim mjetesh lundruese', tags: ['service'] },
    { src: 'images/pika tirane.jpg', cap: 'Pika Tiranë', tags: ['station'] },
    { src: 'images/preload video.mp4', cap: 'Micka Oil — Prezantim', tags: ['video','station'], type: 'video', thumbTime: 1.5 },
    { src: 'images/transport.png', cap: 'Transport hidrokarburesh', tags: ['service'] },
    { src: 'images/MEMALIAJ NATEN.jpg', cap: 'Memaliaj — Ndriçim nate', tags: ['night','station'] },
    { src: 'images/micka_card_2.png', cap: 'Kartë VIP', tags: ['loyalty'] },
    { src: 'images/patos.jpg', cap: 'Patos — Stacion', tags: ['station'] },
    { src: 'images/video furnizim.mp4', cap: 'Furnizim me karburant', tags: ['video','service'], type: 'video', thumbTime: 6 },
    { src: 'images/Tirane.jpg', cap: 'Tiranë — Stacion', tags: ['station'] },
    { src: 'images/furnizim varkash.png', cap: 'Furnizim mjetesh lundruese', tags: ['service'] },
    { src: 'images/MEMALIAJ N.jpg', cap: 'Memaliaj — Natë', tags: ['night','station'] },
    { src: 'images/karta e besnikerise banner.jpeg', cap: 'Karta e besnikërisë — Banner', tags: ['loyalty'] },
    { src: 'images/kavaje.jpg', cap: 'Kavajë — Stacion', tags: ['station'] },
    { src: 'images/helikopter.png', cap: 'Furnizim aviacioni', tags: ['service'] },
    { src: 'images/patos me kart.jpg', cap: 'Patos — Kartë', tags: ['station','loyalty'] },
    { src: 'images/karta-vip.mp4', cap: 'Karta VIP', tags: ['video','loyalty'], type: 'video', thumbTime: 1.2 },
    { src: 'images/memaliaj.jpg', cap: 'Memaliaj — Stacion', tags: ['station'] },
    { src: 'images/kavje me bot.jpg', cap: 'Kavajë — Bot nate', tags: ['night','station'] },
    { src: 'images/micka_card_1.png', cap: 'Kartë Standart', tags: ['loyalty'] },
    { src: 'images/varka.jpg', cap: 'Furnizim në porte', tags: ['service'] },
    { src: 'images/tirane (2).jpg', cap: 'Tiranë — Fasada', tags: ['station'] },
    { src: 'images/Memaliaj (2).jpg', cap: 'Memaliaj — Detaj nate', tags: ['night','station'] },
    { src: 'images/karta e besnikerise.mp4', cap: 'Karta e besnikërisë', tags: ['video','loyalty'], type: 'video', thumbTime: 1.4 },
    { src: 'images/pika kavaje.jpg', cap: 'Pika Kavajë', tags: ['station'] },
    { src: 'images/memaliaj ai.png', cap: 'Memaliaj — Përpunim vizual', tags: ['station'] },
    { src: 'images/micka_card_3.png', cap: 'Kartë Business', tags: ['loyalty'] },
    { src: 'images/Gjirokaster.jpg', cap: 'Gjirokastër', tags: ['station'] },
    { src: 'images/kavaje me bot.jpg', cap: 'Kavajë — Transport nate', tags: ['night','station'] },
    { src: 'images/pika memaliaj.jpg', cap: 'Pika Memaliaj', tags: ['station'] },
    { src: 'images/karta e besnikerise foto.jpeg', cap: 'Karta e besnikërisë', tags: ['loyalty'] },
    { src: 'images/patos (2).jpg', cap: 'Patos — Pamje', tags: ['station'] },
    { src: 'images/MEMALIAJ NATEN SIDE.jpg', cap: 'Memaliaj — Pamje anësore nate', tags: ['night','station'] },
    { src: 'images/tollon.mp4', cap: 'Tollon elektronik', tags: ['video','loyalty'], type: 'video', thumbTime: 1.2 },
    { src: 'images/pika kavaje2.jpg', cap: 'Kavajë — Hyrje', tags: ['station'] },
    { src: 'images/punonjes me logo.jpg', cap: 'Ekipi Micka Oil', tags: ['team'] },
    { src: 'images/memaluaj.jpg', cap: 'Memaliaj — Pamje', tags: ['station'] },
    { src: 'images/memaliaj 2.jpg', cap: 'Memaliaj — Natë', tags: ['night','station'] },
    { src: 'images/pika memaliaj2.jpg', cap: 'Memaliaj — Detaj', tags: ['station'] },
    { src: 'images/memaliaj nozle.jpg', cap: 'Memaliaj — Nozzle', tags: ['station'] },
    { src: 'images/kavaje naten.jpg', cap: 'Kavajë — Ndriçim', tags: ['night','station'] },
  ];

  let pool      = IMGS.map((_,i) => i);
  let lbIdx     = 0;
  let lbOpen    = false;
  let busy      = false;

  /* ─────────────────────────────────────────
     06B. LIGHTBOX AND GRID ELEMENTS
  ───────────────────────────────────────── */
  const lb      = document.getElementById('gLb');
  const lbImg   = document.getElementById('gLbImg');
  const lbVideo = document.getElementById('gLbVideo');
  const lbCount = document.getElementById('gLbCounter');
  const lbFilm  = document.getElementById('gLbFilm');
  const lbCap   = document.getElementById('gLbCaption');
  const lbClose = document.getElementById('gLbClose');
  const lbPrev  = document.getElementById('gLbPrev');
  const lbNext  = document.getElementById('gLbNext');
  const lbZoomIn = document.getElementById('gLbZoomIn');
  const lbZoomOut = document.getElementById('gLbZoomOut');
  const lbZoomReset = document.getElementById('gLbZoomReset');
  let savedScrollY = 0;
  let lbZoom = 1;

  function isVideo(item) {
    return item.type === 'video';
  }

  function mediaMarkup(item, eager = false) {
    if (isVideo(item)) {
      return `<video src="${item.src}" muted playsinline preload="metadata" data-thumb-time="${item.thumbTime || 1}"></video><span class="g-video-caption">${item.cap}</span><span class="g-media-play"><i class="fa-solid fa-play"></i></span>`;
    }
    return `<img src="${item.src}" alt="${item.cap}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
  }

  function tagLabel(item) {
    if (item.tags.includes('video')) return 'Video';
    if (item.tags.includes('night')) return 'Natë';
    if (item.tags.includes('team')) return 'Ekipi';
    if (item.tags.includes('service')) return 'Shërbim';
    if (item.tags.includes('loyalty')) return 'Kartë';
    return 'Stacion';
  }

  function updateCounts() {
    // Count labels were removed from the design; keep this hook harmless for future use.
  }

  function renderGrid() {
    grid.innerHTML = IMGS.map((item, idx) => `
      <div class="g-card g-card--loading ${isVideo(item) ? 'g-card--video' : ''}" data-idx="${idx}" data-tag="${item.tags.join(' ')}">
        ${mediaMarkup(item, idx < 4)}
        <span class="g-card__loader" role="status"><i aria-hidden="true"></i><span>Duke ngarkuar</span></span>
        <div class="g-card__overlay"><div class="g-card__icon"><i class="fa-solid fa-expand"></i></div></div>
        <span class="g-card__tag">${tagLabel(item)}</span>
      </div>`).join('');
    prepareMediaLoadingStates();
    prepareVideoThumbnails();
  }

  function prepareMediaLoadingStates() {
    const settleCard = (media, failed = false) => {
      const card = media.closest('.g-card');
      if (!card) return;
      card.classList.remove('g-card--loading');
      card.classList.toggle('g-card--error', failed);
    };

    grid.querySelectorAll('.g-card img').forEach(img => {
      img.addEventListener('load', () => settleCard(img), { once: true });
      img.addEventListener('error', () => settleCard(img, true), { once: true });
      if (img.complete) settleCard(img, img.naturalWidth === 0);
    });

    grid.querySelectorAll('.g-card video').forEach(video => {
      video.addEventListener('seeked', () => settleCard(video), { once: true });
      video.addEventListener('canplay', () => settleCard(video), { once: true });
      video.addEventListener('error', () => settleCard(video, true), { once: true });
    });
  }

  function prepareVideoThumbnails() {
    grid.querySelectorAll('.g-card--video video').forEach(video => {
      const targetTime = parseFloat(video.dataset.thumbTime || '1');
      const seekToFrame = () => {
        const safeTime = video.duration ? Math.min(targetTime, Math.max(video.duration - 0.2, 0)) : targetTime;
        try {
          video.currentTime = safeTime;
        } catch (err) {
          // Some browsers delay seeking until enough metadata is available.
        }
      };
      video.addEventListener('loadedmetadata', seekToFrame, { once: true });
      video.addEventListener('seeked', () => video.classList.add('is-thumb-ready'), { once: true });
      video.addEventListener('canplay', () => video.classList.add('is-thumb-ready'), { once: true });
      video.load();
    });
  }

  /* ─────────────────────────────────────────
     06C. VERTICAL THUMBNAIL FILMSTRIP
  ───────────────────────────────────────── */
  function buildFilm() {
    lbFilm.innerHTML = '';
    pool.forEach((imgIdx, pi) => {
      const item = IMGS[imgIdx];
      const t = document.createElement(isVideo(item) ? 'video' : 'img');
      t.className = 'g-lb__thumb';
      t.src  = item.src;
      t.alt  = '';
      if (isVideo(item)) {
        t.muted = true;
        t.playsInline = true;
        t.preload = 'metadata';
      }
      t.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        jumpTo(pi);
      });
      lbFilm.appendChild(t);
    });
  }

  function syncFilm() {
    [...lbFilm.children].forEach((t, i) => t.classList.toggle('active', i === lbIdx));
    const active = lbFilm.children[lbIdx];
    if (active) {
      const filmRect = lbFilm.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const delta = activeRect.top - filmRect.top - (filmRect.height / 2) + (activeRect.height / 2);
      lbFilm.scrollTop += delta;
    }
  }

  function syncUI() {
    lbCount.textContent = (lbIdx + 1) + ' / ' + pool.length;
    lbCap.textContent   = IMGS[pool[lbIdx]].cap;
    syncFilm();
  }

  function clearMediaAnimation() {
    lbImg.classList.remove('is-out', 'is-in');
    lbVideo.classList.remove('is-out', 'is-in');
  }

  function showIndex(nextIndex, direction = 0, animate = true) {
    if (!pool.length) return;
    const next = ((nextIndex % pool.length) + pool.length) % pool.length;
    if (busy && animate) return;

    const commit = () => {
      lbIdx = next;
      resetZoom();
      setLightboxMedia(IMGS[pool[lbIdx]]);
      clearMediaAnimation();
      syncUI();
    };

    if (!animate || next === lbIdx) {
      commit();
      return;
    }

    busy = true;
    const dir = direction || (next > lbIdx ? 1 : -1);
    const px = dir > 0 ? '-40px' : '40px';
    const ep = dir > 0 ? '40px' : '-40px';
    const activeMedia = isVideo(IMGS[pool[lbIdx]]) ? lbVideo : lbImg;
    activeMedia.style.setProperty('--lb-dir', px);
    activeMedia.classList.add('is-out');

    setTimeout(() => {
      lbIdx = next;
      resetZoom();
      setLightboxMedia(IMGS[pool[lbIdx]]);
      syncUI();
      const nextMedia = isVideo(IMGS[pool[lbIdx]]) ? lbVideo : lbImg;
      nextMedia.style.setProperty('--lb-dir', ep);
      nextMedia.classList.remove('is-out');
      nextMedia.classList.add('is-in');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        nextMedia.classList.remove('is-in');
        busy = false;
      }));
    }, 170);
  }

  /* ─────────────────────────────────────────
     06D. LIGHTBOX OPEN, CLOSE, AND ZOOM
  ───────────────────────────────────────── */
  function open(poolPos) {
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    showIndex(poolPos, 0, false);
    lb.classList.add('open');
    document.body.classList.add('lb-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    lbOpen = true;
  }

  function close() {
    lb.classList.remove('open');
    lbVideo.pause();
    document.body.classList.remove('lb-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
    lbOpen = false;
  }

  function applyZoom() {
    lbImg.style.setProperty('--lb-zoom', lbZoom);
    lbVideo.style.setProperty('--lb-zoom', lbZoom);
    lbZoomReset.textContent = Math.round(lbZoom * 100) + '%';
  }

  function changeZoom(delta) {
    lbZoom = Math.min(2.5, Math.max(0.5, Math.round((lbZoom + delta) * 10) / 10));
    applyZoom();
  }

  function resetZoom() {
    lbZoom = 1;
    applyZoom();
  }

  function setLightboxMedia(item) {
    if (isVideo(item)) {
      lbImg.style.display = 'none';
      lbImg.removeAttribute('src');
      lbVideo.style.display = 'block';
      lbVideo.src = item.src;
    } else {
      lbVideo.pause();
      lbVideo.style.display = 'none';
      lbVideo.removeAttribute('src');
      lbImg.style.display = 'block';
      lbImg.src = item.src;
      lbImg.alt = item.cap;
    }
  }

  /* ─────────────────────────────────────────
     06E. LIGHTBOX NAVIGATION
  ───────────────────────────────────────── */
  function go(dir) {
    showIndex(lbIdx + dir, dir, true);
  }

  function jumpTo(pi) {
    showIndex(pi, pi > lbIdx ? 1 : -1, true);
  }

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => go(-1));
  lbNext.addEventListener('click', () => go(1));
  lbZoomIn.addEventListener('click', () => changeZoom(0.1));
  lbZoomOut.addEventListener('click', () => changeZoom(-0.1));
  lbZoomReset.addEventListener('click', resetZoom);

  document.addEventListener('keydown', e => {
    if (!lbOpen) return;
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'Escape')     close();
    if (e.key === '+' || e.key === '=') changeZoom(0.1);
    if (e.key === '-' || e.key === '_') changeZoom(-0.1);
    if (e.key === '0') resetZoom();
  });

  let tx = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend',   e => {
    const d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
  });

  /* ─────────────────────────────────────────
     06F. GRID CLICK HANDLING
  ───────────────────────────────────────── */
  document.addEventListener('click', e => {
    if (lbOpen) return;
    const el = e.target.closest('[data-idx]');
    if (!el) return;
    const idx = parseInt(el.dataset.idx);
    const pi  = pool.indexOf(idx);
    if (pi >= 0) open(pi);
  });

  /* ─────────────────────────────────────────
     06G. INITIAL RENDER
     Mobile menu behavior is handled once in app.js.
  ───────────────────────────────────────── */
  renderGrid();
  updateCounts();
  pool = IMGS.map((_, i) => i);
  buildFilm();
  document.getElementById('year').textContent = new Date().getFullYear();

})();












