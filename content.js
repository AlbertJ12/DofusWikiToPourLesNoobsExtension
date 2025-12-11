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
                       !pageContent.includes("template:") &&
                       englishName.length > 2 &&
                       !englishName.includes("Fandom") &&
                       !englishName.includes("Wiki");
    
    if (!isValidPage) {
        console.log("Not a valid content page, skipping");
        return;
    }

    function toSlug(text) {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/['']/g, "")
            .replace(/[^a-z0-9\s]+/g, "")
            .replace(/\s+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function createButton(dplnUrl, isDirectLink = false) {
        // Remove existing button if any
        const existingBtn = document.getElementById("dofus-quest-linker-btn");
        if (existingBtn) existingBtn.remove();
        
        // Create a styled container with logo
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
        
        container.onclick = () => window.open(dplnUrl, "_blank");
        
        document.body.appendChild(container);
        console.log("Styled button created for URL:", dplnUrl);
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
    
    function createFallbackButton() {
        // Create direct URL from English name as fallback
        const slug = toSlug(englishName);
        const dplnUrl = "https://www.dofuspourlesnoobs.com/" + slug + ".html";
        createButton(dplnUrl, true);
    }
})();
