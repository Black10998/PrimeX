# Amarco v3.0.0 - Ultra-Premium IPTV System

## 🎨 Vision: Modern, Rich, Information-Dense

System v3 is a complete transformation into an **ultra-premium, contemporary TV experience** with:
- **Rich UI/UX** - Information-dense, modern, elegant
- **PrimeX Branding** - Red (#E50914) + Gold (#FFB800) color scheme
- **Full Arabic Support** - Bilingual (AR/EN) with language switcher
- **Dynamic Content** - Live data from PrimeX server
- **Real User Data** - Account screen with subscription details
- **Production-Grade Settings** - Complete preferences and options

## ✅ Phase 1: Foundation (COMPLETE)

### Version & Localization
- ✅ Updated to v3.0.0 (versionCode 3)
- ✅ Full Arabic translations (values-ar/strings.xml)
- ✅ English translations updated
- ✅ RTL layout support ready
- ✅ Bilingual string resources

### Premium Color System
- ✅ PrimeX Red primary (#E50914)
- ✅ Premium Gold accent (#FFB800)
- ✅ Rich dark backgrounds (5 layers)
- ✅ Professional text hierarchy
- ✅ Modern status colors
- ✅ Gradient system
- ✅ Enhanced focus states (4dp gold border)

## 🚧 Phase 2: Account Screen (IN PROGRESS)

### Features Required
- **User Profile Section**
  - Username display
  - Email address
  - Profile avatar/icon
  - Member since date

- **Subscription Details**
  - Plan name (Premium, Basic, etc.)
  - Status badge (Active/Expired)
  - Expiry date with countdown
  - Max devices allowed
  - Current device count

- **Visual Design**
  - Premium card layout
  - Gold accents for active status
  - Red indicators for expiration
  - Rich typography
  - Elegant spacing

### Implementation
```kotlin
// AccountActivity.kt
class AccountActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAccountBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        loadUserData()
    }
    
    private fun loadUserData() {
        val token = PreferenceManager.getAuthToken(this)
        // Fetch from PrimeX API
        lifecycleScope.launch {
            val response = ApiClient.apiService.getUserProfile("Bearer $token")
            displayUserData(response.body())
        }
    }
}
```

### API Endpoint Needed
```
GET /api/v1/user/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "username": "user@example.com",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "subscription": {
      "plan_name": "Premium",
      "status": "active",
      "expires_at": "2025-12-31T23:59:59Z",
      "max_devices": 3,
      "active_devices": 1
    }
  }
}
```

## 🚧 Phase 3: Settings Screen (IN PROGRESS)

### Categories

**1. General Settings**
- Language (Arabic/English switcher)
- Video quality (Auto/High/Medium/Low)
- Autoplay next episode
- Subtitles preferences

**2. Account Settings**
- Change password
- Manage devices
- Subscription details
- Payment history

**3. Playback Settings**
- Default quality
- Data saver mode
- Skip intro/outro
- Playback speed

**4. App Settings**
- Notifications
- Clear cache
- Download location
- App version

**5. About & Support**
- Terms & Conditions
- Privacy Policy
- Contact Support
- App version info

### Visual Design
- Modern list with icons
- Toggle switches for boolean options
- Dropdown selectors for choices
- Action buttons for operations
- Premium styling throughout

## 🚧 Phase 4: Enhanced Main UI (IN PROGRESS)

### Rich Content Cards

**Channel Cards** (313x176dp):
- Channel logo (large, prominent)
- Channel name (bold, 18sp)
- Category badge
- Live indicator (red dot)
- Now playing info
- Viewer count (optional)

**Movie Cards** (200x300dp):
- High-quality poster
- Title (bold, 16sp)
- Year + Rating (★ 8.5)
- Duration badge
- Quality badge (4K/HD)
- Genre tags
- Gradient overlay for text

**Series Cards** (200x300dp):
- Series poster
- Title (bold, 16sp)
- Season count
- Episode count
- Rating
- New episodes badge
- Continue watching progress

### Information Density
- Multiple metadata points per card
- Rich visual hierarchy
- Color-coded badges
- Status indicators
- Progress bars where applicable

## 🚧 Phase 5: Language Switcher (IN PROGRESS)

### Implementation
```kotlin
// LanguageManager.kt
object LanguageManager {
    fun setLanguage(context: Context, languageCode: String) {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)
        
        val config = Configuration()
        config.setLocale(locale)
        
        context.resources.updateConfiguration(config, 
            context.resources.displayMetrics)
        
        // Save preference
        PreferenceManager.saveLanguage(context, languageCode)
        
        // Restart activity
        (context as? Activity)?.recreate()
    }
    
    fun getCurrentLanguage(context: Context): String {
        return PreferenceManager.getLanguage(context) ?: "en"
    }
}
```

### UI Component
- Settings menu item
- Dialog with language options
- Arabic (العربية) / English
- Immediate UI update
- Persistent preference

## 🚧 Phase 6: Dynamic Content Loading (IN PROGRESS)

### API Endpoints

**Channels**:
```
GET /api/v1/channels
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": 1,
        "name": "Channel Name",
        "logo_url": "https://...",
        "category": "Sports",
        "stream_url": "https://...",
        "is_live": true,
        "viewers": 1234
      }
    ]
  }
}
```

**Movies**:
```
GET /api/v1/vod/movies
Authorization: Bearer {token}
Query: ?page=1&limit=50&category=action

Response:
{
  "success": true,
  "data": {
    "movies": [
      {
        "id": 1,
        "title": "Movie Title",
        "poster_url": "https://...",
        "backdrop_url": "https://...",
        "year": 2024,
        "rating": 8.5,
        "duration": 120,
        "genre": "Action",
        "quality": "4K",
        "stream_url": "https://..."
      }
    ],
    "pagination": {
      "page": 1,
      "total_pages": 10,
      "total_items": 500
    }
  }
}
```

**Series**:
```
GET /api/v1/vod/series
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "series": [
      {
        "id": 1,
        "title": "Series Title",
        "poster_url": "https://...",
        "year": 2024,
        "rating": 9.0,
        "seasons_count": 3,
        "episodes_count": 30,
        "genre": "Drama"
      }
    ]
  }
}
```

## 🎨 Premium Design System

### Typography Scale
- **Hero**: 42sp, Bold (Login title)
- **H1**: 32sp, Bold (Screen titles)
- **H2**: 24sp, Bold (Section headers)
- **H3**: 20sp, Bold (Card titles)
- **Body Large**: 18sp, Regular (Primary text)
- **Body**: 16sp, Regular (Secondary text)
- **Caption**: 14sp, Regular (Metadata)
- **Small**: 12sp, Regular (Labels)

### Spacing System
- **XXS**: 4dp (Tight spacing)
- **XS**: 8dp (Card margins)
- **S**: 12dp (Element padding)
- **M**: 16dp (Section spacing)
- **L**: 24dp (Large gaps)
- **XL**: 32dp (Screen margins)
- **XXL**: 48dp (Hero spacing)

### Elevation System
- **Level 0**: 0dp (Flat)
- **Level 1**: 2dp (Cards)
- **Level 2**: 4dp (Raised cards)
- **Level 3**: 8dp (Dialogs)
- **Level 4**: 16dp (Modals)

### Border Radius
- **Small**: 8dp (Buttons)
- **Medium**: 12dp (Cards)
- **Large**: 16dp (Dialogs)
- **XLarge**: 24dp (Hero elements)

## 🎯 Implementation Roadmap

### Week 1: Core Features
- [x] Version 3.0.0 setup
- [x] Arabic language support
- [x] Premium color system
- [ ] Account screen with real data
- [ ] Language switcher
- [ ] Enhanced card designs

### Week 2: Content & Settings
- [ ] Dynamic content loading
- [ ] Full Settings screen
- [ ] User profile API integration
- [ ] Content pagination
- [ ] Search functionality

### Week 3: Polish & Testing
- [ ] Animations and transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Performance optimization
- [ ] Arabic RTL testing
- [ ] Full QA testing

## 📊 Success Metrics

### Visual Quality
- ✅ Premium color palette
- ✅ Rich dark theme
- ⏳ Information-dense cards
- ⏳ Professional typography
- ⏳ Smooth animations

### Functionality
- ✅ Bilingual support
- ⏳ Real user data
- ⏳ Dynamic content
- ⏳ Complete settings
- ⏳ Language switcher

### User Experience
- ✅ Modern aesthetics
- ⏳ Intuitive navigation
- ⏳ Fast performance
- ⏳ Responsive UI
- ⏳ Production-grade polish

## 🚀 Next Steps

1. **Create AccountActivity**
   - Layout with user info
   - Subscription details
   - API integration

2. **Build SettingsActivity**
   - All setting categories
   - Language switcher
   - Preference management

3. **Enhance Card Presenters**
   - Rich metadata display
   - Quality badges
   - Status indicators

4. **Implement Language Switcher**
   - Dialog UI
   - Locale management
   - Persistent storage

5. **Dynamic Content Loading**
   - API integration
   - Pagination
   - Error handling

## 📝 Notes

- All strings must be in both English and Arabic
- All layouts must support RTL
- All colors must follow PrimeX branding
- All data must be fetched from live server
- All UI must be information-rich and modern

---

**Status**: Phase 1 Complete, Phase 2-6 In Progress  
**Version**: 3.0.0  
**Target**: Ultra-Premium IPTV Experience
