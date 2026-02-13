import { useState, useEffect, useMemo } from "react";

// ─── DATA ───────────────────────────────────────────────
// Current as of Feb 12, 2026 ~4:30pm ET (44 of 116 events completed)
// Structure allows easy manual updates or future API integration
const MEDAL_DATA = [
  { code: "NOR", name: "Norway", flag: "🇳🇴", gold: 7, silver: 2, bronze: 5, population: 5.5, gdp: 579, continent: "Europe", historicalWinterTotal: 406 },
  { code: "ITA", name: "Italy", flag: "🇮🇹", gold: 6, silver: 3, bronze: 8, population: 59, gdp: 2254, continent: "Europe", historicalWinterTotal: 141, isHost: true },
  { code: "USA", name: "United States", flag: "🇺🇸", gold: 4, silver: 7, bronze: 3, population: 335, gdp: 28781, continent: "Americas", historicalWinterTotal: 330 },
  { code: "GER", name: "Germany", flag: "🇩🇪", gold: 4, silver: 3, bronze: 2, population: 84, gdp: 4456, continent: "Europe", historicalWinterTotal: 267 },
  { code: "SWE", name: "Sweden", flag: "🇸🇪", gold: 4, silver: 3, bronze: 1, population: 10.5, gdp: 593, continent: "Europe", historicalWinterTotal: 168 },
  { code: "SUI", name: "Switzerland", flag: "🇨🇭", gold: 4, silver: 1, bronze: 2, population: 8.8, gdp: 884, continent: "Europe", historicalWinterTotal: 167 },
  { code: "AUT", name: "Austria", flag: "🇦🇹", gold: 3, silver: 6, bronze: 3, population: 9.1, gdp: 516, continent: "Europe", historicalWinterTotal: 250 },
  { code: "FRA", name: "France", flag: "🇫🇷", gold: 3, silver: 4, bronze: 1, population: 68, gdp: 3130, continent: "Europe", historicalWinterTotal: 158 },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", gold: 3, silver: 3, bronze: 0, population: 17.8, gdp: 1118, continent: "Europe", historicalWinterTotal: 130 },
  { code: "JPN", name: "Japan", flag: "🇯🇵", gold: 2, silver: 2, bronze: 6, population: 124, gdp: 4213, continent: "Asia", historicalWinterTotal: 75 },
  { code: "KOR", name: "South Korea", flag: "🇰🇷", gold: 1, silver: 1, bronze: 2, population: 52, gdp: 1712, continent: "Asia", historicalWinterTotal: 75 },
  { code: "CZE", name: "Czechia", flag: "🇨🇿", gold: 1, silver: 1, bronze: 0, population: 10.9, gdp: 330, continent: "Europe", historicalWinterTotal: 32 },
  { code: "SLO", name: "Slovenia", flag: "🇸🇮", gold: 1, silver: 1, bronze: 0, population: 2.1, gdp: 68, continent: "Europe", historicalWinterTotal: 18 },
  { code: "AUS", name: "Australia", flag: "🇦🇺", gold: 1, silver: 0, bronze: 0, population: 26, gdp: 1724, continent: "Oceania", historicalWinterTotal: 18 },
  { code: "CAN", name: "Canada", flag: "🇨🇦", gold: 0, silver: 3, bronze: 4, population: 40, gdp: 2140, continent: "Americas", historicalWinterTotal: 225 },
  { code: "CHN", name: "China", flag: "🇨🇳", gold: 0, silver: 2, bronze: 2, population: 1412, gdp: 17794, continent: "Asia", historicalWinterTotal: 77 },
  { code: "NZL", name: "New Zealand", flag: "🇳🇿", gold: 0, silver: 1, bronze: 1, population: 5.2, gdp: 252, continent: "Oceania", historicalWinterTotal: 5 },
  { code: "LAT", name: "Latvia", flag: "🇱🇻", gold: 0, silver: 1, bronze: 0, population: 1.8, gdp: 47, continent: "Europe", historicalWinterTotal: 10 },
  { code: "POL", name: "Poland", flag: "🇵🇱", gold: 0, silver: 1, bronze: 0, population: 37, gdp: 842, continent: "Europe", historicalWinterTotal: 28 },
  { code: "FIN", name: "Finland", flag: "🇫🇮", gold: 0, silver: 0, bronze: 2, population: 5.6, gdp: 300, continent: "Europe", historicalWinterTotal: 178 },
  { code: "GBR", name: "Great Britain", flag: "🇬🇧", gold: 0, silver: 0, bronze: 1, population: 67, gdp: 3340, continent: "Europe", historicalWinterTotal: 35 },
  { code: "BEL", name: "Belgium", flag: "🇧🇪", gold: 0, silver: 0, bronze: 1, population: 11.6, gdp: 624, continent: "Europe", historicalWinterTotal: 8 },
];

