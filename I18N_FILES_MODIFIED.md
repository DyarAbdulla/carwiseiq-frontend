# i18n Implementation – Files Modified

## 1. Files Modified

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Remove hardcoded `lang` and `dir` from `<html>` so `SetDirection` controls them |
| `app/globals.css` | RTL CSS: text-align, margin/padding flips, header/nav order, `space-x` in RTL |
| `components/common/SetDirection.tsx` | Sets `document.documentElement.dir` (rtl for `ar`/`ku`, ltr for `en`) and `lang` |
| `components/layout/Header.tsx` | Language selector in main bar + mobile drawer; RTL drawer slide and border |
| `components/LanguageSelector.tsx` | Dropdown with en/ar/ku; `localStorage` + `NEXT_LOCALE` cookie; `useTranslations('languages')` |
| `messages/en.json` | Complete English strings (languages, common, nav, listing, sell, …) |
| `messages/ar.json` | Complete Arabic strings (same structure as en) |
| `messages/ku.json` | Complete Kurdish strings (same structure as en) |
| `middleware.ts` | `localeDetection: true`; next-intl handles `/` redirect |
| `i18n.ts` | `getRequestConfig` loads `messages/{locale}.json` |
| `app/[locale]/layout.tsx` | Renders `SetDirection` and `NextIntlClientProvider` with `locale` and `messages` |

## 2. Language Selector in Main Navigation

- **Desktop:** In the header bar, between the theme toggle and the account (lock) dropdown.  
- **Mobile:** In the slide-out drawer, directly under the “Menu” header, with label `common.language` and the same `LanguageSelector` component.

## 3. HTML `dir` Attribute

- **SetDirection** (`components/common/SetDirection.tsx`): In `useEffect`, sets  
  `document.documentElement.setAttribute('dir', (locale === 'ar' || locale === 'ku') ? 'rtl' : 'ltr')`  
  and `setAttribute('lang', locale)`.
- **Root `app/layout.tsx`:** `<html>` has no `lang` or `dir`; `SetDirection` is the single source of truth after hydration.

## 4. RTL CSS in `app/globals.css`

- `[dir="rtl"] p` → `text-align: right`
- `[dir="rtl"] .text-left` → `text-align: right`
- `[dir="rtl"] .text-right` → `text-align: left`
- `[dir="rtl"] input, textarea, select` → `text-align: right`
- `[dir="rtl"] .ml-auto` / `.mr-auto` → margin auto swapped
- `[dir="rtl"] header > div` → `flex-direction: row-reverse`
- `[dir="rtl"] header nav` → `flex-direction: row-reverse`
- `[dir="rtl"] .space-x-2/3/4 > * + *` → `margin-left: 0; margin-right: 0.5rem` (etc.)

## 5. Translation File Structure (Complete Content)

The **complete** translation content for all three languages is in:

- `frontend/messages/en.json`
- `frontend/messages/ar.json`
- `frontend/messages/ku.json`

All three share the same key structure. Top-level namespaces:

| Namespace | Purpose |
|-----------|---------|
| `languages` | `en`, `ar`, `ku` – labels for the language selector |
| `common` | appName, appNameShort, loading, error, success, themeLight/Dark, openMenu, closeMenu, **language**, pageNotFound, goHome, etc. |
| `footer` | brand, description, quickLinks, resources, legal, predict, compare, budget, docs, stats, privacy, terms, copyright, poweredBy |
| `nav` | menu, home, buySell, favorites, predict, batch, compare, budget, stats, history, docs, sellCar, messages |
| `marketplace` | title, searchPlaceholder, filters, priceRange, yearRange, maxMileage, min, max, clearAll, applyFilters, loading, noListings, postFirst, showingRange, posted*Ago, noImage, pageOf, previous, next |
| `listing` | noImageAvailable, notFound, backToMarketplace, loadError, invalidId, mileage, year, transmission, fuelType, color, condition, features, description, vin, priceHistory, contactSeller, sendMessage, shareListing, reportListing, previousImage, nextImage, viewImage, listedOn, location, postedOn, callNow, contactNotAvailable, safetyTip, sellerNotAvailable |
| `sell` | step1Title, step1Description, locationRequired, selectLocation, country, selectCountry, stateProvince, selectStateProvince, city, enterCity, orSearchLocation, searchPlaceholder, autocompleteComingSoon, continue |
| `favorites` | title, subtitle, sortBy, recentlySaved, priceLow, priceHigh, newestListings, filters, priceRange, min, max, location, cityOrState, clearFilters, loadingFavorites, noFavorites, noFavoritesDesc, browseListings, showingXofY, saved*Ago, noImage, pageOf, previous, next, loadError |
| `home` | title, description, trustedBy, usersWorldwide, features, howItWorks, valueProposition, socialProof, liveActivity, regionalIntelligence, aiTransparency, interactiveDemo, comparison, faq, newsletter, finalCta, cta |
| `predict` | title, description, form.*, result.* |
| `batch` | title, description, upload.*, process, results.* |
| `compare` | title, description, addCar, predictAll, remove |
| `budget` | title, description, maxBudget, filters, minYear, maxMileage, preferredMakes, condition, findCars, noResults, comingSoon, useThisCar, foundCars, page, of, previous, next, reset |
| `stats` | title, description, totalCars, averagePrice, medianPrice, minPrice, maxPrice, yearRange, tabs, priceDistribution, topMakes, fuelTypeDistribution, priceTrendsByYear, priceByCondition, visualizations.* |
| `docs` | title, description, baseUrl, endpoints, examples, swagger |
| `sidebar` | account.*, appInfo.*, howToUse.*, tips.*, language.*, recentSearches.*, quickStats.*, modelInfo.*, trust.*, savedCars.*, quickActions.*, instructions.* |
| `auth` | login, register, logout, email, password, confirmPassword, *Placeholder, *Description, *Success, *Error, passwordMismatch, passwordTooShort, passwordHint, loggingIn, registering, noAccount, hasAccount, logoutSuccess, logoutError, user |
| `dealAnalysis` | title, excellent, good, fair, poor, aboveMarket, belowMarket, description |
| `marketComparison` | title, yourCar, marketAverage, difference, aboveAverage, belowAverage, wideRange, wideRangeDesc |
| `marketTrends` | title, decreased, increased, declining, rising |
| `smartTips` | title, buyingTip.*, export.* |
| `similarCars` | title, year, mileage, condition, price |
| `feedback` | title, description, aiConfidence, starRating, accurate, notAccurate, thankYou, detailed.*, history.*, metrics.* |

## 6. Testing that changing language updates ALL text

1. Run `npm run dev` and open e.g. `http://localhost:3002/en`.
2. Change language via the header dropdown (EN → AR or KU). The URL should become `/ar/...` or `/ku/...`.
3. Check: nav labels, hero, footer, buttons, form labels, toasts, and listing/sell pages all change to the new language.
4. For Arabic or Kurdish: `document.documentElement.getAttribute('dir')` should be `rtl`; layout should be mirrored (header order, drawer from the left).
5. For English: `dir` should be `ltr`.
6. Refresh: the chosen locale should persist (cookie + `localStorage`).
