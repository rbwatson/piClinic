# piClinic v2 UI Pattern Library

Derived from the v1 rendered HTML in `v2_refactor/v1-screens/` and the v1
stylesheet `www/html/assets/css/piClinic.css`. Each pattern maps a v1 DOM
structure to a v2 React component with plain CSS styling.

**Guiding principles:**

- Each pattern is a single React component with its own CSS module or
  scoped styles. No pattern depends on Tailwind responsive prefixes.
- Responsive behavior is handled with CSS media queries in the component's
  own styles, not in the JSX className strings.
- Patterns are independently renderable and testable without page-level
  data or routing.
- Pages are compositions of patterns. A page file should contain routing,
  data fetching, and pattern assembly — not layout or styling logic.

---

## 1. Layout patterns

These form the skeleton that every page sits inside.

---

### 1.1 PageShell

**V1 equivalent:** the full-page stack of banner + session menu + app menu +
page body.

**Design rationale:** v1 uses a horizontal top-bar layout for two reasons
that apply equally to v2: the global nav item list is small and fixed, and
the information-dense pages (ptInfo, visitInfo, visitEdit) need the full
horizontal width for content. A sidebar would permanently consume screen
width on every page. v2 follows the same horizontal top-bar layout.

**V1 structure (top to bottom, full browser width):**

```css
#piClinicBannerDiv    70px, blue (#558ED5) "piClinic" italic bold white, 20px left padding
#sessionMenu          ~15px, blue, 70% font size, white text
  left:         username | settings | logout
  right:        language switcher
#topLinkMenuDiv       white background, 90% font size, no top border
  left:         nav links (pipe-separated li items)
  right:        Comentario link
  [separator]         1px black bottom border on topLinkMenuDiv
.pageBody             white, 20px left padding, page content
```

**V2 component:** `AppShell.tsx`

**Layout:** a fixed header containing the three horizontal bars stacked
vertically, followed by a full-width scrollable content area. A
`padding-top` spacer on the content area equal to the header height
prevents content from rendering beneath the fixed header.

**Header bar 1 — Banner:**
- Height: 70px
- Background: `#558ED5`
- Left: "piClinic" in italic bold white, 150% font size, 20px left padding
  (matches v1 `p.piClinicBannerText`)
- Right: patient quick-search input + button (v2 addition — see note)

**Header bar 2 — Session:**
- Height: ~28px (14px text + padding)
- Background: `#558ED5`
- Font size: 70% of base (matches v1 `div#sessionMenu`)
- White text and links
- Left: "Logged in as: [username] | Settings | Logout"
- Right: language links ("English | Español" — current language not linked)

**Header bar 3 — Nav:**
- Background: white
- Font size: 90% of base (matches v1 `div#topLinkMenuDiv`)
- Bottom border: 1px solid black (this is the separator between nav and
  page content, not the border between nav items)
- Left: nav links in `ul.topLinkMenuList` style — horizontal list, no
  bullets, pipe separator between items, brand blue links, current page
  rendered as plain text (not a link)
- Right: secondary link (e.g. language toggle or help link)

**Content area:**
- White background
- 20px left padding (matches v1 `.pageBody`)
- Scrolls independently of the fixed header
- Full browser width minus the 20px padding

**Patient quick-search (v2 addition):**
Placed in the banner bar (right side). Staff must be able to look up a
patient from any authenticated page without navigating away. This is a
workflow requirement, not a convenience feature — a patient may walk up
with a question while the staff member is in the middle of another task.
Submits to `/patients?q=...`.

V1 placed this search inline on individual pages (clinicDash, ptInfo,
visitInfo). Placing it in the persistent header in v2 achieves the same
availability without repeating it on every page.

**Responsive (mobile, below 768px):**
The three-bar header collapses to a single slim bar containing the app
name and a hamburger button. The hamburger opens a full-height drawer
containing the nav links, patient search, session info, and language
toggle. The content area gains a top spacer equal to the collapsed
header height.

CSS media queries on `.shell-header-full` (visible above 768px) and
`.shell-header-mobile` (visible below 768px) control the switch. These
class names are defined in `AppShell.css`, not in Tailwind.

**Plain CSS only.** No Tailwind utility classes for layout, height,
position, or responsive behavior in this component.

---

### 1.2 PageActions

**V1 equivalent:** `#topicMenuDiv` and `#optionMenuDiv`

**What it does:** a horizontal strip of pipe-separated action links rendered
at the top of the page body, below the shell nav and above the page content.
Used for two distinct purposes in v1 that share the same visual treatment:

- **Topic actions** (`#topicMenuDiv`): navigation — search for another
  patient, cancel, back links.
- **Option actions** (`#optionMenuDiv`): record-level actions — edit this
  patient, admit, discharge, edit all visit fields.

Both use `ul.topLinkMenuList` with pipe-separated `li` items.

**V2 component:** `PageActions.tsx`

**Structure:**
```
<div class="page-actions">        border-bottom 1px, 8px vertical padding
  <span class="pa-item">
    <a>link text</a>
    <span class="pa-sep">|</span>   hidden on last item via :last-child
  </span>
  ...
</div>
```

**Variants within the component:**
- `PageActions.Link` — renders a `<Link>` (react-router)
- `PageActions.Button` — renders a `<button>` for onClick actions
- `PageActions.Button variant="destructive"` — red text for destructive
  actions

**Typography:** 14px, brand blue (`#558ED5`) for links and default buttons,
red for destructive. No bold. Matches v1 `ul.topLinkMenuList li a` styles.

**Notes:**
- Hidden on print (`.page-actions { display: none }` in `@media print`)
- The pipe separator after the last item is hidden with CSS
  (`.pa-item:last-child .pa-sep { display: none }`)

---

### 1.3 NameBlock

**V1 equivalent:** `div.nameBlock` used on visitInfo, visitOpen, visitClose,
visitEdit.

**What it does:** displays the patient's name prominently as a page-level
heading, with DOB and patient ID link below on the left, and visit date (and
visit ID on detail/edit pages) on the right.

**V1 structure:**
```
div.nameBlock
  div.infoBlock (left, float: left)
    h1.pageHeading.noBottomPad.noBottomMargin
      [Patient full name]  (Sex)
    p
      [DOB]   [patient ID link]
  div.infoBlock (right, float: left)
    p  Visit date: [datetime]
    p  ID: [visitID]          ← omitted on visitOpen (no ID yet)
div.clearFloat
```

**V2 component:** `NameBlock.tsx`

**Props:**
```typescript
interface NameBlockProps {
  patientName:    string        // formatted "Last, First M."
  patientSex:     string        // "M" | "F" | "X"
  patientDOB:     string | null
  patientID:      string        // clinicPatientID, rendered as link
  visitDate:      string | null // formatted datetime
  visitID?:       string | null // omitted on open-visit form (not yet assigned)
}
```

**Layout:** flex row, space-between. Left block takes remaining width. Right
block is right-aligned, shrinks to content. Stacks to column on mobile
(below 768px).

**Typography:**
- Patient name: 20px, weight 400 (matches v1 `h1.pageHeading` at 18pt
  normal weight)
- Sex: 14px, muted color, inline after name
- DOB + patient ID: 14px, muted color; patient ID is a blue link
- Visit date label: 11px bold; value 14px
- Visit ID: 12px monospace, muted

---

### 1.4 TwoColumnLayout

**V1 equivalent:** side-by-side `div.infoBlock` or `#PatientDataView` +
`#PatientHistoryDiv` using `float: left`.

**What it does:** places two content blocks side by side on wide screens,
stacking them vertically on mobile.

**Used on:**
- `ptInfo` — patient data (left) + visit history (right)
- `visitInfo` / `visitEdit` — arrival + vitals (left) + notes + diagnosis
  (right)

**V2 component:** `TwoColumnLayout.tsx`

**Props:**
```typescript
interface TwoColumnLayoutProps {
  left:  React.ReactNode
  right: React.ReactNode
}
```

**CSS:**
```css
.two-col {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}
.two-col-left,
.two-col-right {
  flex: 1;
  min-width: 0;
}
.two-col-right {
  margin-top: 0;
}
@media (max-width: 767px) {
  .two-col {
    flex-direction: column;
  }
  .two-col-right {
    margin-top: 1.5rem;
  }
}
```

---

### 1.5 CurrentVisitBanner

**V1 equivalent:** `div.currentVisitList`

**What it does:** a light gray box displayed on the patient detail page when
the patient currently has an open visit. Conditionally rendered — absent when
there is no open visit.

**V1 structure:**
```
div.currentVisitList           background: #DDD, padding 1px 5px 5px 0.5em
  h2 "Patient is in the clinic now"
  table.piClinicList
    cols: Arrived | Doctor | Reason | Actions
    actions: View | Edit | Discharge  (pipe-separated links)
```

**V2 component:** `CurrentVisitBanner.tsx`

