import { BackgroundPreset } from '../types';

/**
 * High-quality SVG vector scenes as Data URLs.
 * Loads instantly offline without external asset dependencies.
 */

// 1. Modern High-Rise Executive Office (สำนักงานผู้บริหารวิวเมือง)
const SVG_OFFICE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="60%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <!-- Outside City Sky -->
  <rect x="0" y="0" width="1024" height="680" fill="url(#sky)"/>
  <!-- Distant Skyscrapers -->
  <rect x="60" y="240" width="110" height="440" fill="#94a3b8" opacity="0.6"/>
  <rect x="180" y="160" width="140" height="520" fill="#64748b" opacity="0.7"/>
  <rect x="330" y="280" width="90" height="400" fill="#94a3b8" opacity="0.6"/>
  <rect x="440" y="120" width="180" height="560" fill="#475569" opacity="0.8"/>
  <polygon points="530,60 490,120 570,120" fill="#334155"/>
  <rect x="630" y="220" width="120" height="460" fill="#64748b" opacity="0.7"/>
  <rect x="760" y="180" width="160" height="500" fill="#475569" opacity="0.75"/>
  <rect x="930" y="260" width="90" height="420" fill="#94a3b8" opacity="0.6"/>
  <!-- Windows Grids on buildings -->
  <g fill="#fef08a" opacity="0.3">
    <rect x="460" y="160" width="20" height="30"/><rect x="500" y="160" width="20" height="30"/>
    <rect x="460" y="220" width="20" height="30"/><rect x="500" y="220" width="20" height="30"/>
    <rect x="780" y="210" width="25" height="35"/><rect x="830" y="210" width="25" height="35"/>
  </g>
  <!-- Office Floor -->
  <rect x="0" y="650" width="1024" height="374" fill="url(#floor)"/>
  <!-- Window Frames & Glass Reflection -->
  <rect x="0" y="0" width="1024" height="670" fill="url(#glass)"/>
  <rect x="30" y="0" width="20" height="670" fill="#1e293b"/>
  <rect x="340" y="0" width="20" height="670" fill="#1e293b"/>
  <rect x="680" y="0" width="20" height="670" fill="#1e293b"/>
  <rect x="1000" y="0" width="24" height="670" fill="#1e293b"/>
  <rect x="0" y="640" width="1024" height="30" fill="#0f172a"/>
  <!-- Office Indoor Plant (Left) -->
  <path d="M 60 760 Q 40 680 80 620 Q 90 700 70 760" fill="#15803d"/>
  <path d="M 90 770 Q 130 670 180 640 Q 140 720 100 770" fill="#16a34a"/>
  <path d="M 80 770 Q 70 650 110 580 Q 120 670 90 770" fill="#22c55e"/>
  <rect x="55" y="760" width="50" height="80" rx="8" fill="#475569"/>
  <!-- Office Executive Desk Edge (Foreground) -->
  <polygon points="0,850 1024,850 1024,1024 0,1024" fill="url(#desk)"/>
  <rect x="0" y="845" width="1024" height="12" fill="#92400e" opacity="0.6"/>
  <!-- Laptop on desk silhouette (Right side) -->
  <rect x="800" y="800" width="150" height="90" rx="4" fill="#0f172a" opacity="0.7"/>
  <polygon points="780,890 970,890 950,910 800,910" fill="#334155"/>
</svg>
`)}`;

