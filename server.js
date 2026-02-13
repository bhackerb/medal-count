import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// ─── MEDAL DATA CACHE ───────────────────────────────────
let medalCache = {
  data: null,
  lastUpdated: null,
  source: null,
};

// Country metadata for enrichment (population in millions, GDP in $B USD)
const COUNTRY_META = {
  NOR: { name: "Norway", flag: "🇳🇴", population: 5.5, gdp: 579, continent: "Europe", historicalWinterTotal: 406 },
  ITA: { name: "Italy", flag: "🇮🇹", population: 59, gdp: 2254, continent: "Europe", historicalWinterTotal: 141, isHost: true },
  USA: { name: "United States", flag: "🇺🇸", population: 335, gdp: 28781, continent: "Americas", historicalWinterTotal: 330 },
  GER: { name: "Germany", flag: "🇩🇪", population: 84, gdp: 4456, continent: "Europe", historicalWinterTotal: 267 },
  SWE: { name: "Sweden", flag: "🇸🇪", population: 10.5, gdp: 593, continent: "Europe", historicalWinterTotal: 168 },
  SUI: { name: "Switzerland", flag: "🇨🇭", population: 8.8, gdp: 884, continent: "Europe", historicalWinterTotal: 167 },
  AUT: { name: "Austria", flag: "🇦🇹", population: 9.1, gdp: 516, continent: "Europe", historicalWinterTotal: 250 },
  FRA: { name: "France", flag: "🇫🇷", population: 68, gdp: 3130, continent: "Europe", historicalWinterTotal: 158 },
  NED: { name: "Netherlands", flag: "🇳🇱", population: 17.8, gdp: 1118, continent: "Europe", historicalWinterTotal: 130 },
  JPN: { name: "Japan", flag: "🇯🇵", population: 124, gdp: 4213, continent: "Asia", historicalWinterTotal: 75 },
  KOR: { name: "South Korea", flag: "🇰🇷", population: 52, gdp: 1712, continent: "Asia", historicalWinterTotal: 75 },
  CZE: { name: "Czechia", flag: "🇨🇿", population: 10.9, gdp: 330, continent: "Europe", historicalWinterTotal: 32 },
  SLO: { name: "Slovenia", flag: "🇸🇮", population: 2.1, gdp: 68, continent: "Europe", historicalWinterTotal: 18 },
  AUS: { name: "Australia", flag: "🇦🇺", population: 26, gdp: 1724, continent: "Oceania", historicalWinterTotal: 18 },
  CAN: { name: "Canada", flag: "🇨🇦", population: 40, gdp: 2140, continent: "Americas", historicalWinterTotal: 225 },
  CHN: { name: "China", flag: "🇨🇳", population: 1412, gdp: 17794, continent: "Asia", historicalWinterTotal: 77 },
  NZL: { name: "New Zealand", flag: "🇳🇿", population: 5.2, gdp: 252, continent: "Oceania", historicalWinterTotal: 5 },
  LAT: { name: "Latvia", flag: "🇱🇻", population: 1.8, gdp: 47, continent: "Europe", historicalWinterTotal: 10 },
  POL: { name: "Poland", flag: "🇵🇱", population: 37, gdp: 842, continent: "Europe", historicalWinterTotal: 28 },
  FIN: { name: "Finland", flag: "🇫🇮", population: 5.6, gdp: 300, continent: "Europe", historicalWinterTotal: 178 },
  GBR: { name: "Great Britain", flag: "🇬🇧", population: 67, gdp: 3340, continent: "Europe", historicalWinterTotal: 35 },
  BEL: { name: "Belgium", flag: "🇧🇪", population: 11.6, gdp: 624, continent: "Europe", historicalWinterTotal: 8 },
  ESP: { name: "Spain", flag: "🇪🇸", population: 47, gdp: 1581, continent: "Europe", historicalWinterTotal: 2 },
  BRA: { name: "Brazil", flag: "🇧🇷", population: 216, gdp: 2126, continent: "Americas", historicalWinterTotal: 0 },
  ROU: { name: "Romania", flag: "🇷🇴", population: 19, gdp: 350, continent: "Europe", historicalWinterTotal: 2 },
  EST: { name: "Estonia", flag: "🇪🇪", population: 1.3, gdp: 41, continent: "Europe", historicalWinterTotal: 7 },
  SVK: { name: "Slovakia", flag: "🇸🇰", population: 5.4, gdp: 127, continent: "Europe", historicalWinterTotal: 8 },
  BLR: { name: "Belarus", flag: "🇧🇾", population: 9.2, gdp: 73, continent: "Europe", historicalWinterTotal: 20 },
  UKR: { name: "Ukraine", flag: "🇺🇦", population: 37, gdp: 179, continent: "Europe", historicalWinterTotal: 10 },
  KAZ: { name: "Kazakhstan", flag: "🇰🇿", population: 20, gdp: 261, continent: "Asia", historicalWinterTotal: 9 },
  BUL: { name: "Bulgaria", flag: "🇧🇬", population: 6.5, gdp: 100, continent: "Europe", historicalWinterTotal: 8 },
  CRO: { name: "Croatia", flag: "🇭🇷", population: 3.9, gdp: 78, continent: "Europe", historicalWinterTotal: 15 },
  LIE: { name: "Liechtenstein", flag: "🇱🇮", population: 0.04, gdp: 7, continent: "Europe", historicalWinterTotal: 10 },
  DEN: { name: "Denmark", flag: "🇩🇰", population: 5.9, gdp: 404, continent: "Europe", historicalWinterTotal: 1 },
  HUN: { name: "Hungary", flag: "🇭🇺", population: 10, gdp: 212, continent: "Europe", historicalWinterTotal: 10 },
};