**Props:**
```typescript
interface CurrentVisitBannerProps {
  visit: Visit   // the open visit record
}
```

**CSS:**
```css
.current-visit-banner {
  background-color: #ddd;
  padding: 4px 8px 8px 0.5em;
  margin: 12px 0 0 0;
}
```

**Notes:** the gray background is intentional and matches v1 exactly. It
signals "this patient is currently in the clinic" at a glance. The v2 blue
banner used previously is incorrect — it conflates status with action.

---

## 2. Data display patterns

Used on read-only info pages (ptInfo, visitInfo).

---

### 2.1 SectionHeading

**V1 equivalent:** `h2` inside `.pageBody`

**What it does:** labels a section of related data fields. Optional inline
extra content (e.g. a link like "Search ICD-10 code") appears at the same
baseline in smaller text.

**V1 structure:**
```html
<h2>Section title</h2>
<!-- or with extra content: -->
<h2>Discharge &nbsp;&nbsp;
  <span class="linkInHeading"><a>Search ICD-10</a></span>
</h2>
```

**V1 CSS:** `h2 { font-size: 16pt; font-weight: normal; margin-bottom: 10pt }`

**V2 component:** `SectionHeading.tsx`

**Props:**
```typescript
interface SectionHeadingProps {
  title: string
  extra?: React.ReactNode   // optional inline link or badge
}
```

**CSS:** 16px, weight 400, bottom margin 8px, top margin 16px (except first
child). Border-bottom optional — use when introducing a major section break.

---

### 2.2 LabelValue (display)

**V1 equivalent:** `div.dataBlock > p > label + span` or plain text

**What it does:** renders a single label-value pair. The label is bold and
smaller than the value. Empty or unspecified values render in italic gray
(`span.inactive`).

**V1 structure:**
```html
<div class="dataBlock">
  <p>
    <label>Field name:</label>
    <span>value text</span>
    <!-- or when empty: -->
    <span class="inactive">No especificado</span>
  </p>
</div>
```

**V1 CSS:**
```css
label          { font-weight: bold; font-size: 80%; margin-right: 1.5em }
span.inactive  { font-style: italic; color: #aaa }
```

**V2 component:** `LabelValue.tsx`

**Props:**
```typescript
interface LabelValueProps {
  label: string
  value: React.ReactNode | null | undefined
  // if value is null/undefined/'', renders the inactive placeholder
  emptyText?: string  // defaults to "—"
}
```

**CSS:**
```css
.label-value        { padding: 4px 0; border-bottom: 1px dotted #ccc; }
.label-value:last-child { border-bottom: none; }
.lv-label           { font-weight: bold; font-size: 87.5%; margin-right: 1.5em;
                      display: inline-block; min-width: 10em; }
.lv-value           { font-size: 87.5%; }
.lv-empty           { font-style: italic; color: #aaa; font-size: 87.5%; }
```

**Notes:**
- The dotted bottom border between rows matches v1's `table.piClinicList td`
  dotted separator treatment
- `min-width` on the label creates consistent alignment across a block of
  fields without needing a grid

---

### 2.3 LabelValue (locked)

**V1 equivalent:** `div.dataBlock > p > label.close + plain text` inside a
`<form>`, used for fields that exist in the record but are not editable in
the current workflow step.

**What it does:** visually identical to LabelValue (display) but rendered
inside a form where neighboring fields are editable inputs. Signals "this
field is part of the record but cannot be changed here."

**V1 example (visitClose — arrived time is shown but not editable):**
```html
<div class="dataBlock">
  <p>
    <label class="close">Llegó a la clínica:</label>
    &nbsp;18-06-2022 12:04
    &nbsp;&nbsp;&nbsp;
    <label class="close">Tipo de la visita:</label>
    &nbsp;Consulta externa
  </p>
</div>
```

**V2 component:** `LabelValue.tsx` with `locked` prop, or a `locked` CSS
modifier on the same component.

**Props:** same as LabelValue (display) plus:
```typescript
locked?: boolean  // renders value as non-interactive text inside a form
```

**CSS:** same as LabelValue (display). No additional styling needed — the
visual treatment is identical. The `locked` prop exists to document intent,
not to change appearance.

**Notes:**
- Do not use a disabled `<input readonly>` for locked fields. Plain text in
  a form is less visually confusing than a grayed-out input.
- Multiple locked fields can appear on the same line (as in v1's arrived
  time + visit type). Use an `InlineGroup` wrapper for this case (see 3.4).

