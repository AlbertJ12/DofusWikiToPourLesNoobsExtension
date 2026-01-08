# URL Inconsistencies Between Dofus Wiki and DofusPourLesNoobs

## Executive Summary

This document explains the URL generation challenges encountered when building an extension to link Dofus Wiki quest pages to their French equivalents on DofusPourLesNoobs.com. Through extensive testing of 1,579 quests, we discovered that **478 exceptions** were required to achieve 98.8% coverage due to systematic inconsistencies in URL formatting between the two sites.

## The Problem

### Initial Assumption
We initially assumed that converting English quest names to French (via DofusDB API) and applying standard URL slug rules would generate correct URLs. For example:
- English: "The Koalak Costume"
- French (from API): "Le déguisement du Koalak"
- Expected URL: `le-deguisement-du-koalak.html`

### Reality
This approach only worked for **~70% of quests**. The remaining 30% failed due to various inconsistencies in how DofusPourLesNoobs formats their URLs.

## Root Causes of Inconsistencies

### 1. **Accent Encoding Ambiguity** (285 exceptions)

The most significant issue: DofusPourLesNoobs uses **two different systems** for handling French accents, with no clear pattern:

#### System A: Normalized (accents removed)
```
"L'anneau de Tot" → l-anneau-de-tot.html
"Série animalière" → serie-animaliere.html
```

#### System B: HTML Entity Encoding (accents preserved as entities)
```
"Île de Nowel" → icircle-de-nowel.html
"Les Étoiles de Nowel" → les-eacutetoiles-de-nowel.html
```

**The Challenge:** There's no consistent rule for which system is used. We implemented smart detection (entity-encoded for accented quests, normalized for others), but this still failed for 285 quests that used the opposite system than expected.

**Solution:** After running comprehensive tests, we generated 285 hardcoded exceptions mapping each quest to its actual URL format.

**Examples of inconsistencies:**
- `"métamorphoooose !"` (has é) → `meacutetamorphoooose.html` (entity-encoded - accent preserved as `eacute`)
- `"les métamorphoses d'un tanuki"` (has é) → `les-metamorphoses-d-un-tanuki.html` (normalized - accent removed)

Both quests have the same accent (é) in similar words ("métamorpho..."), but one uses entity encoding while the other uses normalized URLs. There's no pattern to predict which system will be used.

### 2. **Apostrophe Handling Variations** (31+ exceptions)