// IOC code aliases (some sources use different codes)
const CODE_ALIASES = {
  "SUI": ["SUI", "CHE"],
  "GER": ["GER", "DEU"],
  "NED": ["NED", "NLD"],
  "KOR": ["KOR"],
  "GBR": ["GBR"],
  "DEN": ["DEN", "DNK"],
};

/**
 * Scrape medal data from Olympics.com
 */
async function scrapeOlympicsMedals() {
  try {
    console.log("[scraper] Fetching medal data from Olympics.com...");

    const response = await fetch("https://www.olympics.com/en/milano-cortina-2026/medals", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MedalTracker/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    // Parse medal data from the HTML
    // Olympics.com embeds data in structured elements
    // We look for patterns like NOC code + medal counts
    const medals = [];

    // Try JSON-LD or embedded data first
    const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
    if (jsonMatch) {
      for (const block of jsonMatch) {
        const content = block.replace(/<\/?script[^>]*>/g, "");
        try {
          const data = JSON.parse(content);
          // Look for medal table data in various possible structures
          if (data?.props?.pageProps?.medalStandings) {
            const standings = data.props.pageProps.medalStandings;
            for (const entry of standings) {
              medals.push({
                code: entry.noc || entry.code,
                gold: entry.gold || 0,
                silver: entry.silver || 0,
                bronze: entry.bronze || 0,
              });
            }
          }
        } catch { /* not JSON or wrong structure, continue */ }
      }
    }

    // Regex fallback: parse the medal table from HTML structure
    if (medals.length === 0) {
      // Match patterns like: NOR...7...2...5 or structured table rows
      const nocPattern = /([A-Z]{3})\s*(?:[A-Za-z\s\-']+)\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g;
      let match;
      while ((match = nocPattern.exec(html)) !== null) {
        const [, code, gold, silver, bronze] = match;
        if (COUNTRY_META[code] || Object.values(CODE_ALIASES).some(a => a.includes(code))) {
          medals.push({
            code,
            gold: parseInt(gold),
            silver: parseInt(silver),
            bronze: parseInt(bronze),
          });
        }
      }
    }

    if (medals.length > 0) {
      console.log(`[scraper] Parsed ${medals.length} countries from Olympics.com`);
      return medals;
    }

    console.log("[scraper] Could not parse Olympics.com, trying Wikipedia fallback...");
    return await scrapeWikipedia();

  } catch (err) {
    console.error(`[scraper] Olympics.com failed: ${err.message}`);
    return await scrapeWikipedia();
  }
}

/**
 * Fallback: scrape from Wikipedia medal table
 */
async function scrapeWikipedia() {
  try {
    console.log("[scraper] Fetching from Wikipedia...");
    const response = await fetch(
      "https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MedalTracker/1.0)" },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const medals = [];
    // Wikipedia medal tables have: rank, country (with NOC code), gold, silver, bronze, total
    // Pattern: look for 3-letter codes near sequences of numbers
    const tableMatch = html.match(/wikitable[\s\S]*?<\/table>/);
    if (tableMatch) {
      const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
      for (const row of rows) {
        const codeMatch = row.match(/\(([A-Z]{3})\)/);
        const nums = [...row.matchAll(/<td[^>]*>\s*(\d+)\s*<\/td>/g)].map(m => parseInt(m[1]));
        if (codeMatch && nums.length >= 3) {
          medals.push({
            code: codeMatch[1],
            gold: nums[0],
            silver: nums[1],
            bronze: nums[2],
          });
        }
      }
    }

    if (medals.length > 0) {
      console.log(`[scraper] Parsed ${medals.length} countries from Wikipedia`);
      return medals;
    }

    throw new Error("No data parsed from Wikipedia");
  } catch (err) {
    console.error(`[scraper] Wikipedia failed: ${err.message}`);
    return null;
  }
}

/**
 * Enrich raw medal data with country metadata
 */
function enrichMedalData(rawMedals) {
  return rawMedals.map(m => {
    const meta = COUNTRY_META[m.code] || {
      name: m.code,
      flag: "🏳️",
      population: 10,
      gdp: 100,
      continent: "Unknown",
      historicalWinterTotal: 0,
    };

    return {
      code: m.code,
      ...meta,
      gold: m.gold,
      silver: m.silver,
      bronze: m.bronze,
    };
  });
}

/**
 * Refresh medal data
 */
async function refreshData() {
  const raw = await scrapeOlympicsMedals();

  if (raw && raw.length > 0) {
    medalCache.data = enrichMedalData(raw);
    medalCache.lastUpdated = new Date().toISOString();
    medalCache.source = "live";
    console.log(`[cache] Updated with ${medalCache.data.length} countries at ${medalCache.lastUpdated}`);
  } else if (!medalCache.data) {
    // Use hardcoded fallback if no cache and scraping failed
    console.log("[cache] Using hardcoded fallback data");
    medalCache.data = getFallbackData();
    medalCache.lastUpdated = new Date().toISOString();
    medalCache.source = "fallback";
  }
}

function getFallbackData() {
  return enrichMedalData([
    { code: "NOR", gold: 7, silver: 2, bronze: 5 },
    { code: "ITA", gold: 6, silver: 3, bronze: 8 },
    { code: "USA", gold: 4, silver: 7, bronze: 3 },
    { code: "GER", gold: 4, silver: 3, bronze: 2 },
    { code: "SWE", gold: 4, silver: 3, bronze: 1 },
    { code: "SUI", gold: 4, silver: 1, bronze: 2 },
    { code: "AUT", gold: 3, silver: 6, bronze: 3 },
    { code: "FRA", gold: 3, silver: 4, bronze: 1 },
    { code: "NED", gold: 3, silver: 3, bronze: 0 },
    { code: "JPN", gold: 2, silver: 2, bronze: 6 },
    { code: "KOR", gold: 1, silver: 1, bronze: 2 },
    { code: "CZE", gold: 1, silver: 1, bronze: 0 },
    { code: "SLO", gold: 1, silver: 1, bronze: 0 },
    { code: "AUS", gold: 1, silver: 0, bronze: 0 },
    { code: "CAN", gold: 0, silver: 3, bronze: 4 },
    { code: "CHN", gold: 0, silver: 2, bronze: 2 },
    { code: "NZL", gold: 0, silver: 1, bronze: 1 },
    { code: "LAT", gold: 0, silver: 1, bronze: 0 },
    { code: "POL", gold: 0, silver: 1, bronze: 0 },
    { code: "FIN", gold: 0, silver: 0, bronze: 2 },
    { code: "GBR", gold: 0, silver: 0, bronze: 1 },
    { code: "BEL", gold: 0, silver: 0, bronze: 1 },
  ]);
}

// ─── ROUTES ─────────────────────────────────────────────

// API: Get medal data
app.get("/api/medals", (req, res) => {
  res.json({
    medals: medalCache.data || [],
    lastUpdated: medalCache.lastUpdated,
    source: medalCache.source,
    totalEvents: 116,
    completedEvents: medalCache.data
      ? medalCache.data.reduce((s, c) => s + c.gold + c.silver + c.bronze, 0)
      : 0,
    gamesName: "Milano Cortina 2026",
  });
});

// API: Force refresh
app.post("/api/refresh", async (req, res) => {
  await refreshData();
  res.json({ ok: true, lastUpdated: medalCache.lastUpdated });
});

// API: Health check for Cloud Run
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", lastUpdated: medalCache.lastUpdated });
});

// Serve static files
app.use(express.static(join(__dirname, "public")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// ─── STARTUP ────────────────────────────────────────────

// Initial data load
await refreshData();

// Auto-refresh every 5 minutes
setInterval(refreshData, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`\n🏅 Medal Tracker running on http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/medals`);
  console.log(`   Auto-refresh: every 5 minutes\n`);
});
