/**
 * BULK QUEST URL TESTING
 * 
 * Fetches all quests from DofusDB API and tests URL generation.
 * 
 * Modes:
 * 1. GENERATION_ONLY: Just test slug generation (fast, no network requests)
 * 2. VERIFY_FAILURES: Test generation + verify failed URLs exist on website (slow)
 * 3. VERIFY_ALL: Test generation + verify ALL URLs (very slow, ~2000 requests)
 * 
 * Usage:
 *   node bulk-quest-test.js                    # Generation only
 *   node bulk-quest-test.js --verify-failures  # Verify failed URLs
 *   node bulk-quest-test.js --verify-all       # Verify all URLs (careful!)
 */

const https = require('https');

// ============================================
// CONFIGURATION
// ============================================
const MODE = process.argv.includes('--verify-all') ? 'VERIFY_ALL' 
    : process.argv.includes('--verify-failures') ? 'VERIFY_FAILURES'
    : 'GENERATION_ONLY';

const API_BASE = 'https://api.dofusdb.fr/quests';
const WEBSITE_BASE = 'https://www.dofuspourlesnoobs.com';
const QUESTS_PER_PAGE = 100;
const RATE_LIMIT_MS = 100; // Delay between URL checks to avoid overwhelming server

console.log(`\n${'='.repeat(60)}`);
console.log(`BULK QUEST URL TESTING - MODE: ${MODE}`);
console.log(`${'='.repeat(60)}\n`);

// ============================================
// URL GENERATION LOGIC (from content.js)
// ============================================

