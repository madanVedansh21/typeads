# TypeAds — Landing Page Design System

## Editorial Retro / Newspaper Style

**Scope: Landing page only · typeads.fairgigs.app**

---

## 01 · Design Philosophy

This is not a SaaS landing page. It is a broadsheet.

TypeAds' landing page should feel like an old newspaper front page — the kind you'd find in a 1940s archive. Cream paper, ink-black type, serif headlines, tight column grids, editorial structure. No gradients. No glow. No floating cards. Just ink on paper.

The goal: when someone lands on TypeAds for the first time, it should feel like they've opened something — not loaded a website.

---

## 02 · Color Palette

| Token            | Value     | Usage                                                  |
| ---------------- | --------- | ------------------------------------------------------ |
| `--paper`        | `#F2EDE3` | Page background — warm cream, aged newsprint           |
| `--paper-dark`   | `#E8E0D0` | Section dividers, alternate row backgrounds            |
| `--paper-darker` | `#D9CEBC` | Borders, horizontal rules                              |
| `--ink`          | `#1A1108` | Primary text — near-black, warm-toned ink              |
| `--ink-light`    | `#4A3F30` | Secondary text, bylines, captions                      |
| `--ink-faint`    | `#8C7B65` | Tertiary text, labels, dates                           |
| `--stamp-red`    | `#8B2020` | Accent only — used like a rubber stamp. Sparingly.     |
| `--stamp-navy`   | `#1A2744` | Secondary accent — banner backgrounds, section headers |
| `--white`        | `#FFFFFF` | Never used as a full background. Only for inset boxes. |

**Rule:** No hex colors outside this palette. No pure `#000000` — always use `--ink`. No pure `#ffffff` background — always `--paper`.

---

## 03 · Typography

### Typefaces

| Role                       | Typeface            | Fallback               | Source       |
| -------------------------- | ------------------- | ---------------------- | ------------ |
| Display / Headlines        | `Playfair Display`  | Georgia, serif         | Google Fonts |
| Body / Columns             | `IM Fell English`   | Georgia, serif         | Google Fonts |
| Labels / Bylines / Caps    | `Libre Baskerville` | Times New Roman, serif | Google Fonts |
| Monospace (typing UI only) | `Courier Prime`     | Courier New, monospace | Google Fonts |

**Zero sans-serif fonts on the landing page.** Sans-serif is reserved for the app itself (dashboard, typing screen). The landing page is 100% serif.

### Type Scale

| Role                 | Font              | Size    | Weight | Style  | Case                              |
| -------------------- | ----------------- | ------- | ------ | ------ | --------------------------------- |
| Masthead (site name) | Playfair Display  | 52–64px | 900    | Normal | UPPERCASE                         |
| Section dateline     | Libre Baskerville | 9px     | 400    | Normal | UPPERCASE + letter-spacing 0.2em  |
| Front page headline  | Playfair Display  | 36–48px | 700    | Normal | Title Case                        |
| Sub-headline         | Playfair Display  | 22–28px | 400    | Italic | Title Case                        |
| Column body copy     | IM Fell English   | 15–16px | 400    | Normal | Sentence case                     |
| Byline               | Libre Baskerville | 10px    | 400    | Normal | UPPERCASE + letter-spacing 0.15em |
| Caption              | IM Fell English   | 12px    | 400    | Italic | Sentence case                     |
| Pull quote           | Playfair Display  | 20–24px | 700    | Italic | Sentence case                     |
| CTA button text      | Libre Baskerville | 13px    | 700    | Normal | UPPERCASE + letter-spacing 0.12em |
| Tag / label          | Libre Baskerville | 9px     | 700    | Normal | UPPERCASE + letter-spacing 0.18em |

### Line Height & Spacing

- Body copy: `line-height: 1.75`
- Headlines: `line-height: 1.15`
- Column text: justified (`text-align: justify`) — like a real newspaper column
- Drop caps on first paragraph of main hero column (CSS `::first-letter`, font-size 3.5em, float left)

---

## 04 · Layout System

### Grid

The landing page uses a **newspaper column grid**. Not a card grid — a column grid.

```
Desktop (1200px+):  6-column grid, 16px gutters
Tablet (768–1199px): 4-column grid, 12px gutters
Mobile (<768px):    1-column, stacked like a mobile broadsheet
```

Sections span columns explicitly — like a real newspaper layout where some stories are 2 columns wide and some are 4.

### Borders & Rules

