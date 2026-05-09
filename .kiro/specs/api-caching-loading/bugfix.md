# Bugfix Requirements Document

## Introduction

The Atlas globe app suffers from three interconnected issues that degrade UX and reliability. First, `fetchAllCountries()` is called without a client-side result cache, causing redundant GeoJSON parsing and potential re-fetches on every `PersistentLayout` mount. Second, there are no loading states during country page transitions — users see a blank or frozen UI while data loads. Third, the loading orchestration is incomplete: the `LoadingScreen` progress bar only tracks globe initialization (0 → 50 → 100%), leaving Wikipedia API calls and country page transitions entirely untracked. Together these produce janky, unpredictable UX that falls short of the Awwwards-level polish standard.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `PersistentLayout` mounts (or remounts) on the client THEN the system calls `fetchAllCountries()` without checking a client-side result cache, causing the GeoJSON-to-`CountryData[]` mapping to be re-executed on every call

1.2 WHEN a user navigates from the globe to a country page (`/pays/[code]`) THEN the system shows no transition loading indicator, leaving the user with a blank or frozen UI until the page fully renders

1.3 WHEN the country page fetches the Wikipedia summary at runtime THEN the system provides no visual feedback, causing the `CountryCard` to appear with missing content or a layout shift once the data arrives

1.4 WHEN the `LoadingScreen` progress bar is active THEN the system jumps from 50% (countries fetched) directly to 100% (canvas ready) with no intermediate progress steps, making the loading feel abrupt and unpolished

1.5 WHEN multiple components simultaneously request country data THEN the system issues redundant parallel fetches with no deduplication, increasing the risk of hitting REST Countries API rate limits

### Expected Behavior (Correct)

2.1 WHEN `fetchAllCountries()` is called after the first successful fetch THEN the system SHALL return the cached `CountryData[]` result immediately without re-executing the GeoJSON mapping or issuing a new network request

2.2 WHEN a user navigates from the globe to a country page THEN the system SHALL display a smooth, GSAP-animated transition loading indicator that covers the blank state until the page content is ready to reveal

2.3 WHEN the country page is loading its Wikipedia summary THEN the system SHALL display a skeleton or placeholder in the `CountryCard` that matches the final layout, preventing content shift on data arrival

2.4 WHEN the `LoadingScreen` progress bar advances THEN the system SHALL progress through meaningful intermediate steps (GeoJSON fetch → country data mapping → globe canvas init → ready) so the bar moves smoothly from 0% to 100%

2.5 WHEN `fetchAllCountries()` is called concurrently by multiple components before the first result is available THEN the system SHALL deduplicate the in-flight request so only one network call is made

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the globe loads for the first time in a fresh session THEN the system SHALL CONTINUE TO display the `LoadingScreen` with the ATLAS° branding, GPS text animation, and progress bar until assets are ready

3.2 WHEN a user selects a country on the globe THEN the system SHALL CONTINUE TO navigate to `/pays/[code]` and render the full `CountryCard` with all existing data (palette, MDX, neighbors, etc.)

3.3 WHEN the GeoJSON file is fetched on the client THEN the system SHALL CONTINUE TO cache the raw `GeoJSONCollection` in the module-level singleton in `geojson-loader.ts` for the duration of the session

3.4 WHEN the app is built statically (SSG) THEN the system SHALL CONTINUE TO generate all 195 country pages via `generateStaticParams` without any runtime API calls at request time

3.5 WHEN the `LoadingScreen` minimum display duration (1.5s) has not elapsed THEN the system SHALL CONTINUE TO hold the loading screen visible even if assets finish loading earlier

3.6 WHEN WebGL is not supported by the browser THEN the system SHALL CONTINUE TO fall back to the `SROnlyList` accessible country list without triggering any loading errors

3.7 WHEN the GeoJSON or country data fetch fails THEN the system SHALL CONTINUE TO gracefully degrade by transitioning the loading screen to the reveal phase rather than hanging indefinitely

---

## Bug Condition Pseudocode

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AppInteraction
  OUTPUT: boolean

  RETURN (
    X.type = "fetchAllCountries" AND X.callCount > 1 AND NOT cachedResultExists
  ) OR (
    X.type = "countryPageNavigation" AND NOT transitionIndicatorVisible
  ) OR (
    X.type = "loadingProgress" AND X.progressJump > 40
  )
END FUNCTION
```

### Property: Fix Checking

```pascal
// Property: Fix Checking — Caching and Loading States
FOR ALL X WHERE isBugCondition(X) DO
  result ← handleInteraction'(X)
  ASSERT (
    (X.type = "fetchAllCountries" → result.networkCallCount = 1) AND
    (X.type = "countryPageNavigation" → result.transitionIndicatorShown = true) AND
    (X.type = "loadingProgress" → result.maxProgressJump ≤ 20)
  )
END FOR
```

### Property: Preservation Checking

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handleInteraction(X) = handleInteraction'(X)
END FOR
```
