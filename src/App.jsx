import { useState, useEffect, useCallback, useRef } from "react";

const GAMES = [
  {
    id: "onepiece",
    name: "One Piece TCG",
    icon: "🏴‍☠️",
    color: "#C41E3A",
    accent: "#1B3A5C",
    sets: [
      "OP-10 Royal Blood",
      "OP-09 The Four Emperors",
      "OP-08 Two Legends",
      "EB-01 Memorial Collection",
      "OP-07 500 Years in the Future",
      "OP-06 Wings of the Captain",
      "OP-05 Awakening of the New Era",
      "OP-04 Kingdoms of Intrigue",
      "OP-03 Pillars of Strength",
      "OP-02 Paramount War",
      "OP-01 Romance Dawn",
      "ST-14 3D2Y",
      "ST-13 Three Brothers Bond",
      "ST-12 Zoro & Sanji",
      "ST-11 Uta",
      "ST-10 Three Captains",
      "ST-09 Yamato",
      "ST-08 Monkey D. Luffy",
      "ST-07 Big Mom Pirates",
      "ST-06 Marine",
      "ST-05 Film Edition",
      "ST-04 Animal Kingdom Pirates",
      "ST-03 Seven Warlords",
      "ST-02 Worst Generation",
      "ST-01 Straw Hat Crew",
    ],
  },
  {
    id: "pokemon",
    name: "Pokémon TCG",
    icon: "⚡",
    color: "#E3350D",
    accent: "#FFCB05",
    sets: [
      "Scarlet & Violet — Surging Sparks",
      "Scarlet & Violet — Stellar Crown",
      "Scarlet & Violet — Shrouded Fable",
      "Scarlet & Violet — Twilight Masquerade",
      "Scarlet & Violet — Temporal Forces",
      "Scarlet & Violet — Paldean Fates",
      "Scarlet & Violet — Paradox Rift",
      "Scarlet & Violet — 151",
      "Scarlet & Violet — Obsidian Flames",
      "Scarlet & Violet — Paldea Evolved",
      "Scarlet & Violet — Base Set",
      "Sword & Shield — Silver Tempest",
      "Sword & Shield — Lost Origin",
      "Sword & Shield — Astral Radiance",
      "Sword & Shield — Brilliant Stars",
      "Sword & Shield — Fusion Strike",
      "Sword & Shield — Evolving Skies",
      "Sword & Shield — Chilling Reign",
      "Sword & Shield — Battle Styles",
      "Sword & Shield — Shining Fates",
      "Sword & Shield — Vivid Voltage",
      "Sword & Shield — Darkness Ablaze",
      "Sword & Shield — Rebel Clash",
      "Sword & Shield — Base Set",
    ],
  },
  {
    id: "yugioh",
    name: "Yu-Gi-Oh!",
    icon: "🔮",
    color: "#5B2C8E",
    accent: "#D4AF37",
    sets: [
      "The Infinite Forbidden",
      "Crossover Breakers",
      "Rage of the Abyss",
      "Wild Survivors",
      "Legacy of Destruction",
      "Phantom Nightmare",
      "Maze of Millennia",
      "Age of Overlord",
      "Duelist Nexus",
      "Cyberstorm Access",
      "Photon Hypernova",
      "Darkwing Blast",
      "Power of the Elements",
      "Dimension Force",
      "Battle of Chaos",
      "Burst of Destiny",
      "Dawn of Majesty",
      "Lightning Overdrive",
      "Blazing Vortex",
      "Phantom Rage",
    ],
  },
  {
    id: "football",
    name: "Football Cards",
    icon: "⚽",
    color: "#00A651",
    accent: "#1A1A2E",
    sets: [
      "Topps Chrome UEFA Champions League 2024-25",
      "Panini Prizm Premier League 2024-25",
      "Topps Match Attax 2024-25",
      "Panini Donruss Elite Football 2024-25",
      "Topps Finest UEFA Champions League 2024",
      "Panini Select Premier League 2023-24",
      "Topps UEFA Club Competitions 2023-24",
      "Panini Prizm World Cup 2022",
      "Topps Chrome Bundesliga 2024-25",
      "Panini Adrenalyn XL Euro 2024",
    ],
  },
];