const TOTAL_EVENTS = 116;
const COMPLETED_EVENTS = 44;
const GAMES_NAME = "Milano Cortina 2026";
const LAST_UPDATED = "Feb 12, 2026";

// ─── HELPERS ────────────────────────────────────────────
const total = (c) => c.gold + c.silver + c.bronze;
const perCapita = (c) => (total(c) / c.population) * 10;
const goldPerCapita = (c) => (c.gold / c.population) * 10;
const efficiency = (c) => (c.gold / Math.max(total(c), 1)) * 100;
const medalsPerBillion = (c) => (total(c) / c.gdp) * 1000;

// ─── SORT MODES ─────────────────────────────────────────
const SORT_MODES = {
  traditional: { label: "Official Ranking", desc: "IOC standard: gold → silver → bronze", fn: (a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze },
  total: { label: "Total Medals", desc: "Raw medal count", fn: (a, b) => total(b) - total(a) || b.gold - a.gold },
  perCapita: { label: "Per Capita", desc: "Medals per 10M people", fn: (a, b) => perCapita(b) - perCapita(a) },
  goldPerCapita: { label: "Gold Per Capita", desc: "Golds per 10M people", fn: (a, b) => goldPerCapita(b) - goldPerCapita(a) },
  efficiency: { label: "Gold Rate", desc: "% of medals that are gold", fn: (a, b) => efficiency(b) - efficiency(a) },
  gdp: { label: "Per GDP", desc: "Medals per $1B GDP", fn: (a, b) => medalsPerBillion(b) - medalsPerBillion(a) },
};

// ─── NARRATIVE GENERATOR ────────────────────────────────
function generateNarratives(data) {
  const sorted = [...data].sort(SORT_MODES.traditional.fn);
  const byTotal = [...data].sort(SORT_MODES.total.fn);
  const byPC = [...data].sort(SORT_MODES.perCapita.fn);
  const byEff = [...data].filter(c => total(c) >= 3).sort(SORT_MODES.efficiency.fn);
  const totalMedals = data.reduce((s, c) => s + total(c), 0);
  const totalGold = data.reduce((s, c) => s + c.gold, 0);

  const stories = [];

  // Lead narrative
  const leader = sorted[0];
  stories.push({
    icon: "👑",
    title: `${leader.flag} ${leader.name} Leads the Pack`,
    text: `With ${leader.gold} golds and ${total(leader)} total medals, ${leader.name} sits atop the standings. They've claimed ${((leader.gold / totalGold) * 100).toFixed(0)}% of all gold medals awarded so far.`,
    color: "#FFD700",
  });

  // Host nation
  const host = data.find(c => c.isHost);
  if (host && total(host) > 0) {
    stories.push({
      icon: "🏠",
      title: `Host Nation ${host.flag} Having a Games to Remember`,
      text: `Italy leads in total medals with ${total(host)} — fueled by ${host.bronze} bronze medals. The home crowd advantage is real: their ${total(host)} medals already surpass their 2022 Beijing total of 17.`,
      color: "#00C853",
    });
  }

  // Per capita king
  const pcKing = byPC[0];
  stories.push({
    icon: "📊",
    title: `The Real Winner? ${pcKing.flag} ${pcKing.name}`,
    text: `Adjusting for population, ${pcKing.name} (${pcKing.population}M people) has ${perCapita(pcKing).toFixed(1)} medals per 10 million citizens. That's ${(perCapita(pcKing) / perCapita(byPC.find(c => c.code === "USA") || byPC[1])).toFixed(0)}x the US rate.`,
    color: "#448AFF",
  });

  // Efficiency story
  if (byEff.length > 0) {
    const eff = byEff[0];
    stories.push({
      icon: "🎯",
      title: `${eff.flag} ${eff.name}: Quality Over Quantity`,
      text: `${efficiency(eff).toFixed(0)}% of ${eff.name}'s medals are gold — the highest gold conversion rate among countries with 3+ medals. When they medal, they medal big.`,
      color: "#FF6D00",
    });
  }

  // Surprise / overperformer
  const surprises = data.filter(c => total(c) > 0 && c.historicalWinterTotal < 30).sort((a, b) => total(b) - total(a));
  if (surprises.length > 0) {
    const s = surprises[0];
    stories.push({
      icon: "🚀",
      title: `${s.flag} ${s.name} Punching Above Their Weight`,
      text: `With ${total(s)} medals so far, ${s.name} is already at ${((total(s) / s.historicalWinterTotal) * 100).toFixed(0)}% of their all-time Winter Olympics total (${s.historicalWinterTotal}) — in just one week.`,
      color: "#E040FB",
    });
  }

  // Canada heartbreak
  const canada = data.find(c => c.code === "CAN");
  if (canada && canada.gold === 0 && total(canada) > 0) {
    stories.push({
      icon: "💔",
      title: `${canada.flag} Canada: Silver Lining, No Gold Yet`,
      text: `The winter sports powerhouse has ${total(canada)} medals but zero golds. With ${canada.silver} silvers and ${canada.bronze} bronzes, they're knocking on the door but can't break through. Hockey starts soon — that could change everything.`,
      color: "#FF1744",
    });
  }

  // Progress
  const pct = ((COMPLETED_EVENTS / TOTAL_EVENTS) * 100).toFixed(0);
  stories.push({
    icon: "⏱️",
    title: `${COMPLETED_EVENTS} of ${TOTAL_EVENTS} Events Complete`,
    text: `The Games are ${pct}% done with ${totalMedals} medals awarded across ${data.filter(c => total(c) > 0).length} nations. ${TOTAL_EVENTS - COMPLETED_EVENTS} events remain — including men's and women's hockey, which could reshape the standings.`,
    color: "#78909C",
  });

  return stories;
}

// ─── COMPONENTS ─────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <span>{display}{suffix}</span>;
}

