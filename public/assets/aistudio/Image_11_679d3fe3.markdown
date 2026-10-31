---
name: AO3 Reading Companion
colors:
  surface: '#151217'
  surface-dim: '#151217'
  surface-bright: '#3b383d'
  surface-container-lowest: '#100d12'
  surface-container-low: '#1d1a1f'
  surface-container: '#211e23'
  surface-container-high: '#2c292e'
  surface-container-highest: '#373339'
  on-surface: '#e7e0e7'
  on-surface-variant: '#d3c2c8'
  inverse-surface: '#e7e0e7'
  inverse-on-surface: '#332f34'
  outline: '#9c8d92'
  outline-variant: '#504448'
  surface-tint: '#f2b5d1'
  primary: '#f2b5d1'
  on-primary: '#4c2339'
  primary-container: '#d49ab5'
  on-primary-container: '#5d3148'
  inverse-primary: '#804f68'
  secondary: '#fcb3c0'
  on-secondary: '#50212c'
  secondary-container: '#6e3944'
  on-secondary-container: '#eca5b2'
  tertiary: '#e4bccb'
  on-tertiary: '#432834'
  tertiary-container: '#c7a0af'
  on-tertiary-container: '#533743'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd8e8'
  primary-fixed-dim: '#f2b5d1'
  on-primary-fixed: '#330e23'
  on-primary-fixed-variant: '#653850'
  secondary-fixed: '#ffd9de'
  secondary-fixed-dim: '#fcb3c0'
  on-secondary-fixed: '#360c18'
  on-secondary-fixed-variant: '#6b3742'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#e4bccb'
  on-tertiary-fixed: '#2c141f'
  on-tertiary-fixed-variant: '#5c3e4b'
  background: '#151217'
  on-background: '#e7e0e7'
  surface-variant: '#373339'
typography:
  display:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.01em
  display-mobile:
    fontFamily: Merriweather
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 34px
  headline-lg-mobile:
    fontFamily: Merriweather
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 28px
  headline-md:
    fontFamily: Merriweather
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  headline-sm:
    fontFamily: Merriweather
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-reading-lg:
    fontFamily: Merriweather
    fontSize: 18px
    fontWeight: '300'
    lineHeight: 32px
  body-reading-md:
    fontFamily: Merriweather
    fontSize: 16px
    fontWeight: '300'
    lineHeight: 28px
  body-ui:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  tag-archive:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  margin-reading: 1.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system is tailored for an intimate, distraction-free reading companion designed for cataloging, personal curation, and long-form archive reading. 

The aesthetic is quiet editorial minimalism: an atmosphere reminiscent of private bound journals, late-night reading desks, and classic letterpress typography. It prioritizes emotional safety, discretion, and uninterrupted narrative immersion. Visual noise is systematically eliminated—eschewing bright saturated gamification, neon status badges, and playful bubbly geometry in favor of restrained layouts, fine hairline strokes, deliberate typographic hierarchy, and tonal depth.

Interactions are gentle and intentional. The interface stays out of the reader's way, elevating text legibility and metadata comprehension while retaining personal warmth through muted dusty accents.

## Colors

The core palette defaults to **Rose Noir**, providing an atmospheric dark canvas that protects eyes during extended night sessions.

### Functional Color Roles
- **Background (`#242126`)**: Deep, low-fatigue charcoal with a subtle warm mauve undertone.
- **Surface Elevated (`#343039`)**: Used for cards, sheets, drawer containers, and popovers.
- **Primary Dusty Pink (`#D49AB5`)**: The core brand highlight. Reserved for active navigation items, reading progress indicators, and primary action targets.
- **Muted Rose (`#BF7E8A`)**: Subtle accent for selected tags, secondary links, and auxiliary metadata.
- **Cream Text (`#F1E8EF`)**: High-contrast, non-harsh primary foreground preventing high-luminance optical glare.
- **Secondary Text (`#C8BEC8`)**: Subdued metadata, author credits, word counts, and chapter counts.
- **Hairline Border (`#514852`)**: Deliberate, razor-thin structural dividers.

### Multi-Theme Strategy
The system provisions four calibrated reading states:
1. **Rose Noir**: Intimate night mode (default).
2. **Midnight Blue**: Deep, cool navy dark mode for low-glare twilight reading.
3. **Soft Light**: Neutral alabaster daylight mode, avoiding blinding `#FFFFFF` backdrops.
4. **Warm Sepia**: Low-contrast, paper-mimetic parchment tone for sustained daytime reading.

Status tokens maintain low saturation to avoid turning tag clouds and archive lists into jarring status dashboards.

## Typography

The typographical landscape divides cleanly into **Editorial Reading** and **System Shell** roles.

### Typeface Roles
- **Editorial & Reading**: `Merriweather` (or user-swapped `Georgia`) serves as the core reading experience and literary headline voice. Its sturdy serifs ensure readability at low screen brightness.
- **System Interface & Metadata**: `Inter` handles operational UI—tab navigation, metadata metrics (word count, kudos, bookmarks, relationships), tags, and input controls.
- **Reader Accessibility Overrides**: The reader view supports real-time swap into user-selected font engines:
  - **Georgia**: Crisp, traditional screen-serif.
  - **Merriweather**: Deep, bookish, warm literary weight.
  - **Inter**: Neutral, humanist sans-serif reading mode.
  - **OpenDyslexic**: Weighted bases to assist readers with dyslexia and visual tracking fatigue.

Reading line heights are tuned intentionally loose (`1.75` to `1.85`) to enable effortless eye tracking across long passages without visual crowding.

## Layout & Spacing

