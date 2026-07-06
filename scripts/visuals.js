"use strict";
/**
 * SVG diagrams attached to bits during migration (and a reference for agents adding new ones).
 * Style contract: viewBox ~ "0 0 320 200", font-family system-ui, palette:
 *   fairway #86b979 / dark green #14532d / green surface #a7d19a / sand #fde68a (#d97706 line)
 *   water #93c5fd (#1d4ed8 line) / ink #1c1917 / danger #b91c1c / neutral #78716c
 */
const S = 'font-family="system-ui,sans-serif"';

module.exports = {
  b001: {
    caption: "Top-down anatomy of a hole: tee → fairway → green, trouble on the edges.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<path d="M30 170 C80 150 60 100 130 80 C200 60 210 90 270 55" stroke="#86b979" stroke-width="34" fill="none" stroke-linecap="round"/>
<path d="M30 170 C80 150 60 100 130 80 C200 60 210 90 270 55" stroke="#a7d19a" stroke-width="22" fill="none" stroke-linecap="round"/>
<rect x="16" y="158" width="30" height="24" rx="4" fill="#6ea25f"/>
<text x="31" y="196" font-size="10" text-anchor="middle" fill="#1c1917">tee box</text>
<ellipse cx="272" cy="52" rx="30" ry="20" fill="#b9dcab"/>
<circle cx="278" cy="50" r="2.5" fill="#1c1917"/>
<line x1="278" y1="50" x2="278" y2="28" stroke="#1c1917" stroke-width="1.5"/>
<path d="M278 28 l12 4 -12 4z" fill="#b91c1c"/>
<text x="272" y="88" font-size="10" text-anchor="middle" fill="#1c1917">green + pin</text>
<ellipse cx="170" cy="112" rx="14" ry="8" fill="#fde68a" stroke="#d97706"/>
<text x="170" y="134" font-size="10" text-anchor="middle" fill="#92400e">bunker</text>
<ellipse cx="105" cy="52" rx="26" ry="13" fill="#93c5fd" stroke="#1d4ed8"/>
<text x="105" y="34" font-size="10" text-anchor="middle" fill="#1d4ed8">penalty area</text>
<text x="95" y="140" font-size="10" fill="#3f6212">fairway</text>
<text x="230" y="150" font-size="10" fill="#57534e">rough</text>
</svg>`
  },

  b005: {
    caption: "The teeing area: between the markers, up to two club-lengths back. Never ahead.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<rect x="40" y="30" width="240" height="140" rx="8" fill="#86b979"/>
<circle cx="80" cy="70" r="9" fill="#fff" stroke="#1c1917" stroke-width="2"/>
<circle cx="240" cy="70" r="9" fill="#fff" stroke="#1c1917" stroke-width="2"/>
<text x="160" y="58" font-size="11" text-anchor="middle" fill="#1c1917">tee markers</text>
<rect x="80" y="70" width="160" height="62" fill="#14532d" opacity="0.25"/>
<line x1="80" y1="70" x2="240" y2="70" stroke="#14532d" stroke-width="2" stroke-dasharray="6 4"/>
<line x1="80" y1="132" x2="240" y2="132" stroke="#14532d" stroke-width="2" stroke-dasharray="6 4"/>
<path d="M256 70 v62" stroke="#1c1917" stroke-width="1.5"/>
<path d="M252 74 l4 -6 4 6 M252 128 l4 6 4 -6" fill="none" stroke="#1c1917" stroke-width="1.5"/>
<text x="264" y="104" font-size="10" fill="#1c1917">2 club-</text>
<text x="264" y="115" font-size="10" fill="#1c1917">lengths</text>
<text x="160" y="110" font-size="11" text-anchor="middle" fill="#14532d" font-weight="700">tee here ✓</text>
<text x="160" y="40" font-size="10" text-anchor="middle" fill="#b91c1c" font-weight="700">✗ ahead of markers = penalty</text>
</svg>`
  },

  b010: {
    caption: "Bunker choreography: enter at the low side, rake backwards out along your own path.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<ellipse cx="160" cy="105" rx="110" ry="60" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
<path d="M78 70 C95 52 130 45 160 47" stroke="#92400e" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.5"/>
<text x="98" y="38" font-size="10" fill="#92400e">steep face — never enter here ✗</text>
<circle cx="185" cy="110" r="5" fill="#fff" stroke="#1c1917" stroke-width="1.5"/>
<path d="M250 150 C230 140 205 125 192 115" stroke="#15803d" stroke-width="2.5" fill="none" stroke-dasharray="5 4" marker-end="none"/>
<path d="M196 119 l-8 -5 9 -2z" fill="#15803d"/>
<text x="252" y="166" font-size="10" fill="#15803d" font-weight="700">enter low side ✓</text>
<path d="M192 122 C210 133 228 143 246 152" stroke="#78716c" stroke-width="2.5" fill="none"/>
<path d="M240 148 l9 5 -10 1z" fill="#78716c"/>
<text x="205" y="146" font-size="9" fill="#57534e" transform="rotate(24 205 146)">rake backwards out</text>
</svg>`
  },

  b017: {
    caption: "Penalty-area relief: yellow gives two options, red adds the sideways drop.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<ellipse cx="160" cy="60" rx="95" ry="34" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
<text x="160" y="64" font-size="11" text-anchor="middle" fill="#1d4ed8">penalty area</text>
<circle cx="160" cy="96" r="5" fill="#1c1917"/>
<text x="196" y="99" font-size="9" fill="#1c1917">crossing point X</text>
<circle cx="160" cy="20" r="3" fill="#b91c1c"/>
<line x1="160" y1="23" x2="160" y2="12" stroke="#b91c1c" stroke-width="1.5"/>
<text x="171" y="18" font-size="9" fill="#b91c1c">flag</text>
<line x1="160" y1="96" x2="160" y2="180" stroke="#78716c" stroke-width="2" stroke-dasharray="5 4"/>
<circle cx="160" cy="156" r="6" fill="none" stroke="#78716c" stroke-width="2"/>
<text x="168" y="176" font-size="9" fill="#57534e">1&#38;2: back-on-a-line (yellow + red)</text>
<line x1="160" y1="96" x2="228" y2="120" stroke="#b91c1c" stroke-width="2"/>
<circle cx="228" cy="120" r="12" fill="none" stroke="#b91c1c" stroke-width="2" stroke-dasharray="3 3"/>
<text x="244" y="124" font-size="9" fill="#b91c1c">3: lateral 2 club-lengths</text>
<text x="244" y="135" font-size="9" fill="#b91c1c" font-weight="700">RED only</text>
</svg>`
  },

  b019: {
    caption: "The drop: knee height, straight down, must land and stay in the relief area.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<circle cx="90" cy="52" r="12" fill="none" stroke="#1c1917" stroke-width="2.5"/>
<path d="M90 64 v46 M90 78 l-20 14 M90 78 l20 10 M90 110 l-14 42 M90 110 l14 42" stroke="#1c1917" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<circle cx="112" cy="92" r="4.5" fill="#b91c1c"/>
<line x1="112" y1="100" x2="112" y2="146" stroke="#b91c1c" stroke-width="1.5" stroke-dasharray="3 3"/>
<path d="M108 140 l4 8 4 -8z" fill="#b91c1c"/>
<line x1="60" y1="126" x2="130" y2="126" stroke="#78716c" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="46" y="122" font-size="9" fill="#57534e">knee</text>
<text x="42" y="132" font-size="9" fill="#57534e">height</text>
<ellipse cx="210" cy="158" rx="72" ry="22" fill="#86b979" opacity="0.7" stroke="#14532d" stroke-width="2" stroke-dasharray="6 4"/>
<text x="210" y="155" font-size="10" text-anchor="middle" fill="#14532d" font-weight="700">relief area (1–2 club-lengths)</text>
<text x="210" y="168" font-size="9" text-anchor="middle" fill="#14532d">land + stay inside · 2 fails → place</text>
</svg>`
  },

  b023: {
    caption: "Loft gapping: even steps club to club — and the PW→SW chasm a gap wedge fixes.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<text x="160" y="22" font-size="11" text-anchor="middle" fill="#1c1917" font-weight="700">carry distance by club</text>
<g>
<rect x="30" y="50" width="34" height="110" fill="#14532d" rx="3"/><text x="47" y="176" font-size="10" text-anchor="middle" fill="#1c1917">7i</text>
<rect x="74" y="66" width="34" height="94" fill="#15803d" rx="3"/><text x="91" y="176" font-size="10" text-anchor="middle" fill="#1c1917">8i</text>
<rect x="118" y="82" width="34" height="78" fill="#3f8f4f" rx="3"/><text x="135" y="176" font-size="10" text-anchor="middle" fill="#1c1917">9i</text>
<rect x="162" y="98" width="34" height="62" fill="#5aa562" rx="3"/><text x="179" y="176" font-size="10" text-anchor="middle" fill="#1c1917">PW</text>
<rect x="206" y="114" width="34" height="46" fill="#d97706" rx="3" stroke="#92400e" stroke-dasharray="4 3"/><text x="223" y="176" font-size="10" text-anchor="middle" fill="#92400e" font-weight="700">GW?</text>
<rect x="250" y="130" width="34" height="30" fill="#86b979" rx="3"/><text x="267" y="176" font-size="10" text-anchor="middle" fill="#1c1917">SW</text>
</g>
<path d="M196 100 L250 132" stroke="#b91c1c" stroke-width="2" stroke-dasharray="4 3"/>
<text x="240" y="106" font-size="9" fill="#b91c1c" font-weight="700">30m gap!</text>
</svg>`
  },

  b024: {
    caption: "Lie angle at impact: toe-up steers left, toe-down steers right.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<line x1="20" y1="150" x2="300" y2="150" stroke="#86b979" stroke-width="4"/>
<g>
<line x1="80" y1="40" x2="62" y2="138" stroke="#1c1917" stroke-width="3"/>
<path d="M62 138 L92 148 L90 152 L60 148z" fill="#57534e" transform="rotate(-12 62 143)"/>
<text x="76" y="30" font-size="10" text-anchor="middle" fill="#1c1917" font-weight="700">too UPRIGHT</text>
<path d="M76 168 C68 176 56 178 46 176" stroke="#b91c1c" stroke-width="2" fill="none"/>
<path d="M52 172 l-8 4 6 5z" fill="#b91c1c"/>
<text x="60" y="192" font-size="9" fill="#b91c1c">ball goes left</text>
</g>
<g>
<line x1="240" y1="40" x2="258" y2="138" stroke="#1c1917" stroke-width="3"/>
<path d="M258 138 L228 148 L230 152 L260 148z" fill="#57534e" transform="rotate(12 258 143)"/>
<text x="244" y="30" font-size="10" text-anchor="middle" fill="#1c1917" font-weight="700">too FLAT</text>
<path d="M244 168 C252 176 264 178 274 176" stroke="#b91c1c" stroke-width="2" fill="none"/>
<path d="M268 172 l8 4 -6 5z" fill="#b91c1c"/>
<text x="236" y="192" font-size="9" fill="#b91c1c">ball goes right</text>
</g>
<text x="160" y="110" font-size="10" text-anchor="middle" fill="#14532d" font-weight="700">sole flat = straight ✓</text>
</svg>`
  },

  b026: {
    caption: "Bounce: the trailing edge hangs below the leading edge, so the sole skids instead of digging.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<line x1="20" y1="150" x2="300" y2="150" stroke="#d97706" stroke-width="5"/>
<text x="290" y="168" font-size="9" text-anchor="end" fill="#92400e">sand / turf</text>
<path d="M120 40 L138 118 L196 138 L206 128 L150 112 Z" fill="#a8a29e" stroke="#57534e" stroke-width="2"/>
<line x1="196" y1="138" x2="196" y2="150" stroke="#78716c" stroke-width="1.5" stroke-dasharray="3 2"/>
<line x1="206" y1="128" x2="252" y2="146" stroke="#b91c1c" stroke-width="2"/>
<line x1="206" y1="128" x2="252" y2="128" stroke="#78716c" stroke-width="1.5" stroke-dasharray="3 2"/>
<path d="M236 128 A18 18 0 0 1 240 141" fill="none" stroke="#b91c1c" stroke-width="1.5"/>
<text x="258" y="136" font-size="10" fill="#b91c1c" font-weight="700">bounce°</text>
<text x="150" y="30" font-size="10" fill="#1c1917" font-weight="700">wedge (leading edge up ↑)</text>
<path d="M60 132 C90 140 110 146 130 148" stroke="#15803d" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/>
<path d="M124 144 l8 4 -8 3z" fill="#15803d"/>
<text x="42" y="124" font-size="9" fill="#15803d" font-weight="700">skids ✓</text>
</svg>`
  },

  b030: {
    caption: "Stableford: points per hole against your net score. Blob = 0, pick up, move on.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<text x="160" y="24" font-size="12" text-anchor="middle" fill="#1c1917" font-weight="700">Stableford points (net score)</text>
<g font-size="10">
<rect x="30" y="40" width="260" height="22" rx="5" fill="#fca5a5"/><text x="44" y="55" fill="#7f1d1d">net double bogey+</text><text x="272" y="55" text-anchor="end" font-weight="700" fill="#7f1d1d">0 — "blob", pick up</text>
<rect x="30" y="66" width="260" height="22" rx="5" fill="#fde68a"/><text x="44" y="81" fill="#78350f">net bogey</text><text x="272" y="81" text-anchor="end" font-weight="700" fill="#78350f">1</text>
<rect x="30" y="92" width="260" height="22" rx="5" fill="#bbf7d0"/><text x="44" y="107" fill="#14532d">net par</text><text x="272" y="107" text-anchor="end" font-weight="700" fill="#14532d">2</text>
<rect x="30" y="118" width="260" height="22" rx="5" fill="#86efac"/><text x="44" y="133" fill="#14532d">net birdie</text><text x="272" y="133" text-anchor="end" font-weight="700" fill="#14532d">3</text>
<rect x="30" y="144" width="260" height="22" rx="5" fill="#4ade80"/><text x="44" y="159" fill="#052e16">net eagle</text><text x="272" y="159" text-anchor="end" font-weight="700" fill="#052e16">4</text>
</g>
<text x="160" y="188" font-size="10" text-anchor="middle" fill="#57534e">36 points = played to your handicap</text>
</svg>`
  },

  b036: {
    caption: "Handicap Index = average of your best 8 differentials from the last 20 rounds.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<text x="160" y="24" font-size="11" text-anchor="middle" fill="#1c1917" font-weight="700">your last 20 rounds</text>
<g>
<circle cx="45" cy="60" r="10" fill="#14532d"/><circle cx="75" cy="60" r="10" fill="#d6d3d1"/><circle cx="105" cy="60" r="10" fill="#14532d"/><circle cx="135" cy="60" r="10" fill="#d6d3d1"/><circle cx="165" cy="60" r="10" fill="#d6d3d1"/><circle cx="195" cy="60" r="10" fill="#14532d"/><circle cx="225" cy="60" r="10" fill="#d6d3d1"/><circle cx="255" cy="60" r="10" fill="#14532d"/><circle cx="285" cy="60" r="10" fill="#d6d3d1"/><circle cx="45" cy="90" r="10" fill="#d6d3d1"/>
<circle cx="75" cy="90" r="10" fill="#14532d"/><circle cx="105" cy="90" r="10" fill="#d6d3d1"/><circle cx="135" cy="90" r="10" fill="#14532d"/><circle cx="165" cy="90" r="10" fill="#d6d3d1"/><circle cx="195" cy="90" r="10" fill="#d6d3d1"/><circle cx="225" cy="90" r="10" fill="#14532d"/><circle cx="255" cy="90" r="10" fill="#d6d3d1"/><circle cx="285" cy="90" r="10" fill="#d6d3d1"/><circle cx="45" cy="120" r="10" fill="#d6d3d1"/><circle cx="75" cy="120" r="10" fill="#d6d3d1"/>
</g>
<text x="160" y="152" font-size="10" text-anchor="middle" fill="#14532d" font-weight="700">■ best 8 → averaged → your Index</text>
<text x="160" y="170" font-size="10" text-anchor="middle" fill="#57534e">□ the other 12 don't count (bad days forgiven)</text>
<text x="160" y="188" font-size="10" text-anchor="middle" fill="#57534e">…which is why you beat your handicap only ~1 in 4 rounds</text>
</svg>`
  },

  b038: {
    caption: "Stroke Index: with 20 strokes, every hole gives you 1, and SI 1–2 give you a 2nd.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<text x="160" y="22" font-size="11" text-anchor="middle" fill="#1c1917" font-weight="700">course handicap 20 → where the strokes land</text>
<g font-size="9" text-anchor="middle">
<text x="36" y="52" fill="#57534e">hole SI:</text>
<g>
<rect x="56" y="38" width="24" height="20" rx="3" fill="#14532d"/><text x="68" y="52" fill="#fff">1</text>
<rect x="84" y="38" width="24" height="20" rx="3" fill="#14532d"/><text x="96" y="52" fill="#fff">2</text>
<rect x="112" y="38" width="24" height="20" rx="3" fill="#5aa562"/><text x="124" y="52" fill="#fff">3</text>
<rect x="140" y="38" width="24" height="20" rx="3" fill="#5aa562"/><text x="152" y="52" fill="#fff">4</text>
<rect x="168" y="38" width="24" height="20" rx="3" fill="#5aa562"/><text x="180" y="52" fill="#fff">…</text>
<rect x="196" y="38" width="24" height="20" rx="3" fill="#5aa562"/><text x="208" y="52" fill="#fff">17</text>
<rect x="224" y="38" width="24" height="20" rx="3" fill="#5aa562"/><text x="236" y="52" fill="#fff">18</text>
</g>
<text x="36" y="82" fill="#57534e">strokes:</text>
<text x="68" y="82" font-weight="700" fill="#14532d">+2</text><text x="96" y="82" font-weight="700" fill="#14532d">+2</text><text x="124" y="82" fill="#15803d">+1</text><text x="152" y="82" fill="#15803d">+1</text><text x="180" y="82" fill="#15803d">+1</text><text x="208" y="82" fill="#15803d">+1</text><text x="236" y="82" fill="#15803d">+1</text>
</g>
<rect x="40" y="104" width="240" height="66" rx="8" fill="#fff" stroke="#d6d3d1"/>
<text x="160" y="126" font-size="10" text-anchor="middle" fill="#1c1917">18 holes × 1 stroke = 18</text>
<text x="160" y="142" font-size="10" text-anchor="middle" fill="#1c1917">+ 2nd stroke on SI 1–2 = 2 more</text>
<text x="160" y="160" font-size="11" text-anchor="middle" fill="#14532d" font-weight="700">SI-3 par 4 → your net par is 5</text>
</svg>`
  },

  b044: {
    caption: "Same dispersion, two aims: center-green keeps your circle on grass; pin-hunting hangs it over sand.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<g>
<ellipse cx="85" cy="90" rx="52" ry="38" fill="#a7d19a" stroke="#14532d"/>
<ellipse cx="118" cy="112" rx="16" ry="9" fill="#fde68a" stroke="#d97706"/>
<circle cx="112" cy="98" r="2.5" fill="#b91c1c"/>
<circle cx="112" cy="98" r="30" fill="#b91c1c" opacity="0.14" stroke="#b91c1c" stroke-dasharray="4 3"/>
<text x="85" y="160" font-size="10" text-anchor="middle" fill="#b91c1c" font-weight="700">aim at pin ✗</text>
<text x="85" y="174" font-size="9" text-anchor="middle" fill="#57534e">half the circle is sand</text>
</g>
<g>
<ellipse cx="235" cy="90" rx="52" ry="38" fill="#a7d19a" stroke="#14532d"/>
<ellipse cx="268" cy="112" rx="16" ry="9" fill="#fde68a" stroke="#d97706"/>
<circle cx="262" cy="98" r="2.5" fill="#b91c1c"/>
<circle cx="235" cy="90" r="30" fill="#15803d" opacity="0.18" stroke="#15803d" stroke-dasharray="4 3"/>
<circle cx="235" cy="90" r="2" fill="#14532d"/>
<text x="235" y="160" font-size="10" text-anchor="middle" fill="#14532d" font-weight="700">aim center ✓</text>
<text x="235" y="174" font-size="9" text-anchor="middle" fill="#57534e">whole circle is green</text>
</g>
</svg>`
  },

  b045: {
    caption: "Lay up to a number: 210 out → hit the 130 club → full 80m wedge in.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<path d="M20 130 H300" stroke="#86b979" stroke-width="30" stroke-linecap="round"/>
<circle cx="36" cy="130" r="5" fill="#fff" stroke="#1c1917" stroke-width="1.5"/>
<ellipse cx="284" cy="128" rx="22" ry="14" fill="#a7d19a" stroke="#14532d"/>
<line x1="284" y1="128" x2="284" y2="104" stroke="#1c1917" stroke-width="1.5"/>
<path d="M284 104 l10 4 -10 4z" fill="#b91c1c"/>
<path d="M40 122 C90 84 150 84 196 118" stroke="#14532d" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/>
<path d="M191 112 l7 7 -10 1z" fill="#14532d"/>
<text x="118" y="78" font-size="10" text-anchor="middle" fill="#14532d" font-weight="700">130m club</text>
<path d="M202 120 C230 96 258 100 280 118" stroke="#d97706" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/>
<path d="M274 112 l8 6 -10 2z" fill="#d97706"/>
<text x="243" y="90" font-size="10" text-anchor="middle" fill="#92400e" font-weight="700">full 80m wedge</text>
<text x="118" y="160" font-size="9" text-anchor="middle" fill="#57534e">not "as far as possible" → no awkward half-swing left</text>
<text x="36" y="160" font-size="9" text-anchor="middle" fill="#1c1917">210m out</text>
</svg>`
  },

  b046: {
    caption: "Greenside decision tree: putt when you can, chip when you can't, pitch only over trouble.",
    svg: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" ${S}>
<rect width="320" height="200" rx="10" fill="#e7f0e2"/>
<rect x="94" y="14" width="132" height="26" rx="8" fill="#1c1917"/>
<text x="160" y="31" font-size="10" text-anchor="middle" fill="#fff">can the ball ROLL there?</text>
<line x1="120" y1="40" x2="70" y2="66" stroke="#78716c" stroke-width="1.5"/><text x="80" y="52" font-size="9" fill="#15803d" font-weight="700">yes</text>
<line x1="200" y1="40" x2="250" y2="66" stroke="#78716c" stroke-width="1.5"/><text x="232" y="52" font-size="9" fill="#b91c1c" font-weight="700">no</text>
<rect x="20" y="66" width="100" height="30" rx="8" fill="#14532d"/>
<text x="70" y="85" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">1. PUTT</text>
<rect x="196" y="66" width="110" height="26" rx="8" fill="#1c1917"/>
<text x="251" y="83" font-size="9" text-anchor="middle" fill="#fff">must CARRY trouble?</text>
<line x1="220" y1="92" x2="180" y2="118" stroke="#78716c" stroke-width="1.5"/><text x="188" y="104" font-size="9" fill="#15803d" font-weight="700">no</text>
<line x1="280" y1="92" x2="290" y2="118" stroke="#78716c" stroke-width="1.5"/><text x="294" y="106" font-size="9" fill="#b91c1c" font-weight="700">yes</text>
<rect x="126" y="118" width="106" height="30" rx="8" fill="#15803d"/>
<text x="179" y="137" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">2. CHIP (8/9i)</text>
<rect x="244" y="118" width="66" height="30" rx="8" fill="#d97706"/>
<text x="277" y="137" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">3. PITCH</text>
<text x="160" y="176" font-size="10" text-anchor="middle" fill="#57534e">lowest loft that works = smallest margin for disaster</text>
</svg>`
  }
};
