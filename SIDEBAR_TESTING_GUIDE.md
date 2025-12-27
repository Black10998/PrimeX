# Channel Sidebar - Testing Guide

## How to Activate the Sidebar

### Remote Button
**Press the MENU button on your TV remote**

The MENU button is typically:
- Labeled as "MENU" or "☰" (three horizontal lines)
- Located near the center or bottom of the remote
- Sometimes combined with other functions (long press may be needed on some remotes)

### Alternative Methods
If your remote doesn't have a MENU button, try:
1. **Three-line button** (hamburger menu icon)
2. **Options button**
3. **Settings button** (may work on some remotes)

### What Should Happen

**First Time**:
1. You'll see a toast message: "Press MENU button to open Channel Browser"
2. This hint only shows once

**When MENU is Pressed**:
1. Sidebar slides in from the left (300ms animation)
2. Shows channel list with numbers and names
3. Search field at the top
4. Focus automatically moves to search field

**When MENU is Pressed Again**:
1. Sidebar slides out to the left
2. Returns to main content

## Where is the Sidebar Available?

**Available on ALL pages**:
- ✅ Home
- ✅ Live TV
- ✅ Movies
- ✅ Series
- ✅ Categories
- ✅ Favorites
- ✅ Settings

The sidebar is available throughout the entire app (MainActivity level).

## Sidebar Features

### Channel List
- Shows all live channels
- Each item displays:
  - Channel number (001, 002, 003, etc.)
  - Channel name
- Scrollable list
- Focus states with visual feedback

### Search Field
- Real-time filtering
- Type channel name or number
- Results update instantly
- Clear search to see all channels

### Navigation
- **D-pad UP/DOWN**: Navigate channels
- **D-pad LEFT/RIGHT**: Move between search and list
- **OK/Enter**: Select and play channel
- **BACK**: Close sidebar

## Troubleshooting

### Sidebar Doesn't Appear

**Check 1: MENU Button**
- Try pressing and holding MENU button
- Try different buttons (Options, Settings)
- Check logcat for key codes:
  ```
  adb logcat | grep "MainActivity.*Key pressed"
  ```

**Check 2: Channels Loaded**
- Sidebar needs channels to display
- Check logcat:
  ```
  adb logcat | grep "SidebarHelper"
  ```
- Should see: "Loaded X channels to sidebar"

**Check 3: Fragment Created**
- Check logcat:
  ```
  adb logcat | grep "MainActivity.*sidebar"
  ```
- Should see: "Creating new sidebar fragment"
- Should see: "Animating sidebar in"

### Sidebar Appears But Empty

**Possible Causes**:
1. No channels loaded yet (wait a few seconds)
2. Login credentials missing
3. Network error loading channels

**Check Logs**:
```bash
adb logcat | grep -E "(SidebarHelper|ChannelSidebar)"
```

### MENU Button Not Working

**Alternative Test**:
Add a test button to trigger sidebar:

```kotlin
// In HomeFragment or any fragment
testButton.setOnClickListener {
    (activity as? MainActivity)?.toggleChannelSidebar()
}
```

**Check Key Code**:
```bash
adb logcat | grep "Key pressed"
```

When you press MENU, you should see:
```
Key pressed: 82 (MENU=82)
```

If you see a different number, your remote uses a different key code.

## Debug Commands

### Check if Sidebar is Loaded
```bash
adb logcat | grep "MainActivity.*sidebar"
```

### Check Channel Loading
```bash
adb logcat | grep "SidebarHelper"
```

### Check Key Presses
```bash
adb logcat | grep "MainActivity.*Key pressed"
```

### Full Debug Log
```bash
adb logcat | grep -E "(MainActivity|SidebarHelper|ChannelSidebar)"
```

## Expected Behavior

### On Home Page
1. App loads
2. Toast shows: "Press MENU button to open Channel Browser"
3. Channels load in background (check logs)
4. Press MENU → Sidebar appears with channels

### On Live TV Page
1. Navigate to Live TV
2. Channels load
3. Press MENU → Sidebar appears with channels
4. Select channel → Plays immediately

### On Any Page
1. Press MENU → Sidebar appears
2. Use D-pad to navigate
3. Type to search
4. Press OK to play
5. Press BACK or MENU to close

## Common Remote Key Codes

Different remotes may use different codes:

| Button | Common Codes |
|--------|--------------|
| MENU | 82, 229 |
| Options | 82 |
| Settings | 176 |
| Info | 165 |

If MENU doesn't work, check the log to see what code your remote sends.

## Manual Testing Checklist

- [ ] Press MENU button
- [ ] Sidebar slides in from left
- [ ] Channel list appears
- [ ] Search field is visible
- [ ] Focus is on search field
- [ ] D-pad navigates channels
- [ ] Typing filters channels
- [ ] Selecting channel plays it
- [ ] Press BACK closes sidebar
- [ ] Press MENU toggles sidebar

## Integration Status

**Currently Integrated**:
- ✅ HomeFragment (all pages)
- ✅ CategoriesFragment

**Channels Loaded From**:
- Live TV streams (Xtream API)
- Automatically numbered (001, 002, etc.)

**Playback**:
- Selecting channel opens PlayerActivity
- Plays selected stream

## Next Steps

If sidebar still doesn't appear:

1. **Share logs**:
   ```bash
   adb logcat > sidebar_debug.log
   ```
   Then press MENU and share the log

2. **Check remote compatibility**:
   - Some remotes don't have MENU button
   - May need to add alternative trigger

3. **Test with ADB**:
   ```bash
   adb shell input keyevent 82
   ```
   This simulates MENU button press

---

**Status**: Implemented with debugging  
**Version**: 1.1  
**Date**: 2024-12-27