---

### 2.4 DataTable

**V1 equivalent:** `table.piClinicList`

**What it does:** a data table with left-aligned column headers, dotted
row separators, and link cells. Used for open visits list (clinicDash),
visit history (ptInfo), and search results (ptResults).

**V1 CSS:**
```css
table.piClinicList th  { text-align: left; vertical-align: bottom;
                         padding: 5px 20px 0 0; font-size: inherit }
table.piClinicList td  { text-align: left; vertical-align: top;
                         padding: 0 20px 0 0; font-size: 90%;
                         border-bottom: 1px dotted #ccc }
table.piClinicList td.nowrap     { white-space: nowrap }
table.piClinicList td.inactive   { font-style: italic; color: #aaa }
table.piClinicList td.notToday   { color: #F00 }
```

**V2 component:** `DataTable.tsx`

**Props:**
```typescript
interface DataTableProps {
  columns: {
    key:      string
    heading:  string
    nowrap?:  boolean
    align?:   'left' | 'right' | 'center'
  }[]
  rows: Record<string, React.ReactNode>[]
  // each row is a map of column key -> cell content
  // cell content can be a string, a Link, or pipe-separated action links
}
```

**CSS:** no outer border, no background. Dotted `1px #ccc` bottom border on
each `td`. Column header `font-weight: bold`, `font-size: 87.5%`.

---

### 2.5 AllergyList / MedsList

**V1 equivalent:** `ul.allergyList` and `ul.medsList`

**What it does:** renders a pipe-delimited string from the database as a
bullet list. Used for known allergies and current medications on ptInfo.

**V1 structure:**
```html
<ul class="allergyList">
  <li class="allergy">milk</li>
  <li class="allergy">walnuts</li>
</ul>
```

**V2 component:** not a separate component — handled inside `LabelValue` by
passing a pre-split list as the `value` prop:
```tsx
<LabelValue
  label={t('PATIENT_ALLERGIES_HEADING')}
  value={
    allergies.length > 0
      ? <ul>{allergies.map((a, i) => <li key={i}>{a}</li>)}</ul>
      : null
  }
/>
```

The split logic (`str.split('|').filter(Boolean)`) belongs in the page or a
utility function, not in a pattern component.

---

### 2.6 VitalsRow

**V1 equivalent:** `table.piClinicList` with six `th.sixCol` / `td.sixCol`
columns for Height | Weight | Temp | BP | Pulse | RBS/FBS.

**What it does:** displays pre-clinic vitals in a compact six-column
horizontal row. Used on visitInfo (display) and visitOpen/visitEdit/
visitClose (editable inputs).

**V1 structure:**
```html
<table class="piClinicList">
  <tr>
    <th class="sixCol"><label>Estatura</label></th>
    <th class="sixCol"><label>Peso</label></th>
    ...
  </tr>
  <tr>
    <td class="sixCol">150 cm</td>
    <td class="sixCol">40 kg</td>
    ...
  </tr>
</table>
```

**V1 CSS:** `th.sixCol, td.sixCol { width: 16%; text-align: left }`

**V2 component:** `VitalsSection.tsx` (already exists)

The existing component handles both display and editable modes. Verify that
it uses a plain `<table>` with six equal-width columns and not a flex/grid
layout, which collapses at small screen widths. If a column has no value,
display `—`.

---

## 3. Form patterns

Used on edit and entry pages (ptAddEdit, visitOpen, visitEdit, visitClose).

---

### 3.1 FieldLabel + TextInput

**V1 equivalent:** `label.piClinicFieldLabel` or `label.close` + `input.piClinicEdit`

**What it does:** a single labeled text input. `label.close` has tighter
right margin (`0.5em` vs `1.5em`) for inline use. `label.piClinicFieldLabel`
is used for standalone (block) inputs.

**V1 CSS:**
```css
label.piClinicFieldLabel { font-size: 100% }
input.piClinicEdit        { width: 202px }
input.wide                { width: 30em }
```

**V2 component:** `FieldInput.tsx`

**Props:**
```typescript
interface FieldInputProps {
  id:          string
  label:       string
  type?:       string      // default 'text'
  placeholder?: string
  required?:   boolean
  wide?:       boolean     // 30em width vs default 202px
  error?:      string      // validation message shown below input
  // ...plus react-hook-form register spread
}
```