// 2. Professional Meeting & Conference Room (ห้องประชุมผู้บริหาร)
const SVG_MEETING = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <!-- Background Wall -->
  <rect x="0" y="0" width="1024" height="1024" fill="url(#wall)"/>
  <!-- Ceiling Light Strips -->
  <rect x="180" y="40" width="664" height="16" rx="8" fill="#f8fafc" opacity="0.8"/>
  <rect x="120" y="80" width="784" height="8" rx="4" fill="#60a5fa" opacity="0.4"/>
  <!-- Presentation Board Screen (Center Wall) -->
  <rect x="220" y="140" width="584" height="340" rx="12" fill="#090d16" stroke="#334155" stroke-width="6"/>
  <rect x="236" y="156" width="552" height="308" rx="8" fill="url(#screen)"/>
  <!-- Board Graphs & Business Graphics -->
  <text x="270" y="210" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">Q4 PROJECT ROADMAP</text>
  <path d="M 270 380 L 360 320 L 450 350 L 540 270 L 630 300 L 730 220" fill="none" stroke="#38bdf8" stroke-width="6"/>
  <circle cx="730" cy="220" r="8" fill="#f59e0b"/>
  <rect x="270" y="400" width="70" height="35" rx="4" fill="#10b981" opacity="0.8"/>
  <rect x="360" y="375" width="70" height="60" rx="4" fill="#3b82f6" opacity="0.8"/>
  <rect x="450" y="350" width="70" height="85" rx="4" fill="#8b5cf6" opacity="0.8"/>
  <!-- Conference Table Glass / Wood (Bottom Perspective) -->
  <polygon points="120,680 904,680 1024,1024 0,1024" fill="url(#table)"/>
  <polygon points="120,676 904,676 910,684 114,684" fill="#60a5fa" opacity="0.5"/>
  <!-- Ambient Side Plants & Lamps -->
  <rect x="60" y="320" width="60" height="360" rx="6" fill="#1e293b" opacity="0.6"/>
  <rect x="904" y="320" width="60" height="360" rx="6" fill="#1e293b" opacity="0.6"/>
</svg>
`)}`;

// 3. TV News & Media Studio (สตูดิโอรายการข่าวและผู้ประกาศ)
const SVG_NEWS_STUDIO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="studiorad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="neonbar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <!-- Studio Room Gradient -->
  <rect width="1024" height="1024" fill="url(#studiorad)"/>
  <!-- Curved Video Wall / World Grid -->
  <ellipse cx="512" cy="380" rx="480" ry="240" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.25"/>
  <ellipse cx="512" cy="380" rx="380" ry="190" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.3"/>
  <ellipse cx="512" cy="380" rx="260" ry="130" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.35"/>
  <line x1="512" y1="140" x2="512" y2="620" stroke="#3b82f6" stroke-width="2" opacity="0.3"/>
  <line x1="200" y1="380" x2="824" y2="380" stroke="#3b82f6" stroke-width="2" opacity="0.3"/>
  <!-- World Map Dots / Silhouette in background -->
  <circle cx="440" cy="320" r="14" fill="#38bdf8" opacity="0.6"/>
  <circle cx="470" cy="300" r="18" fill="#38bdf8" opacity="0.6"/>
  <circle cx="560" cy="340" r="16" fill="#38bdf8" opacity="0.6"/>
  <circle cx="610" cy="310" r="22" fill="#38bdf8" opacity="0.6"/>
  <circle cx="660" cy="350" r="15" fill="#38bdf8" opacity="0.6"/>
  <!-- Studio Overhead Spotlights -->
  <polygon points="160,0 240,0 360,500 40,500" fill="#38bdf8" opacity="0.08"/>
  <polygon points="864,0 784,0 664,500 984,500" fill="#818cf8" opacity="0.08"/>
  <rect x="140" y="0" width="80" height="24" rx="4" fill="#334155"/>
  <rect x="804" y="0" width="80" height="24" rx="4" fill="#334155"/>
  <!-- Neon Accent Bars -->
  <rect x="0" y="620" width="1024" height="12" fill="url(#neonbar)"/>
  <!-- Glossy Studio Stage & Anchor Desk (Foreground) -->
  <polygon points="0,740 1024,740 1024,1024 0,1024" fill="#090d16"/>
  <ellipse cx="512" cy="740" rx="540" ry="120" fill="#0f172a" stroke="#1e293b" stroke-width="4"/>
  <!-- Anchor Desk Crescent Glow -->
  <path d="M 160 840 Q 512 760 864 840 L 920 1024 L 104 1024 Z" fill="#0f172a"/>
  <path d="M 160 840 Q 512 760 864 840" fill="none" stroke="url(#neonbar)" stroke-width="12"/>
