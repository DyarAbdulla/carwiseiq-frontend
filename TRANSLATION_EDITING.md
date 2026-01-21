# Manual Translation Editing Guide

## 1. Kurdish translations file

**File path:** `frontend/messages/ku.json`

Full path from project root:  
`c:\Car price prection program Local E\frontend\messages\ku.json`

---

## 2. How to find and edit specific strings

### Search (recommended)

1. Open `messages/ku.json` in your editor.
2. Use **Search** (Ctrl+F / Cmd+F) and search for:
   - The **exact Kurdish text** you want to change (e.g. `پشبینی کردنی نرخی ئۆتۆمبێل`), or
   - The **translation key** if you know it (e.g. `"tagline"`, `"title"`).
3. Change the value on the right side of the colon. Keep the key and the double quotes.
4. Save the file.

### Search and replace

1. **Edit → Find and Replace** (Ctrl+H / Cmd+Option+F).
2. **Find:** the exact old string, e.g. `پێشبینی نرخی ئۆتۆمبێل بە هێزی AI`
3. **Replace:** the new string, e.g. `پشبینی کردنی نرخی ئۆتۆمبێل  بە ژیری دەستکرد`
4. Use **Replace** or **Replace all** (only if the same string appears in multiple keys and you want to change all of them).
5. Save the file.

### Rules

- Keep the **key** (left side) in English.
- Change only the **value** (right side) in quotes.
- Preserve the comma after the value (except for the last entry in an object).
- Keep the same JSON structure (no missing `{`, `}`, or `,`).

---

## 3. Structure of `messages/ku.json`

The file is a single JSON object. Top-level keys are **namespaces**:

| Top-level key   | Used in                          | Example sub-keys                         |
|-----------------|-----------------------------------|------------------------------------------|
| `languages`     | Language selector                 | `en`, `ar`, `ku`                         |
| `common`        | Shared UI (buttons, errors, app name, **tagline**) | `appName`, `appNameShort`, `tagline`, `loading`, `error`, … |
| `nav`           | Navigation and menu               | `home`, `predict`, `buySell`, `favorites`, … |
| `footer`        | Footer                            | `brand`, `privacy`, `terms`, …           |
| `home`          | Home page                         | `title`, `description`, `features`, …    |
| `predict`       | Predict page                      | `title`, `form`, `result`                |
| `privacy`       | Privacy Policy page               | `title`, `lastUpdated`, `sections`       |
| `terms`         | Terms of Service page             | `title`, `lastUpdated`, `sections`       |
| `listing`       | Car listing / buy-sell detail     | `mileage`, `year`, `contactSeller`, …    |
| `auth`          | Login, register, etc.             | `login`, `register`, `email`, …          |
| …               | (and other namespaces)            |                                          |

### Example: `common`

```json
"common": {
  "appName": "پێشبینی نرخی ئۆتۆمبێل",
  "appNameShort": "پێشبینی نرخی ئۆتۆمبێل",
  "tagline": "پشبینی کردنی نرخی ئۆتۆمبێل  بە ژیری دەستکرد",
  "loading": "بارکردن...",
  ...
}
```

- `common.tagline` → tagline under the logo / “AI-Powered Car Price Prediction”.
- `common.appName` → full app name; `common.appNameShort` → short name in the header.

### Example: `home`

```json
"home": {
  "title": "پشبینی کردنی نرخی ئۆتۆمبێل  بە ژیری دەستکرد",
  "description": "...",
  "features": { ... },
  ...
}
```

- `home.title` → main heading on the home page.

### Nested keys

Use dot notation to describe where a string lives, e.g.:

- `privacy.sections.informationWeCollect.title`
- `terms.sections.acceptance.content`
- `home.features.single.title`

---

## 4. Your example (already applied)

You asked to change:

- **FROM:** `پێشبینی نرخی ئۆتۆمبێل بە هێزی AI`  
- **TO:** `پشبینی کردنی نرخی ئۆتۆمبێل  بە ژیری دەستکرد`

That text was in two places in `messages/ku.json`:

| Key             | Where it appears                          |
|-----------------|-------------------------------------------|
| `common.tagline`| Tagline (e.g. under logo, “AI-Powered…”)  |
| `home.title`    | Main headline on the home page            |

Both have been updated to:  
`پشبینی کردنی نرخی ئۆتۆمبێل  بە ژیری دەستکرد`

To change only one of them, edit that key in `messages/ku.json` and leave the other as is.

---

## 5. After editing

- Save `messages/ku.json`.
- If the dev server is running, the app usually picks up the change on refresh.
- If not, restart with `npm run dev` and reload the app. No build is required for JSON edits in development.
