# Testing Guide

## Overview

This extension uses automated bulk testing to validate URL generation logic. However, **automated tests have limitations** and cannot catch all issues.

## Test Architecture

### What the Tests Validate ✅

The bulk test (`bulk-quest-test.js`) validates:
- **URL generation logic** - Uses the same code as `content.js`
- **API integration** - Fetches real French names from DofusDB API
- **URL accessibility** - Verifies generated URLs return HTTP 200
- **Fallback behavior** - Tests both normalized and entity-encoded URLs
- **Exception coverage** - Validates hardcoded URL exceptions work

### What the Tests CANNOT Detect ❌

The automated tests **cannot** catch:
- **Name mismatches** - When API name differs from website name (e.g., "Un pouvoir méridianique" → "un-pouvoir-merydique")
- **Content script issues** - Button injection, DOM manipulation, event handlers
- **Browser-specific bugs** - Cross-browser compatibility issues
- **Extension lifecycle** - Background script, popup behavior, storage
- **Real user workflows** - Actual clicking through from Dofus Wiki to DofusPourLesNoobs

## Why Name Mismatches Happen

The extension flow:
1. User visits Dofus Wiki page (e.g., "Meridiawful Power")
2. Extension fetches quest data from DofusDB API
3. API returns French name: `"Un pouvoir méridianique"`
4. Extension generates URL: `un-pouvoir-meridianique.html`
5. **FAILS** - Website actually uses: `un-pouvoir-merydique.html`

The bulk test uses the **same API data** and **same URL generation logic**, so it generates the same incorrect URL. Both the extension and test fail together, making the bug invisible to automated testing.

## Running Tests

### Quick Test (Generation Only)
```bash
node bulk-quest-test.js
```
Fast, no network requests. Only validates slug generation logic.

### Verify Failed Quests
```bash
node bulk-quest-test.js --verify-failures
```
Tests quests that previously failed. Good for validating fixes.

### Full Validation (Slow)
```bash
node bulk-quest-test.js --verify-all
```
Tests all ~1,579 quests. Takes several minutes. Use sparingly.

## Manual Testing Checklist

When a user reports a broken quest, follow this process:

### 1. Reproduce the Issue
- [ ] Visit the exact Dofus Wiki URL the user reported
- [ ] Click the extension button
- [ ] Verify it redirects to wrong/404 page

### 2. Identify the Root Cause
- [ ] Check browser console for errors
- [ ] Note the French name the extension found
- [ ] Search DofusPourLesNoobs for the quest manually
- [ ] Compare API name vs. website URL

### 3. Determine Fix Type

**Name Mismatch:**
- API: "Un pouvoir méridianique"
- Website: "un-pouvoir-merydique"
- **Fix:** Add to `URL_EXCEPTIONS` in both `content.js` and `bulk-quest-test.js`

**Accent/Encoding Issue:**
- Extension tries normalized first, but needs entity-encoded
- **Fix:** Check if smart accent detection should handle it, or add exception

**Missing Page:**
- Quest genuinely doesn't have a page on the website
- **Fix:** Document as known limitation

### 4. Add Exception
```javascript
// In both content.js and bulk-quest-test.js
const URL_EXCEPTIONS = {
    // ... existing exceptions ...
    "un pouvoir méridianique": "un-pouvoir-merydique",
};
```

### 5. Verify Fix
- [ ] Test in actual browser with extension loaded
- [ ] Run `node bulk-quest-test.js --verify-failures`
- [ ] Confirm quest now passes

## Test Results Interpretation

### High Coverage (>95%)
System is working well. Remaining failures are likely:
- Quests without individual pages
- Almanax offerings (filtered out)
- Edge cases requiring manual review

### Medium Coverage (80-95%)
Some issues need attention:
- Review failed quests for patterns
- Check for systematic naming issues
- Consider adding more exceptions

### Low Coverage (<80%)
Major issues present:
- Core URL generation logic may be broken
- Large-scale naming convention changes
- Review smart accent detection system

## Known Limitations

### Cannot Be Tested Automatically
1. **Name mismatches** - Requires manual website search
2. **New content** - Website may use different naming than API
3. **Regional variations** - Some quests have regional name differences
4. **Combined pages** - Multiple quests on one page (e.g., "Gare aux krokilles")

### Requires Manual Verification
- Quest chains with multiple parts
- Event-specific quests
- Seasonal content (Nowel, etc.)
- Dungeon-related quests vs. standalone quests

## Best Practices

### When Adding Exceptions
1. **Always add to both files** - `content.js` AND `bulk-quest-test.js`
2. **Use lowercase** - All exception keys should be lowercase
3. **Document the reason** - Add comment explaining why exception is needed
4. **Test in browser** - Don't rely solely on bulk test

### When Debugging
1. **Check console first** - Browser console shows extension logs
2. **Verify API response** - Check what French name API returns
3. **Search website manually** - Find the actual URL on DofusPourLesNoobs
4. **Compare carefully** - Look for subtle differences (é vs e, accents, hyphens)

### When Updating Logic
1. **Run full test suite** - `node bulk-quest-test.js --verify-all`
2. **Check coverage change** - Should improve, not decrease
3. **Review new failures** - Understand why they failed
4. **Test manually** - Try 5-10 random quests in browser

## Reporting Issues

When reporting a test failure or bug, include:
- Dofus Wiki URL
- Expected DofusPourLesNoobs URL
- Actual redirect URL (if any)
- French name from API (check console)
- Browser and extension version

## Future Improvements

### Potential Enhancements
- [ ] Integration tests with Puppeteer/Playwright
- [ ] API name validation against website sitemap
- [ ] Automated name mismatch detection
- [ ] Cross-reference with website search API
- [ ] Periodic regression testing in CI/CD

### Why Not Implemented Yet
- **Complexity** - Integration tests require browser automation
- **Maintenance** - More tests = more maintenance burden
- **Coverage** - Current approach catches 98.8% of cases
- **Manual testing** - Some issues inherently require human verification