Layouts follow a calm, vertical rhythmic flow centered around reader focus.

### Layout Principles
- **Reading Canvas**: Constrained maximum line width of `68ch` (or `640px`) centered horizontally. Text must never span unchecked across wide displays.
- **Library & List Views**: A single-column or restrained 2-column stream. Density is medium-compact to surface pertinent metadata without feeling clinical or tabular.
- **4-Tab Navigation Footprint**: Anchored strictly to the viewport bottom at a fixed `56px` height plus device safe-area inset.
- **Safe Margins**: Mobile layout maintains `1.25rem` outer margins; active reader views dynamically scale between `1.25rem` and `2.5rem` based on user preferences for margins and line length.

## Elevation & Depth

This system intentionally departs from diffused dropshadows, neumorphic extrusions, and heavy blurs. Visual layering is constructed through **tonal stacking** and **crisp 1px hairline framing**.

### Elevation Hierarchy
- **Level 0 (Canvas Base)**: The foundational background (`#242126` in Rose Noir). Used for continuous reading pages and screen backdrops.
- **Level 1 (Surface Containers & Cards)**: Elevated surface (`#343039`) bound by a 1px solid hairline (`#514852`). Applies to work cards, metadata disclosure sheets, and popovers.
- **Level 2 (Overlays & Sheets)**: Modals, bottom navigation bars, and chapter drawers share the elevated surface tone (`#343039`) combined with an opaque or semi-translucent back-layer, delineated exclusively by a top or perimeter hairline border (`#514852`).
- **Shadow Profile**: Shadows are strictly absent or reduced to a flat, dark ambient scrim (`rgba(0, 0, 0, 0.45)`) used only behind modal backdrops to isolate modal reading settings.

## Shapes

The design system maintains a structured, bookbound personality through crisp edges and soft corners.

- **Corner Radius Level**: Level 1 (Soft).
- **Core Radius (`0.25rem` / `4px`)**: Work cards, status badges, text inputs, buttons, and bottom sheet containers.
- **Subtle Radius (`0.125rem` / `2px`)**: Tiny inline metadata tags, character tags, and fandom chips.
- **Round Pills**: Explicitly avoided. Chips, tags, and badges remain rectangular with micro-softened corners to emulate archival card catalogs and book stamps rather than modern social apps.

## Components

### Bottom Navigation Bar (4-Tab)
- **Tabs**: `Home`, `Reading`, `Notebook`, `Settings`.
- **Structure**: Height `56px`, fixed bottom position with hardware safe-area accommodation. Background `#343039` with a continuous `1px` top border in `#514852`.
- **States**: 
  - *Active*: Minimalist monochrome/editorial icon with dusty-pink fill or stroke (`#D49AB5`), paired with a `11px` label in `#F1E8EF`.
  - *Inactive*: Subdued stroke in `#C8BEC8` (60% opacity), label in `#C8BEC8`.
  - *No shifting or bouncing animations*: Transitions are smooth `150ms` opacity fades.

### Status Badges
- **Shape**: Compact box with `2px` corners, `3px 6px` padding, uppercase or small-caps `11px` font (`Inter`).
- **Variants**:
  - `To Read`: Slate mauve container (`#38313A`), hairline `#5A4F5D`, muted text `#D4CAD4`.
  - `Priority To Read`: Rich plum container (`#44303C`), hairline `#734F64`, rose text `#E8B8CE`.
  - `Reading`: Deep teal container (`#2A3638`), hairline `#466266`, cyan-tinted text `#A5CBD0`.
  - `Read`: Deep spruce container (`#2A3831`), hairline `#456653`, soft mint text `#A4CEB5`.
  - `Abandoned`: Muted burgundy container (`#372B2B`), hairline `#664949`, faded coral text `#CF9E9E`.
  - `Possibly Read Before`: Muted amber container (`#3A342B`), hairline `#6B5E46`, parchment text `#DFCBA3`.

### Reaction Tokens
- `Favorite`: Placed inline or in footer actions. Deep mauve surface (`#402A36`), border `#6F455B`, heart accent `#E489B3`. When active, heart is filled; counter text is `#F2B8D2`.
- `Not My Thing`: Discreet, non-punitive archive dismiss icon. Muted surface (`#2E2A2E`), border `#474047`, text/icon `#9E949D`. Flags works to fade down in library listings without harsh deletion UI.

### Work / Fic Cards
- **Container**: Surface `#343039`, 1px border `#514852`, `4px` corner radius, `16px` padding.
- **Header**: Merriweather title in `#F1E8EF` (18px), author attribution in `#D49AB5` with hover underline.
- **Tags Grid**: Grouped into Archive Warnings, Fandoms, Relationships (italicized serif or distinct subtle tint), and Additional Tags. All chips render with `2px` radius and hairline borders.
- **Footer**: Word count, chapters, status badge, and reading progress bar (a `2px` high hairline track with `#D49AB5` fill).

### Buttons & Inputs
- **Primary Button**: Background `#D49AB5`, text `#242126` (high-contrast charcoal), font weight 600, border radius `4px`.
- **Secondary / Ghost Button**: Transparent background, 1px hairline `#514852`, text `#F1E8EF`. Active state shifts to surface `#343039`.
- **Inputs**: Hairline borders (`#514852`), background `#2B272E`, inner text `#F1E8EF`, placeholder `#7D737E`. Active focus rings are `1px` solid `#D49AB5` without outer glow.

### Reading Surface Overlay
- Pure distraction-free HUD. Tapping center toggles a discreet top status header (Chapter progress, battery, book title) and a bottom control bar (Theme switch, typography picker, margin slider).