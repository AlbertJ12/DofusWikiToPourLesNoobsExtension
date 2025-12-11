# Dofus Content Linker

A browser extension that adds a button to any Dofus Wiki page, allowing you to quickly open the corresponding DofusPourLesNoobs page with French names for quests, items, monsters, areas, and dungeons.

## Features

- **Universal Detection**: Detects any content page on dofuswiki.fandom.com (quests, items, monsters, areas, subareas, dungeons)
- **Multi-API Integration**: Queries multiple DofusDB endpoints to find French names for accurate linking
- **Professional UI**: Styled button with DofusPourLesNoobs branding, logo, and hover effects
- **Smart Fallback**: If API fails, creates direct links using English names
- **Visual Feedback**: Different button text indicates API-based vs direct links
- **Modern Compatibility**: Built with Manifest V3 for current browsers

## Installation

### Chrome/Edge (Developer Mode)

1. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension should now appear in your extensions list

### Firefox

**Quick Install (Temporary):**
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this folder
5. The extension will be loaded temporarily (until Firefox restart)

**For permanent installation and detailed Firefox setup, see [FIREFOX_INSTALL.md](FIREFOX_INSTALL.md)**

## Usage

1. Visit any quest page on [dofuswiki.fandom.com](https://dofuswiki.fandom.com)
2. Look for the orange button in the top-right corner of the page
3. Click the button to open the corresponding guide on DofusPourLesNoobs with French quest names
4. The button color indicates the link type:
   - **Orange (#ff6a00)**: API-based link using French quest name
   - **Light Orange (#ff9500)**: Direct link using English quest name

## How It Works

1. **Page Detection**: The extension detects quest pages by checking for quest-related content
2. **API Lookup**: Queries the DofusDB API to find the French name of the quest
3. **URL Generation**: Creates a slug from the French name and builds the DofusPourLesNoobs URL
4. **Fallback**: If the API fails, uses the English name to create a direct link

## Files

- `manifest.json`: Extension configuration (Manifest V3)
- `content.js`: Main script that runs on Dofus Wiki pages
- `background.js`: Service worker for API calls
- `popup.html`: Extension popup interface
- `icon.png`: Extension icon

## Troubleshooting

### Button Not Appearing
- Check if you're on a quest page (URL contains quest-related terms)
- Open browser console (F12) and look for error messages
- Ensure the extension is enabled in your browser

### Links Not Working
- The extension tries to match quest names between Dofus Wiki and DofusPourLesNoobs
- Some quests may not have exact matches due to naming differences
- Direct links (light orange button) are best-effort attempts

### API Issues
- If the DofusDB API is down, the extension will use fallback direct links
- Check browser console for API error messages

## Development

The extension is built with:
- **Manifest V3** for modern browser compatibility
- **Vanilla JavaScript** for lightweight performance
- **DofusDB API** for content name translation
- **Error handling** and fallback mechanisms

## API Usage Documentation

### Overview
The extension queries the DofusDB API to translate English content names from Dofus Wiki into French names, which are then used to construct accurate DofusPourLesNoobs URLs.

### API Endpoints Used
The extension simultaneously queries 6 different content type endpoints:

1. **Quests**: `https://api.dofusdb.fr/quests?name.en={encoded_name}`
2. **Items**: `https://api.dofusdb.fr/items?name.en={encoded_name}`
3. **Monsters**: `https://api.dofusdb.fr/monsters?name.en={encoded_name}`
4. **Subareas**: `https://api.dofusdb.fr/subareas?name.en={encoded_name}`
5. **Areas**: `https://api.dofusdb.fr/areas?name.en={encoded_name}`
6. **Dungeons**: `https://api.dofusdb.fr/dungeons?name.en={encoded_name}`

### Query Parameters
- **`name.en={encoded_name}`**: Searches for exact English name matches
- **`{encoded_name}`**: URL-encoded version of the content name (e.g., "Royal Gobball's Court" becomes "Royal%20Gobball%27s%20Court")

### Response Format
Each endpoint returns JSON in this format:
```json
{
  "total": 1,
  "limit": 10,
  "skip": 0,
  "data": [
    {
      "_id": "674e523e64788cc7414160c8",
      "id": 1,
      "name": {
        "de": "Hof des Königlichen Fresssacks",
        "en": "Royal Gobball's Court",
        "es": "Corte del Jalató Real",
        "fr": "Cour du Bouftou Royal",
        "pt": "Pátio do Papatudo Real"
      },
      // ... additional fields specific to content type
    }
  ]
}
```

### Implementation Details

#### Background Script (`background.js`)
```javascript
// Parallel API queries using Promise.allSettled
const [quests, items, monsters, subareas, areas, dungeons] = await Promise.allSettled([
    fetch("https://api.dofusdb.fr/quests?name.en=" + encodedName),
    fetch("https://api.dofusdb.fr/items?name.en=" + encodedName),
    fetch("https://api.dofusdb.fr/monsters?name.en=" + encodedName),
    fetch("https://api.dofusdb.fr/subareas?name.en=" + encodedName),
    fetch("https://api.dofusdb.fr/areas?name.en=" + encodedName),
    fetch("https://api.dofusdb.fr/dungeons?name.en=" + encodedName)
]);
```

#### Content Script (`content.js`)
```javascript
// Priority order for content type matching
if (resp.data.quests && resp.data.quests.data.length > 0) {
    frenchName = resp.data.quests.data[0].name.fr;
} else if (resp.data.items && resp.data.items.data.length > 0) {
    frenchName = resp.data.items.data[0].name.fr;
} else if (resp.data.monsters && resp.data.monsters.data.length > 0) {
    frenchName = resp.data.monsters.data[0].name.fr;
} else if (resp.data.subareas && resp.data.subareas.data.length > 0) {
    frenchName = resp.data.subareas.data[0].name.fr;
} else if (resp.data.areas && resp.data.areas.data.length > 0) {
    frenchName = resp.data.areas.data[0].name.fr;
} else if (resp.data.dungeons && resp.data.dungeons.data.length > 0) {
    frenchName = resp.data.dungeons.data[0].name.fr;
}
```

### URL Generation Process
1. **Extract English Name**: From Dofus Wiki page title
2. **Query API**: All 6 endpoints in parallel
3. **Find French Name**: First successful match in priority order
4. **Create Slug**: Convert French name to URL-friendly format
5. **Construct URL**: `https://www.dofuspourlesnoobs.com/{french-slug}.html`

### Slug Generation Algorithm
```javascript
function toSlug(text) {
    return text
        .toLowerCase()
        .normalize("NFD")                    // Remove accents
        .replace(/[\u0300-\u036f]/g, "")     // Remove diacritics
        .replace(/['']/g, "")                // Remove apostrophes
        .replace(/[^a-z0-9\s]+/g, "")        // Remove special chars
        .replace(/\s+/g, "-")                // Spaces to hyphens
        .replace(/^-+|-+$/g, "");            // Remove leading/trailing hyphens
}
```

### Example Translations
| English Name | French Name | Generated Slug |
|--------------|-------------|----------------|
| "The Longest Day" | "Le jour le plus long" | `le-jour-le-plus-long` |
| "Royal Gobball's Court" | "Cour du Bouftou Royal" | `cour-du-bouftou-royal` |
| "War's Wounds" | "Blessures de Guerre" | `blessures-de-guerre` |

### Error Handling
- **Network Failures**: Graceful fallback to direct English name URLs
- **No Results**: Falls back to English name slug generation
- **API Changes**: Robust error logging for debugging
- **Cross-browser**: Compatible with both Chrome and Firefox APIs

### Performance Considerations
- **Parallel Queries**: All 6 endpoints called simultaneously
- **Caching**: No built-in caching (could be added for future versions)
- **Timeout Handling**: Uses Promise.allSettled to avoid blocking on slow endpoints
- **Minimal Payload**: Only requests necessary fields via API filtering

### Rate Limiting
- No explicit rate limiting implemented
- DofusDB API appears to handle moderate traffic well
- Consider adding delays if issues arise in high-usage scenarios

## Extension Signing & Distribution

### Chrome Web Store Signing

#### Prerequisites
- **Google Developer Account**: $5 one-time registration fee
- **Valid Gmail account**: For developer console access
- **Extension ZIP file**: Contains all extension files

#### Steps to Sign & Publish
1. **Prepare Extension Package**:
   ```bash
   # Create ZIP with all extension files
   zip -r dofus-content-linker.zip *.js *.json *.png *.html *.md
   ```

2. **Upload to Chrome Web Store**:
   - Visit [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
   - Click "Add new item"
   - Upload your ZIP file
   - Fill in store listing details:
     - **Name**: "Dofus Content Linker"
     - **Description**: "Adds a button on any Dofus Wiki page to open the corresponding DofusPourLesNoobs page"
     - **Category**: "Productivity" or "Tools"
     - **Privacy**: Include API usage details

3. **Required Information**:
   - **Privacy Policy URL**: Required since extension uses external API
   - **Publisher Details**: Your developer information
   - **Screenshots**: At least 1 screenshot (1280x800 or 640x400)
   - **Icon**: 128x128 PNG icon

4. **Review Process**:
   - Google reviews for compliance (usually 1-3 days)
   - Must follow Chrome Web Store policies
   - No deceptive practices or malware

#### Automatic Signing
- Chrome automatically signs extensions upon approval
- Users install directly from Web Store
- No manual signing required

### Firefox Add-on Signing

#### Prerequisites
- **Mozilla Developer Account**: Free registration
- **Valid email address**: For developer notifications
- **Extension files**: Ready for submission

#### Two Methods: Self-Signed vs Mozilla-Signed

##### Method 1: Self-Signed (for Distribution)
1. **Install web-ext**:
   ```bash
   npm install --global web-ext
   ```

2. **Sign Extension**:
   ```bash
   web-ext sign --api-key YOUR_API_KEY --api-secret YOUR_SECRET
   ```

3. **Get API Credentials**:
   - Visit [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/)
   - Go to "API Credentials" tab
   - Generate new API key and secret

4. **Output**:
   - Signed `.xpi` file
   - Can be distributed directly
   - Works in Firefox without additional steps

##### Method 2: Mozilla-Signed (Recommended for Store)
1. **Submit to Firefox Add-on Store**:
   - Visit [Firefox Developer Hub](https://addons.mozilla.org/developers/)
   - Click "Submit a New Add-on"
   - Upload your extension ZIP file

2. **Store Listing Requirements**:
   - **Name**: "Dofus Content Linker"
   - **Description**: Detailed description of functionality
   - **Category**: "Productivity" or "Tools"
   - **Privacy Policy**: Required for API usage
   - **Version Notes**: Explain changes in each version
   - **Screenshots**: Multiple screenshots showing functionality
   - **Icons**: 32x32, 48x48, 64x64, 128x128 PNG icons

3. **Review Process**:
   - Automated review: Usually immediate
   - Manual review: 1-5 days for initial submission
   - Must follow Firefox Add-on Policies

#### Manifest Requirements for Firefox
```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "dofus-content-linker@example.com",
      "strict_min_version": "109.0"
    }
  }
}
```

### Edge Add-on Store

#### Automatic Import from Chrome
1. **Publish to Chrome Web Store first**
2. **Import to Edge**:
   - Visit [Microsoft Edge Add-ons Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge)
   - Click "Import from Chrome"
   - Enter your Chrome Web Store extension ID
   - Microsoft will automatically import and review

#### Direct Edge Submission
- Similar to Chrome Web Store process
- Requires Microsoft Partner Network account
- Same review process and requirements

### Common Signing Issues & Solutions

#### 1. Missing Permissions
**Problem**: Extension requests too many permissions
**Solution**: 
- Only request necessary permissions
- Document why each permission is needed
- Use `optional_permissions` where possible

#### 2. Security Violations
**Problem**: Remote code execution or unsafe practices
**Solution**:
- Avoid `eval()` and dynamic code injection
- Use Content Security Policy (CSP)
- Sanitize all external data

#### 3. API Usage Disclosure
**Problem**: Not disclosing external API usage
**Solution**:
- Include privacy policy explaining DofusDB API usage
- Document what data is sent and why
- Be transparent about data handling

#### 4. Icon/Asset Issues
**Problem**: Missing or incorrect icons
**Solution**:
- Include all required icon sizes (16, 32, 48, 96, 128px)
- Use PNG format with transparency
- Ensure icons are clear and recognizable

### Testing Before Submission

#### Chrome Testing
```bash
# Load unpacked extension
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder
```

#### Firefox Testing
```bash
# Temporary installation
1. Go to about:debugging
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select manifest.json
```

### Post-Signing Updates

#### Version Management
- Increment version number for each update
- Update version history in README
- Test thoroughly before submission
- Allow time for review process

#### Distribution URLs
- **Chrome**: `https://chrome.google.com/webstore/detail/{extension-id}`
- **Firefox**: `https://addons.mozilla.org/firefox/addon/{slug}/`
- **Edge**: `https://microsoftedge.microsoft.com/addons/detail/{extension-id}`

### Privacy Policy Template

Create a simple privacy policy page explaining:
- What data is collected (content names from wiki pages)
- How it's used (to query DofusDB API for translation)
- Where it's sent (only to api.dofusdb.fr)
- Data retention (no data stored locally)
- User rights (can disable extension anytime)

### Recommended Publishing Order
1. **Firefox** (usually fastest approval)
2. **Chrome** (largest user base)
3. **Edge** (automatic import from Chrome)

## Version History

- **v2.11**: Fixed Firefox manifest structure - removed unsupported data_collection_properties and separated Android settings
- **v2.10**: Security fix - Replaced unsafe innerHTML assignment with safe DOM manipulation methods for Firefox compliance
- **v2.9**: Fixed required array to use official Firefox 'websiteContent' key based on MDN documentation
- **v2.8**: Fixed required array to use valid Firefox 'content' key for data collection permissions
- **v2.7**: Fixed required array to include 'page_titles' item for Firefox data collection compliance
- **v2.6**: Fixed data_collection_permissions format - changed 'required' to array and added Android version support
- **v2.5**: Updated Firefox minimum version to 140.0 to support data_collection_permissions feature
- **v2.4**: Added missing 'required' property to data_collection_permissions for Firefox compliance
- **v2.3**: Updated Firefox minimum version to 112.0 to support background.type module compatibility
- **v2.2**: Fixed data_collection_permissions placement - moved inside browser_specific_settings.gecko for Firefox compliance
- **v2.1**: Added data_collection_permissions property for Firefox Add-on store compliance
- **v2.0**: Major UI redesign with DofusPourLesNoobs branding, styled button with logo and hover effects
- **v1.9**: Added dungeon support with /dungeons API endpoint integration
- **v1.8**: Expanded to support all Dofus Wiki content (quests, items, monsters, subareas, areas) with multi-API endpoint queries
- **v1.7**: Fixed API query to use proper name.en parameter for French quest name lookup
- **v1.6**: Clarified that extension uses .com domain with French quest names from API
- **v1.5**: Updated to use French DofusPourLesNoobs site (.fr domain)
- **v1.4**: Added Firefox compatibility, cross-browser API support
- **v1.3**: Updated to Manifest V3, improved error handling, added fallback system
- **v1.2**: Original ChatGPT version (Manifest V2)