- **Horizontal rules between sections:** `1px solid var(--paper-darker)` — thin, like a printed rule
- **Vertical column dividers:** `1px solid var(--paper-darker)`
- **Section header underlines:** `2px solid var(--ink)` — slightly heavier for section titles
- **Masthead border (top and bottom):** `3px solid var(--ink)` — the thickest line on the page
- **No border radius anywhere.** Everything is rectangular.
- **No box shadows.** Paper doesn't cast shadows.

---

## 05 · Section-by-Section Spec

### 5.1 Masthead

The very top of the page. Looks like a newspaper nameplate.

```
Layout:
- Full width
- Top border: 3px solid var(--ink)
- Bottom border: 3px solid var(--ink)
- Between: a thin 1px rule, then the logo, then another 1px rule
- Background: var(--paper)

Left side:   Date + tagline in Libre Baskerville 9px uppercase
Center:      "TYPEADS" in Playfair Display 900, 56px, uppercase — the nameplate
Right side:  "typeads.fairgigs.app" + "EST. 2025" in 9px uppercase

Below masthead:
- Full-width ticker strip: var(--stamp-navy) background, white text
- Scrolling text: "TYPE ADS. EARN REWARDS. · REAL BRANDS. REAL COPY. · POWERED BY FAIRGIGS · "
- Font: Libre Baskerville, 10px, uppercase, letter-spacing 0.15em
```

### 5.2 Navigation Bar

```
- Full width, var(--paper-dark) background
- Border top + bottom: 1px solid var(--paper-darker)
- Nav items: Libre Baskerville, 10px, uppercase, letter-spacing 0.15em, color var(--ink-light)
- Hover: color var(--ink), underline
- Active: var(--ink), bold
- Items: HOW IT WORKS · FOR TYPISTS · FOR ADVERTISERS · SIGN UP
- No buttons in nav — just text links, newspaper style
```

### 5.3 Front Page — Hero Section

This is the front page "above the fold." Mimics a newspaper front page layout.

```
Layout: 3-column newspaper grid

LEFT COLUMN (2/6 width):
- Section dateline: "EARN · ISSUE 001" — 9px, uppercase, ink-faint
- Large headline: "GET PAID TO TYPE ADS." — Playfair Display, 42px, weight 700
- Sub-headline: "The internet's first typing platform where every keystroke earns." — italic, 22px
- Horizontal rule (1px)
- Body column copy (2 paragraphs) — IM Fell English, 15px, justified
- Drop cap on first letter
- Byline: "BY THE TYPEADS TEAM · 2025" — 9px uppercase

CENTER COLUMN (2/6 width):
- Bordered box (2px solid var(--ink)):
  - Inside: the typing demo widget — a miniature version of the typing screen
  - Caption below: "LIVE DEMO — TYPE THIS AD AND EARN POINTS" — italic caption style
- Below demo box: a pull quote
  - "Every ad you type is an ad someone actually read."
  - Playfair Display, italic, 20px, centered, bordered left with 3px var(--ink)

RIGHT COLUMN (2/6 width):
- "HOW IT WORKS" — section header, 9px uppercase, underlined
- Numbered editorial list style (not bullet points):
  1. Brand submits ad copy
  2. You type it word by word
  3. The ad image reveals as you go
  4. Points land in your wallet
  5. Redeem for Amazon, Flipkart & more
- Each step: number in Playfair Display italic, text in IM Fell English
- Bottom: "JOIN THE WAITLIST" CTA — full width of column, black bg, white text, Libre Baskerville uppercase
```

### 5.4 Stats Strip

```
- Full width, var(--stamp-navy) background, white text
- 4 equal columns, separated by 1px white rule
- Each: big number (Playfair Display, 36px, white) + label (9px, uppercase, faded white)
- Stats: "500+ TYPISTS" · "12 CAMPAIGNS" · "₹4 PER AD" · "20 ADS / DAY MAX"
- Border top + bottom: 2px solid var(--ink)
```

### 5.5 "For Typists" Section

```
- Background: var(--paper)
- Section header strip: thin full-width bar, var(--paper-dark), text "FOR TYPISTS" centered, 9px uppercase
- 2-column layout:
  Left: editorial body copy — what typists get, how earning works, gift card options
  Right: a mock "earnings card" — bordered box, shows example points breakdown
         Looks like a printed receipt or ledger — monospace font, ruled lines
```

### 5.6 "For Advertisers" Section