</svg>
`)}`;

// 4. Smart Classroom & Blackboard (ห้องเรียนกระดานดำและการบรรยาย)
const SVG_CLASSROOM = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="boardwood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="blackboard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="wallbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <!-- Classroom Wall -->
  <rect width="1024" height="1024" fill="url(#wallbg)"/>
  <!-- Window on Left -->
  <rect x="30" y="80" width="140" height="520" rx="8" fill="#e0f2fe" stroke="#94a3b8" stroke-width="8"/>
  <line x1="100" y1="80" x2="100" y2="600" stroke="#94a3b8" stroke-width="4"/>
  <line x1="30" y1="340" x2="170" y2="340" stroke="#94a3b8" stroke-width="4"/>
  <!-- Large Chalkboard (Center) -->
  <rect x="200" y="80" width="780" height="560" rx="14" fill="url(#boardwood)"/>
  <rect x="216" y="96" width="748" height="528" rx="8" fill="url(#blackboard)"/>
  <!-- Chalk Drawings & Text -->
  <g fill="none" stroke="#f8fafc" opacity="0.8" stroke-linecap="round">
    <text x="260" y="160" fill="#fef08a" font-family="serif" font-size="28" font-style="italic">Lesson: AI Video &amp; Voice Synthesis</text>
    <!-- Triangle & Math Formulas -->
    <polygon points="300,240 400,400 200,400" stroke-width="3"/>
    <text x="310" y="320" fill="#ffffff" font-family="serif" font-size="20">E = mc²</text>
    <path d="M 460 260 Q 520 200 580 260 T 700 260" stroke-width="3" stroke="#86efac"/>
    <text x="500" y="330" fill="#ffffff" font-family="sans-serif" font-size="18">f(x) = sin(ωt + φ)</text>
    <!-- Chemical structure / diagram -->
    <polygon points="760,220 810,250 810,310 760,340 710,310 710,250" stroke-width="3"/>
    <circle cx="760" cy="220" r="5" fill="#f8fafc"/>
    <circle cx="810" cy="250" r="5" fill="#f8fafc"/>
  </g>
  <!-- Chalk Tray & Chalk Pieces -->
  <rect x="200" y="624" width="780" height="24" fill="#92400e"/>
  <rect x="280" y="618" width="30" height="6" rx="2" fill="#ffffff"/>
  <rect x="330" y="618" width="24" height="6" rx="2" fill="#fef08a"/>
  <!-- Teacher's Podium / Lecture Table (Bottom) -->
  <polygon points="0,780 1024,780 1024,1024 0,1024" fill="#451a03"/>
  <polygon points="0,774 1024,774 1024,784 0,784" fill="#78350f"/>
</svg>
`)}`;

