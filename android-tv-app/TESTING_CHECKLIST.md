# Amarco Android TV - D-Pad Navigation Testing Checklist

## Pre-Testing Setup
- [ ] Build APK successfully
- [ ] Install on Android TV device or emulator
- [ ] Launch app and complete login

## Header Navigation
- [ ] Search icon is visible in header
- [ ] D-pad UP from sidebar reaches search icon
- [ ] Search icon highlights with gold color on focus
- [ ] Pressing SELECT/ENTER on search opens SearchActivity
- [ ] SearchActivity keyboard is accessible via D-pad
- [ ] Back button returns from search to main screen

## Sidebar Navigation (Left Menu)
- [ ] D-pad LEFT from content focuses sidebar
- [ ] Sidebar items highlight with dark gray background on focus
- [ ] Gold accent bar appears on left side of focused item
- [ ] Text color changes to gold on focus
- [ ] Smooth scale animation (1.02x) on focus
- [ ] Alpha fade animation (0.7 → 1.0) on focus
- [ ] All menu items are reachable:
  - [ ] Account
  - [ ] Settings
  - [ ] Refresh
  - [ ] Sign Out
- [ ] D-pad DOWN/UP navigates between sidebar items
- [ ] D-pad RIGHT from sidebar returns to content

## Content Rows Navigation
- [ ] D-pad RIGHT from sidebar focuses first content row
- [ ] D-pad DOWN moves to next row
- [ ] D-pad UP moves to previous row
- [ ] Row headers are visible and readable
- [ ] Content cards are properly aligned

## Card Focus Animations
- [ ] Cards scale to 1.08x on focus
- [ ] Cards lift with 8dp elevation on focus
- [ ] Animation duration is 200ms (smooth)
- [ ] fast_out_slow_in interpolator creates natural motion
- [ ] Unfocus animation returns to 1.0x scale
- [ ] Elevation returns to 0dp on unfocus
- [ ] No jank or stuttering during navigation

## Content Sections
- [ ] Continue Watching section appears (if content exists)
- [ ] Trending Now section appears (if content exists)
- [ ] My List section appears
- [ ] Live TV section header is visible
- [ ] Live TV categories are organized properly
- [ ] Movies section header is visible
- [ ] Movie categories are organized properly
- [ ] Series section header is visible
- [ ] Series categories are organized properly

## Card Interactions
- [ ] D-pad LEFT/RIGHT navigates within row
- [ ] Pressing SELECT/ENTER on channel plays content
- [ ] Pressing SELECT/ENTER on movie opens details
- [ ] Pressing SELECT/ENTER on series opens details
- [ ] Background updates when hovering over content
- [ ] Background transition is smooth (300ms delay)

## Settings Menu Items
- [ ] Account item opens AccountActivity
- [ ] Settings item opens SettingsActivity
- [ ] Refresh item reloads content
- [ ] Sign Out item logs out and returns to login
- [ ] Favorites item shows "coming soon" message
- [ ] History item shows "coming soon" message

## Settings Screen
- [ ] SettingsActivity opens successfully
- [ ] GuidedStep fragment displays properly
- [ ] All settings options are focusable:
  - [ ] Language
  - [ ] Video Quality
  - [ ] Autoplay Next Episode
  - [ ] Notifications
  - [ ] Clear Cache
  - [ ] About
  - [ ] Sign Out
- [ ] D-pad UP/DOWN navigates between options
- [ ] Pressing SELECT/ENTER activates option
- [ ] Back button returns to main screen

## Search Screen
- [ ] SearchActivity opens successfully
- [ ] Search keyboard is accessible
- [ ] D-pad navigates keyboard
- [ ] Text input works via remote
- [ ] Search results display properly
- [ ] D-pad navigates search results
- [ ] Pressing SELECT/ENTER on result plays content
- [ ] Back button returns to main screen

## Visual Design
- [ ] Dark theme throughout (no bright yellow)
- [ ] Sidebar background is dark (#0A0A0A)
- [ ] Sidebar text is white/gray (not black)
- [ ] Header background is dark with subtle gradient
- [ ] Header text is white with elegant typography
- [ ] Gold accents (#D4AF37) used sparingly
- [ ] Typography is refined and readable
- [ ] Spacing is consistent (8dp grid)
- [ ] Icons are crisp SVG vectors

## Performance
- [ ] No lag when navigating with D-pad
- [ ] Animations are smooth (60fps)
- [ ] Content loads without blocking UI
- [ ] Background images load asynchronously
- [ ] No memory leaks during navigation
- [ ] App responds quickly to remote input

## Edge Cases
- [ ] Navigation works with empty content
- [ ] Navigation works with single item in row
- [ ] Navigation works with many items in row
- [ ] Back button behavior is correct at each level
- [ ] Focus is restored when returning to screen
- [ ] No focus traps (can always navigate out)

## Accessibility
- [ ] All interactive elements are focusable
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] Content descriptions are present for icons
- [ ] Text is readable at TV viewing distance
- [ ] Color contrast meets accessibility standards

## Final Checks
- [ ] No crashes during navigation
- [ ] No ANR (Application Not Responding) errors
- [ ] All features work as expected
- [ ] UI matches premium design requirements
- [ ] App feels polished and complete

---

## Known Issues
(Document any issues found during testing)

## Notes
(Add any additional observations or recommendations)
