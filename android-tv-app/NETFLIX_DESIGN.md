# Amarco TV - Netflix-Style Design Implementation

## Design Philosophy

**Netflix-like structure with Apple-level refinement**

- Horizontal navigation at top (NOT sidebar)
- Content-focused layout
- Dark theme only
- No yellow/gold colors
- Clean, minimal, premium
- Smooth focus and motion

## Navigation Structure

### Top Horizontal Bar (80dp height)
```
[AMARCO]    Home    Live TV    Movies    Series    [spacer]    Settings
```

**Layout:**
- Brand logo: Left side, 24sp light font
- Navigation items: Horizontal row, 16sp
- Settings: Right-aligned
- Background: Pure black (#0A0A0A)
- Padding: 48dp horizontal

**States:**
- Selected: White (#FFFFFF)
- Unselected: 50% opacity (#80FFFFFF)
- Focus: Smooth transition

## Content Area

### Structure
- RecyclerView with vertical scrolling
- Each row contains horizontal content
- Netflix-style row layout
- No heavy panels or blocks
- Content first, UI chrome minimal

### Rows (To be implemented)
1. Continue Watching
2. Trending Now
3. Live TV Categories
4. Movie Categories
5. Series Categories

## Color Palette

### NO YELLOW/GOLD ANYWHERE
All previous gold colors replaced:
- `amarco_gold` → `#FFFFFF` (white)
- `amarco_gold_light` → `#FFFFFF` (white)
- `amarco_gold_dark` → `#B0B0B0` (gray)
- `amarco_accent` → `#FFFFFF` (white)
- `amarco_focus_border` → `#FFFFFF` (white)

### Dark Theme
- Background: `#0A0A0A` (pure black)
- Dark gray: `#1A1A1A`
- Medium gray: `#2A2A2A`
- Light gray: `#3A3A3A`

### Text
- Primary: `#FFFFFF` (white)
- Secondary: `#B0B0B0` (gray)
- Tertiary: `#808080` (darker gray)
- Disabled: `#505050` (very dark gray)

## Typography

### Navigation
- Brand: 24sp, sans-serif-light, 0.1 letter spacing
- Nav items: 16sp, sans-serif

### Content (To be implemented)
- Row titles: 20sp, sans-serif-medium
- Card titles: 16sp, sans-serif
- Metadata: 14sp, sans-serif

## Focus & Motion

### Principles
- Smooth transitions (200-300ms)
- Subtle scale effects (1.0 → 1.05)
- White border on focus
- No jarring movements
- Apple-like polish

### Navigation Focus
- Text color transition: 50% → 100% opacity
- Duration: 200ms
- Easing: fast_out_slow_in

### Content Focus (To be implemented)
- Scale: 1.0 → 1.05
- Border: 2dp white
- Duration: 250ms
- Elevation: 0dp → 4dp

## Implementation Status

### ✅ Completed
- [x] Remove BrowseSupportFragment
- [x] Create HomeFragment with horizontal navigation
- [x] Implement top navigation bar
- [x] Add Settings to navigation
- [x] Remove ALL yellow/gold colors
- [x] Dark theme implementation
- [x] Navigation state management
- [x] Clean layout structure

### 🚧 In Progress
- [ ] Content row adapter
- [ ] Horizontal content scrolling
- [ ] Content loading from API
- [ ] Focus animations
- [ ] Card layouts for content

### 📋 To Do
- [ ] Continue Watching row
- [ ] Trending Now row
- [ ] Category rows
- [ ] Detail screens
- [ ] Player integration
- [ ] Settings screen redesign

## Key Differences from Previous Design

### Before (Wrong)
- ❌ Sidebar navigation (Leanback)
- ❌ Yellow/gold colors everywhere
- ❌ Stacked UI layers
- ❌ Heavy background panels
- ❌ Cluttered interface
- ❌ Content hidden

### After (Correct)
- ✅ Horizontal top navigation
- ✅ No yellow/gold anywhere
- ✅ Clean single layer
- ✅ Minimal UI chrome
- ✅ Content-focused
- ✅ Content visible

## Netflix Comparison

### What We Match
- Horizontal top navigation
- Dark theme
- Content rows
- Minimal UI
- Focus on content

### What We Don't Need
- Profiles (not required)
- Autoplay previews (optional)
- Complex recommendations (optional)

## Apple-Level Polish

### Attention to Detail
- Precise spacing (48dp, 24dp, 16dp)
- Consistent typography
- Smooth animations
- Subtle transitions
- Clean hierarchy

### Quality Standards
- No visual bugs
- Smooth performance
- Intuitive navigation
- Professional appearance
- Premium feel

## Testing Checklist

- [ ] Navigation works with D-pad
- [ ] Focus states are clear
- [ ] No yellow colors visible
- [ ] Content loads properly
- [ ] Smooth transitions
- [ ] Settings accessible
- [ ] No crashes
- [ ] Clean appearance

## Notes

This is a **complete redesign** from the ground up. The previous Leanback-based approach was fundamentally wrong for achieving Netflix-like quality. The new approach gives us full control over the UI and matches the design requirements exactly.
