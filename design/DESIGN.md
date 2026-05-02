# LifeOps Design System

> **Status:** v0.1 (locked Apr 2026 from `/design-shotgun` round 2 — V2 "Apple Wallet Native" direction). Source of truth for every screen built going forward. When you add a new screen, this is the rule book — invent only when the rule book is silent.

## TL;DR for builders

- **Idiom:** macOS-native window + Apple-Wallet-style brand-colored cards as the primary visual unit.
- **Typography:** JetBrains Mono Bold for digits/data; system-ui (SF Pro) for prose.
- **Color:** Issuer brand colors as full saturated fills on cards (Amex green, Chase blue, Marriott navy, Hyatt purple). Warm desk surface `#F0EDE6` everywhere else.
- **Voice:** "Log spend" not "Mark used." Say what users *did*, not what they *consumed*.
- **Partial usage is the default.** Every dollar value is `$X left of $Y` with a progress indicator.
- **No AI slop.** No purple gradients, no 3-col feature grids, no decorative blobs, no centered everything.

---

## 1. Tokens

### Colors

| Token | Hex | Use |
|---|---|---|
| `--lo-amex` | `#0F4C3A` | Amex hunter green — primary brand accent + Amex card fills |
| `--lo-chase` | `#1A4FA8` | Chase sapphire blue — Chase card fills |
| `--lo-marriott` | `#1A2D4D` | Marriott deep navy — Marriott card fills |
| `--lo-hyatt` | `#5C2D87` | Hyatt purple — Hyatt card fills |
| `--lo-clear` | `#003DA5` | CLEAR Plus blue |
| `--lo-delta` | `#2A2A2A` | Delta neutral (real brand red feels alarmist) |
| `--lo-ba` | `#2A6DB8` | British Airways |
| `--lo-united` | `#1A4FA8` | United (alias of Chase blue, OK at small sizes) |
| `--lo-grey-card` | `#6F6B62` | Used / annual / inactive card state |
| `--lo-red` | `#B43A3A` | Expiry, urgency, destructive (USE SPARINGLY) |
| `--lo-desk` | `#F0EDE6` | Warm desk surface — main app background (light mode) |
| `--lo-titlebar` | `#FAFAF7` | Window titlebar |
| `--lo-warm-white` | `#FFFFFF` | Cards/panels on top of the desk |
| `--lo-card-text` | `#F5F1E8` | Cream text on brand-color cards |
| `--lo-card-text-muted` | `rgba(245,241,232,0.62)` | Secondary text on cards |
| `--lo-ink` | `#1A1A1A` | Primary off-card text |
| `--lo-ink-muted` | `#6A6A6A` | Secondary off-card text, labels |
| `--lo-ink-faint` | `#B0AEA5` | Tertiary text, decorative dividers |
| `--lo-hairline` | `#E0DCD2` | All 1px borders, dividers |

**Rule:** Brand colors NEVER appear as text on white. They only appear as card fills, accent stripes, or as colored swatches/dots in legend rows.

**Dark mode (planned, not built v0):** same brand colors muted ~30% (e.g. Amex `#0E3D2E`), desk → near-black `#0A0A0A`, cream text gets ~5% lighter.

### Typography

```css
/* Imports */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

/* Stacks */
--lo-font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
--lo-font-text: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
```

