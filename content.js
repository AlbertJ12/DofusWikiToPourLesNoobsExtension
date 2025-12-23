(function () {
    // Cross-browser compatibility: use browser API if available, fallback to chrome
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    
    // Check if we're on any Dofus Wiki page
    const titleElem = document.querySelector("h1");
    if (!titleElem) return;
    
    const englishName = titleElem.innerText.trim();
    console.log("Found Dofus Wiki page:", englishName);
    
    // Check if this is a valid Dofus Wiki content page (not main page, category, etc.)
    const pageContent = document.body.innerText.toLowerCase();
    const isValidPage = !pageContent.includes("category:") && 
                       !pageContent.includes("forum:") &&
                       !pageContent.includes("user:") &&
                       !pageContent.includes("help:") &&
                       !englishName.includes("Fandom") &&
                       !englishName.includes("Wiki");

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
                // Try to find French name from any content type
                let frenchName = null;
                
                // Check quests
                if (resp.data.quests && resp.data.quests.data && resp.data.quests.data.length > 0) {
                    frenchName = resp.data.quests.data[0].name && resp.data.quests.data[0].name.fr;
                }
                // Check items
                else if (resp.data.items && resp.data.items.data && resp.data.items.data.length > 0) {
                    frenchName = resp.data.items.data[0].name && resp.data.items.data[0].name.fr;
                }
                // Check monsters
                else if (resp.data.monsters && resp.data.monsters.data && resp.data.monsters.data.length > 0) {
                    frenchName = resp.data.monsters.data[0].name && resp.data.monsters.data[0].name.fr;
                }
                // Check subareas
                else if (resp.data.subareas && resp.data.subareas.data && resp.data.subareas.data.length > 0) {
                    frenchName = resp.data.subareas.data[0].name && resp.data.subareas.data[0].name.fr;
                }
                // Check areas
                else if (resp.data.areas && resp.data.areas.data && resp.data.areas.data.length > 0) {
                    frenchName = resp.data.areas.data[0].name && resp.data.areas.data[0].name.fr;
                }
                // Check dungeons
                else if (resp.data.dungeons && resp.data.dungeons.data && resp.data.dungeons.data.length > 0) {
                    frenchName = resp.data.dungeons.data[0].name && resp.data.dungeons.data[0].name.fr;
                }
                
                if (frenchName) {
                    const slug = toSlug(frenchName);
                    const dplnUrl = "https://www.dofuspourlesnoobs.com/" + slug + ".html";
                    createButton(dplnUrl, false);
                    return;
                }
            }
            
            console.log("API failed or no French name found in any content type, using fallback");
            createFallbackButton();
        });
    }

    function toSlug(text, useEntities = true) {
        let result = text;
        
        if (useEntities) {
            // Use HTML entity encoding for accents
            result = result
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
                .replace(/Ç|ç/g, "ccedil")
                .replace(/Œ|œ/g, "oe");
        } else {
            // Remove accents completely (normalize approach)
            result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        
        return result
            .toLowerCase()
            .replace(/['']/g, "")                     // Remove apostrophes completely (not replace with space)
            .replace(/[^a-z0-9\s-]+/g, "")            // Keep hyphens, remove other special chars
            .replace(/\s+/g, "-")                     // Spaces to hyphens
            .replace(/-+/g, "-")                      // Multiple hyphens to single
            .replace(/^-+|-+$/g, "");                 // Remove leading/trailing hyphens
    }

    // Generate both URL patterns for fallback testing
    function generateUrlPatterns(frenchName) {
        const entitySlug = toSlug(frenchName, true);
        const normalizedSlug = toSlug(frenchName, false);
        
        return [
            `https://www.dofuspourlesnoobs.com/${entitySlug}.html`,
            `https://www.dofuspourlesnoobs.com/${normalizedSlug}.html`
        ];
    }

    // Comprehensive test function for accent scenarios (development only)
    function testAccentScenarios() {
        const testCases = [
            // Common French accents in Dofus content
            { input: "Épreuve du Zobal", expected: "epreuve-du-zobal" },
            { input: "Crâne du Craqueleur", expected: "crane-du-craqueleur" },
            { input: "Forêt de la Mist", expected: "foret-de-la-mist" },
            { input: "Maître Pandawa", expected: "maitre-pandawa" },
            { input: "Princesse Radegonde", expected: "princesse-radegonde" },
            { input: "Épée du Roi", expected: "epee-du-roi" },
            { input: "Fée des Bois", expected: "fee-des-bois" },
            { input: "Montagne des Craqueleurs", expected: "montagne-des-craqueleurs" },
            
            // Multiple accents
            { input: "L'Épreuve des Bworks", expected: "lepreuve-des-bworks" },
            { input: "Crâne et Épée", expected: "crane-et-epee" },
            { input: "Forêt enchantée", expected: "foret-enchantee" },
            { input: "Maîtrise des Éléments", expected: "maitrise-des-elements" },
            
            // Complex apostrophe + accent combinations
            { input: "L'Œil de Forfut", expected: "loeil-de-forfut" },
            { input: "L'Épée de la vérité", expected: "leepee-de-la-verite" },
            { input: "D'Émeraude", expected: "demeraude" },
            
            // Edge cases
            { input: "  É  è  ê  ë  à  â  ä  î  ï  ô  ö  ù  û  ü  ç  ", expected: "e-e-e-e-a-a-a-i-i-o-o-u-u-u-c" },
            { input: "---Épreuve---", expected: "epreuve" },
            { input: "Accents!@#$%^&*()Test", expected: "accentstest" }
        ];
        
        console.log("=== Testing Accent Scenarios ===");
        testCases.forEach((testCase, index) => {
            const result = toSlug(testCase.input);
            const passed = result === testCase.expected;
            console.log(`${index + 1}. ${testCase.input}`);
            console.log(`   Expected: ${testCase.expected}`);
            console.log(`   Got:      ${result}`);
            console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
            console.log('');
        });
    }

    function createButton(dplnUrl, isDirectLink = false) {
        // Check current popup visibility state before creating button
        browserAPI.storage.sync.get(['popupVisible'], function(result) {
            const isVisible = result.popupVisible === true;
            
            if (!isVisible) {
                console.log("Extension disabled, not creating button");
                return;
            }
            
            const existingBtn = document.getElementById("dofus-quest-linker-btn");
            if (existingBtn) existingBtn.remove();
            
            // Create container with correct original styling
            const container = document.createElement("div");
            container.id = "dofus-quest-linker-btn";
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
        subtitle.textContent = isDirectLink ? 'Try Direct Link' : 'Open Guide';
            
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
            container.onclick = () => window.open(dplnUrl, "_blank");
            
            // Add to page
            document.body.appendChild(container);
            console.log("Styled button created for URL:", dplnUrl);
        });
    }

    // Try API with multiple content types, then fallback to direct URL generation
    browserAPI.runtime.sendMessage({ type: "fetchAllContent", name: englishName }, (resp) => {
        if (browserAPI.runtime.lastError) {
            console.error("Runtime error:", browserAPI.runtime.lastError);
            // Fallback to direct URL generation
            createFallbackButton();
            return;
        }
        
        if (resp && resp.success && resp.data) {
            // Try to find French name from any content type
            let frenchName = null;
            
            // Check quests
            if (resp.data.quests && resp.data.quests.data && resp.data.quests.data.length > 0) {
                frenchName = resp.data.quests.data[0].name && resp.data.quests.data[0].name.fr;
            }
            // Check items
            else if (resp.data.items && resp.data.items.data && resp.data.items.data.length > 0) {
                frenchName = resp.data.items.data[0].name && resp.data.items.data[0].name.fr;
            }
            // Check monsters
            else if (resp.data.monsters && resp.data.monsters.data && resp.data.monsters.data.length > 0) {
                frenchName = resp.data.monsters.data[0].name && resp.data.monsters.data[0].name.fr;
            }
            // Check subareas
            else if (resp.data.subareas && resp.data.subareas.data && resp.data.subareas.data.length > 0) {
                frenchName = resp.data.subareas.data[0].name && resp.data.subareas.data[0].name.fr;
            }
            // Check areas
            else if (resp.data.areas && resp.data.areas.data && resp.data.areas.data.length > 0) {
                frenchName = resp.data.areas.data[0].name && resp.data.areas.data[0].name.fr;
            }
            // Check dungeons
            else if (resp.data.dungeons && resp.data.dungeons.data && resp.data.dungeons.data.length > 0) {
                frenchName = resp.data.dungeons.data[0].name && resp.data.dungeons.data[0].name.fr;
            }
            // Check achievements
            else if (resp.data.achievements && resp.data.achievements.data && resp.data.achievements.data.length > 0) {
                frenchName = resp.data.achievements.data[0].name && resp.data.achievements.data[0].name.fr;
            }
            // Check equipments
            else if (resp.data.equipments && resp.data.equipments.data && resp.data.equipments.data.length > 0) {
                frenchName = resp.data.equipments.data[0].name && resp.data.equipments.data[0].name.fr;
            }
            // Check spells
            else if (resp.data.spells && resp.data.spells.data && resp.data.spells.data.length > 0) {
                frenchName = resp.data.spells.data[0].name && resp.data.spells.data[0].name.fr;
            }
            
            if (frenchName) {
                // Try both URL patterns to handle inconsistent dofuspourlesnoobs.com URLs
                const [entityUrl, normalizedUrl] = generateUrlPatterns(frenchName);
                
                // Default to entity-based URL (works for most cases like "Return of the Jetty")
                createButton(entityUrl, false);
                console.log(`Generated URLs for "${frenchName}":`);
                console.log(`  Entity: ${entityUrl}`);
                console.log(`  Normalized: ${normalizedUrl}`);
                return;
            }
        }
        
        console.log("API failed or no French name found in any content type, using fallback");
        createFallbackButton();
    });
    
    function createFallbackButton() {
        // Create direct URL from English name as fallback
        const [entityUrl, normalizedUrl] = generateUrlPatterns(englishName);
        
        // Default to entity-based URL for fallback too
        createButton(entityUrl, true);
        console.log(`Fallback URLs for "${englishName}":`);
        console.log(`  Entity: ${entityUrl}`);
        console.log(`  Normalized: ${normalizedUrl}`);
    }
    
    // Manual accent testing and fixing
    console.log("=== Manual Accent Testing ===");
    
    const testCases = [
        "Épreuve du Zobal",
        "Crâne du Craqueleur", 
        "Forêt de la Mist",
        "Maître Pandawa",
        "Princesse Radegonde",
        "Épée du Roi",
        "Fée des Bois",
        "Montagne des Craqueleurs",
        "L'Épreuve des Bworks",
        "Crâne et Épée",
        "Forêt enchantée",
        "Maîtrise des Éléments",
        "L'Œil de Forfut",
        "L'Épée de la vérité",
        "D'Émeraude"
    ];
    
    testCases.forEach((testCase, index) => {
        const result = toSlug(testCase);
        console.log(`${index + 1}. "${testCase}" → "${result}"`);
    });
    
    // Main execution
    checkPopupVisible();
})();
