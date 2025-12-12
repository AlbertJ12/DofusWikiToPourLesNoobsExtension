// Cross-browser compatibility: use browser API if available, fallback to chrome
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Manifest V3 background script (works as both service worker and background script)
browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "fetchAllContent") {
        // Use async function with proper promise handling for Manifest V3
        (async () => {
            try {
                console.log("Fetching all content types for:", msg.name);
                const encodedName = encodeURIComponent(msg.name);
                
                // Try multiple content types in parallel
                const [quests, items, monsters, subareas, areas, dungeons, achievements, equipments, spells] = await Promise.allSettled([
                    fetch("https://api.dofusdb.fr/quests?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/items?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/monsters?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/subareas?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/areas?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/dungeons?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/achievements?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/equipments?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/spells?name.en=" + encodedName)
                ]);
                
                const results = {};
                
                // Process each result
                if (quests.status === 'fulfilled') {
                    const questData = await quests.value.json();
                    if (questData.data && questData.data.length > 0) {
                        results.quests = questData;
                        console.log("Found quest:", questData.data[0].name);
                    }
                }
                
                if (items.status === 'fulfilled') {
                    const itemData = await items.value.json();
                    if (itemData.data && itemData.data.length > 0) {
                        results.items = itemData;
                        console.log("Found item:", itemData.data[0].name);
                    }
                }
                
                if (monsters.status === 'fulfilled') {
                    const monsterData = await monsters.value.json();
                    if (monsterData.data && monsterData.data.length > 0) {
                        results.monsters = monsterData;
                        console.log("Found monster:", monsterData.data[0].name);
                    }
                }
                
                if (subareas.status === 'fulfilled') {
                    const subareaData = await subareas.value.json();
                    if (subareaData.data && subareaData.data.length > 0) {
                        results.subareas = subareaData;
                        console.log("Found subarea:", subareaData.data[0].name);
                    }
                }
                
                if (areas.status === 'fulfilled') {
                    const areaData = await areas.value.json();
                    if (areaData.data && areaData.data.length > 0) {
                        results.areas = areaData;
                        console.log("Found area:", areaData.data[0].name);
                    }
                }
                
                if (dungeons.status === 'fulfilled') {
                    const dungeonData = await dungeons.value.json();
                    if (dungeonData.data && dungeonData.data.length > 0) {
                        results.dungeons = dungeonData;
                        console.log("Found dungeon:", dungeonData.data[0].name);
                    }
                }
                
                if (achievements.status === 'fulfilled') {
                    const achievementData = await achievements.value.json();
                    if (achievementData.data && achievementData.data.length > 0) {
                        results.achievements = achievementData;
                        console.log("Found achievement:", achievementData.data[0].name);
                    }
                }
                
                if (equipments.status === 'fulfilled') {
                    const equipmentData = await equipments.value.json();
                    if (equipmentData.data && equipmentData.data.length > 0) {
                        results.equipments = equipmentData;
                        console.log("Found equipment:", equipmentData.data[0].name);
                    }
                }
                
                if (spells.status === 'fulfilled') {
                    const spellData = await spells.value.json();
                    if (spellData.data && spellData.data.length > 0) {
                        results.spells = spellData;
                        console.log("Found spell:", spellData.data[0].name);
                    }
                }
                
                console.log("API results:", results);
                sendResponse({ success: true, data: results });
            } catch (e) {
                console.error("Background fetch error:", e);
                sendResponse({ success: false, error: e.message });
            }
        })();
        
        return true; // keeps message channel open for async response
    }
    
    // Keep the old fetchQuest for backward compatibility
    if (msg.type === "fetchQuest") {
        (async () => {
            try {
                console.log("Fetching quest data for:", msg.name);
                const res = await fetch("https://api.dofusdb.fr/quests?name.en=" + encodeURIComponent(msg.name));
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();
                console.log("API response:", data);
                sendResponse({ success: true, data: data });
            } catch (e) {
                console.error("Background fetch error:", e);
                sendResponse({ success: false, error: e.message });
            }
        })();
        
        return true;
    }
});