// Hardcoded exceptions for quests with unpredictable URL patterns
const URL_EXCEPTIONS = {
    // Apostrophe exceptions (keep hyphens)
    "wogew l'hewmite": "wogew-l-hewmite",
    "si j'avais un marteau": "si-j-avais-un-marteau",
    "la tactique des gens d'armes": "la-tactique-des-gens-d-armes",
    "à la poursuite d'octolliard rouge": "a-la-poursuite-d-octolliard-rouge",
    "sram d'égoutant": "sram-d-egoutant",
    "quand y'en a marre de brâkmar": "quand-y-en-a-marre-de-brakmar",
    "crocs n'en bourrent": "crocs-n-en-bourrent",
    "vilain petit n'enfant": "vilain-petit-nrsquoenfant",
    "barnabé dans l'espace": "barnabe-dans-l-espace",
    "t'as les boules": "t-as-les-boules",
    
    // Apprentissage double-hyphen exceptions (not dark-themed but use --)
    "apprentissage : surineur": "apprentissage--surineur",
    "apprentissage : chasseur d'âmes": "apprentissage--chasseur-dacircmes",
    "apprentissage : maître des sévices": "apprentissage--maicirctre-des-seacutevices",
    "apprentissage : psychopathe": "apprentissage--psychopathe",
    "apprentissage : disciple de ménalt": "apprentissage--disciple-de-meacutenalt",
    "apprentissage : disciple de djaul": "apprentissage--disciple-de-djaul",
    "apprentissage : disciple d'hécate": "apprentissage--disciple-dheacutecate",
    "apprentissage : disciple de brumaire": "apprentissage--disciple-de-brumaire",
    
    // Name mismatches (API name != website name)
    "la serveuse dame cloude": "la-tenanciere-dame-cloude",
    "bienvenue au krazybwork saloon": "bienvenue-au-krazybwok-saloon",
    "la fatalité": "la-fataliteacute-prologue",
    
    // Plural/singular mismatches
    "gros œuvre au château d'allister": "gros-oeliguvres-au-chacircteau-dallister",
    "crocs en jambe": "crocs-en-jambes",
    "faire le tas de pins": "faire-le-tas-de-pin",
    
    // Entity encoding needed
    "la mort vous va si bien": "-la-mort-vous-va-si-bien",
    "l'essentiel est dans lac gelé": "lessentiel-est-dans-le-lac-geleacute",
    "cœur brisé": "coeur-briseacute",
    "où est passée la 7e compagnie ?": "ougrave-est-passeacutee-la-7-e-compagnie",
    "une enquête alambiquée - investigation": "une-enquecircte-alambiqueacutee---investigation",
    "une enquête alambiquée - identification": "une-enquecircte-alambiqueacutee---identification",
    "une enquête alambiquée - confrontation": "une-enquecircte-alambiqueacutee---confrontation",
    "une enquête alambiquée - résolution": "une-enquecircte-alambiqueacutee---reacutesolution",
    
    // Special encoding patterns (rsquo for apostrophes, oelig for œ)
    "l'œuf ou la cawotte ?": "lrsquooeliguf-ou-la-cawotte",
    "fraîcheur de l'ivre": "fraicirccheur-de-lrsquoivre",
    
    // L'Étoile quests (all use lrsquoeacutetoile pattern)
    "l'étoile des was mages": "lrsquoeacutetoile-des-was-mages",
    "l'étoile du sapik": "lrsquoeacutetoile-du-sapik",
    "l'étoile des glutins farceurs": "lrsquoeacutetoile-des-glutins-farceurs",
    "l'étoile de l'atelier": "lrsquoeacutetoile-de-lrsquoatelier",
    "l'étoile des donjons": "lrsquoeacutetoile-des-donjons",
    "l'étoile des grincheux": "lrsquoeacutetoile-des-grincheux",
    
    // Gare aux krokilles (all combined on one page)
    "gare aux krokilles juvéniles": "gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables",
    "gare aux krokilles novices": "gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables",
    "gare aux krokilles matures": "gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables",
    "gare aux krokilles vénérables": "gare-aux-krokilles-juveacutenilesnovicesmaturesveacuteneacuterables",
    
    // C'est votre métier quests (use c-est with hyphens, not cest)
    "bûcher, c'est votre métier": "bucher-c-est-votre-metier",
    "piocher, c'est votre métier": "piocher-c-est-votre-metier",
    "cueillir, c'est votre métier": "cueillir-c-est-votre-metier",
    "pêcher, c'est votre métier": "pecher-c-est-votre-metier",
    "chasser, c'est votre métier": "chasser-c-est-votre-metier",
    
    // More apostrophe with hyphen patterns
    "le dragon des forêts": "le-dragon-des-foret",
    "retrouver un fémur dans une botte d'ossements": "retrouver-un-femur-dans-une-botte-d-ossements",
    "l'eau douce ou l'eau dure": "l-eau-douce-ou-l-eau-dure",
    "des étoiles dans l'estomac": "des-etoiles-dans-l-estomac",
    "l'archéologie, c'est facile": "l-archeologie-c-est-facile",
    
    // Additional Apprentissage double-hyphen quests
    "apprentissage : gardien du savoir": "apprentissage--gardien-du-savoir",
    "apprentissage : gardien des tortures": "apprentissage--gardien-des-tortures",
    
    // More apostrophe with hyphen patterns
    "le mort dans l'âme": "le-mort-dans-l-ame",
    "la croisière, ça m'use": "la-croisiere-ca-m-use",
    "battre le fer tant qu'il est chaud": "battre-le-fer-tant-qu-il-est-chaud",
    "la quête sous l'eau": "la-quete-sous-l-eau",
    "les principes d'archie m'aident": "les-principes-d-archie-m-aident",
    "tournée d'inspection": "tournee-d-inspection",
    "tarot, t'es très fort": "tarot-t-es-tres-fort",
    "bière qui roule n'amasse pas mousse": "biere-qui-roule-n-amasse-pas-mousse",
    "légende d'automne": "legende-d-automne",
    "les deux font l'impair": "les-deux-font-l-impair",
    "qui sème le vent récolte l'artempeth": "qui-seme-le-vent-recolte-l-artempeth",
    "l'invasion des profanateurs de sépultures": "l-invasion-des-profanateurs-de-sepulture",
    "œufs dans l'eau": "oeufs-dans-l-eau",
    
    // Name mismatches (API name ≠ website name)
    "la serveuse dame cloude": "la-tenanciegravere-dame-cloude",
    
    // Combined pages (touriste/amateur/spécialiste/expert on one page)
    "cueillette de coquillages pour touriste": "cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert",
    "cueillette de coquillages pour amateur": "cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert",
    "cueillette de coquillages pour spécialiste": "cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert",
    "cueillette de coquillages pour expert": "cueillette-de-coquillages-pour-touristeamateurspeacutecialisteexpert",
    "chasse aux krokilles pour touriste": "chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert",
    "chasse aux krokilles pour amateur": "chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert",
    "chasse aux krokilles pour spécialiste": "chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert",
    "chasse aux krokilles pour expert": "chasse-aux-krokilles-pour-touristeamateurspeacutecialisteexpert",
    "kilukru pour touriste": "kilukru-pour-touristeamateurspeacutecialisteexpert",
    "kilukru pour amateur": "kilukru-pour-touristeamateurspeacutecialisteexpert",
    "kilukru pour spécialiste": "kilukru-pour-touristeamateurspeacutecialisteexpert",
    "kilukru pour expert": "kilukru-pour-touristeamateurspeacutecialisteexpert",
    "éklate vulkaine pour touriste": "eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert",
    "éklate vulkaine pour amateur": "eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert",
    "éklate vulkaine pour spécialiste": "eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert",
    "éklate vulkaine pour expert": "eklate-vulkaine-pour-touristeamateurspeacutecialisteexpert",
    
    // More apostrophe with hyphen patterns
    "qui vole un œuf cherche l'embrouille": "qui-vole-un-oeuf-cherche-l-embrouille",
    "le fabuleux festin d'amélie poêlon": "le-fabuleux-festin-d-amelie-poelon",
    "fée d'hiver": "fee-d-hiver",
    "jusqu'au bout du rêve": "jusqu-au-bout-du-reve",
    "s'armer contre le destin": "s-armer-contre-le-destin",
    "le silence est d'aure": "le-silence-est-d-aure",
    "les problèmes d'une pictopublicéphile": "les-problemes-d-une-pictopublicephile",
    
    // Formation quests (plural forms)
    "formation des première année": "formation-des-premiegraveres-anneacutees",
    "formation des deuxième année": "formation-des-deuxiegravemes-anneacutees",
    "formation des troisième année": "formation-des-troisiegravemes-anneacutees",
    "formation des quatrième année": "formation-des-quatriegravemes-anneacutees",
    "formation des cinquième année": "formation-des-cinquiegravemes-anneacutees",
    "formation des sixième année": "formation-des-sixiegravemes-anneacutees",
    "formation des septième année": "formation-des-septiegravemes-anneacutees",
    "formation des huitième année": "formation-des-huitiegravemes-anneacutees",
    "formation des neuvième année": "formation-des-neuviegravemes-anneacutees",
    "formation des dixième année": "formation-des-dixiegravemes-anneacutees",
    
    // Special encoding (ç → ccedila)
    "ça saute aux œufs": "ccedila-saute-aux-oeufs",
    
    // Accent entity encoding required
    "métamorphoooose !": "meacutetamorphoooose",
    
    // Plural/singular mismatches
    "squelettes et amulette": "squelettes-et-amulettes",
    "sanctuaires de famille": "sanctuaire-de-famille",
    
    // Apostrophe with hyphen variations
    "de l'autre côté du chalœil": "de-lautre-cocircteacute-du-chaloeil",
    "l'ascension de qu'tan": "l-ascension-de-qu-tan",
    "le dofus et l'alchimiste": "le-dofus-et-l-alchimiste",
    "donner l'amour, pas le fouet": "donner-l-amour-pas-le-fouet",
    "à plus dans l'muldobus": "a-plus-dans-l-muldobus",
    "c'est toujours dur le matin": "c-est-toujours-dur-le-matin",
    "à l'ombre des murs": "a-l-ombre-des-murs",
    "sur la route d'erazal": "sur-la-route-d-erazal",
    "c'est pour ta pomme": "c-est-pour-ta-pomme",
    "c'est pourtant naturel": "c-est-pourtant-naturel",
    "trempette dans un verre d'eau": "trempette-dans-un-verre-d-eau",
    "question d'évolution": "question-d-evolution",
    "rencontres d'un soir": "rencontres-d-un-soir",
    "elle n'a pas fini d'aimer la viande": "elle-n-a-pas-fini-d-aimer-la-viande",
    "le monde à l'envers": "le-monde-a-l-envers-partie1",
    "en manque d'inspiration": "en-manque-d-inspiration",
    "la guerre de cania n'aura pas lieu": "la-guerre-de-cania-n-aura-pas-lieu",
    "présence d'esprits": "presence-d-esprits",
    "les métamorphoses d'un tanuki": "les-metamorphoses-d-un-tanuki",
    "les habitudes ont l'eau-de-vie dure": "les-habitudes-ont-l-eau-de-vie-dure",
    "gobstination d'un grobelin": "gobstination-d-un-grobelin",
    "sang d'encre": "sang-d-encre",
    "jusqu'à leur dernier soupir": "jusqu-a-leur-dernier-soupir",
    "de l'encre spectaculaire": "de-l-encre-spectaculaire",
    "quand l'éveil n'est qu'un songe": "quand-l-eveil-n-est-qu-un-songe",
    "par ce serment s'écrit le monde": "par-ce-serment-s-ecrit-le-monde",
    "au détour d'un rêve perdu": "au-detour-d-un-reve-perdu",
    "sos d'un douzien en détresse": "sos-d-un-douzien-en-detresse",
    "de l'eau dans la chair": "de-l-eau-dans-la-chair",
    "leçon d'histoire": "lecon-d-histoire",
    "soldats d'infortune": "soldats-d-infortune",
    "quand les esprits s'échauffent": "quand-les-esprits-s-echauffent",
    "l'opportunité d'un jour": "l-opportunite-d-un-jour",
    "gladiateur dans l'âme": "gladiateur-dans-l-ame",
    "tour d'honneur": "tour-d-honneur",
    "c'est du bateau": "c-est-du-bateau",
    "c'est radical ici": "c-est-radical-ici",
    "rien n'est tout noir, ni tout blanc": "rien-n-est-tout-noir-ni-tout-blanc",
    "altéré go !": "altere-go",
    "chercher un marteau-aigri dans une galerie d'ereboria": "chercher-un-marteau-aigri-dans-une-galerie-d-ereboria",
    "par l'héritage qui vous lie": "par-l-heritage-qui-vous-lie",
    "le cœur d'un compagnon est fait comme une auberge...": "le-coeur-d-un-compagnon-est-fait-comme-une-auberge",
    "les derniers d'entre nous": "les-derniers-d-entre-nous",
    "rokwa : voie du poing": "rokwa-voie-du-poing",
    "gokwa : voie du bâton": "gokwa-voie-du-baton",
    "yonkwa : voie du sabre": "yonkwa-voie-du-sabre",
    "sankwa : voie du bouclier": "sankwa-voie-du-bouclier",
    "nikwa : voie des cinq griffes": "nikwa-voie-des-cinq-griffes",
    "ikwa : voie du guerrier ivre": "ikwa-voie-du-guerrier-ivre",
    "shodanwa : perfection martiale": "shodanwa-perfection-martiale",
    "nidanwa : harmonie intérieure": "nidanwa-harmonie-interieure",
    "sandanwa : pluralité martiale": "sandanwa-pluralite-martiale",
    "yondanwa : maîtrise absolue": "yondanwa-maitrise-absolue",
    "godanwa : transcendance": "godanwa-transcendance",
    "on recherche ka'youloud": "on-recherche-ka-youloud",
    "on recherche le shushu debruk'sayl": "on-recherche-le-shushu-debruk-sayl",
    "reconnaissance de dette": "reconnaissance-de-dettes",
};