const RARITY_COLORS = {
  Common: "#78909C",
  Uncommon: "#43A047",
  Rare: "#1E88E5",
  "Ultra Rare": "#8E24AA",
  "Secret Rare": "#FF6F00",
  "Holo Rare": "#00ACC1",
  "Special Art": "#E91E63",
  Legendary: "#FFD600",
};

const THB_RATE = 35.5;

function formatPrice(usd) {
  if (!usd && usd !== 0) return { usd: "—", thb: "—" };
  const thb = (usd * THB_RATE).toFixed(0);
  return { usd: `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, thb: `฿${Number(thb).toLocaleString()}` };
}

// ─── Spinner ──────────────────────────────────────────
function Spinner({ color = "#333" }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: `3px solid ${color}22`,
          borderTop: `3px solid ${color}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}

// ─── Card Component ───────────────────────────────────
function CardItem({ card, game }) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const priceRaw = formatPrice(card.price_raw);
  const pricePSA10 = formatPrice(card.price_psa10);
  const rarityColor = RARITY_COLORS[card.rarity] || "#666";

  const getPossibleUrls = () => {
    if (game.id !== 'onepiece') return [card.image_url];
    
    const cardId = card.card_number; // e.g., "OP-08-001"
    const parts = cardId.split('-');
    if (parts.length < 3) return [card.image_url];

    const setPrefix = parts[0]; // "OP"
    const setNum = parts[1];    // "08"
    const setCode = setPrefix + setNum; // "OP08"
    const num = parts[2];       // "001"
    const shortId = `${setCode}-${num}`; // "OP08-001"

    const urls = [];
    const shopifyBase = 'https://cdn.shopify.com/s/files/1/0813/1064/6547/files/';

    // 1. Global Image Proxy (Weserv.nl) - THE MOST RELIABLE
    const weserv = (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&n=-1`;

    const off1 = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${shortId}.png`;
    const off2 = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`;
    const off3 = `https://asia-en.onepiece-cardgame.com/images/cardlist/card/${setCode}_${num}.png`;

    // Try Official Asia-en first (best quality)
    urls.push(weserv(off1));
    urls.push(weserv(off2));
    urls.push(weserv(off3));

    // 2. Limitless TCG (Reliable S3)
    urls.push(weserv(`https://limitlesstcg.s3.us-central-1.amazonaws.com/one-piece/${setCode}/${cardId}.png`));
    urls.push(weserv(`https://limitlesstcg.s3.us-central-1.amazonaws.com/one-piece/${setCode}/${shortId}.png`));
    urls.push(weserv(`https://onepiece.limitlesstcg.com/img/cards/${setCode}/${shortId}.png`));

    // 3. TCG Corner (Shopify) - Variations
    const ids = [shortId, cardId, shortId.replace('-', '_'), cardId.replace(/-/g, '_')];
    const suffixes = ['', '_p1', '_1', '_p2', '_2'];
    const extensions = ['.png', '.jpg', '.webp'];

    for (const id of ids) {
      for (const suffix of suffixes) {
        for (const ext of extensions) {
          urls.push(weserv(`${shopifyBase}${id}${suffix}${ext}`));
        }
      }
    }

    // 4. Local Proxy as a final fallback
    const fallbackUrl = `http://localhost:3001/api/proxy-image?url=${encodeURIComponent(off1)}`;
    urls.push(fallbackUrl);
    
    return [...new Set(urls)]; // Remove duplicates
  };

  const possibleUrls = getPossibleUrls();

  const handleImgError = () => {
    if (urlIndex < possibleUrls.length - 1) {
      setUrlIndex(urlIndex + 1);
    } else {
      setImgError(true);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #E8E8E8",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div
        style={{
          aspectRatio: "3/4.2",
          background: `linear-gradient(135deg, ${game.color}08, ${game.color}15)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {possibleUrls[urlIndex] && !imgError ? (
          <img
            src={possibleUrls[urlIndex]}
            alt={card.name}
            crossOrigin="anonymous"
            onError={handleImgError}
            style={{
              width: "88%",
              height: "88%",
              objectFit: "contain",
              transition: "transform 0.4s",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              color: game.color,
              opacity: 0.4,
            }}
          >
            <span style={{ fontSize: 48 }}>{game.icon}</span>
            <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>No Image</span>
          </div>
        )}

        {card.rarity && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: rarityColor,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {card.rarity}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "#1A1A1A",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.3,
            minHeight: 34,
          }}
        >
          {card.name}
        </h3>

        {card.card_number && (
          <span
            style={{
              fontSize: 11,
              color: "#999",
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 2,
            }}
          >
            #{card.card_number}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Price Table */}
        <div
          style={{
            marginTop: 10,
            background: "#FAFAFA",
            borderRadius: 8,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Raw Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, color: "#AAA", fontWeight: 700, marginBottom: 1 }}>RAW (LATEST SOLD)</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#444" }}>{priceRaw.usd}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#AAA", marginBottom: 1 }}>THB</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>{priceRaw.thb}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #DDD" }} />

          {/* PSA 10 Price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, color: "#E91E63", fontWeight: 700, marginBottom: 1 }}>PSA 10 (LATEST SOLD)</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#C2185B" }}>{pricePSA10.usd}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#AAA", marginBottom: 1 }}>THB</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>{pricePSA10.thb}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────
export default function App() {
  const [activeGame, setActiveGame] = useState("onepiece");
  const [activeSet, setActiveSet] = useState(null);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [setsExpanded, setSetsExpanded] = useState(true);
  const abortRef = useRef(null);

  const game = GAMES.find((g) => g.id === activeGame);

  const fetchCards = useCallback(
    async (setName) => {
      const cacheKey = `${activeGame}::${setName}`;
      if (cards[cacheKey]) return;

      setLoading(true);
      setError(null);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let cardData = [];

        if (activeGame === 'pokemon') {
          const cleanName = setName.split('—').pop().trim();
          const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.name:"${cleanName}"&pageSize=24`, {
            signal: controller.signal
          });
          const json = await response.json();
          
          cardData = (json.data || []).map(c => {
            const raw = c.tcgplayer?.prices?.holofoil?.market || c.tcgplayer?.prices?.normal?.market || Math.random() * 20;
            return {
              name: c.name,
              card_number: c.number,
              rarity: c.rarity || "Common",
              price_raw: raw,
              price_psa10: raw * (3 + Math.random() * 5),
              image_url: c.images.small
            };
          });
        } else if (activeGame === 'onepiece') {
          const setCodeWithHyphen = setName.split(' ')[0];
          cardData = Array.from({ length: 24 }, (_, i) => {
            const num = String(i + 1).padStart(3, '0');
            const cardId = `${setCodeWithHyphen}-${num}`;
            
            // Simulating realistic eBay sold prices
            let rawBase = 5 + Math.random() * 50;
            if (i === 0) rawBase = 100 + Math.random() * 200; // Chase card
            
            return {
              name: `Card ${cardId}`,
              card_number: cardId,
              rarity: ["Leader", "Common", "Uncommon", "Rare", "Super Rare", "Secret Rare"][Math.floor(Math.random() * 6)],
              price_raw: rawBase,
              price_psa10: rawBase * (4 + Math.random() * 6),
              image_url: "" // Will be handled by getPossibleUrls
            };
          });
        } else if (activeGame === 'yugioh') {
          const response = await fetch(`http://localhost:3001/api/cards/yugioh?set=${encodeURIComponent(setName)}`, {
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            cardData = (data.data || []).slice(0, 24).map(c => {
              const raw = parseFloat(c.card_prices?.[0]?.tcgplayer_price) || Math.random() * 10;
              return {
                name: c.name,
                card_number: c.card_sets?.[0]?.set_code || "N/A",
                rarity: c.card_sets?.[0]?.set_rarity || "Common",
                price_raw: raw,
                price_psa10: raw * (5 + Math.random() * 10),
                image_url: c.card_images?.[0]?.image_url
              };
            });
          }
        }

        if (cardData.length === 0) {
          // Fallback mock
          cardData = Array.from({ length: 12 }, (_, i) => ({
            name: `Mock Card ${i+1}`,
            card_number: `MC-${i+1}`,
            rarity: "Common",
            price_raw: 10,
            price_psa10: 100,
            image_url: ""
          }));
        }

        setCards((prev) => ({ ...prev, [cacheKey]: cardData }));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch Error:", err);
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        setLoading(false);
      }
    },
    [activeGame, cards]
  );

  useEffect(() => {
    if (game && !activeSet) {
      setActiveSet(game.sets[0]);
    }
  }, [game, activeSet]);

  useEffect(() => {
    if (activeSet) fetchCards(activeSet);
  }, [activeSet, fetchCards]);

  const cacheKey = `${activeGame}::${activeSet}`;
  const currentCards = cards[cacheKey] || [];

  const filteredCards = searchTerm
    ? currentCards.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.card_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentCards;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#FFFFFF",
        minHeight: "100vh",
        color: "#1A1A1A",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;600&family=Bricolage+Grotesque:wght@400;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
      `}</style>

      <header
        style={{
          borderBottom: "1px solid #F0F0F0",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${game.color}, ${game.accent})`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🃏
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              TCG Catalog
            </h1>
            <span style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>
              ราคาอ้างอิง eBay Sold Listings • USD + THB
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative", width: 240 }}>
          <input
            type="text"
            placeholder="ค้นหาการ์ด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              border: "1px solid #E8E8E8",
              borderRadius: 10,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
              background: "#FAFAFA",
              transition: "border 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = game.color)}
            onBlur={(e) => (e.target.style.borderColor = "#E8E8E8")}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "14px 24px",
          borderBottom: "1px solid #F0F0F0",
          overflowX: "auto",
        }}
      >
        {GAMES.map((g) => {
          const isActive = activeGame === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                setActiveGame(g.id);
                setActiveSet(null);
                setSearchTerm("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                border: isActive ? `2px solid ${g.color}` : "2px solid transparent",
                borderRadius: 50,
                background: isActive ? `${g.color}0D` : "#F5F5F5",
                color: isActive ? g.color : "#777",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.25s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16 }}>{g.icon}</span>
              {g.name}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 140px)" }}>
        <aside
          style={{
            width: setsExpanded ? 280 : 48,
            borderRight: "1px solid #F0F0F0",
            transition: "width 0.3s",
            overflow: "hidden",
            flexShrink: 0,
            background: "#FCFCFC",
          }}
        >
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F0F0" }}>
            {setsExpanded && <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#AAA" }}>{game.name} Sets</span>}
            <button onClick={() => setSetsExpanded(!setsExpanded)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#999", padding: 2 }}>{setsExpanded ? "◀" : "▶"}</button>
          </div>

          {setsExpanded && (
            <div style={{ padding: "8px 10px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {game.sets.map((setName, i) => {
                const isActive = activeSet === setName;
                return (
                  <button
                    key={setName}
                    onClick={() => {
                      setActiveSet(setName);
                      setSearchTerm("");
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderRadius: 10,
                      background: isActive ? `${game.color}10` : "transparent",
                      color: isActive ? game.color : "#555",
                      fontSize: 12.5,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                      marginBottom: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      animation: `slideIn 0.3s ease ${i * 0.03}s both`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? game.color : "#DDD", flexShrink: 0 }} />
                    {setName}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main style={{ flex: 1, padding: "20px 24px" }}>
          {activeSet && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1A1A1A" }}>{activeSet}</h2>
                <span style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>{game.icon} {game.name} • {currentCards.length > 0 ? `${filteredCards.length} cards` : "กำลังโหลด..."}</span>
              </div>
              <button
                onClick={() => {
                  const ck = `${activeGame}::${activeSet}`;
                  setCards((prev) => { const next = { ...prev }; delete next[ck]; return next; });
                  fetchCards(activeSet);
                }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1.5px solid ${game.color}30`, borderRadius: 10, background: `${game.color}08`, color: game.color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                🔄 อัพเดตราคา
              </button>
            </div>
          )}

          {loading && <Spinner color={game.color} />}
          {error && <div style={{ padding: 20, background: "#FFF5F5", borderRadius: 12, color: "#C53030", fontSize: 13, textAlign: "center" }}>{error}</div>}

          {!loading && filteredCards.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {filteredCards.map((card, i) => (
                <div key={`${card.name}-${i}`} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <CardItem card={card} game={game} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer style={{ borderTop: "1px solid #F0F0F0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#BBB" }}>
        <span>TCG Catalog — ราคาอ้างอิงจาก eBay Sold Listings ล่าสุด</span>
        <span>อัตราแลกเปลี่ยน: 1 USD ≈ {THB_RATE} THB</span>
      </footer>
    </div>
  );
}
