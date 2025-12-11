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
                const [quests, items, monsters, subareas, areas, dungeons] = await Promise.allSettled([
                    fetch("https://api.dofusdb.fr/quests?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/items?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/monsters?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/subareas?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/areas?name.en=" + encodedName),
                    fetch("https://api.dofusdb.fr/dungeons?name.en=" + encodedName)
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