**CSS:**
```css
.field-label        { display: block; font-weight: bold; font-size: 87.5%;
                      margin-bottom: 2px; }
.field-input        { width: 202px; padding: 3px 6px; border: 1px solid #ccc;
                      font-size: 14px; }
.field-input.wide   { width: 30em; }
.field-error        { font-size: 80%; color: #cc0000; margin-top: 2px; }
```

---

### 3.2 FieldLabel + Select

**V1 equivalent:** `label.close` + `<select>`

**What it does:** a labeled dropdown select. Often appears inline with other
fields on the same row.

**V2 component:** `FieldSelect.tsx`

**Props:**
```typescript
interface FieldSelectProps {
  id:       string
  label:    string
  options:  { value: string; label: string }[]
  required?: boolean
  error?:   string
  // ...plus react-hook-form register spread
}
```

**CSS:** same label treatment as FieldInput. Select width matches
`input.piClinicEdit` (202px) by default.

---

### 3.3 FieldLabel + Textarea

**V1 equivalent:** `label` + `textarea.complaintEdit` or `textarea.allergyEdit`

**What it does:** a labeled multi-line text input. Used for primary
complaint, secondary complaint, allergies, medications, and comments.

**V1 CSS:**
```css
textarea.allergyEdit,
textarea.complaintEdit  { width: 30em; height: 56pt; font-size: 12pt }
```

**V2 component:** `FieldTextarea.tsx`

**Props:**
```typescript
interface FieldTextareaProps {
  id:          string
  label:       string
  placeholder?: string
  rows?:       number   // default 4
  error?:      string
  // ...plus react-hook-form register spread
}
```

**CSS:** `width: 30em; font-size: 14px; resize: vertical;`

---

### 3.4 InlineFieldGroup

**V1 equivalent:** multiple `label.close` + input elements on one `<p>` tag,
separated by `&nbsp;` or `&nbsp;&nbsp;&nbsp;`.

**What it does:** places two or more short field inputs on the same
horizontal line. Used for date spinners (day-month-year), sex + DOB +
vaccination date, blood type + organ donor + language.

**V1 example:**
```html
<p>
  <label class="close">Sexo:</label>
  <select>...</select>
  &nbsp;&nbsp;
  <label class="close">Fecha de nacimiento (D-M-A):</label>
  <input class="twoDigitNumeric">-<input class="twoDigitNumeric">-
  <input class="fourDigitNumeric">
  <label class="close">Próxima vacunación:</label>
  ...
</p>
```

**V2 component:** not a separate component. Use a wrapping `<div>` with
`display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline;`
directly in the page form. Individual fields within it are `FieldInput` or
`FieldSelect` instances.

On mobile (`max-width: 767px`) the group wraps to multiple lines
automatically via `flex-wrap: wrap`.

**Note:** the v1 small numeric inputs use specific widths:
```css
input.twoDigitNumeric  { width: 3em }
input.fourDigitNumeric { width: 5em }
input.timeNumeric      { width: 6em }
input.short            { width: 6em }
```
These should be honored in v2 — date spinners should not be full-width
inputs.

---

### 3.5 DiagnosisField

**V1 equivalent:** `label.close` + `select#ConditionNSelect` +
`input[list="diagData"]` (ICD-10 autocomplete via datalist) stacked
vertically.

**What it does:** captures a single diagnosis entry: first a
new-vs-subsequent classification select, then a free-text ICD-10 search
input that resolves to a code stored in a hidden field. Appears three times
per visit (diagnoses 1, 2, 3).

**V1 structure:**
```html
<div class="dataBlock">
  <p>
    <label class="close">Diagnóstico 1:</label>
    <select name="condition1">
      <option>(Select new or subsequent)</option>
      <option value="NEWDIAG">New diagnosis</option>
      <option value="SUBSDIAG">Subsequent diagnosis</option>
    </select>
    <br>
    <input type="text" list="diagData" name="diagnosis1Desc"
           class="piClinicEdit fullWidth" />
    <input type="hidden" name="diagnosis1" />
  </p>
</div>
```

**V2 component:** `DiagnosisField.tsx` (wraps existing `ICD10Autocomplete`)

**Props:**
```typescript
interface DiagnosisFieldProps {
  n:         1 | 2 | 3
  label:     string
  language:  'en' | 'es'
  // react-hook-form setValue for condition and diagnosis fields
  onSelect:  (code: string, description: string) => void
  initialValue?: string
}
```

**Layout:** label, then condition select, then ICD autocomplete input on the
next line. Full width within its container column.

---

## 4. Feedback patterns

---

### 4.1 ErrorBanner

**V1 equivalent:** `div.errorMessage`