**Type scale (use these, don't invent new sizes):**

| Token | Size | Use |
|---|---|---|
| `--lo-fs-mega` | `112px` | Hero countdown (dashboard) |
| `--lo-fs-display` | `96px` | Hero amount, loyalty points |
| `--lo-fs-headline` | `56px` | Onboarding H1, modal hero number |
| `--lo-fs-h1` | `26px` | Page title |
| `--lo-fs-h2` | `15px` | Section heading |
| `--lo-fs-h3` | `11px` | Eyebrow / section label (mono caps) |
| `--lo-fs-body` | `14px` | Body prose |
| `--lo-fs-meta` | `11px` | Mono metadata, timestamps |
| `--lo-fs-mini` | `10px` | Card tag labels (mono caps) |

**Rules:**
- All numerics ≥ 18px MUST use mono. Mono is the brand.
- Section labels: 11px mono bold, `letter-spacing: 0.18em`, uppercase, color `--lo-ink-muted`.
- Body prose: ALWAYS ≥ 14px (universal hard rule says ≥ 16px; we use 14 inside dense contexts only — flag if you go below).
- Letter-spacing on caps: `0.18em` for labels, `0.16em` for hero merchants, `0.06em` for status-bar text. Never letterspace lowercase.

### Spacing

8-pixel scale. Don't use values not on this list.

| Token | px |
|---|---|
| `--lo-space-1` | `4` |
| `--lo-space-2` | `8` |
| `--lo-space-3` | `12` |
| `--lo-space-4` | `16` |
| `--lo-space-5` | `20` |
| `--lo-space-6` | `24` |
| `--lo-space-8` | `32` |
| `--lo-space-10` | `40` |
| `--lo-space-12` | `48` |
| `--lo-space-14` | `56` |
| `--lo-space-16` | `64` |

Content padding: `56px` horizontal, `28-32px` vertical (the warm desk shows around content).

### Radii

| Token | px | Use |
|---|---|---|
| `--lo-r-sm` | `6` | Pills, small buttons |
| `--lo-r-md` | `10` | Inputs, search fields, secondary buttons |
| `--lo-r-lg` | `12` | Inventory chips, settings rows |
| `--lo-r-card` | `14` | List cards (inventory grid) |
| `--lo-r-hero` | `18` | Hero cards |
| `--lo-r-window` | `12` | Window outer container |

**Rule:** Inner radius = outer radius − gap. If a card has 14px corners and 16px padding, inner content (a stat pod inside) gets `14 - 4 = 10px`.

### Shadows

| Token | Use |
|---|---|
| `--lo-shadow-window` | `0 24px 64px rgba(0,0,0,0.18)` — window outer |
| `--lo-shadow-hero` | `0 12px 32px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)` — hero card |
| `--lo-shadow-card` | `0 4px 12px rgba(0,0,0,0.10)` — inventory grid card |
| `--lo-shadow-modal` | `0 32px 80px rgba(0,0,0,0.32)` — modal |
| `--lo-shadow-toast` | `0 12px 32px rgba(0,0,0,0.22)` — toast |
| `--lo-shadow-subtle` | `0 1px 3px rgba(0,0,0,0.04)` — accordion rows, settings sheets |

**Rule:** No drop shadows on text. No glow effects. No multi-layer fancy shadows on chips.

### Brand-card decorative ::before

Every brand-color card gets a subtle radial accent in the bottom-right:

```css
.lo-brand-card::before {
  content: "";
  position: absolute;
  right: -100px;
  bottom: -100px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}
```

This adds dimensional depth without violating "no gradients." Sized proportionally (smaller on chips, bigger on hero cards). The `::before` pattern keeps it out of the DOM.

---

## 2. Window chrome (every screen)

Every full-app screen sits inside a `.lo-window` with:

```html
<div class="lo-window">
  <div class="lo-titlebar">
    <div class="lo-traffic">
      <span class="lo-tl lo-tl--red"></span>
      <span class="lo-tl lo-tl--yellow"></span>
      <span class="lo-tl lo-tl--green"></span>
    </div>
    <div class="lo-title">LifeOps</div>
    <div class="lo-title-actions">
      <button class="lo-icon-btn"><!-- search SVG --></button>
      <button class="lo-icon-btn"><!-- gear SVG --></button>
    </div>
  </div>
  <div class="lo-content"><!-- screen content --></div>
</div>
```

- Window: 1440 × 900, `--lo-r-window`, `--lo-shadow-window`, on `--lo-desk`.
- Titlebar: 44px tall, `--lo-titlebar` background, hairline bottom border.
- Traffic lights: 12px circles in red `#FF5F57` / yellow `#FEBC2E` / green `#28C840`.
- Title: 13px medium, centered.
- Right side: search + gear icons, only on screens that need them.
- Settings sheet exception: smaller window (1100 × 800), 40px titlebar, "Settings" title.

---

## 3. Components

### 3.1 Hero card (focal screens: dashboard, modal, card-detail header)

The single most important component. ALWAYS standalone (no stack-behind), generous padding, mono digits dominant.

```html
<div class="lo-hero" style="background: var(--lo-amex);">
  <div class="lo-hero__label">Amex Gold · Monthly dining credit</div>
  <div class="lo-hero__mid">
    <div class="lo-hero__countdown">3d<span class="lo-hero__small"> 04h</span></div>
    <div class="lo-hero__progress">
      <div class="lo-hero__amt">
        <span class="lo-hero__currency">$</span>7
        <span class="lo-hero__of">left of <strong>$10</strong></span>
      </div>
      <div class="lo-bar"><div class="lo-bar__fill" style="width: 70%;"></div></div>
      <div class="lo-hero__hint">
        <span>$3 used this cycle</span><span>resets Apr 30</span>
      </div>
    </div>
  </div>
  <div class="lo-hero__foot">
    <div>
      <div class="lo-hero__merchant">GRUBHUB</div>
      <div class="lo-hero__ledger">Last used $3 · Apr 15 · view ledger →</div>
    </div>
    <button class="lo-hero__cta">LOG SPEND  →</button>
  </div>
</div>
```

**Specs:**
- Width 720px, height 360px (dashboard); flexible on card-detail/modal.
- 36px-44px padding.
- 18px corner radius.
- 112px countdown, 96px amount, 28px merchant, all JetBrains Mono Bold.
- `:: before` decorative circle bottom-right.
- Cream text `--lo-card-text` throughout.

### 3.2 Brand chip (strip on dashboard, secondary surfaces)

```html
<div class="lo-chip" style="background: var(--lo-chase);">
  <div class="lo-chip__top">
    <span class="lo-chip__cd">12d</span>
    <span class="lo-chip__amt"><span class="lo-chip__currency">$</span>25</span>
  </div>
  <div>
    <div class="lo-chip__merchant">DoorDash</div>
    <div class="lo-chip__prog">Chase Sapphire</div>
  </div>
</div>
```

**Specs:** 116-140px height, 14px radius, 16-18px padding, 22-28px mono digits, 13px sans merchant, 9-10px mono caps program tag.

### 3.3 Inventory card (4-col grid)

Like brand chip but bigger, more content. Used state has grey-brown fill + strikethrough on the "Used" label. NEVER opacity-fade the dollar amount — that's the data.

```html
<div class="lo-inv-card" style="background: var(--lo-amex);">
  <div class="lo-inv-card__top">
    <span class="lo-inv-card__cd">3d <span class="lo-small">04h</span></span>
    <span class="lo-inv-card__amt"><span class="lo-currency">$</span>7</span>
  </div>
  <div class="lo-inv-card__mid">Grubhub · Dining</div>
  <div class="lo-inv-card__bot">
    <span class="lo-inv-card__issuer">Amex Gold</span>
    <span class="lo-inv-card__status">Monthly</span>
  </div>
</div>

<!-- Used variant -->
<div class="lo-inv-card lo-inv-card--used">
  <div class="lo-inv-card__top">
    <span class="lo-inv-card__cd lo-strike">Used</span>
    <span class="lo-inv-card__amt"><span class="lo-currency">$</span>15</span>
  </div>
  ...
</div>
```

**Used state rule:** background `--lo-grey-card`, strikethrough on countdown/status label, dollar amount keeps full readability.

### 3.4 Stat pod (inline on cards or tiles)

Translucent pill inside a brand-color card. Replaces "stack-behind" cards.

```html
<div class="lo-stat-pod">
  <div class="lo-stat-pod__label">Suite night awards</div>
  <div class="lo-stat-pod__value">5 / 5 unused</div>
</div>
```

**Specs:** background `rgba(255,255,255,0.08)`, 10px radius, 12px padding, 9px mono caps label, 18px mono value.

### 3.5 Progress bar (used in hero, stat pods, card detail rows)

```html
<div class="lo-bar"><div class="lo-bar__fill" style="width: 70%;"></div></div>
```

**On brand-color background:** track `rgba(255,255,255,0.18)`, fill `rgba(245,241,232,0.85)`, 4-5px height.
**On warm-white background:** track `--lo-hairline`, fill `var(--lo-amex)`, 3-4px height.

### 3.6 Mini-bar (per-row, card detail)

Same as progress bar but width 110px, 3px height, used inline next to dollar amounts.

### 3.7 Section label (eyebrow)

```html
<div class="lo-section-label">Expiring next — top priority</div>
```

11px JetBrains Mono Bold, `letter-spacing: 0.18em`, uppercase, `--lo-ink-muted`. Always pairs with content directly below — never floats orphan.

### 3.8 Filter pills

```html
<span class="lo-pill lo-pill--on">All</span>
<span class="lo-pill">Expiring soon</span>
```

7px × 14px padding, 999px radius, 11px mono bold caps, `0.1em` letter-spacing. Active = ink fill + cream text. Inactive = warm-white fill + ink-muted text + hairline border.

### 3.9 Toggle (settings)

```html
<div class="lo-toggle"><div class="lo-toggle__knob"></div></div>
<div class="lo-toggle lo-toggle--off"><div class="lo-toggle__knob"></div></div>
```

44 × 26 track, 22 × 22 knob. ON = `--lo-amex` track, knob right. OFF = `#C8C2B5` track, knob left.

### 3.10 Segmented control (settings, theme picker)

```html
<div class="lo-seg">
  <span class="lo-seg__opt lo-seg__opt--on">System</span>
  <span class="lo-seg__opt">Light</span>
  <span class="lo-seg__opt">Dark</span>
</div>
```

Track `#EFECE3`, active option warm-white with subtle shadow, inactive transparent.

### 3.11 Checkbox

```html
<div class="lo-check lo-check--on"><svg><!-- check --></svg></div>
<div class="lo-check"></div>
```

18 × 18 box, 4px radius. ON = `--lo-amex` fill + cream check SVG. OFF = warm-white + hairline border.

### 3.12 Button — primary

```html
<button class="lo-btn lo-btn--primary">Log $3 spend →</button>
```

12-14px padding, 10px radius, 13-14px semibold, `--lo-amex` background, cream text.

### 3.13 Button — secondary / ghost

12-14px padding, 10px radius, transparent background, hairline border, ink text. Hover: border darkens.

### 3.14 Button — text link

`--lo-amex` text, underlined, 12-13px. No background, no border.

### 3.15 Modal

```html
<div class="lo-modal-bg"></div>
<div class="lo-modal">
  <header class="lo-modal__head">
    <span class="lo-modal__pre">How much did you spend?</span>
    <button class="lo-icon-btn"><!-- close X --></button>
  </header>
  <!-- modal-card (small hero), stepper, actions -->
</div>
```

**Specs:** modal width 560px, padding 24-28px, 16px radius, `--lo-shadow-modal`. Background overlay `rgba(15,15,12,0.42)` + `backdrop-filter: blur(2px)`.

### 3.16 Stepper + slider

```html
<div class="lo-stepper">
  <div class="lo-stepper__head">
    <span class="lo-stepper__l">This order</span>
    <span class="lo-stepper__max">$3 used so far this cycle</span>
  </div>
  <div class="lo-stepper__row">
    <button class="lo-step-btn">−</button>
    <div class="lo-step-display"><span class="lo-currency">$</span>3</div>
    <button class="lo-step-btn">+</button>
  </div>
  <div class="lo-slider">
    <div class="lo-slider__fill" style="width: 30%;"></div>
    <div class="lo-slider__knob" style="left: 30%;"></div>
  </div>
  <div class="lo-stepper__hint">Logs <strong>$3</strong> at Grubhub. <strong>$4 will still be available</strong>. Undo within 10 seconds.</div>
</div>
```

**Specs:** 40 × 40 step buttons (≥44 ideal but 40 OK in modal context), 36px stepper display digit, slider with branded fill + cream knob.

### 3.17 Toast

```html
<div class="lo-toast">
  <div class="lo-toast__check"><svg><!-- check --></svg></div>
  <div class="lo-toast__text">
    <div class="lo-toast__title">Logged $3 spend · $4 left this cycle</div>
    <div class="lo-toast__sub">Amex Gold · Monthly dining</div>
  </div>
  <button class="lo-toast__undo">Undo</button>
  <span class="lo-toast__timer">10s</span>
  <div class="lo-toast__bar"></div>
</div>
```

**Specs:** 480-560px width, fixed bottom 32px, ink background + cream text, 12px radius, 12-18px padding, 28px green checkmark circle, 2px progress bar at bottom edge depleting at 1Hz.

### 3.18 Tabs (settings sheet)

```html
<div class="lo-tabs">
  <span class="lo-tab lo-tab--on">General</span>
  <span class="lo-tab">Sources</span>
  <span class="lo-tab">Privacy</span>
  <span class="lo-tab">Skill</span>
  <span class="lo-tab">About</span>
</div>
```

10-12px padding, 13px medium, hairline bottom border on container, 2px green underline on active.

### 3.19 Settings row

```html
<div class="lo-settings-row">
  <div>
    <div class="lo-settings-row__label">Refresh cadence</div>
    <div class="lo-settings-row__desc">How often LifeOps checks Gmail.</div>
  </div>
  <div class="lo-settings-row__control"><!-- dropdown / toggle / segmented --></div>
  <div><!-- optional secondary action --></div>
</div>
```

3-column grid (`240px 1fr auto`), 12px vertical padding, hairline top border (except first).

### 3.20 Path field (read-only mono input)

```html
<div class="lo-path-field">
  <svg><!-- file icon --></svg>
  <span>~/.personal-context.yaml</span>
</div>
```

8-12px padding, `#F8F6EE` background, hairline border, 8px radius, mono 12px.

### 3.21 Inventory accordion footer

```html
<div class="lo-inv-foot">
  <div class="lo-inv-foot__text">
    <strong>Inventory</strong>
    <span class="lo-sep">·</span>
    <span>12 cards</span>
    <span class="lo-sep">·</span>
    <span>4 status programs</span>
  </div>
  <svg class="lo-chev"><!-- chevron --></svg>
</div>
```

Single quiet row, 14-18px padding, hairline top + bottom borders, mono 13-14px.

### 3.22 Wallet stack (onboarding)

A peripheral visual cue, never the focal element. 4 brand-colored cards rotated at regular intervals: `-4°, -2°, 0°, +2°`. Each card shows ONE merchant's countdown + amount in mono. Active (frontmost) card has stronger shadow.

---

## 4. Patterns

### 4.1 Partial usage idiom (LOAD-BEARING)

Every dollar value tells the user where they are between zero and the cap.

- Hero card: `$X left of $Y` + progress bar + `$used this cycle / resets Date`
- Inventory card: countdown OR `$X left of $Y`; mini-bar optional but recommended
- Card detail row: `$X left of $Y` + mini-bar + inline ledger (`Apr 15 · $3 at Grubhub`)
- Modal: stepper defaults to a typical amount (NOT max), slider has stops `$0 / $X / $Y / Use all`
- Toast: confirms the *delta* and remaining (`Logged $3 spend · $4 left this cycle`)

**Never** show a single dollar value without context. `$7` alone is ambiguous; `$7 left of $10` is clear.

### 4.2 Top summary row (dashboard, inventory)

A horizontal row above the grid showing 2-3 aggregate stats + search field at right. Mono digits, 22px size, mono caps labels at 10px.

### 4.3 Side rail (card detail)

When a screen has a primary content column, the right side rail is for QUICK ACTIONS + per-card secondary stats. NEVER raw YAML — that goes behind a "View raw YAML" button. Right rail is usually 280-320px wide.

### 4.4 Trays (use-credit interaction)

When showing a state-transition ("expiring → used"), use two clearly-labeled trays side by side. Animate the row sliding from left tray to right at 250ms ease-out.

### 4.5 Breadcrumb

`< Cards / Amex Gold` in 11px mono, ink-muted color. Active leaf in ink/bold. Chevron and slash separators, never `>`.

---

## 5. Voice

### Verbs

| Use | Don't |
|---|---|
| Log spend | Mark used |
| How much did you spend? | Use credit |
| Logs $3 at Grubhub | $3 marked used |
| Log $3 spend → | Mark $3 used → |

The frame is *recording a transaction*, not *consuming an entitlement*. The latter implies one terminal event; the former invites repeat use.

### Nouns

| Use | Don't |
|---|---|
| Credit | Benefit |
| Cycle | Period |
| Cards (loyalty + credit, generically) | Accounts |
| Status (elite tier) | Membership level |
| Cert (free-night certificate) | Voucher |
| Points / miles / avios (program-specific) | "rewards" |

### Microcopy patterns

- Toast title: action + delta + remaining state. "Logged $3 spend · $4 left this cycle"
- Toast subtitle: source identification. "Amex Gold · Monthly dining"
- Empty state: "No usage this cycle" — short, factual, no apology
- Error: name what failed + fix. Avoid generic "Something went wrong"
- Currency formatting: `$7` not `$7.00`. Decimals only when relevant (`$2.40 over budget`)
- Time: `3d 04h` for countdowns, `Apr 15` for events, `Dec 31, 2026` for far dates
- Long lists: never truncate merchant identity; always preserve "Amex Gold" not "Amex G…"

### Things to avoid

- Welcome paragraphs ("Welcome to LifeOps! We're so excited…")
- AI-startup phrases ("Unlock the power of…", "Your all-in-one solution…")
- Emoji in product UI (chrome icons OK; never in card content)
- Marketing voice in app surfaces — keep it utility/calm

---

## 6. Layout principles

- Content padding: 56px horizontal in main views, 24-32px in panels and side rails
- Vertical rhythm: 24-32px between major sections, 14-18px between related items
- Maximum content width: 1440px for main app, 1100px for settings sheet
- Multi-column grids: `repeat(N, 1fr)` with explicit gap, not `space-between`
- One primary CTA per visible region. Secondary actions are text links or ghost buttons
- Section labels always pair with content directly below — never orphan

---

## 7. The "no" list (AI slop, anti-patterns)

When you're tempted to add any of these, the answer is no:

1. Purple/violet/indigo gradient backgrounds
2. 3-column feature grids with icon-in-colored-circle
3. Decorative blobs / floating circles / wavy SVG dividers
4. Centered everything (`text-align: center` on all elements)
5. Uniform 16px+ rounded corners on EVERY surface (vary by component)
6. Emoji as design elements
7. Colored left-border on cards (`border-left: 3px solid <accent>`)
8. Generic hero copy ("Welcome to…", "Unlock the…", "Your all-in-one…")
9. system-ui as the PRIMARY display font (use mono for data; sans for prose)
10. Drop shadows on everything (use shadows hierarchically — bigger surfaces, bigger shadows)
11. Default Tailwind/shadcn colors (`#3B82F6` blue, `#10B981` green) — use brand hex
12. Animated everything — animate only state changes, never decoration

---

## 8. When you add a new screen

1. Identify the screen's job. One sentence.
2. Pick the rule set: APP UI (default for most screens) vs MARKETING (only `02-landing` and any future blog/docs/launch surfaces).
3. Use existing components first. Inventing a new component is a flag — ask whether the same shape already exists.
4. If you DO need a new component, name it (`lo-<noun>`), follow the design tokens, document it here in §3.
5. Use the partial-usage idiom for any numeric data point that has a cap.
6. Test the trunk test: drop a fresh user on this screen — can they answer "what site, what page, what can I do here, where else can I go" in 2 seconds?
7. Run `/gstack-design-review` to verify before merging.

---

## 9. Files

- `design/DESIGN.md` (this file) — canonical spec
- `design/lifeops-tokens.css` — CSS custom properties
- `design/lifeops-components.css` — reusable classes
- `design/component-gallery.html` — visual reference of every component
- `design/icons/` — Lucide-derived inline SVGs

When you start the Tauri+Vite app:
```css
@import "/path/to/design/lifeops-tokens.css";
@import "/path/to/design/lifeops-components.css";
```

Or copy them into `apps/desktop/src/styles/` and own them as part of the app.

---

## Changelog

- **v0.1** (2026-04-30) — Initial spec from V2 "Apple Wallet Native" direction. Locked. 8 screens validated.