// 5. Anime Golden Hour Sunset & City (วิวเมืองอนิเมะยามเย็น)
const SVG_ANIME_SUNSET = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="animesky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="30%" stop-color="#9333ea"/>
      <stop offset="60%" stop-color="#f97316"/>
      <stop offset="85%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Anime Sunset Sky Gradient -->
  <rect width="1024" height="1024" fill="url(#animesky)"/>
  <!-- Giant Glowing Sun -->
  <circle cx="512" cy="540" r="180" fill="url(#sun)"/>
  <!-- Anime Fluffy Clouds -->
  <ellipse cx="280" cy="420" rx="190" ry="70" fill="#fbcfe8" opacity="0.6"/>
  <ellipse cx="360" cy="380" rx="140" ry="80" fill="#ffffff" opacity="0.8"/>
  <ellipse cx="760" cy="460" rx="220" ry="80" fill="#fed7aa" opacity="0.6"/>
  <ellipse cx="820" cy="410" rx="150" ry="70" fill="#ffffff" opacity="0.75"/>
  <!-- Distant Mountains / Hills -->
  <path d="M 0 620 Q 260 540 512 600 Q 780 520 1024 610 L 1024 1024 L 0 1024 Z" fill="#581c87" opacity="0.5"/>
  <!-- City Skyline Silhouette -->
  <polygon points="60,560 120,560 120,800 60,800" fill="#311042"/>
  <polygon points="140,500 220,500 220,800 140,800" fill="#240b33"/>
  <polygon points="240,580 310,580 310,800 240,800" fill="#311042"/>
  <polygon points="680,480 770,480 770,800 680,800" fill="#240b33"/>
  <polygon points="790,540 880,540 880,800 790,800" fill="#311042"/>
  <polygon points="900,510 970,510 970,800 900,800" fill="#240b33"/>
  <!-- Iconic Anime Power Lines & Utility Poles -->
  <line x1="80" y1="120" x2="80" y2="850" stroke="#180728" stroke-width="8"/>
  <line x1="30" y1="200" x2="140" y2="200" stroke="#180728" stroke-width="6"/>
  <line x1="30" y1="260" x2="140" y2="260" stroke="#180728" stroke-width="6"/>
  <!-- Power Cables Crossing Sky -->
  <path d="M 80 200 Q 400 320 1024 190" fill="none" stroke="#180728" stroke-width="2.5" opacity="0.8"/>
  <path d="M 80 260 Q 450 380 1024 250" fill="none" stroke="#180728" stroke-width="2.5" opacity="0.8"/>
  <path d="M 80 210 Q 550 410 1024 280" fill="none" stroke="#180728" stroke-width="2" opacity="0.7"/>
  <!-- Road / Foreground Rooftop Balcony -->
  <polygon points="0,780 1024,780 1024,1024 0,1024" fill="#180728"/>
  <!-- Balcony Handrail -->
  <line x1="0" y1="720" x2="1024" y2="720" stroke="#3b0764" stroke-width="12"/>
  <line x1="160" y1="720" x2="160" y2="780" stroke="#3b0764" stroke-width="8"/>
  <line x1="400" y1="720" x2="400" y2="780" stroke="#3b0764" stroke-width="8"/>
  <line x1="640" y1="720" x2="640" y2="780" stroke="#3b0764" stroke-width="8"/>
  <line x1="880" y1="720" x2="880" y2="780" stroke="#3b0764" stroke-width="8"/>
</svg>
`)}`;

// 6. Cozy Anime Room (ห้องนอนการ์ตูนและโต๊ะอ่านหนังสือ)
const SVG_ANIME_ROOM = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="roomwall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="windowsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
  </defs>
  <!-- Room Wall -->
  <rect width="1024" height="1024" fill="url(#roomwall)"/>
  <!-- Window with Sunshine (Left Side) -->
  <rect x="60" y="80" width="340" height="480" rx="16" fill="url(#windowsky)" stroke="#78350f" stroke-width="12"/>
  <line x1="230" y1="80" x2="230" y2="560" stroke="#78350f" stroke-width="8"/>
  <line x1="60" y1="320" x2="400" y2="320" stroke="#78350f" stroke-width="8"/>
  <!-- Sun Rays Through Window -->
  <polygon points="120,80 340,80 780,1024 200,1024" fill="#ffffff" opacity="0.18"/>
  <!-- Anime Bookshelf (Right Side) -->
  <rect x="640" y="60" width="320" height="600" rx="8" fill="#b45309"/>
  <!-- Shelves and Books -->
  <rect x="654" y="220" width="292" height="16" fill="#78350f"/>
  <rect x="654" y="420" width="292" height="16" fill="#78350f"/>
  <!-- Books Rows -->
  <rect x="670" y="100" width="24" height="120" rx="3" fill="#ef4444"/>
  <rect x="698" y="90" width="30" height="130" rx="3" fill="#3b82f6"/>
  <rect x="732" y="110" width="22" height="110" rx="3" fill="#10b981"/>
  <rect x="758" y="85" width="28" height="135" rx="3" fill="#f59e0b"/>
  <rect x="790" y="105" width="32" height="115" rx="3" fill="#8b5cf6"/>
  <!-- Manga / Figure Silhouette on middle shelf -->
  <rect x="680" y="310" width="40" height="110" rx="4" fill="#ec4899"/>
  <circle cx="820" cy="350" r="28" fill="#fbbf24"/>
  <polygon points="820,380 795,420 845,420" fill="#3b82f6"/>
  <!-- Wall Poster (Center) -->
  <rect x="440" y="120" width="160" height="220" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  <rect x="450" y="130" width="140" height="170" fill="#38bdf8"/>
  <circle cx="520" cy="180" r="30" fill="#fef08a"/>
  <!-- Wooden Room Floor & Study Desk (Bottom) -->
  <polygon points="0,720 1024,720 1024,1024 0,1024" fill="#92400e"/>
  <polygon points="0,790 1024,790 1024,1024 0,1024" fill="#78350f"/>
  <!-- Desk Lamp Silhouette -->
  <path d="M 120 790 L 140 680 L 190 710" fill="none" stroke="#e2e8f0" stroke-width="6"/>
  <polygon points="170,700 230,730 200,750" fill="#fbbf24"/>