// Check if quest has a hardcoded exception
function getUrlException(text) {
    const lower = text.toLowerCase();
    return URL_EXCEPTIONS[lower] || null;
}

// Detect which apostrophe pattern to use based on quest name
function detectApostrophePattern(text) {
    const lower = text.toLowerCase();
    
    // Pattern 1: "On recherche" quests keep ALL apostrophe hyphens
    if (lower.startsWith('on recherche')) {
        return 'keep-all-hyphens';
    }
    
    // Pattern 2: "On m'appelle" quests keep apostrophe hyphens
    if (lower.startsWith("on m'appelle")) {
        return 'keep-all-hyphens';
    }
    
    // Pattern 3: Quests with "d'identité" or "d'Allister" keep d' hyphen
    if (lower.includes("d'identité") || lower.includes("d'allister")) {
        return 'keep-d-hyphen';
    }
    
    // Pattern 4: Dark/Sombre Apprentissage quests use double hyphen
    if (lower.startsWith('apprentissage :') && (lower.includes('sombre') || lower.includes('douleur') || lower.includes('désespoir'))) {
        return 'apprentissage-double';
    }
    
    // Default: Use standard rules
    return 'standard';
}

// Base slug generation for NORMALIZED URLs
function toSlugBaseNormalized(text) {
    let result = text.toLowerCase();
    const pattern = detectApostrophePattern(text);
    
    result = result
        .replace(/,/g, '')
        .replace(/!/g, '');
    
    // Handle Apprentissage based on pattern
    if (pattern === 'apprentissage-double') {
        result = result.replace(/^apprentissage : /g, 'apprentissage--');  // DOUBLE hyphen
    } else {
        result = result.replace(/^apprentissage : /g, 'apprentissage-');   // SINGLE hyphen
    }
    
    result = result
        .replace(/ : /g, '--')
        .replace(/:/g, '-');
    
    // Handle apostrophes based on detected pattern
    if (pattern === 'keep-all-hyphens') {
        result = result
            .replace(/\bc'est\b/g, 'cest')
            .replace(/\bp'ti\b/g, 'pti')
            .replace(/l'/g, 'l-')
            .replace(/d'/g, 'd-')
            .replace(/m'/g, 'm-')
            .replace(/n'/g, 'n-')
            .replace(/'/g, '');
    } else if (pattern === 'keep-d-hyphen') {
        result = result
            .replace(/\bc'est\b/g, 'cest')
            .replace(/\bp'ti\b/g, 'pti')
            .replace(/^l'/g, 'l-')
            .replace(/ de l'/g, ' de l-')
            .replace(/ à l'/g, ' a l-')
            .replace(/ l'/g, ' l')
            .replace(/d'/g, 'd-')  // KEEP HYPHEN
            .replace(/n'/g, 'n')
            .replace(/'/g, '');
    } else {
        result = result
            .replace(/\bc'est\b/g, 'cest')
            .replace(/\bp'ti\b/g, 'pti')
            .replace(/^l'/g, 'l-')
            .replace(/ de l'/g, ' de l-')
            .replace(/ à l'/g, ' a l-')
            .replace(/ l'/g, ' l')
            .replace(/\bd'/g, 'd')
            .replace(/n'/g, 'n')
            .replace(/'/g, '');
    }
    
    return result;
}

// Base slug generation for ENTITY-ENCODED URLs (removes ALL l' without hyphens)
function toSlugBaseEntity(text) {
    let result = text.toLowerCase();
    const pattern = detectApostrophePattern(text);
    
    result = result
        .replace(/,/g, '')
        .replace(/!/g, '');
    
    // Handle Apprentissage based on pattern (same as normalized)
    if (pattern === 'apprentissage-double') {
        result = result.replace(/^apprentissage : /g, 'apprentissage--');  // DOUBLE hyphen
    } else {
        result = result.replace(/^apprentissage : /g, 'apprentissage-');   // SINGLE hyphen
    }
    
    result = result
        .replace(/ : /g, '--')
        .replace(/:/g, '-')
        .replace(/\bc'est\b/g, 'cest')
        .replace(/\bp'ti\b/g, 'pti')
        .replace(/l'/g, 'l')                      // ALL "l'" → "l" (NO hyphen)
        .replace(/\bd'/g, 'd')
        .replace(/n'/g, 'n')
        .replace(/'/g, '');
    
    return result;
}

// Finalize slug (handles special chars, spaces, hyphens)
function finalizeSlug(result) {
    result = result
        .replace(/[?]/g, ' ')
        .replace(/[^a-z0-9\s-]+/g, '')
        .replace(/   /g, '--')
        .replace(/\s+/g, '-')
        .replace(/-{3,}/g, '--')
        .replace(/^-+|-+$/g, '');
    
    return result;
}

// Generate normalized slug (accents → plain characters)
function toSlugNormalized(text) {
    let result = toSlugBaseNormalized(text);
    
    result = result
        .replace(/Œ|œ/g, 'oe')
        .replace(/É|é/g, 'e')
        .replace(/È|è/g, 'e')
        .replace(/Ê|ê/g, 'e')
        .replace(/Ë|ë/g, 'e')
        .replace(/À|à/g, 'a')
        .replace(/Â|â/g, 'a')
        .replace(/Ä|ä/g, 'a')
        .replace(/Î|î/g, 'i')
        .replace(/Ï|ï/g, 'i')
        .replace(/Ô|ô/g, 'o')
        .replace(/Ö|ö/g, 'o')
        .replace(/Ù|ù/g, 'u')
        .replace(/Û|û/g, 'u')
        .replace(/Ü|ü/g, 'u')
        .replace(/Ç|ç/g, 'c');
    
    return finalizeSlug(result);
}

// Generate entity-encoded slug (accents → HTML entities)
function toSlugEntity(text) {
    let result = toSlugBaseEntity(text);
    
    result = result
        .replace(/Œ|œ/g, 'oelig')
        .replace(/É|é/g, 'eacute')
        .replace(/È|è/g, 'egrave')
        .replace(/Ê|ê/g, 'ecirc')
        .replace(/Ë|ë/g, 'euml')
        .replace(/À|à/g, 'agrave')
        .replace(/Â|â/g, 'acirc')
        .replace(/Ä|ä/g, 'auml')
        .replace(/Î|î/g, 'icirc')
        .replace(/Ï|ï/g, 'iuml')
        .replace(/Ô|ô/g, 'ocirc')
        .replace(/Ö|ö/g, 'ouml')
        .replace(/Ù|ù/g, 'ugrave')
        .replace(/Û|û/g, 'ucirc')
        .replace(/Ü|ü/g, 'uuml')
        .replace(/Ç|ç/g, 'ccedil');
    
    return finalizeSlug(result);
}

// Detect if text contains French accents
function hasAccents(text) {
    return /[àâäéèêëïîôùûüÿœæçÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ]/.test(text);
}

// Generate both URL variants
function generateUrlVariants(frenchName) {
    // Check for hardcoded exception first
    const exception = getUrlException(frenchName);
    if (exception) {
        const url = `https://www.dofuspourlesnoobs.com/${exception}.html`;
        return {
            primary: url,
            fallback: url  // Same URL for both since we know the exact format
        };
    }
    
    // Otherwise use pattern detection
    const normalizedSlug = toSlugNormalized(frenchName);
    const entitySlug = toSlugEntity(frenchName);
    
    const normalizedUrl = `https://www.dofuspourlesnoobs.com/${normalizedSlug}.html`;
    const entityUrl = `https://www.dofuspourlesnoobs.com/${entitySlug}.html`;
    
    // Smart priority logic:
    // 1. Apprentissage quests generally use normalized URLs (except dark-themed with entity encoding)
    // 2. Other quests with accents try entity-encoded first
    // 3. Quests without accents try normalized first
    
    const questHasAccents = hasAccents(frenchName);
    const isApprentissage = frenchName.toLowerCase().startsWith('apprentissage');
    
    // Apprentissage quests prefer normalized (accents removed)
    if (isApprentissage) {
        return {
            primary: normalizedUrl,
            fallback: entityUrl
        };
    }
    // Other quests with accents try entity-encoded first
    else if (questHasAccents) {
        return {
            primary: entityUrl,
            fallback: normalizedUrl
        };
    }
    // Quests without accents use normalized
    else {
        return {
            primary: normalizedUrl,
            fallback: entityUrl
        };
    }
}

// ============================================
// HTTP UTILITIES
// ============================================
function checkUrlExists(url) {
    return new Promise((resolve) => {
        const options = {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
                'Connection': 'keep-alive'
            }
        };
        
        const req = https.request(url, options, (res) => {
            // Consume response data to free up memory
            res.on('data', () => {});
            res.on('end', () => {
                // Accept 200 OK or 3xx redirects as success
                resolve(res.statusCode >= 200 && res.statusCode < 400);
            });
        });
        
        req.on('error', (err) => {
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        
        req.setTimeout(10000); // 10 second timeout
        req.end();
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// API FETCHING
// ============================================
async function fetchAllQuests() {
    console.log('📥 Fetching quests from API...\n');
    
    let allQuests = [];
    let skip = 0;
    const limit = 100;
    let total = 0;
    
    // Fetch in batches
    while (true) {
        const url = `${API_BASE}?$limit=${limit}&$skip=${skip}`;
        
        const data = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
        
        if (!data.data || data.data.length === 0) {
            break;
        }
        
        allQuests = allQuests.concat(data.data);
        total = data.total || total;
        skip += data.data.length;
        
        process.stdout.write(`\r   Fetched ${allQuests.length}/${total} quests...`);
        
        if (allQuests.length >= total) {
            break;
        }
    }
    
    console.log(`\n✅ Fetched ${allQuests.length} quests\n`);
    return allQuests;
}

// ============================================
// TESTING LOGIC
// ============================================
async function testQuests(quests) {
    // Filter out Almanax offerings, Dopple hunting, and Safari quests
    const filteredQuests = quests.filter(quest => {
        if (!quest.name || !quest.name.fr) return true; // Keep for noFrenchName count
        
        const frenchLower = quest.name.fr.toLowerCase();
        
        // Skip Almanax offerings
        if (frenchLower.startsWith('offrande à') || frenchLower.startsWith('offrande a')) {
            return false;
        }
        // Skip Dopple hunting
        if (frenchLower.includes('chasse au dopeul') || frenchLower.includes('dopeul')) {
            return false;
        }
        // Skip Safari quests
        if (frenchLower.includes('safari')) {
            return false;
        }
        
        return true;
    });
    
    const skippedCount = quests.length - filteredQuests.length;
    console.log(`📊 Filtered out ${skippedCount} quests (Almanax, Dopple, Safari)`);
    console.log(`🧪 Testing ${filteredQuests.length} actual quests...\n`);
    
    const results = {
        total: 0,
        noFrenchName: 0,
        tested: 0,
        primaryWorks: 0,
        fallbackWorks: 0,
        bothFail: 0,
        failed: [],
        urlCheckFailed: []
    };
    
    for (let i = 0; i < filteredQuests.length; i++) {
        const quest = filteredQuests[i];
        results.total++;
        
        // Progress indicator
        if (i % 50 === 0 && i > 0) {
            process.stdout.write(`\r   Progress: ${i}/${filteredQuests.length} (${Math.round(i/filteredQuests.length*100)}%)`);
        }
        
        // Skip if no French name
        if (!quest.name || !quest.name.fr) {
            results.noFrenchName++;
            continue;
        }
        
        const frenchName = quest.name.fr;
        const englishName = quest.name.en || 'Unknown';
        
        try {
            // Generate both URL variants
            const urls = generateUrlVariants(frenchName);
            results.tested++;
            
            // Verify URLs if needed
            if (MODE === 'VERIFY_ALL' || MODE === 'VERIFY_FAILURES') {
                await sleep(RATE_LIMIT_MS);
                const primaryExists = await checkUrlExists(urls.primary);
                
                if (primaryExists) {
                    results.primaryWorks++;
                } else {
                    // Try fallback
                    await sleep(RATE_LIMIT_MS);
                    const fallbackExists = await checkUrlExists(urls.fallback);
                    
                    if (fallbackExists) {
                        results.fallbackWorks++;
                    } else {
                        results.bothFail++;
                        results.urlCheckFailed.push({
                            id: quest.id,
                            english: englishName,
                            french: frenchName,
                            primaryUrl: urls.primary,
                            fallbackUrl: urls.fallback
                        });
                    }
                }
            }
        } catch (error) {
            results.failed.push({
                id: quest.id,
                english: englishName,
                french: frenchName,
                error: error.message
            });
        }
    }
    
    console.log(`\n`);
    return results;
}

// ============================================
// REPORTING
// ============================================
function printResults(results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST RESULTS`);
    console.log(`${'='.repeat(60)}\n`);
    
    console.log(`📊 Summary:`);
    console.log(`   Total quests: ${results.total}`);
    console.log(`   No French name: ${results.noFrenchName}`);
    console.log(`   Successfully tested: ${results.tested}`);
    
    if (MODE !== 'GENERATION_ONLY') {
        console.log(`\n   ✅ Primary URL works: ${results.primaryWorks}`);
        console.log(`   🔄 Fallback URL works: ${results.fallbackWorks}`);
        console.log(`   ❌ Both URLs fail: ${results.bothFail}`);
        
        const totalVerified = results.primaryWorks + results.fallbackWorks;
        const totalTested = results.primaryWorks + results.fallbackWorks + results.bothFail;
        const successRate = totalTested > 0 ? (totalVerified / totalTested * 100).toFixed(1) : 0;
        console.log(`\n   📊 Coverage: ${totalVerified}/${totalTested} (${successRate}%)`);
    }
    
    console.log(`\n   Generation errors: ${results.failed.length}`);
    
    // Report generation errors
    if (results.failed.length > 0) {
        console.log(`\n❌ Generation Errors (${results.failed.length}):`);
        results.failed.forEach(f => {
            console.log(`   - [${f.id}] ${f.english}`);
            console.log(`     French: ${f.french}`);
            console.log(`     Error: ${f.error}\n`);
        });
    }
    
    // Report URL check failures
    if (results.urlCheckFailed.length > 0) {
        console.log(`\n❌ Both URLs Failed (${results.urlCheckFailed.length}):`);
        
        // Show first 20, then summarize
        const showCount = Math.min(20, results.urlCheckFailed.length);
        for (let i = 0; i < showCount; i++) {
            const f = results.urlCheckFailed[i];
            console.log(`   - [${f.id}] ${f.english}`);
            console.log(`     French: ${f.french}`);
            console.log(`     Primary: ${f.primaryUrl}`);
            console.log(`     Fallback: ${f.fallbackUrl}\n`);
        }
        
        if (results.urlCheckFailed.length > 20) {
            console.log(`   ... and ${results.urlCheckFailed.length - 20} more\n`);
        }
    }
    
    
    console.log(`\n${'='.repeat(60)}\n`);
}

// ============================================
// MAIN
// ============================================
async function loadFailedQuests() {
    const fs = require('fs');
    try {
        const data = fs.readFileSync('bulk-test-results.json', 'utf8');
        const previousResults = JSON.parse(data);
        
        if (!previousResults.urlCheckFailed || previousResults.urlCheckFailed.length === 0) {
            console.log('\n⚠️  No failed quests found in bulk-test-results.json');
            console.log('   Run with --verify-all first to generate initial results.\n');
            process.exit(0);
        }
        
        console.log(`\n📂 Loading ${previousResults.urlCheckFailed.length} failed quests from previous run...\n`);
        
        // Convert failed quest data back to quest format for retesting
        const failedQuests = previousResults.urlCheckFailed.map(f => ({
            id: f.id,
            name: {
                en: f.english,
                fr: f.french
            }
        }));
        
        return failedQuests;
    } catch (error) {
        console.error('❌ Error reading bulk-test-results.json:', error.message);
        console.log('   Run with --verify-all first to generate initial results.\n');
        process.exit(1);
    }
}

async function main() {
    try {
        let quests;
        
        if (MODE === 'VERIFY_FAILURES') {
            quests = await loadFailedQuests();
        } else {
            quests = await fetchAllQuests();
        }
        
        const results = await testQuests(quests);
        printResults(results);
        
        // Save detailed results to file
        const fs = require('fs');
        fs.writeFileSync('bulk-test-results.json', JSON.stringify(results, null, 2));
        console.log('💾 Detailed results saved to bulk-test-results.json\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