French uses apostrophes extensively (l', d', n', etc.), but DofusPourLesNoobs handles them inconsistently:

#### Pattern A: Remove apostrophe entirely
```
"l'anneau de tot" → l-anneau-de-tot.html
```

#### Pattern B: Keep apostrophe as hyphen
```
"wogew l'hewmite" → wogew-l-hewmite.html
"sram d'égoutant" → sram-d-egoutant.html
```

#### Pattern C: Use HTML entity (rsquo)
```
"l'œuf ou la cawotte ?" → lrsquooeliguf-ou-la-cawotte.html
"fraîcheur de l'ivre" → fraicirccheur-de-lrsquoivre.html
```

**Why this matters:** The phrase "l'étoile" appears in 6 different quests, all using `lrsquoeacutetoile` (entity-encoded apostrophe + accent), while most other "l'" phrases use simple hyphens.

### 3. **Colon Handling in "Apprentissage" Quests** (10 exceptions)

Most quests with colons convert ` : ` to a single hyphen:
```
"Apprentissage : Écuyer" → apprentissage-ecuyer.html
```

But 10 specific Apprentissage quests use **double hyphens**:
```
"Apprentissage : Surineur" → apprentissage--surineur.html
"Apprentissage : Psychopathe" → apprentissage--psychopathe.html
```

**No pattern detected** - these 10 quests are seemingly arbitrary.

### 4. **Name Mismatches Between API and Website** (3 exceptions)

The DofusDB API returns different French names than what DofusPourLesNoobs uses:

| Quest | API Returns | Website Uses |
|-------|-------------|--------------|
| La Serveuse Dame Cloude | "la serveuse dame cloude" | "la-tenanciegravere-dame-cloude" (serveuse → tenancière) |
| Bienvenue au KrazyBwork Saloon | "bienvenue au krazybwork saloon" | "bienvenue-au-krazybwok-saloon" (work → wok) |
| La Fatalité | "la fatalité" | "la-fataliteacute-prologue" (adds "prologue") |

### 5. **Plural/Singular Inconsistencies** (13 exceptions)

The API and website disagree on singular vs. plural forms:

```
API: "gros œuvre au château d'allister"
Website: gros-oeliguvres-au-chacircteau-dallister.html (œuvre → œuvres)

API: "formation des première année"
Website: formation-des-premiegraveres-anneacutees.html (année → années)
```

All 10 "Formation des [X] année" quests use plural "années" on the website despite the API returning singular.

### 6. **Combined Quest Pages** (16 exceptions)

Some quest series (typically difficulty tiers: Touriste/Amateur/Spécialiste/Expert) are combined into a single page on DofusPourLesNoobs:

```
"Gare aux Krokilles Juvéniles" → gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables.html
"Gare aux Krokilles Novices" → gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables.html
"Gare aux Krokilles Matures" → gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables.html
"Gare aux Krokilles Vénérables" → gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables.html
```

All 4 difficulty levels map to the same URL containing all tier names concatenated.

**Affected series:**
- Gare aux Krokilles (4 quests)
- Cueillette de Coquillages (4 quests)
- Chasse aux Krokilles (4 quests)
- Kilukru (4 quests)
- Éklate Vulkaine (4 quests)

### 7. **Special Character Encoding Edge Cases** (9 exceptions)

Some quests use unexpected encoding patterns:

```
"ça saute aux œufs" → ccedila-saute-aux-oeufs.html (ç → ccedil)
"où est passée la 7e compagnie ?" → ougrave-est-passeacutee-la-7-e-compagnie.html
"vilain petit n'enfant" → vilain-petit-nrsquoenfant.html (n' → nrsquo)
```

### 8. **"C'est Votre Métier" Pattern** (5 exceptions)

These 5 quests all follow a specific pattern where "c'est" becomes "c-est" (with hyphens):

```
"Bûcher, c'est votre métier" → bucher-c-est-votre-metier.html
"Piocher, c'est votre métier" → piocher-c-est-votre-metier.html
```

Most other quests with "c'est" remove the apostrophe entirely or use entity encoding.

## Our Solution: The Exception Dictionary

### Phase 1: Smart Pattern Detection
We implemented intelligent URL generation with:
- Accent detection (entity-encoded for accented quests, normalized otherwise)
- Apostrophe normalization rules
- Special case handling for "Apprentissage" quests
- Colon and special character conversion

**Result:** ~70% success rate (1,100/1,579 quests)

### Phase 2: Bulk Testing & Exception Generation
We built a comprehensive testing system:
1. Fetched all 1,579 quests from DofusDB API
2. Generated URLs using our smart system
3. Tested each URL with HTTP HEAD requests
4. Identified 479 quests where primary URL failed but fallback worked
5. Generated hardcoded exceptions for these edge cases

**Result:** 98.8% success rate (1,560/1,579 quests)

### Phase 3: The 478 Exception Dictionary
The final solution uses a two-tier system:

```javascript
const URL_EXCEPTIONS = {
    // 193 manually discovered exceptions (Phases 1-2)
    "l'anneau de tot": "l-anneau-de-tot",
    "série animalière": "serie-animaliere",
    "apprentissage : surineur": "apprentissage--surineur",
    
    // 285 automatically generated exceptions (Phase 3)
    "comment mettre un requin en bière": "comment-mettre-un-requin-en-biere",
    "on recherche padgref demoël": "on-recherche-padgref-demoel",
    // ... 283 more
};
```

## Statistics

### Coverage Breakdown
- **Total quests tested:** 1,579 (excluding Almanax/Dopple/Safari)
- **Working with exceptions:** 1,560 (98.8%)
- **Permanent failures:** 19 (1.2%)

### Exception Categories
- **Accent encoding mismatches:** 285 (59.6%)
- **Apostrophe variations:** 31 (6.5%)
- **Combined quest pages:** 16 (3.3%)
- **Plural/singular mismatches:** 13 (2.7%)
- **Apprentissage double-hyphen:** 10 (2.1%)
- **Special character encoding:** 9 (1.9%)
- **"C'est votre métier" pattern:** 5 (1.0%)
- **Name mismatches:** 3 (0.6%)
- **Other edge cases:** 106 (22.2%)

### The 19 Permanent Failures
These quests fail because:
- No guide page exists on DofusPourLesNoobs (e.g., "Offering for Tholank")
- Extreme encoding issues (e.g., "Xiz Tp Nvdi Ibuf?" - Caesar cipher quest)
- Severe name mismatches we couldn't resolve

## Lessons Learned

### 1. **No Universal Pattern**
Despite extensive analysis, we found no reliable algorithm to predict which encoding system DofusPourLesNoobs uses for a given quest. The inconsistencies appear arbitrary.

### 2. **Hardcoded Exceptions Are Necessary**
For a production-quality extension, the 478 exceptions are essential. Without them, users would need to manually right-click and try fallback URLs 30% of the time.

### 3. **Testing Is Critical**
Our bulk testing system (testing all 1,579 quests) was crucial for:
- Discovering edge cases we'd never find manually
- Generating the 285 automated exceptions
- Verifying our 98.8% success rate

### 4. **Maintenance Considerations**
New quests added to Dofus may require new exceptions. Our testing framework makes it easy to:
- Run bulk tests on demand
- Identify new failures
- Generate exception code automatically

## Technical Implementation

### Exception Storage
Exceptions are stored as a JavaScript object mapping French quest names (lowercase) to URL slugs:

```javascript
const URL_EXCEPTIONS = {
    "french quest name": "url-slug-without-html",
};
```

### Lookup Process
1. Fetch French name from DofusDB API
2. Convert to lowercase
3. Check if exists in `URL_EXCEPTIONS`
4. If yes: Use exception slug
5. If no: Use smart pattern detection

### Synchronization
Both `content.js` (extension) and `bulk-quest-test.js` (testing) maintain identical exception dictionaries to ensure consistency.

## Conclusion

The 478 exceptions represent real-world inconsistencies between two independently-maintained websites. While not elegant, this dictionary-based approach provides:

- **Reliability:** 98.8% success rate
- **User Experience:** No manual intervention needed for 1,560 quests
- **Maintainability:** Automated testing and exception generation
- **Transparency:** All exceptions documented and categorized

The alternative—asking users to manually try fallback URLs 30% of the time—would provide a poor user experience. The exception dictionary is the pragmatic solution to an imperfect data landscape.

---

**Last Updated:** January 2026  
**Total Exceptions:** 478  
**Coverage:** 98.8% (1,560/1,579 quests)
