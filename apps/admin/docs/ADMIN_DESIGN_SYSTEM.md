# Tareeq Admin Design System

A warm-paper, editorial admin that echoes the consumer post-result "home" world: off-white sand canvas, carbon ink, brand violet for actions, gold and the eight cluster colors as data accents, and the display-italic serif for signature moments. It is a data tool first — density and contrast win over spectacle.

## Scope

All tokens live in `app/admin/admin.css` as CSS variables on the `.adm` class, applied once by `app/admin/layout.tsx`. The consumer app (`color-scheme: dark`) is never touched; the admin sets `color-scheme: light` inside its own scope. Tailwind utilities (`bg-adm-paper`, `text-adm-ink`, `shadow-adm-md`, `rounded-adm-lg`, `font-display`…) alias the variables via `tailwind.config.ts` and resolve only where `.adm` provides the variables.

## Color

Canvas is `--adm-paper #F9F4EC` with `--adm-sand #F5EEE6` for wells and table headers; cards sit on `--adm-card #FFFDF9`. Text is `--adm-ink #14101F` (≈15:1 on paper), secondary text `--adm-ink-muted #5D5670` (≥4.5:1 — the floor for body copy; `--adm-ink-faint` is decorative/large-text only). `--adm-violet #6E48E4` is the single action color — primary buttons, links, focus rings, active nav. Gold is celebratory (published states, signature numbers' underline), mint is success, `--adm-error-ink #9C2F23` carries error text (the blush `--adm-error` is for fills/borders only — it fails AA as text). Night surfaces (`--adm-midnight` + the `.adm-night-glow` helper) appear in exactly two places: the sidebar and the login backdrop, tying the admin to the consumer's dark world.

Cluster colors (`--adm-cl-tech` … `--adm-cl-env`) are categorical and meaningful — use them for chips, distribution bars, and counts; never as decoration.

## Type

Body/UI is Plus Jakarta Sans (`--font-jakarta`) on a compact scale: 12 for badges/meta, 13 for dense table rows, 14 default, 16 for inputs. The display serif (`--font-display`, used *italic*) is reserved for page titles, stat numbers, and empty-state headlines — apply via the `.adm-display` helper or `font-display italic`. If a screen has more than two serif moments, remove one. Pair titles with the `.adm-kicker` overline (violet, letterspaced caps).

## Shape, space, elevation

Radii: 8 (inputs, chips), 12 (buttons, table wrappers), 20 (cards), 28/36 (modals, hero cards) — `rounded-adm-sm…2xl`. Spacing follows the 4/8/12/16/20/24/32/40/48/64 scale; tables use 12px vertical padding, forms 16–20 between fields. Shadows (`--adm-shadow-xs…lg`) are warm and violet-tinted; cards default to `xs` + a `--adm-line` border, lifting to `md` on hover.

## Motion

Durations 150/220/360ms with `--adm-ease` (ease-out quint). Animate only `transform` and `opacity`: `.adm-lift` for hover raise, `.adm-fade-up` for entry. `prefers-reduced-motion` flattens everything globally — never opt out of it.

## Accessibility

One focus style everywhere: 2px violet `:focus-visible` outline with 2px offset (soft violet on dark via `.adm-on-dark`). All interactive primitives are real buttons/links/inputs, keyboard-reachable, with disabled states at full-contrast text on muted fills (no 40%-opacity text). Status is never conveyed by color alone — badges always carry a label.

## Primitives (`components/admin/ui/`)

`Button` (primary / ghost / danger, sm/md, `loading`), `Card` (+`CardHeader`), `Field` group (`Label`, `Input`, `Select`, `Textarea`, inline `error`), `Badge` (status) + `ClusterChip`, `Table` set (`Table`, `Th`, `Td`, hover rows), `NavItem` (sidebar tabs with active indicator), `EmptyState` (compass glyph + serif headline), `InlineStatus`/`Toast`. Compose screens from these; one-off styles should graduate into a primitive or die.

## Signature touches

The night sidebar with its gold compass mark and violet active pill; the editorial page header (kicker + display-italic title); display-serif stat numbers with a gold underline; cluster-colored chips and the stacked cluster distribution bar.