</svg>
`)}`;

// 7. Podcast / Creator Studio (สตูดิโอพอดแคสต์ไฟนีออน)
const SVG_PODCAST = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="podrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#podrad)"/>
  <!-- Acoustic Foam Hexagon Wall Pattern -->
  <g fill="#27272a" stroke="#18181b" stroke-width="4" opacity="0.7">
    <polygon points="200,140 240,116 280,140 280,186 240,210 200,186"/>
    <polygon points="280,140 320,116 360,140 360,186 320,210 280,186"/>
    <polygon points="360,140 400,116 440,140 440,186 400,210 360,186"/>
    <polygon points="240,210 280,186 320,210 320,256 280,280 240,256"/>
    <polygon points="320,210 360,186 400,210 400,256 360,280 320,256"/>
    <!-- Right side hexes -->
    <polygon points="680,140 720,116 760,140 760,186 720,210 680,186"/>
    <polygon points="760,140 800,116 840,140 840,186 800,210 760,186"/>
    <polygon points="720,210 760,186 800,210 800,256 760,280 720,256"/>
  </g>
  <!-- Neon Strips (Cyan & Magenta) -->
  <line x1="80" y1="40" x2="80" y2="750" stroke="#06b6d4" stroke-width="10" stroke-linecap="round"/>
  <line x1="80" y1="40" x2="80" y2="750" stroke="#22d3ee" stroke-width="4" stroke-linecap="round"/>
  <line x1="944" y1="40" x2="944" y2="750" stroke="#d946ef" stroke-width="10" stroke-linecap="round"/>
  <line x1="944" y1="40" x2="944" y2="750" stroke="#f0abfc" stroke-width="4" stroke-linecap="round"/>
  <!-- Studio ON AIR Sign -->
  <rect x="452" y="70" width="120" height="44" rx="6" fill="#dc2626"/>
  <text x="512" y="100" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">ON AIR</text>
  <!-- Microphone Stand Silhouette (Right foreground) -->
  <path d="M 880 720 L 780 620 L 720 650" fill="none" stroke="#52525b" stroke-width="10"/>
  <rect x="700" y="620" width="40" height="70" rx="14" fill="#71717a"/>
  <!-- Studio Desk (Bottom) -->
  <polygon points="0,800 1024,800 1024,1024 0,1024" fill="#18181b"/>
  <line x1="0" y1="800" x2="1024" y2="800" stroke="#06b6d4" stroke-width="4" opacity="0.6"/>
</svg>
`)}`;

// 8. Chroma Green Screen (กรีนสกรีนมาตรฐาน)
const SVG_CHROMA_GREEN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#00ff00"/>
</svg>
`)}`;

// 9. Chroma Blue Screen (บลูสกรีนมาตรฐาน)
const SVG_CHROMA_BLUE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#0047bb"/>
</svg>
`)}`;

// 10. Clean Dark Studio Charcoal (สตูดิโอสีเข้มพรีเมียม)
const SVG_STUDIO_DARK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="darkvignette" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#3f3f46"/>
      <stop offset="60%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#darkvignette)"/>
  <!-- Subtle lighting rim -->
  <ellipse cx="512" cy="380" rx="360" ry="240" fill="#ffffff" opacity="0.04"/>