function MedalPill({ gold, silver, bronze }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <span style={{
        background: "linear-gradient(135deg, #FFD700, #FFA000)",
        color: "#1a1a2e", fontWeight: 800, borderRadius: "6px",
        padding: "2px 8px", fontSize: "13px", minWidth: "24px",
        textAlign: "center", boxShadow: "0 2px 8px rgba(255,215,0,0.3)",
      }}>{gold}</span>
      <span style={{
        background: "linear-gradient(135deg, #E0E0E0, #9E9E9E)",
        color: "#1a1a2e", fontWeight: 800, borderRadius: "6px",
        padding: "2px 8px", fontSize: "13px", minWidth: "24px",
        textAlign: "center", boxShadow: "0 2px 8px rgba(192,192,192,0.3)",
      }}>{silver}</span>
      <span style={{
        background: "linear-gradient(135deg, #CD7F32, #8B4513)",
        color: "#fff", fontWeight: 800, borderRadius: "6px",
        padding: "2px 8px", fontSize: "13px", minWidth: "24px",
        textAlign: "center", boxShadow: "0 2px 8px rgba(205,127,50,0.3)",
      }}>{bronze}</span>
    </div>
  );
}

function MedalBar({ country, maxTotal, rank, sortMode }) {
  const t = total(country);
  const barWidth = (t / maxTotal) * 100;
  const goldWidth = (country.gold / maxTotal) * 100;
  const silverWidth = (country.silver / maxTotal) * 100;
  const bronzeWidth = (country.bronze / maxTotal) * 100;

  let statValue = "";
  if (sortMode === "perCapita") statValue = `${perCapita(country).toFixed(1)} / 10M`;
  else if (sortMode === "goldPerCapita") statValue = `${goldPerCapita(country).toFixed(1)} / 10M`;
  else if (sortMode === "efficiency") statValue = `${efficiency(country).toFixed(0)}% gold`;
  else if (sortMode === "gdp") statValue = `${medalsPerBillion(country).toFixed(2)} / $1B`;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 40px minmax(80px, 140px) 1fr 50px",
      alignItems: "center",
      gap: "10px",
      padding: "8px 12px",
      borderRadius: "8px",
      background: rank <= 3 ? `rgba(255,215,0,${0.08 - rank * 0.02})` : "transparent",
      transition: "all 0.3s ease",
      animation: `slideIn 0.5s ease ${rank * 0.05}s both`,
    }}>
      <span style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: rank <= 3 ? "18px" : "14px",
        fontWeight: 700,
        color: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "#666",
        textAlign: "center",
      }}>
        {rank}
      </span>
      <span style={{ fontSize: "28px", lineHeight: 1 }}>{country.flag}</span>
      <div>
        <span style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 600,
          fontSize: "14px",
          color: "#e0e0e0",
          letterSpacing: "0.5px",
        }}>
          {country.code}
          {country.isHost && <span style={{ color: "#FFD700", marginLeft: "4px", fontSize: "10px" }}>★ HOST</span>}
        </span>
        {statValue && (
          <div style={{ fontSize: "11px", color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>
            {statValue}
          </div>
        )}
      </div>
      <div style={{
        display: "flex",
        height: "22px",
        borderRadius: "4px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{
          width: `${goldWidth}%`,
          background: "linear-gradient(135deg, #FFD700, #FFA000)",
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }} />
        <div style={{
          width: `${silverWidth}%`,
          background: "linear-gradient(135deg, #E0E0E0, #9E9E9E)",
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }} />
        <div style={{
          width: `${bronzeWidth}%`,
          background: "linear-gradient(135deg, #CD7F32, #8B4513)",
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }} />
      </div>
      <span style={{
        fontFamily: "'Oswald', sans-serif",
        fontWeight: 700,
        fontSize: "18px",
        color: "#fff",
        textAlign: "right",
      }}>
        {t}
      </span>
    </div>
  );
}

