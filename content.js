(function () {
    // Cross-browser compatibility: use browser API if available, fallback to chrome
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    
    // Global flag to prevent multiple button creation attempts
    let isCreatingButton = false;
    
    // Check if we're on any Dofus Wiki page
    const titleElem = document.querySelector("h1");
    if (!titleElem) return;
    
    const rawEnglishName = titleElem.innerText.trim();
    // Strip parenthetical suffixes like "(quest)", "(monster)", etc.
    const englishName = rawEnglishName.replace(/\s*\([^)]+\)\s*$/g, '').trim();
    console.log("Found Dofus Wiki page:", rawEnglishName, "→ Cleaned:", englishName);
    
    // Determine page type for better content matching
    function getPageType() {
        const url = window.location.href;
        const title = englishName.toLowerCase();
        
        if (url.includes("/wiki/Category:")) return "category";
        if (title.includes("dungeon") || title.includes("donjon")) return "dungeon";
        if (title.includes("quest") || title.includes("quête")) return "quest";
        if (title.includes("monster") || title.includes("monstre")) return "monster";
        if (title.includes("item") || title.includes("objet")) return "item";
        if (title.includes("area") || title.includes("zone")) return "area";
        if (title.includes("equipment") || title.includes("équipement")) return "equipment";
        if (title.includes("spell") || title.includes("sort")) return "spell";
        if (title.includes("achievement") || title.includes("succès")) return "achievement";
        
        return "general"; // Default
    }
    
    const pageType = getPageType();
    console.log("Detected page type:", pageType);
    
    // Check if this is a valid Dofus Wiki content page (allow useful category pages)
    const pageContent = document.body.innerText.toLowerCase();
    const isValidPage = !pageContent.includes("forum:") &&
                       !pageContent.includes("user:") &&
                       !pageContent.includes("help:") &&
                       !englishName.includes("Fandom") &&
                       !englishName.includes("Wiki") &&
                       !englishName.includes("All items") &&
                       !englishName.includes("All quests") &&
                       !englishName.includes("All monsters");

    // Check if popup is visible before running
    function checkPopupVisible() {
        browserAPI.storage.sync.get(['popupVisible'], function(result) {
            // Default to false (disabled) if not set
            const isVisible = result.popupVisible === true;
            
            if (isVisible && isValidPage) {
                console.log("Popup visible, running on valid page");
                findContentName();
            } else {
                console.log("Popup hidden or not on valid page");
                // Remove existing button if any
                const existingBtn = document.getElementById("dofus-quest-linker-btn");
                if (existingBtn) existingBtn.remove();
            }
        });
    }

    // Listen for popup visibility changes from background script
    browserAPI.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === 'popupVisibilityChanged') {
            console.log("Popup visibility changed to:", message.visible);
            if (message.visible && isValidPage) {
                findContentName();
            } else {
                // Remove button when hidden
                const existingBtn = document.getElementById("dofus-quest-linker-btn");
                if (existingBtn) existingBtn.remove();
            }
        }
    });

    // Listen for storage changes (in case popup visibility is changed from another tab)
    browserAPI.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.popupVisible) {
            console.log("Popup visibility state changed:", changes.popupVisible.newValue);
            if (changes.popupVisible.newValue && isValidPage) {
                findContentName();
            } else {
                // Remove button when hidden
                const existingBtn = document.getElementById("dofus-quest-linker-btn");
                if (existingBtn) existingBtn.remove();
            }
        }
    });
    
    // Main execution
    checkPopupVisible();

    function findContentName() {
        // Try API with multiple content types, then fallback to direct URL generation
        browserAPI.runtime.sendMessage({ type: "fetchAllContent", name: englishName }, (resp) => {
            if (browserAPI.runtime.lastError) {
                console.error("Runtime error:", browserAPI.runtime.lastError);
                // Fallback to direct URL generation
                createFallbackButton();
                return;
            }
            
            if (resp && resp.success && resp.data) {
                console.log("🔍 API Response received:", resp);
                // Try to find French name from any content type, prioritized by page type
                let frenchName = null;
                
                // Define priority order based on page type
                const priorityOrder = {
                    "monster": ["monsters", "dungeons", "quests", "items", "achievements", "equipments", "spells", "subareas", "areas"],
                    "dungeon": ["dungeons", "monsters", "quests", "items", "achievements", "equipments", "spells", "subareas", "areas"],
                    "quest": ["quests", "monsters", "dungeons", "items", "achievements", "equipments", "spells", "subareas", "areas"],
                    "item": ["items", "equipments", "quests", "monsters", "dungeons", "achievements", "spells", "subareas", "areas"],
                    "area": ["areas", "subareas", "dungeons", "quests", "monsters", "items", "achievements", "equipments", "spells"],
                    "equipment": ["equipments", "items", "quests", "monsters", "dungeons", "achievements", "spells", "subareas", "areas"],
                    "spell": ["spells", "quests", "monsters", "dungeons", "items", "achievements", "equipments", "subareas", "areas"],
                    "achievement": ["achievements", "quests", "monsters", "dungeons", "items", "equipments", "spells", "subareas", "areas"],
                    "category": ["areas", "monsters", "dungeons", "quests", "items", "subareas", "achievements", "equipments", "spells"],
                    "general": ["quests", "monsters", "dungeons", "items", "achievements", "equipments", "spells", "subareas", "areas"]
                };
                
                const searchOrder = priorityOrder[pageType] || priorityOrder.general;
                
                // Search in priority order
                for (const contentType of searchOrder) {
                    console.log(`🔍 Checking ${contentType}...`);
                    if (resp.data[contentType] && resp.data[contentType].data && resp.data[contentType].data.length > 0) {
                        console.log(`📋 Found ${contentType}.data with ${resp.data[contentType].data.length} items`);
                        frenchName = resp.data[contentType].data[0].name && resp.data[contentType].data[0].name.fr;
                        if (frenchName) {
                            console.log(`✅ Found ${contentType} with French name: "${frenchName}"`);
                            break;
                        } else {
                            console.log(`❌ ${contentType} found but no French name`);
                        }
                    } else {
                        console.log(`❌ No ${contentType} data found`);
                    }
                }
                
                if (frenchName) {
                    // Generate both URL variants (normalized + entity-encoded fallback)
                    const urlVariants = generateUrlVariants(frenchName);
                    createButtonWithFallback(urlVariants);
                    return;
                }
            }
            
            console.log("❌ API failed or no French name found in any content type, using fallback");
            console.log("🔄 Fallback: Using English name:", englishName);
            // Use the new API validation system for fallback
            createFallbackButton();
        });
    }

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
        "un pouvoir mérydique": "un-pouvoir-merydique",
        "l'anneau de tot": "lanneau-de-tot",
        "série animalière": "serie-animaliere",
        "comment mettre un requin en bière": "comment-mettre-un-requin-en-biere",
        "on recherche padgref demoël": "on-recherche-padgref-demoel",
        "on recherche fouduglen l'écureuil": "on-recherche-fouduglen-l-ecureuil",
        "apprentissage : écuyer": "apprentissage-ecuyer",
        "apprentissage : apprenti éclairé": "apprentissage-apprenti-eclaire",
        "on recherche zatoïshwan": "on-recherche-zatoishwan",
        "apprentissage : adepte des écrits": "apprentissage-adepte-des-ecrits",
        "apprentissage : chasseur de renégats": "apprentissage-chasseur-de-renegats",
        "de la viande de dragodinde pour la tablée d'allister": "de-la-viande-de-dragodinde-pour-la-tablee-d-allister",
        "piétine titine": "pietine-titine",
        "visite non guidée": "visite-non-guidee",
        "des fleurs épineuses": "des-fleurs-epineuses",
        "le maître des clefs": "le-maitre-des-clefs",
        "les sbires du maître": "les-sbires-du-maitre",
        "un juge hystérique": "un-juge-hysterique",
        "ça est frugal, une fois": "ca-est-frugal-une-fois",
        "info pour un vrai traître": "info-pour-un-vrai-traitre",
        "usuwpation d'identité": "usuwpation-d-identite",
        "à roublard, roublard et demi": "a-roublard-roublard-et-demi",
        "trouble-fête": "trouble-fete",
        "bouc à misère": "bouc-a-misere",
        "flagrant délire": "flagrant-delire",
        "les kamas résolvent tout": "les-kamas-resolvent-tout",
        "l'équipe ment": "l-equipe-ment",
        "ambition ambigüe": "ambition-ambigue",
        "trâknar": "traknar",
        "attaque à retardement": "attaque-a-retardement",
        "une rumeur intéressante": "une-rumeur-interessante",
        "investigations à moon": "investigations-a-moon",
        "manière douce": "maniere-douce",
        "un coupable idéal": "un-coupable-ideal",
        "de drôles de témoins": "de-droles-de-temoins",
        "esprit, es-tu là ?": "esprit-es-tu-la",
        "ingérence en amakna": "ingerence-en-amakna",
        "apprentissage : maître des parchemins": "apprentissage-maitre-des-parchemins",
        "apprentissage : assassin suprême": "apprentissage-assassin-supreme",
        "la mémoire en lambeaux": "la-memoire-en-lambeaux",
        "pense-bête": "pense-bete",
        "l'éclat de l'aube": "l-eclat-de-l-aube",
        "espèce menacée": "espece-menacee",
        "on recherche fantômayte": "on-recherche-fantomayte",
        "on recherche vengeuse masquée": "on-recherche-vengeuse-masquee",
        "rose à lys, rose à lys, oh !": "rose-a-lys-rose-a-lys-oh",
        "l'ombre et la glace": "lombre-et-la-glace",
        "à la recherche de dan lavy": "a-la-recherche-de-dan-lavy",
        "à qui profite le boufmouth": "a-qui-profite-le-boufmouth",
        "l'abominable yech'ti": "labominable-yechti",
        "septième postage": "septieme-postage",
        "huitième postage": "huitieme-postage",
        "neuvième postage": "neuvieme-postage",
        "dixième postage": "dixieme-postage",
        "douzième postage": "douzieme-postage",
        "fantômes contre fantômes": "fantomes-contre-fantomes",
        "braquage à la roublard": "braquage-a-la-roublard",
        "la destinée": "la-destinee",
        "l'aventure de la terre": "laventure-de-la-terre",
        "dévotion à crâ": "devotion-a-cra",
        "dévotion à ecaflip": "devotion-a-ecaflip",
        "dévotion à eniripsa": "devotion-a-eniripsa",
        "dévotion à enutrof": "devotion-a-enutrof",
        "dévotion à féca": "devotion-a-feca",
        "dévotion à iop": "devotion-a-iop",
        "dévotion à osamodas": "devotion-a-osamodas",
        "dévotion à pandawa": "devotion-a-pandawa",
        "dévotion à dralbour": "devotion-a-dralbour",
        "dévotion à sacrieur": "devotion-a-sacrieur",
        "dévotion à xélor": "devotion-a-xelor",
        "à la barbe du roi": "a-la-barbe-du-roi",
        "des kœurs du tonnerre !": "des-koeurs-du-tonnerre",
        "l'étrange créature de l'étang bleu": "l-etrange-creature-de-l-etang-bleu",
        "dévotion à oktapodas": "devotion-a-oktapodas",
        "pattes aux œufs frais": "pattes-aux-oeufs-frais",
        "vols à la charrette": "vols-a-la-charrette",
        "la fête aux tire-fesses": "la-fete-aux-tire-fesses",
        "contrôles anti-baston": "controles-anti-baston",
        "mener à la baguette": "mener-a-la-baguette",
        "on recherche culbutœuf": "on-recherche-culbutoeuf",
        "la rivalité": "la-rivalite",
        "troubles à bonta": "troubles-a-bonta",
        "troubles à brâkmar": "troubles-a-brakmar",
        "l'ivresse des profondeurs": "livresse-des-profondeurs",
        "à bas kralab rah": "a-bas-kralab-rah",
        "l'amour perdu de nabur": "lamour-perdu-de-nabur",
        "l'art triste": "lart-triste",
        "prime de lèche-majesté": "prime-de-leche-majeste",
        "coiffeur de génie": "coiffeur-de-genie",
        "un œuf pour ecaflip": "un-oeuf-pour-ecaflip",
        "l'art me ment": "lart-me-ment",
        "bouchées à la reine": "bouchees-a-la-reine",
        "sortir de l'ombre": "sortir-de-lombre",
        "os sitôt dit, aussitôt fait": "os-sitot-dit-aussitot-fait",
        "on recherche la mouchâme": "on-recherche-la-mouchame",
        "on recherche pantèroz": "on-recherche-panteroz",
        "la quête de l'oiseau du temps": "la-quete-de-l-oiseau-du-temps",
        "dévotion au roi-dieu": "devotion-au-roi-dieu",
        "l'art de la langue de bois": "lart-de-la-langue-de-bois",
        "l'ombre et la proie": "lombre-et-la-proie",
        "dévotion à la balance krosmique": "devotion-a-la-balance-krosmique",
        "on recherche maître boulet": "on-recherche-maitre-boulet",
        "l'as du volans": "las-du-volans",
        "l'arakne de leng": "larakne-de-leng",
        "gelé à pierre fendre": "gele-a-pierre-fendre",
        "l'essor de qu'tan": "lessor-de-qutan",
        "l'habit ne fait pas le moine": "lhabit-ne-fait-pas-le-moine",
        "ça fait froid dans le dos": "ca-fait-froid-dans-le-dos",
        "risquer un œil": "risquer-un-oeil",
        "la gueule de l'enfer": "la-gueule-de-lenfer",
        "l'affaire pollie perkine": "laffaire-pollie-perkine",
        "l'odeur devant le seuil": "lodeur-devant-le-seuil",
        "le héros de sufokia": "le-heros-de-sufokia",
        "l'effet paula rice": "leffet-paula-rice",
        "la dernière pierre": "la-derniere-pierre",
        "les coûts du sort": "les-couts-du-sort",
        "un remède draconien": "un-remede-draconien",
        "l'allégorie de la taverne": "l-allegorie-de-la-taverne",
        "filouterie épicée": "filouterie-epicee",
        "faune pimentée": "faune-pimentee",
        "chargement déserté": "chargement-deserte",
        "l'étoile de la mer": "l-etoile-de-la-mer",
        "le fou rit et rôde": "le-fou-rit-et-rode",
        "l'épice rit": "l-epice-rit",
        "la barrière des langues": "la-barriere-des-langues",
        "désert de revanche": "desert-de-revanche",
        "une mine de déterré": "une-mine-de-deterre",
        "voleurs en série": "voleurs-en-serie",
        "moins on en a et plus on l'étale": "moins-on-en-a-et-plus-on-letale",
        "investigation embarquée": "investigation-embarquee",
        "un problème de serre-ure": "un-probleme-de-serre-ure",
        "un ver ça va, trop de vers, bonjour les dégâts": "un-ver-ca-va-trop-de-vers-bonjour-les-degats",
        "le mystère des vers": "le-mystere-des-vers",
        "perché là-haut": "perche-la-haut",
        "la cité des truites": "la-cite-des-truites",
        "dévotion à ouginak": "devotion-a-ouginak",
        "à armes égales": "a-armes-egales",
        "nos amies les bêtes": "nos-amies-les-betes",
        "à la rescousse des magypus": "a-la-rescousse-des-magypus",
        "trou de mémoire": "trou-de-memoire",
        "l'entrée des artistes": "l-entree-des-artistes",
        "le baptême du feu": "le-bapteme-du-feu",
        "le fléau de burin": "le-fleau-de-burin",
        "la bête intérieure": "la-bete-interieure",
        "la prolifération a crû": "la-proliferation-a-cru",
        "cours forestière": "cours-forestiere",
        "les goules à zéro": "les-goules-a-zero",
        "cambriolage à durée déterminée": "cambriolage-a-duree-determinee",
        "mélodie en sous-sol": "melodie-en-sous-sol",
        "mieux vaut guérir que mourir": "mieux-vaut-guerir-que-mourir",
        "le crépuscule des morts-vivants": "le-crepuscule-des-morts-vivants",
        "un chemin tout tracé": "un-chemin-tout-trace",
        "à glacer le sang": "a-glacer-le-sang",
        "lettre à ilyz": "lettre-a-ilyz",
        "apprentissage : héros légendaire": "apprentissage-heros-legendaire",
        "apprentissage : maître des illusions": "apprentissage-maitre-des-illusions",
        "apprentissage : héros de l'apocalypse": "apprentissage-heros-de-l-apocalypse",
        "apprentissage : maître des ombres": "apprentissage-maitre-des-ombres",
        "on recherche jérart dupaindur": "on-recherche-jerart-dupaindur",
        "on recherche le fantôme braïdeur": "on-recherche-le-fantome-braideur",
        "le piège se referme": "le-piege-se-referme",
        "la colère des dieux": "la-colere-des-dieux",
        "au-delà de la côte": "au-dela-de-la-cote",
        "cœur de pierre": "coeur-de-pierre",
        "les pierres à feu": "les-pierres-a-feu",
        "plantes contre trépamorts": "plantes-contre-trepamorts",
        "le héros de plantes contre trépamorts": "le-heros-de-plantes-contre-trepamorts",
        "les cœurs livides": "les-coeurs-livides",
        "craquements de cœur": "craquements-de-coeur",
        "on marche sur des œufs": "on-marche-sur-des-oeufs",
        "ça sent le gaz": "ca-sent-le-gaz",
        "balade en forêt": "balade-en-foret",
        "la fête de la chocopépite": "la-fete-de-la-chocopepite",
        "crime et châtiment": "crime-et-chatiment",
        "ça tombe à l'eau": "ca-tombe-a-l-eau",
        "déjeuner à la fourchette": "dejeuner-a-la-fourchette",
        "livraison par intérim": "livraison-par-interim",
        "golémancien": "golemancien",
        "le rebelle de la forêt": "le-rebelle-de-la-foret",
        "de vrais rats de bibliothèque": "de-vrais-rats-de-bibliotheque",
        "les touffes des héros": "les-touffes-des-heros",
        "le génie se meut": "le-genie-se-meut",
        "bûcherons en détresse": "bucherons-en-detresse",
        "revenons à nos bouftons": "revenons-a-nos-bouftons",
        "la dernière barbe avant la fin du monde": "la-derniere-barbe-avant-la-fin-du-monde",
        "lâches de glace": "laches-de-glace",
        "l'épée du rocher": "l-epee-du-rocher",
        "le forgeur de légende": "le-forgeur-de-legende",
        "à la recherche de crocoburio": "a-la-recherche-de-crocoburio",
        "le creuset de mériana": "le-creuset-de-meriana",
        "une douloureuse séparation": "une-douloureuse-separation",
        "l'œuf de crocabulia": "l-oeuf-de-crocabulia",
        "un nouvel héritier": "un-nouvel-heritier",
        "le rituel de la bière": "le-rituel-de-la-biere",
        "chasse au trésor des pirates": "chasse-au-tresor-des-pirates",
        "un œuf à part": "un-oeuf-a-part",
        "mystère et œuf au chocolat": "mystere-et-oeuf-au-chocolat",
        "aux frontières du réel": "aux-frontieres-du-reel",
        "l'île flottante au chocolat": "l-ile-flottante-au-chocolat",
        "les aléas de la chocolaterie": "les-aleas-de-la-chocolaterie",
        "la mélodie du bonheur": "la-melodie-du-bonheur",
        "et paf, ça fait un shokipik !": "et-paf-ca-fait-un-shokipik",
        "l'euphorie des léporidés": "l-euphorie-des-leporides",
        "chasse aux œufs de pwâk": "chasse-aux-oeufs-de-pwak",
        "des croquants à dévorer": "des-croquants-a-devorer",
        "la mère des dragoeufs": "la-mere-des-dragoeufs",
        "les raisons de la colère": "les-raisons-de-la-colere",
        "plongée dans un bain de sang": "plongee-dans-un-bain-de-sang",
        "haché parlé": "hache-parle",
        "cauchemars prémonitoires": "cauchemars-premonitoires",
        "simulations périlleuses": "simulations-perilleuses",
        "les œufs oubliés": "les-oeufs-oublies",
        "une boufette nommée blanquette": "une-boufette-nommee-blanquette",
        "au-delà de la gloire": "au-dela-de-la-gloire",
        "le vent se lève": "le-vent-se-leve",
        "avis de tempête": "avis-de-tempete",
        "rêves translucides": "reves-translucides",
        "les quatre volontés": "les-quatre-volontes",
        "le réveil de pandala": "le-reveil-de-pandala",
        "à la croisée des mondes": "a-la-croisee-des-mondes",
        "sous le bois de sa colère": "sous-le-bois-de-sa-colere",
        "la jetée des enfants perdus": "la-jetee-des-enfants-perdus",
        "l'équilibre des forces": "l-equilibre-des-forces",
        "l'épopée du moine pèlerin": "l-epopee-du-moine-pelerin",
        "une bien étrange prophétie": "une-bien-etrange-prophetie",
        "infâme pourriture": "infame-pourriture",
        "où est mon samouraï ?": "ou-est-mon-samourai",
        "nékinékologie": "nekinekologie",
        "l'égalité des sexes": "l-egalite-des-sexes",
        "sombre mystère": "sombre-mystere",
        "sécurité routière": "securite-routiere",
        "des lueurs de désespoir": "des-lueurs-de-desespoir",
        "le réceptacle des dofus": "le-receptacle-des-dofus",
        "pour que son cœur batte comme des ailes": "pour-que-son-coeur-batte-comme-des-ailes",
        "toute possession dépossède": "toute-possession-depossede",
        "le début de la fin": "le-debut-de-la-fin",
        "un vrai petit garçon": "un-vrai-petit-garcon",
        "un héritage tourmenté": "un-heritage-tourmente",
        "les totems de maïmane": "les-totems-de-maimane",
        "démongraphie galopante": "demongraphie-galopante",
        "l'appel de la cité blanche": "l-appel-de-la-cite-blanche",
        "l'appel de la cité sombre": "l-appel-de-la-cite-sombre",
        "cuisine raffinée": "cuisine-raffinee",
        "déficience immunitaire": "deficience-immunitaire",
        "la lumière au bout des égouts": "la-lumiere-au-bout-des-egouts",
        "ancré dans nos âmes": "ancre-dans-nos-ames",
        "après lui, le déluge": "apres-lui-le-deluge",
        "rester planté là": "rester-plante-la",
        "pas de fumée sans feu": "pas-de-fumee-sans-feu",
        "la bête au bois dormant": "la-bete-au-bois-dormant",
        "arrête-la si tu peux": "arrete-la-si-tu-peux",
        "la campagne hallucinée": "la-campagne-hallucinee",
        "déboisement vulkain": "deboisement-vulkain",
        "écrémage vulkain": "ecremage-vulkain",
        "récolte vulkaine": "recolte-vulkaine",
        "pêche vulkaine": "peche-vulkaine",
        "dévotion à la lance originelle": "devotion-a-la-lance-originelle",
        "un événement inattendu": "un-evenement-inattendu",
        "l'île maudite": "l-ile-maudite",
        "la sorcière exilée": "la-sorciere-exilee",
        "la graine de la révolte": "la-graine-de-la-revolte",
        "une dernière volonté": "une-derniere-volonte",
        "les risques du métier": "les-risques-du-metier",
        "qui nous protège du protecteur ?": "qui-nous-protege-du-protecteur",
        "l'enfer des altérés": "l-enfer-des-alteres",
        "au nom du progrès": "au-nom-du-progres",
        "où est leonzi trool ?": "ou-est-leonzi-trool",
        "donjon éducatif": "donjon-educatif",
        "tour du propriétaire": "tour-du-proprietaire",
        "le métier des aventuriers": "le-metier-des-aventuriers",
        "préparation au combat": "preparation-au-combat",
        "ça barde là-haut": "ca-barde-la-haut",
        "la proie des vérités": "la-proie-des-verites",
        "trois cœurs, un roi": "trois-coeurs-un-roi",
        "un problème de taille": "un-probleme-de-taille",
        "des petites bêtes qui font bzzzbz": "des-petites-betes-qui-font-bzzzbz",
        "têtes de ponte": "tetes-de-ponte",
        "dérive insectaire": "derive-insectaire",
        "une petite démangeaison": "une-petite-demangeaison",
        "devoir de réserve": "devoir-de-reserve",
        "un hôte de marque": "un-hote-de-marque",
        "l'union sacrée": "l-union-sacree",
        "le roi balafré": "le-roi-balafre",
        "chasse au trésor archéologique": "chasse-au-tresor-archeologique",
        "chasse au trésor quotidienne": "chasse-au-tresor-quotidienne",
        "chasse au trésor de güss": "chasse-au-tresor-de-guss",
        "chasse au trésor de scheik": "chasse-au-tresor-de-scheik",
        "chasse au trésor de sad": "chasse-au-tresor-de-sad",
        "chasse au trésor de milivar": "chasse-au-tresor-de-milivar",
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
    
    // Base slug generation for NORMALIZED URLs (handles apostrophes with hyphens for prepositions)
    function toSlugBaseNormalized(text) {
        let result = text.toLowerCase();
        const pattern = detectApostrophePattern(text);
        
        result = result
            .replace(/,/g, "")                       // Remove commas completely
            .replace(/!/g, "");                      // Remove exclamation marks
        
        // Handle Apprentissage based on pattern
        if (pattern === 'apprentissage-double') {
            result = result.replace(/^apprentissage : /g, "apprentissage--");  // DOUBLE hyphen for dark quests
        } else {
            result = result.replace(/^apprentissage : /g, "apprentissage-");   // SINGLE hyphen for others
        }
        
        result = result
            .replace(/ : /g, "--")                    // " : " → double hyphen
            .replace(/:/g, "-");                      // Remaining colons → single hyphen
        
        // Handle apostrophes based on detected pattern
        if (pattern === 'keep-all-hyphens') {
            // Keep hyphens for ALL apostrophes
            result = result
                .replace(/\bc'est\b/g, "cest")        // Exception: "c'est" → "cest"
                .replace(/\bp'ti\b/g, "pti")          // Exception: "p'ti" → "pti"
                .replace(/l'/g, "l-")                 // ALL "l'" → "l-"
                .replace(/d'/g, "d-")                 // ALL "d'" → "d-"
                .replace(/m'/g, "m-")                 // ALL "m'" → "m-"
                .replace(/n'/g, "n-")                 // ALL "n'" → "n-"
                .replace(/'/g, "");                   // Remove remaining apostrophes
        } else if (pattern === 'keep-d-hyphen') {
            // Keep hyphen for d' only
            result = result
                .replace(/\bc'est\b/g, "cest")
                .replace(/\bp'ti\b/g, "pti")
                .replace(/^l'/g, "l-")                // "l'" at START → "l-"
                .replace(/ de l'/g, " de l-")         // " de l'" → " de l-"
                .replace(/ à l'/g, " a l-")           // " à l'" → " a l-"
                .replace(/ l'/g, " l")                // Other " l'" → " l"
                .replace(/d'/g, "d-")                 // ALL "d'" → "d-" (KEEP HYPHEN)
                .replace(/n'/g, "n")
                .replace(/'/g, "");
        } else {
            // Standard rules
            result = result
                .replace(/\bc'est\b/g, "cest")
                .replace(/\bp'ti\b/g, "pti")
                .replace(/^l'/g, "l-")                // "l'" at START → "l-"
                .replace(/ de l'/g, " de l-")         // " de l'" → " de l-"
                .replace(/ à l'/g, " a l-")           // " à l'" → " a l-"
                .replace(/ l'/g, " l")                // Other " l'" → " l"
                .replace(/\bd'/g, "d")                // "d'" → "d"
                .replace(/n'/g, "n")
                .replace(/'/g, "");
        }
        
        return result;
    }
    
    // Base slug generation for ENTITY-ENCODED URLs (removes ALL l' without hyphens)
    function toSlugBaseEntity(text) {
        let result = text.toLowerCase();
        const pattern = detectApostrophePattern(text);
        
        result = result
            .replace(/,/g, "")                       // Remove commas completely
            .replace(/!/g, "");                      // Remove exclamation marks
        
        // Handle Apprentissage based on pattern (same as normalized)
        if (pattern === 'apprentissage-double') {
            result = result.replace(/^apprentissage : /g, "apprentissage--");  // DOUBLE hyphen
        } else {
            result = result.replace(/^apprentissage : /g, "apprentissage-");   // SINGLE hyphen
        }
        
        result = result
            .replace(/ : /g, "--")                    // " : " → double hyphen
            .replace(/:/g, "-")                       // Remaining colons → single hyphen
            .replace(/\bc'est\b/g, "cest")            // Special case: "c'est" becomes "cest"
            .replace(/\bp'ti\b/g, "pti")              // Special case: "p'ti" becomes "pti"
            .replace(/l'/g, "l")                      // ALL "l'" → "l" (NO hyphen for entity encoding)
            .replace(/\bd'/g, "d")                    // "d'" → "d"
            .replace(/n'/g, "n")                      // "n'" → "n"
            .replace(/'/g, "");                       // Remove remaining apostrophes
        
        return result;
    }
    
    // Finalize slug (handles special chars, spaces, hyphens)
    function finalizeSlug(result) {
        result = result
            .replace(/[?]/g, " ")                    // Replace question marks with spaces
            .replace(/[^a-z0-9\s-]+/g, "")           // Keep hyphens, remove other special chars
            .replace(/   /g, "--")                   // Triple spaces to double hyphens
            .replace(/\s+/g, "-")                    // Remaining spaces to single hyphens
            .replace(/-{3,}/g, "--")                 // Collapse 3+ hyphens to double
            .replace(/^-+|-+$/g, "");                // Remove leading/trailing hyphens
        
        return result;
    }
    
    // Generate normalized slug (accents → plain characters)
    function toSlugNormalized(text) {
        console.log(`🔍 Generating NORMALIZED slug for: "${text}"`);
        
        let result = toSlugBaseNormalized(text);
        
        // Normalize ALL accents to plain characters
        result = result
            .replace(/Œ|œ/g, "oe")
            .replace(/É|é/g, "e")
            .replace(/È|è/g, "e")
            .replace(/Ê|ê/g, "e")
            .replace(/Ë|ë/g, "e")
            .replace(/À|à/g, "a")
            .replace(/Â|â/g, "a")
            .replace(/Ä|ä/g, "a")
            .replace(/Î|î/g, "i")
            .replace(/Ï|ï/g, "i")
            .replace(/Ô|ô/g, "o")
            .replace(/Ö|ö/g, "o")
            .replace(/Ù|ù/g, "u")
            .replace(/Û|û/g, "u")
            .replace(/Ü|ü/g, "u")
            .replace(/Ç|ç/g, "c");
        
        result = finalizeSlug(result);
        console.log(`✅ Normalized slug: "${result}"`);
        
        return result;
    }
    
    // Generate entity-encoded slug (accents → HTML entities)
    function toSlugEntity(text) {
        console.log(`🔍 Generating ENTITY-ENCODED slug for: "${text}"`);
        
        let result = toSlugBaseEntity(text);
        
        // Entity-encode ALL accents
        result = result
            .replace(/Œ|œ/g, "oelig")
            .replace(/É|é/g, "eacute")
            .replace(/È|è/g, "egrave")
            .replace(/Ê|ê/g, "ecirc")
            .replace(/Ë|ë/g, "euml")
            .replace(/À|à/g, "agrave")
            .replace(/Â|â/g, "acirc")
            .replace(/Ä|ä/g, "auml")
            .replace(/Î|î/g, "icirc")
            .replace(/Ï|ï/g, "iuml")
            .replace(/Ô|ô/g, "ocirc")
            .replace(/Ö|ö/g, "ouml")
            .replace(/Ù|ù/g, "ugrave")
            .replace(/Û|û/g, "ucirc")
            .replace(/Ü|ü/g, "uuml")
            .replace(/Ç|ç/g, "ccedil");
        
        result = finalizeSlug(result);
        console.log(`✅ Entity-encoded slug: "${result}"`);
        
        return result;
    }

    // Detect if text contains French accents
    function hasAccents(text) {
        return /[àâäéèêëïîôùûüÿœæçÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ]/.test(text);
    }
    
    // Generate both URL variants (normalized and entity-encoded)
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
        console.log(`🎯 Generating URL variants for: "${frenchName}"`);
        
        const normalizedSlug = toSlugNormalized(frenchName);
        const entitySlug = toSlugEntity(frenchName);
        
        const normalizedUrl = `https://www.dofuspourlesnoobs.com/${normalizedSlug}.html`;
        const entityUrl = `https://www.dofuspourlesnoobs.com/${entitySlug}.html`;
        
        // Smart priority logic:
        // Website uses BOTH normalized and entity-encoded URLs
        // URL validation will check both and use whichever works
        // Priority based on historical data:
        // - Quests with accents: entity-encoded works slightly better
        // - Quests without accents: normalized works better
        
        const questHasAccents = hasAccents(frenchName);
        
        if (questHasAccents) {
            console.log(`✨ Quest has accents - trying entity-encoded first`);
            console.log(`📋 Primary URL (entity): ${entityUrl}`);
            console.log(`📋 Fallback URL (normalized): ${normalizedUrl}`);
            return {
                primary: entityUrl,
                fallback: normalizedUrl,
                frenchName: frenchName
            };
        } else {
            console.log(`📋 Primary URL (normalized): ${normalizedUrl}`);
            console.log(`📋 Fallback URL (entity): ${entityUrl}`);
            return {
                primary: normalizedUrl,
                fallback: entityUrl,
                frenchName: frenchName
            };
        }
    }

    // Create button with fallback URL support
    function createButtonWithFallback(urlVariants) {
        console.log(`🚀 createButtonWithFallback called for: "${urlVariants.frenchName}"`);
        console.log(`📌 Primary URL: ${urlVariants.primary}`);
        console.log(`🔄 Fallback URL: ${urlVariants.fallback}`);
        
        // Prevent multiple button creation attempts
        if (isCreatingButton) {
            console.log("⏸️ Button creation already in progress, skipping");
            return;
        }
        
        // Check current popup visibility state before creating button
        browserAPI.storage.sync.get(['popupVisible'], function(result) {
            const isVisible = result.popupVisible === true;
            
            if (!isVisible) {
                console.log("❌ Extension disabled, not creating button");
                console.log("🔓 Button creation lock released (disabled)");
                isCreatingButton = false;
                return;
            }
            
            isCreatingButton = true;
            console.log("🔒 Button creation lock engaged");
            
            const existingBtn = document.getElementById("dofus-quest-linker-btn");
            if (existingBtn) existingBtn.remove();
            
            // Create container with correct original styling
            const container = document.createElement("div");
            container.id = "dpln-button-main";
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #2c1810 0%, #4a2c1a 50%, #6b3e20 100%);
                border: 2px solid #d4af37;
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.2);
                cursor: pointer;
                font-family: 'Trebuchet MS', Arial, sans-serif;
                transition: all 0.3s ease;
                max-width: 240px;
            `;
            
            // Create logo and text container
            const content = document.createElement("div");
            content.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;
                
            // Add logo
            const logo = document.createElement("img");
            logo.src = browserAPI.runtime.getURL("dofusquestimg.png");
            logo.alt = "DofusPourLesNoobs";
            logo.style.cssText = `
                width: 52px;
                height: 52px;
                border-radius: 4px;
            `;
                
            // Add text
            const text = document.createElement("div");
            
            // Create title element
            const title = document.createElement("div");
            title.style.cssText = "color: #d4af37; font-size: 11px; font-weight: bold; margin-bottom: 2px;";
            title.textContent = "DOFUS POUR LES NOOBS";
            
            // Create subtitle element
            const subtitle = document.createElement("div");
            subtitle.style.cssText = "color: #ffffff; font-size: 12px; opacity: 0.9;";
            subtitle.textContent = 'Open Guide';
                
            // Append elements
            text.appendChild(title);
            text.appendChild(subtitle);
            
            content.appendChild(logo);
            content.appendChild(text);
            container.appendChild(content);
            
            // Hover effects
            container.onmouseover = () => {
                container.style.transform = 'translateY(-2px)';
                container.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.4)';
                container.style.borderColor = '#ffd700';
            };
                
            container.onmouseout = () => {
                container.style.transform = 'translateY(0)';
                container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.2)';
                container.style.borderColor = '#d4af37';
            };
                
            // Add click handler
            container.onclick = () => {
                console.log(`🔗 Opening URL: ${urlVariants.primary}`);
                window.open(urlVariants.primary, "_blank");
            };
            
            // Add to page
            document.body.appendChild(container);
            console.log("✅ Button created with validated URL");
            console.log("🔓 Button creation lock released");
            isCreatingButton = false;
        });
    }

    function createFallbackButton() {
        // Enhanced approach: Try API first, then generate direct URLs for missing content
        console.log(`🔍 Validating fallback content: ${englishName}`);
        
        const contentTypes = ['quests', 'monsters', 'dungeons', 'items', 'achievements', 'equipments', 'spells', 'subareas', 'areas'];
        
        let foundFrenchName = null;
        let completedChecks = 0;
        
        contentTypes.forEach(contentType => {
            const apiUrl = `https://api.dofusdb.fr/${contentType}?name=${encodeURIComponent(englishName)}&language=fr`;
            
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    completedChecks++;
                    console.log(`🔍 Fallback API check for ${contentType}:`, data);
                    
                    if (data.data && data.data.length > 0 && data.data[0].name && data.data[0].name.fr) {
                        foundFrenchName = data.data[0].name.fr;
                        console.log(`✅ Found French name in ${contentType}: ${foundFrenchName}`);
                        
                        // Create button with the actual French name
                        const urlVariants = generateUrlVariants(foundFrenchName);
                        console.log(`🎯 Validated fallback URLs`);
                        createButtonWithFallback(urlVariants);
                        return;
                    }
                    
                    // If this was the last content type to check and nothing was found
                    if (completedChecks === contentTypes.length && !foundFrenchName) {
                        console.log(`🚫 No French version found in API for: ${englishName}`);
                        console.log(`💡 Skipping button creation - no valid URL available`);
                    }
                })
                .catch(error => {
                    completedChecks++;
                    console.log(`❌ Error checking ${contentType}:`, error);
                    if (completedChecks === contentTypes.length && !foundFrenchName) {
                        console.log(`🚫 No French version found for: ${englishName}`);
                    }
                });
        });
    }
    
})();