</svg>
`)}`;

// 11. Clean Light Studio White (สตูดิโอสีขาวคลีนทางการ)
const SVG_STUDIO_LIGHT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="lightgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#lightgrad)"/>
  <!-- Soft floor shadow line -->
  <ellipse cx="512" cy="780" rx="440" ry="120" fill="#94a3b8" opacity="0.15"/>
</svg>
`)}`;

export const BACKGROUND_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด (All)', labelEn: 'All Scenes' },
  { id: 'anime', label: 'อนิเมะ & การ์ตูน (Anime)', labelEn: 'Anime & Manga' },
  { id: 'office', label: 'สำนักงาน & ห้องประชุม (Office)', labelEn: 'Office & Work' },
  { id: 'education', label: 'การศึกษา & สอนงาน (Education)', labelEn: 'Education' },
  { id: 'studio', label: 'สตูดิโอ & พอดแคสต์ (Studio)', labelEn: 'Studio & Media' },
  { id: 'chroma', label: 'กรีนสกรีน & คีย์สี (Chroma Key)', labelEn: 'Chroma Screens' },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'original',
    name: 'Original Image Background',
    nameTh: 'ฉากหลังเดิมของภาพ (ต้นฉบับ)',
    category: 'office',
    type: 'original',
    description: 'Use the original background from the avatar image without any modifications.',
    descriptionTh: 'ใช้ภาพต้นฉบับดั้งเดิมของตัวละครโดยไม่เปลี่ยนฉากหลัง',
  },
  {
    id: 'office-skyline',
    name: 'Modern Executive Office',
    nameTh: 'ออฟฟิศผู้บริหารวิวเมือง',
    category: 'office',
    type: 'preset',
    imageUrl: SVG_OFFICE,
    thumbnail: SVG_OFFICE,
    description: 'High-rise executive office with panoramic glass window and city skyline.',
    descriptionTh: 'ห้องทำงานผู้บริหารวิวตึกระฟ้าและกระจกใส เหมาะสำหรับงานธุรกิจและการนำเสนอ',
  },
  {
    id: 'meeting-room',
    name: 'Boardroom & Meeting Screen',
    nameTh: 'ห้องประชุมผู้บริหาร & พรีเซนต์',
    category: 'office',
    type: 'preset',
    imageUrl: SVG_MEETING,
    thumbnail: SVG_MEETING,
    description: 'Professional conference room with chart presentation screen.',
    descriptionTh: 'ห้องประชุมพร้อมจอแสดงกราฟผลงาน เหมาะกับการบรรยายและนำเสนอโปรเจกต์',
  },
  {
    id: 'news-studio',
    name: 'TV News & Broadcast Studio',
    nameTh: 'สตูดิโอรายการข่าว & ผู้ประกาศ',
    category: 'studio',
    type: 'preset',
    imageUrl: SVG_NEWS_STUDIO,
    thumbnail: SVG_NEWS_STUDIO,
    description: 'Professional media broadcast studio with curved digital world backdrop.',
    descriptionTh: 'ห้องส่งสตูดิโอข่าวและรายการพอดแคสต์ แบ็คกราวด์กราฟิกระดับมืออาชีพ',
  },
  {
    id: 'podcast-studio',
    name: 'Neon Podcast / Creator Studio',
    nameTh: 'สตูดิโอครีเอเตอร์ & พอดแคสต์',
    category: 'studio',
    type: 'preset',
    imageUrl: SVG_PODCAST,
    thumbnail: SVG_PODCAST,
    description: 'Acoustic studio with neon ambient lighting and ON AIR sign.',
    descriptionTh: 'สตูดิโออัดเสียงไฟนีออนโมเดิร์น เหมาะสำหรับคอนเทนต์ครีเอเตอร์และคลิปไวรัล',
  },
  {
    id: 'classroom',
    name: 'Smart Classroom & Blackboard',
    nameTh: 'ห้องเรียน & กระดานดำการสอน',
    category: 'education',
    type: 'preset',
    imageUrl: SVG_CLASSROOM,
    thumbnail: SVG_CLASSROOM,
    description: 'Academic classroom with chalk diagrams and wooden lecture podium.',
    descriptionTh: 'ห้องเรียนกระดานดำสำหรับการสอนวิชาการ สื่อการเรียนรู้ และพรีเซนต์งานครูอาจารย์',
  },
  {
    id: 'anime-sunset',
    name: 'Anime Golden Hour Skyline',
    nameTh: 'วิวเมืองอนิเมะยามเย็น',
    category: 'anime',
    type: 'preset',
    imageUrl: SVG_ANIME_SUNSET,
    thumbnail: SVG_ANIME_SUNSET,
    description: 'Vibrant Japanese anime sunset sky with city skyline and power cables.',
    descriptionTh: 'ท้องฟ้าและวิวเมืองสไตล์อนิเมะญี่ปุ่นยามเย็น โทนสีอบอุ่นสดใส',
  },
  {
    id: 'anime-room',
    name: 'Cozy Anime Room & Bookshelf',
    nameTh: 'ห้องนอนการ์ตูน & โต๊ะหนังสือ',
    category: 'anime',
    type: 'preset',
    imageUrl: SVG_ANIME_ROOM,
    thumbnail: SVG_ANIME_ROOM,
    description: 'Warm anime aesthetic room with manga bookshelf, window, and desk.',
    descriptionTh: 'ห้องการ์ตูนอบอุ่นพร้อมชั้นหนังสือและแสงแดดส่อง เหมาะกับตัวละครน่ารัก',
  },
  {
    id: 'chroma-green',
    name: 'Chroma Green Screen (#00FF00)',
    nameTh: 'กรีนสกรีนสีเขียว (Chroma Key)',
    category: 'chroma',
    type: 'preset',
    imageUrl: SVG_CHROMA_GREEN,
    thumbnail: SVG_CHROMA_GREEN,
    color: '#00FF00',
    description: 'Standard pure chroma green for editing in Premiere, CapCut, or OBS.',
    descriptionTh: 'กรีนสกรีนมาตรฐานสีเขียว สำหรับนำไฟล์วิดีโอไปซ้อนคีย์ใน CapCut / Premiere',
  },
  {
    id: 'chroma-blue',
    name: 'Chroma Blue Screen (#0047BB)',
    nameTh: 'บลูสกรีนสีน้ำเงิน (Chroma Blue)',
    category: 'chroma',
    type: 'preset',
    imageUrl: SVG_CHROMA_BLUE,
    thumbnail: SVG_CHROMA_BLUE,
    color: '#0047BB',
    description: 'Clean chroma blue for characters wearing green clothes.',
    descriptionTh: 'บลูสกรีนสีน้ำเงิน สำหรับตัวละครที่มีเสื้อผ้าสีเขียว',
  },
  {
    id: 'studio-dark',
    name: 'Charcoal Dark Studio',
    nameTh: 'สตูดิโอสีชาร์โคลพรีเมียม',
    category: 'studio',
    type: 'preset',
    imageUrl: SVG_STUDIO_DARK,
    thumbnail: SVG_STUDIO_DARK,
    color: '#18181b',
    description: 'Elegant dark studio vignette gradient for clean cinematic focus.',
    descriptionTh: 'ฉากหลังสตูดิโอสีเข้มพรีเมียม ให้ตัวละครโดดเด่นและสบายตา',
  },
  {
    id: 'studio-light',
    name: 'Minimalist Clean White Studio',
    nameTh: 'สตูดิโอสีขาวคลีนทางการ',
    category: 'office',
    type: 'preset',
    imageUrl: SVG_STUDIO_LIGHT,
    thumbnail: SVG_STUDIO_LIGHT,
    color: '#f8fafc',
    description: 'Clean bright studio backdrop suitable for formal work and announcements.',
    descriptionTh: 'ฉากขาวสะอาดมินิมอล เหมาะสำหรับประกาศทางการและการนำเสนองาน',
  },
];