function NarrativeCard({ story, index }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${story.color}22`,
      borderLeft: `3px solid ${story.color}`,
      borderRadius: "12px",
      padding: "20px",
      animation: `fadeUp 0.6s ease ${index * 0.1}s both`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "default",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${story.color}15`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "24px", lineHeight: 1 }}>{story.icon}</span>
        <div>
          <h3 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: story.color,
            margin: "0 0 6px 0",
            letterSpacing: "0.3px",
          }}>{story.title}</h3>
          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "14px",
            color: "#b0b0b0",
            margin: 0,
            lineHeight: 1.6,
          }}>{story.text}</p>
        </div>
      </div>
    </div>
  );
}

function BigStat({ value, label, color = "#FFD700" }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: "42px",
        fontWeight: 700,
        color,
        lineHeight: 1,
        textShadow: `0 0 40px ${color}33`,
      }}>
        <AnimatedNumber value={typeof value === "number" ? value : parseInt(value)} suffix={typeof value === "string" && value.includes("%") ? "%" : ""} />
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        marginTop: "4px",
      }}>{label}</div>
    </div>
  );
}

function ContinentBreakdown({ data }) {
  const continents = {};
  data.forEach(c => {
    if (!continents[c.continent]) continents[c.continent] = { gold: 0, silver: 0, bronze: 0, countries: 0 };
    continents[c.continent].gold += c.gold;
    continents[c.continent].silver += c.silver;
    continents[c.continent].bronze += c.bronze;
    if (total(c) > 0) continents[c.continent].countries++;
  });

  const contEmoji = { Europe: "🌍", Americas: "🌎", Asia: "🌏", Oceania: "🏝️" };
  const sorted = Object.entries(continents).sort((a, b) => (b[1].gold + b[1].silver + b[1].bronze) - (a[1].gold + a[1].silver + a[1].bronze));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
      {sorted.map(([name, stats]) => (
        <div key={name} style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "16px 20px",
          minWidth: "140px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "20px" }}>{contEmoji[name] || "🌐"}</div>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#e0e0e0",
            margin: "6px 0",
          }}>{name}</div>
          <MedalPill gold={stats.gold} silver={stats.silver} bronze={stats.bronze} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#666",
            marginTop: "8px",
          }}>{stats.countries} nations</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────