**What it does:** a full-width pink-background error message shown when a
page-level error occurs (DB failure, access denied, form submission error).

**V1 CSS:**
```css
div.errorMessage {
  background-color: #fbb;
  color: #000;
  padding-left: 1em;
  width: 100%;
}
div.errorMessage p { margin: 10px 0 }
```

**V2 component:** `ErrorBanner.tsx`

**Props:**
```typescript
interface ErrorBannerProps {
  message: string
}
```

**CSS:** background `#fbb`, black text, 1em left padding, full width, 10px
top and bottom padding on the inner paragraph.

---

### 4.2 LoadingState

**What it does:** a minimal inline message shown while data is fetching.
Not a spinner — v1 used a simple italic red "Cargando..." (`span.loading`)
on ICD autocomplete specifically, and relied on fast server-side rendering
elsewhere. In v2, loading states should be unobtrusive.

**V2 pattern:** a single `<p>` with `class="loading-state"`:
```css
.loading-state { font-style: italic; color: #aaa; font-size: 90%; }
```

No component file needed — use inline JSX:
```tsx
if (isLoading) return <p className="loading-state">{t('LOADING')}</p>
```

---

### 4.3 InactiveValue

**V1 equivalent:** `span.inactive`

**What it does:** renders a value as italic gray to indicate the field is
empty, not applicable, or not specified. Used inline within LabelValue and
DataTable cells.

**V1 CSS:** `span.inactive { font-style: italic; color: #aaa }`

**V2 pattern:** a CSS class `.text-inactive` defined in `globals.css`:
```css
.text-inactive { font-style: italic; color: #aaa; }
```

Used directly in JSX — no component file needed:
```tsx
<span className="text-inactive">{t('NOT_SPECIFIED')}</span>
```

The `LabelValue` component renders this automatically when `value` is null,
undefined, or empty string.

---

## 5. Build order

Build and verify each pattern before using it in a page. Suggested order:

1. **globals.css** — confirm CSS variables resolve and base styles apply
2. **AppShell** — confirm sidebar layout is stable at desktop and mobile
3. **PageActions** — confirm strip renders and pipe separators work
4. **LabelValue** (all three variants) — the most-used pattern
5. **SectionHeading**
6. **DataTable**
7. **NameBlock**
8. **TwoColumnLayout**
9. **CurrentVisitBanner**
10. **VitalsSection** (verify existing component matches spec)
11. **DiagnosisField** (wraps existing ICD10Autocomplete)
12. **FieldInput / FieldSelect / FieldTextarea**
13. **ErrorBanner**

Once all patterns are verified, rebuild each page as a composition of
confirmed patterns:

1. `clinicLogin` — simplest page, no patterns except ErrorBanner
2. `clinicDash` — PageActions, DataTable
3. `ptInfo` — PageActions, NameBlock (no visit date), TwoColumnLayout,
   LabelValue, CurrentVisitBanner, DataTable
4. `ptAddEdit` — PageActions, FieldInput, FieldSelect, FieldTextarea,
   InlineFieldGroup
5. `visitInfo` — PageActions, NameBlock, TwoColumnLayout, LabelValue,
   VitalsSection
6. `visitOpen` — PageActions, NameBlock, FieldInput, FieldSelect,
   FieldTextarea, InlineFieldGroup, VitalsSection, DiagnosisField
7. `visitEdit` — same as visitOpen plus LabelValue (locked)
8. `visitClose` — PageActions, NameBlock, LabelValue (locked), VitalsSection,
   DiagnosisField

---

## 6. CSS conventions

All pattern CSS is plain CSS — no Tailwind utility classes for layout or
structural styling. CSS variables from `globals.css` are used for colors,
radius, and font stacks.

```css
/* Reference values for pattern CSS */
--primary:   hsl(213, 60%, 58%)   /* #558ED5 — links, active nav */
--border:    hsl(0, 0%, 80%)      /* #ccc — borders, separators */
--muted:     hsl(0, 0%, 93%)      /* #eee — muted backgrounds */
--muted-fg:  hsl(0, 0%, 43%)      /* inactive text */
--error-bg:  #fbb                  /* error banner background */
--error-fg:  #cc0000               /* error text */
```

Tailwind utility classes remain acceptable for **non-structural** use:
spacing on known-good elements, print hiding, and transitions where they
are already confirmed working. Tailwind is not used for `display`,
`flex-direction`, `width`, `height`, `position`, or responsive behavior
on any pattern component.