```
- Background: var(--paper-dark)
- Mirror layout of Typists section
- Left: mock campaign card — bordered, looks like a print order form
- Right: editorial body copy — why advertisers should care, the attention economy angle
```

### 5.7 Testimonial / Pull Quote Strip

```
- Full width, var(--paper) background
- Centered single large pull quote
- Playfair Display, italic, 28px, var(--ink)
- Em-dash attribution below — Libre Baskerville, 10px, uppercase
- Left and right: decorative old-style quotation marks in var(--paper-darker), 80px
- Border top + bottom: 1px solid var(--paper-darker)
```

### 5.8 Footer

```
- Background: var(--ink) — dark ink background
- Text: var(--paper) — cream on dark
- 3-column layout:
  Left:   TYPEADS nameplate (small), tagline, "typeads.fairgigs.app"
  Center: nav links in uppercase, 10px
  Right:  "A FAIRGIGS PRODUCT" + copyright
- Top border: 3px solid var(--paper-darker)
- Font: Libre Baskerville throughout
```

---

## 06 · UI Components

### CTA Button

```css
.cta-btn {
  background: var(--ink);
  color: var(--paper);
  font-family: "Libre Baskerville", serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 12px 24px;
  border: 2px solid var(--ink);
  border-radius: 0;
  cursor: pointer;
}
.cta-btn:hover {
  background: var(--paper);
  color: var(--ink);
}
```

### Section Header Strip

```css
.section-header {
  width: 100%;
  padding: 6px 0;
  text-align: center;
  font-family: "Libre Baskerville", serif;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--ink-faint);
  border-top: 1px solid var(--paper-darker);
  border-bottom: 1px solid var(--paper-darker);
  background: var(--paper-dark);
}
```

### Pull Quote

```css
.pull-quote {
  font-family: "Playfair Display", serif;
  font-size: 22px;
  font-style: italic;
  color: var(--ink);
  border-left: 3px solid var(--ink);
  padding-left: 16px;
  margin: 20px 0;
  line-height: 1.5;
}
```

### Bordered Editorial Box

```css
.editorial-box {
  border: 2px solid var(--ink);
  padding: 16px;
  background: var(--paper);
}
.editorial-box .box-label {
  font-family: "Libre Baskerville", serif;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--ink-faint);
  border-bottom: 1px solid var(--paper-darker);
  padding-bottom: 6px;
  margin-bottom: 10px;
}
```

### Tag / Dateline

```css
.dateline {
  font-family: "Libre Baskerville", serif;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--ink-faint);
  margin-bottom: 8px;
}
```

---

## 07 · Texture & Atmosphere

- **Paper texture:** Add a subtle CSS noise texture overlay on `var(--paper)` backgrounds
  ```css
  background-image: url("data:image/svg+xml,..."); /* fine grain SVG noise */
  background-blend-mode: multiply;
  opacity on texture: 0.03–0.06 — barely visible, just adds grain
  ```
- **No box shadows** — except one exception: a very faint `inset 0 0 40px rgba(0,0,0,0.03)` on the page body to simulate paper edges
- **Images (if any):** Desaturated or duotone — ink-toned, not full color. Treated like newspaper photographs.
- **Horizontal rules:** Use `<hr>` styled as `border: none; border-top: 1px solid var(--paper-darker)` — thin ink lines between sections

---

## 08 · What to Avoid

| ❌ Don't               | ✅ Do instead            |
| ---------------------- | ------------------------ |
| Gradients              | Flat paper color         |
| Rounded corners        | Sharp 0px radius         |
| Box shadows            | Borders only             |
| Sans-serif fonts       | Serif everywhere         |
| White backgrounds      | `var(--paper)` cream     |
| Pure black `#000`      | `var(--ink)` warm black  |
| Icon libraries         | Text labels only         |
| Hover animations       | Instant color swap       |
| Card grids             | Newspaper column layout  |
| Full-color photos      | Duotone / desaturated    |
| Centered hero text     | Left-aligned column copy |
| Large empty whitespace | Tight editorial spacing  |

---

## 09 · Scope Note

This design system applies to the **landing page only** (`/` route).

Once a user logs in and enters the app (dashboard, typing screen, rewards), the design switches to **brutalism** — white background, Arial Black, thick black borders. The two styles are intentionally distinct:

- **Landing page** = editorial retro — draws people in, feels premium and different
- **App interior** = brutalism — functional, raw, focused on the typing task

This contrast is intentional and part of the TypeAds identity.

---

_TypeAds Landing Design System v1.0 · typeads.fairgigs.app · Confidential_