export default function MedalTracker() {
  const [sortMode, setSortMode] = useState("traditional");
  const [showNarratives, setShowNarratives] = useState(true);

  const sorted = useMemo(() =>
    [...MEDAL_DATA].filter(c => total(c) > 0).sort(SORT_MODES[sortMode].fn),
    [sortMode]
  );

  const maxTotal = useMemo(() => Math.max(...sorted.map(total)), [sorted]);
  const narratives = useMemo(() => generateNarratives(MEDAL_DATA), []);

  const totalMedals = MEDAL_DATA.reduce((s, c) => s + total(c), 0);
  const totalGold = MEDAL_DATA.reduce((s, c) => s + c.gold, 0);
  const totalCountries = MEDAL_DATA.filter(c => total(c) > 0).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a1a",
      color: "#e0e0e0",
      fontFamily: "'Source Serif 4', Georgia, serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, #FFD700 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, #448AFF 0%, transparent 50%),
                         radial-gradient(circle at 50% 80%, #FF6D00 0%, transparent 50%)`,
      }} />

      {/* Noise overlay */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.015, zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#FFD700",
            textTransform: "uppercase",
            letterSpacing: "4px",
            marginBottom: "12px",
          }}>
            ❄️ WINTER OLYMPICS ❄️
          </div>

          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: "clamp(36px, 8vw, 64px)",
            fontWeight: 700,
            margin: 0,
            lineHeight: 0.95,
            background: "linear-gradient(135deg, #FFD700, #FFA000, #FFD700, #fff, #FFD700)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 3s linear infinite",
            letterSpacing: "-1px",
          }}>
            MEDAL TRACKER
          </h1>

          <div style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "16px",
            color: "#888",
            marginTop: "8px",
            fontStyle: "italic",
          }}>
            {GAMES_NAME}
          </div>

          {/* Big stats row */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginTop: "32px",
            flexWrap: "wrap",
          }}>
            <BigStat value={totalMedals} label="Medals Awarded" color="#FFD700" />
            <BigStat value={totalGold} label="Gold Medals" color="#FFA000" />
            <BigStat value={totalCountries} label="Nations on Podium" color="#448AFF" />
            <BigStat value={COMPLETED_EVENTS} label={`of ${TOTAL_EVENTS} Events`} color="#78909C" />
          </div>

          {/* Progress bar */}
          <div style={{
            margin: "24px auto 0",
            maxWidth: "500px",
            height: "4px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${(COMPLETED_EVENTS / TOTAL_EVENTS) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FFD700, #FF6D00)",
              borderRadius: "2px",
              transition: "width 1s ease",
            }} />
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#555",
            marginTop: "6px",
          }}>
            {((COMPLETED_EVENTS / TOTAL_EVENTS) * 100).toFixed(0)}% COMPLETE · UPDATED {LAST_UPDATED.toUpperCase()}
          </div>
        </header>

        {/* Narratives Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <button
            onClick={() => setShowNarratives(!showNarratives)}
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: "12px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: showNarratives ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${showNarratives ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showNarratives ? "#FFD700" : "#888",
              padding: "8px 20px",
              borderRadius: "20px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {showNarratives ? "📖 Stories" : "📖 Show Stories"}
          </button>
        </div>

        {/* Narrative Cards */}
        {showNarratives && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
            marginBottom: "40px",
          }}>
            {narratives.map((story, i) => (
              <NarrativeCard key={i} story={story} index={i} />
            ))}
          </div>
        )}

        {/* Sort Mode Selector */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          justifyContent: "center",
          marginBottom: "20px",
        }}>
          {Object.entries(SORT_MODES).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                background: sortMode === key ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${sortMode === key ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.06)"}`,
                color: sortMode === key ? "#FFD700" : "#888",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div style={{
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "#555",
          marginBottom: "12px",
        }}>
          {SORT_MODES[sortMode].desc}
        </div>

        {/* Medal Table */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "16px 8px",
          marginBottom: "40px",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "32px 40px minmax(80px, 140px) 1fr 50px",
            gap: "10px",
            padding: "4px 12px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "8px",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#555", textAlign: "center" }}>#</span>
            <span />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#555" }}>NATION</span>
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#FFD700" }}>G</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#C0C0C0", marginLeft: "4px" }}>S</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#CD7F32", marginLeft: "4px" }}>B</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#555", textAlign: "right" }}>TOT</span>
          </div>

          {sorted.map((country, i) => (
            <MedalBar
              key={country.code}
              country={country}
              maxTotal={maxTotal}
              rank={i + 1}
              sortMode={sortMode}
            />
          ))}
        </div>

        {/* Continent Breakdown */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: "20px",
            fontWeight: 600,
            color: "#FFD700",
            textAlign: "center",
            marginBottom: "16px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>By Continent</h2>
          <ContinentBreakdown data={MEDAL_DATA} />
        </div>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          padding: "24px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#444",
            lineHeight: 1.8,
          }}>
            MEDAL TRACKER · BUILT BY <a href="https://bhackerb.com" style={{ color: "#FFD700", textDecoration: "none" }}>BHACKERB</a>
            <br />
            DATA: IOC · POPULATION: WORLD BANK 2024 · GDP: IMF 2024 (USD BILLIONS)
            <br />
            NOT AFFILIATED WITH THE IOC OR OLYMPIC MOVEMENT
          </div>
        </footer>
      </div>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 3px; }

        button:hover { filter: brightness(1.1); }

        @media (max-width: 600px) {
          .medal-bar { grid-template-columns: 24px 30px 1fr 40px !important; }
        }
      `}</style>
    </div>
  );
}
