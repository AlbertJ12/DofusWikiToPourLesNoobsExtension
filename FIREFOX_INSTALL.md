# Firefox Installation Guide

## Method 1: Temporary Installation (Development/Testing)

1. Open Firefox and navigate to `about:debugging`
2. Click on "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to your extension folder and select `manifest.json`
5. The extension will be loaded temporarily (until Firefox is restarted)

## Method 2: Permanent Installation (Unsigned Extension)

### Prerequisites
- Firefox Developer Edition or Firefox Nightly (recommended)
- OR Firefox Release with `xpinstall.signatures.required` set to `false`

### Steps for Firefox Developer Edition/Nightly:
1. Open Firefox Developer Edition or Nightly
2. Go to `about:config`
3. Search for `xpinstall.signatures.required`
4. Set it to `false` (if not already)
5. Follow the temporary installation steps above

### Steps for Regular Firefox:
1. Open Firefox and go to `about:config`
2. Accept the warning message
3. Search for `xpinstall.signatures.required`
4. Double-click to set it to `false`
5. Follow the temporary installation steps above

**Warning**: Disabling signature requirements reduces security. Only do this for development/testing.

## Method 3: Creating a Signed Extension (Recommended for Distribution)

1. Create a ZIP file of all extension files:
   ```
   - manifest.json
   - background.js
   - content.js
   - popup.html
   - icon.png
   ```

2. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
3. Create a developer account
4. Submit your extension for review
5. Once approved, it can be installed normally

## Verification

After installation, verify the extension works:

1. Go to any Dofus Wiki quest page (e.g., https://dofuswiki.fandom.com/wiki/Otomai_Island)
2. Look for the orange "Open DofusPourLesNoobs Guide" button in the top-right corner
3. Click the button to test the functionality

## Troubleshooting Firefox-Specific Issues

### Extension Not Loading
- Check the Browser Console (Ctrl+Shift+J) for error messages
- Ensure all files are in the same directory as manifest.json
- Verify manifest.json syntax is valid

### Button Not Appearing
- Open the Web Console (F12) on the Dofus Wiki page
- Look for JavaScript errors in the console
- Check if the content script is being injected

### API Calls Failing
- Firefox may have stricter CORS policies
- Check the Network tab in Developer Tools
- Ensure the DofusDB API is accessible

### Permissions Issues
- Firefox may prompt for additional permissions
- Grant all requested permissions for full functionality
- Check `about:addons` to manage extension permissions

## Firefox-Specific Features

The extension uses cross-browser compatible code:
- Uses `browser` API when available (Firefox native)
- Falls back to `chrome` API for compatibility
- Background script works as both service worker and background script
- Proper Firefox extension ID in manifest for signing

## Development Tips

- Use Firefox Developer Edition for extension development
- Enable "Enable add-on debugging" in `about:debugging`
- Use the Browser Toolbox for debugging background scripts
- Test in both Firefox and Chrome for compatibility