// Handle extension icon clicks for popup visibility toggle with visual feedback
browserAPI.action.onClicked.addListener(async (tab) => {
    try {
        // Get current popup visibility state (default to false/disabled)
        const result = await browserAPI.storage.sync.get(['popupVisible']);
        const currentState = result.popupVisible === true; // Default to false
        
        // Toggle the state
        const newState = !currentState;
        
        // Save new state
        await browserAPI.storage.sync.set({ popupVisible: newState });
        
        console.log(`Popup ${newState ? 'visible' : 'hidden'} via icon click`);
        
        // Update icon to reflect state (visual indication)
        if (newState) {
            // Enabled state - show red "ON" badge
            try {
                await browserAPI.action.setIcon({
                    path: {
                        16: "icon.png",
                        32: "icon.png",
                        48: "icon.png",
                        96: "icon.png"
                    }
                });
                await browserAPI.action.setTitle({
                    title: "Dofus Content Linker - Enabled"
                });
                // Set red "ON" badge for enabled state
                await browserAPI.action.setBadgeText({ text: "ON" });
                await browserAPI.action.setBadgeBackgroundColor({ color: "#ff0000" });
                await browserAPI.action.setBadgeTextColor({ color: "#ffffff" });
            } catch (e) {
                console.log("Could not set enabled icon:", e);
            }
        } else {
            // Disabled state - no badge (default state)
            try {
                // Use same icon but no badge for disabled state
                await browserAPI.action.setIcon({
                    path: {
                        16: "icon.png",
                        32: "icon.png",
                        48: "icon.png",
                        96: "icon.png"
                    }
                });
                await browserAPI.action.setTitle({
                    title: "Dofus Content Linker - Disabled"
                });
                // No badge for disabled state (default)
                await browserAPI.action.setBadgeText({ text: "" });
                await browserAPI.action.setBadgeBackgroundColor({ color: "#00ff00" });
            } catch (e) {
                console.log("Could not set disabled icon:", e);
            }
        }
        
        // Notify all content scripts about the popup visibility change
        const tabs = await browserAPI.tabs.query({});
        for (const currentTab of tabs) {
            if (currentTab.url && currentTab.url.includes('dofuswiki.fandom.com')) {
                try {
                    await browserAPI.tabs.sendMessage(currentTab.id, {
                        type: 'popupVisibilityChanged',
                        visible: newState
                    });
                } catch (e) {
                    // Ignore errors for tabs without content scripts
                }
            }
        }
        
    } catch (error) {
        console.error('Error handling popup visibility toggle:', error);
    }
});

// Initialize extension state on startup
browserAPI.runtime.onStartup.addListener(async () => {
    try {
        const result = await browserAPI.storage.sync.get(['popupVisible']);
        const isVisible = result.popupVisible === true; // Default to false
        
        // Set initial icon state
        await browserAPI.action.setTitle({
            title: `Dofus Content Linker - ${isVisible ? 'Enabled' : 'Disabled'}`
        });
        
        // Set initial badge state
        if (isVisible) {
            await browserAPI.action.setBadgeText({ text: "ON" });
            await browserAPI.action.setBadgeBackgroundColor({ color: "#ff0000" });
            await browserAPI.action.setBadgeTextColor({ color: "#ffffff" });
        } else {
            await browserAPI.action.setBadgeText({ text: "" });
            await browserAPI.action.setBadgeBackgroundColor({ color: "#00ff00" });
        }
        
        console.log(`Extension initialized with popup ${isVisible ? 'visible' : 'hidden'}`);
    } catch (error) {
        console.error('Error initializing extension state:', error);
    }
});

// Also initialize on installation
browserAPI.runtime.onInstalled.addListener(async () => {
    try {
        const result = await browserAPI.storage.sync.get(['popupVisible']);
        const isVisible = result.popupVisible === true; // Default to false
        
        // Set initial icon state
        await browserAPI.action.setTitle({
            title: `Dofus Content Linker - ${isVisible ? 'Enabled' : 'Disabled'}`
        });
        
        // Set initial badge state
        if (isVisible) {
            await browserAPI.action.setBadgeText({ text: "ON" });
            await browserAPI.action.setBadgeBackgroundColor({ color: "#ff0000" });
            await browserAPI.action.setBadgeTextColor({ color: "#ffffff" });
        } else {
            await browserAPI.action.setBadgeText({ text: "" });
            await browserAPI.action.setBadgeBackgroundColor({ color: "#00ff00" });
        }
        
        console.log(`Extension installed with popup ${isVisible ? 'visible' : 'hidden'}`);
    } catch (error) {
        console.error('Error initializing extension on install:', error);
    }
});
