# PAX IPTV Upgrade Plan - Phase 2

## Current State Analysis

### ✅ What's Already Good
1. **Leanback UI Foundation**
   - Using `androidx.leanback` library (1.0.0)
   - `BrowseSupportFragment` and `VerticalGridSupportFragment` implemented
   - TV-optimized navigation in MainFragment and SettingsFragment
   - Focus handling present in key areas

2. **ExoPlayer Integration**
   - Media3 ExoPlayer (1.2.0) already integrated
   - HLS and DASH support included
   - Leanback UI components for player

3. **Code Structure**
   - Organized package structure (ui, api, models, player, utils, adapters)
   - Separation between UI and API layers exists
   - Kotlin coroutines for async operations

### ❌ What Needs Improvement

1. **Hardcoded URLs** (CRITICAL)
   - `https://prime-x.live/` hardcoded in 9+ locations
   - BuildConfig has hardcoded base URL
   - Stream URL construction scattered across fragments

2. **Player Architecture** (HIGH PRIORITY)
   - Basic ExoPlayer implementation
   - No FFmpeg support
   - Player logic mixed with UI (PlayerActivity)
   - No abstraction layer for different player backends

3. **Backend Coupling** (HIGH PRIORITY)
   - Tightly coupled to Xtream Codes API
   - No abstraction for different backend types
   - API models specific to Xtream format

4. **Architecture Issues** (MEDIUM PRIORITY)
   - Business logic in UI fragments
   - No repository pattern
   - No ViewModels for state management
   - Direct API calls from UI

5. **Multi-Architecture Support** (MEDIUM PRIORITY)
   - No NDK configuration
   - No ABI filters defined
   - No native library support

6. **Missing Features Foundation**
   - No EPG data models or UI
   - No catch-up infrastructure
   - No multi-audio/subtitle handling
   - No token-based auth abstraction

---

## Implementation Plan

### Phase 2A: Immediate Implementations (1-2 weeks)

#### 1. Remove Hardcoded URLs ⚡ IMMEDIATE
**Effort:** 2-3 days  
**Impact:** Critical for flexibility

**Tasks:**
- [ ] Create `ConfigManager` class for dynamic configuration
- [ ] Add configuration storage (SharedPreferences/DataStore)
- [ ] Create configuration UI in settings
- [ ] Replace all hardcoded URLs with `ConfigManager.getBaseUrl()`
- [ ] Add portal/server configuration screen
- [ ] Support multiple server profiles

**Files to Modify:**
```
- app/build.gradle (remove hardcoded BuildConfig)
- api/ApiClient.kt (dynamic base URL)
- ui/HomeFragment.kt (remove hardcoded stream URLs)
- ui/MoviesFragment.kt
- ui/CategoriesFragment.kt
- ui/DetailsActivity.kt
- ui/MainFragment.kt
+ config/ConfigManager.kt (NEW)
+ ui/ServerConfigActivity.kt (NEW)
```

**Implementation:**
```kotlin
// config/ConfigManager.kt
object ConfigManager {
    private const val PREFS_NAME = "pax_config"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_PORTAL_TYPE = "portal_type"
    
    enum class PortalType {
        XTREAM_CODES,
        STALKER_PORTAL,
        CUSTOM
    }
    
    fun getBaseUrl(context: Context): String
    fun setBaseUrl(context: Context, url: String)
    fun getPortalType(context: Context): PortalType
    fun buildStreamUrl(username: String, password: String, streamId: String, type: String): String
}
```

---

#### 2. Multi-Architecture Support ⚡ IMMEDIATE
**Effort:** 1 day  
**Impact:** Essential for device compatibility

**Tasks:**
- [ ] Add NDK configuration to build.gradle
- [ ] Configure ABI filters for all architectures
- [ ] Test build for each architecture

**Implementation:**
```gradle
// app/build.gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
        }
    }
    
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

---

#### 3. Improve Leanback UI ⚡ IMMEDIATE
**Effort:** 3-4 days  
**Impact:** Better TV experience

**Tasks:**
- [ ] Convert remaining fragments to proper Leanback components
- [ ] Implement consistent focus handling
- [ ] Add TV-optimized navigation
- [ ] Remove mobile UI patterns
- [ ] Add proper back navigation
- [ ] Implement search with Leanback SearchFragment

**Files to Modify:**
```
- ui/HomeFragment.kt (convert to BrowseSupportFragment)
- ui/MoviesFragment.kt (use VerticalGridSupportFragment)
- ui/SeriesFragment.kt
- ui/CategoriesFragment.kt
- ui/FavoritesFragment.kt
+ ui/SearchFragment.kt (NEW - Leanback search)
```

---

### Phase 2B: Refactoring Required (2-4 weeks)

#### 4. Backend Abstraction Layer 🔧 REFACTORING
**Effort:** 5-7 days  
**Impact:** Critical for multi-backend support

**Tasks:**
- [ ] Create `BackendProvider` interface
- [ ] Implement `XtreamCodesProvider`
- [ ] Implement `StalkerPortalProvider`
- [ ] Create `BackendFactory` for provider selection
- [ ] Abstract authentication mechanisms
- [ ] Create unified data models

**New Architecture:**
```
data/
├── backend/
│   ├── BackendProvider.kt (interface)
│   ├── BackendFactory.kt
│   ├── XtreamCodesProvider.kt
│   ├── StalkerPortalProvider.kt
│   └── CustomBackendProvider.kt
├── models/
│   ├── UnifiedChannel.kt
│   ├── UnifiedMovie.kt
│   ├── UnifiedSeries.kt
│   └── UnifiedEPG.kt
└── repository/
    ├── ContentRepository.kt
    └── AuthRepository.kt
```

**Interface Design:**
```kotlin
interface BackendProvider {
    suspend fun authenticate(credentials: Credentials): AuthResult
    suspend fun getLiveChannels(categoryId: String? = null): List<UnifiedChannel>
    suspend fun getMovies(categoryId: String? = null): List<UnifiedMovie>
    suspend fun getSeries(categoryId: String? = null): List<UnifiedSeries>
    suspend fun getEPG(channelId: String): List<EPGEntry>
    suspend fun getCatchup(channelId: String, timestamp: Long): StreamInfo
    fun buildStreamUrl(streamId: String, type: StreamType): String
}
```

---

#### 5. Repository Pattern + ViewModels 🔧 REFACTORING
**Effort:** 4-5 days  
**Impact:** Clean architecture, testability

**Tasks:**
- [ ] Create Repository layer
- [ ] Implement ViewModels for each screen
- [ ] Move business logic from fragments to ViewModels
- [ ] Implement LiveData/StateFlow for UI updates
- [ ] Add proper error handling

**New Architecture:**
```
data/
└── repository/
    ├── ContentRepository.kt
    ├── AuthRepository.kt
    ├── EPGRepository.kt
    └── ConfigRepository.kt

ui/
└── viewmodels/
    ├── HomeViewModel.kt
    ├── MoviesViewModel.kt
    ├── SeriesViewModel.kt
    ├── PlayerViewModel.kt
    └── SettingsViewModel.kt
```

**Example:**
```kotlin
class HomeViewModel(
    private val contentRepository: ContentRepository
) : ViewModel() {
    
    private val _channels = MutableStateFlow<List<UnifiedChannel>>(emptyList())
    val channels: StateFlow<List<UnifiedChannel>> = _channels.asStateFlow()
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    fun loadChannels(categoryId: String? = null) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val result = contentRepository.getLiveChannels(categoryId)
                _channels.value = result
                _uiState.value = UiState.Success
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message)
            }
        }
    }
}
```

---

#### 6. FFmpeg Player Integration 🔧 REFACTORING
**Effort:** 7-10 days  
**Impact:** Better codec support, advanced features

**Tasks:**
- [ ] Add FFmpeg-based player library (e.g., ijkplayer or custom)
- [ ] Create `PlayerEngine` interface
- [ ] Implement `ExoPlayerEngine`
- [ ] Implement `FFmpegPlayerEngine`
- [ ] Create `PlayerManager` for engine selection
- [ ] Add player configuration (codec selection, hardware acceleration)
- [ ] Implement multi-audio track support
- [ ] Implement subtitle support

**Dependencies to Add:**
```gradle
dependencies {
    // FFmpeg-based player (choose one)
    implementation 'tv.danmaku.ijk.media:ijkplayer-java:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-armv7a:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-arm64:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-x86:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-x86_64:0.8.8'
    
    // OR use custom FFmpeg build
    implementation 'com.github.wseemann:FFmpegMediaMetadataRetriever:1.0.19'
}
```

**New Architecture:**
```
player/
├── engine/
│   ├── PlayerEngine.kt (interface)
│   ├── ExoPlayerEngine.kt
│   ├── FFmpegPlayerEngine.kt
│   └── PlayerEngineFactory.kt
├── PlayerManager.kt
├── PlayerConfig.kt
└── PlayerActivity.kt (refactored)
```

**Interface Design:**
```kotlin
interface PlayerEngine {
    fun initialize(context: Context, config: PlayerConfig)
    fun setDataSource(url: String, headers: Map<String, String>? = null)
    fun prepare()
    fun play()
    fun pause()
    fun stop()
    fun release()
    fun seekTo(position: Long)
    fun setAudioTrack(trackIndex: Int)
    fun setSubtitleTrack(trackIndex: Int)
    fun getAudioTracks(): List<AudioTrack>
    fun getSubtitleTracks(): List<SubtitleTrack>
    fun setPlayerListener(listener: PlayerListener)
    fun getCurrentPosition(): Long
    fun getDuration(): Long
    fun isPlaying(): Boolean
}

class PlayerManager(private val context: Context) {
    private var currentEngine: PlayerEngine? = null
    
    fun createPlayer(type: PlayerType): PlayerEngine {
        return when (type) {
            PlayerType.EXOPLAYER -> ExoPlayerEngine(context)
            PlayerType.FFMPEG -> FFmpegPlayerEngine(context)
            PlayerType.AUTO -> selectBestEngine()
        }
    }
    
    private fun selectBestEngine(): PlayerEngine {
        // Auto-select based on stream format, device capabilities
        return ExoPlayerEngine(context) // fallback
    }
}
```

---

### Phase 2C: Future Features Foundation (2-3 weeks)

#### 7. EPG Infrastructure 🔧 REFACTORING
**Effort:** 5-6 days  
**Impact:** Essential TV feature

**Tasks:**
- [ ] Create EPG data models
- [ ] Implement EPG API endpoints
- [ ] Create EPG database (Room)
- [ ] Implement EPG UI (Leanback program guide)
- [ ] Add EPG caching and updates
- [ ] Implement "What's On Now" feature

**New Components:**
```
data/
├── models/
│   ├── EPGEntry.kt
│   ├── EPGChannel.kt
│   └── EPGProgram.kt
├── database/
│   ├── EPGDatabase.kt
│   ├── EPGDao.kt
│   └── EPGEntity.kt
└── repository/
    └── EPGRepository.kt

ui/
├── epg/
│   ├── EPGFragment.kt
│   ├── EPGAdapter.kt
│   └── ProgramGuideView.kt
└── viewmodels/
    └── EPGViewModel.kt
```

---

#### 8. Catch-up TV Support 🔧 REFACTORING
**Effort:** 3-4 days  
**Impact:** Premium feature

**Tasks:**
- [ ] Add catch-up data models
- [ ] Implement catch-up API endpoints
- [ ] Create catch-up UI
- [ ] Add time-shift controls to player
- [ ] Implement catch-up archive browsing

---

#### 9. Advanced Authentication 🔧 REFACTORING
**Effort:** 3-4 days  
**Impact:** Security and flexibility

**Tasks:**
- [ ] Create `AuthProvider` interface
- [ ] Implement username/password auth
- [ ] Implement token-based auth
- [ ] Implement device activation auth
- [ ] Add MAC address authentication
- [ ] Create unified auth flow

**Interface Design:**
```kotlin
interface AuthProvider {
    suspend fun authenticate(credentials: Any): AuthResult
    suspend fun refreshToken(): AuthResult
    suspend fun validateSession(): Boolean
    suspend fun logout()
}

sealed class Credentials {
    data class UsernamePassword(val username: String, val password: String) : Credentials()
    data class Token(val token: String) : Credentials()
    data class DeviceActivation(val deviceId: String, val activationCode: String) : Credentials()
    data class MacAddress(val mac: String) : Credentials()
}
```

---

## Summary: What Can Be Done Immediately vs. Refactoring

### ⚡ IMMEDIATE (Can Start Now - 1-2 weeks)

1. **Remove Hardcoded URLs** ✅
   - Low risk, high impact
   - No architecture changes needed
   - Just configuration management

2. **Multi-Architecture Support** ✅
   - Simple build.gradle changes
   - No code changes needed

3. **Improve Leanback UI** ✅
   - Incremental improvements
   - Can be done fragment by fragment
   - No breaking changes

**Total Time:** 1-2 weeks  
**Can be deployed:** Yes, incrementally

---

### 🔧 REQUIRES REFACTORING (2-4 weeks)

1. **Backend Abstraction Layer**
   - Major architecture change
   - Affects all data flow
   - Requires testing across all features

2. **Repository Pattern + ViewModels**
   - Significant refactoring
   - Changes all UI components
   - Better long-term maintainability

3. **FFmpeg Player Integration**
   - New dependencies
   - Complex integration
   - Requires extensive testing

4. **EPG Infrastructure**
   - New feature, new database
   - Requires backend support
   - Complex UI components

5. **Catch-up TV**
   - Depends on EPG
   - Requires backend support

6. **Advanced Authentication**
   - Affects login flow
   - Requires backend changes

**Total Time:** 4-6 weeks  
**Can be deployed:** Only after thorough testing

---

## Recommended Approach

### Sprint 1 (Week 1-2): Quick Wins
1. Remove hardcoded URLs
2. Add multi-architecture support
3. Improve Leanback UI consistency
4. Add server configuration UI

**Deliverable:** More flexible, better TV experience

### Sprint 2 (Week 3-4): Backend Abstraction
1. Create backend provider interface
2. Implement Xtream provider
3. Add Stalker portal support
4. Create backend factory

**Deliverable:** Multi-backend support

### Sprint 3 (Week 5-6): Architecture Refactoring
1. Implement repository pattern
2. Add ViewModels
3. Move business logic out of UI
4. Add proper state management

**Deliverable:** Clean architecture

### Sprint 4 (Week 7-8): Advanced Player
1. Integrate FFmpeg player
2. Create player engine abstraction
3. Add multi-audio/subtitle support
4. Implement player configuration

**Deliverable:** Professional player

### Sprint 5 (Week 9-10): EPG & Catch-up
1. Implement EPG infrastructure
2. Create EPG UI
3. Add catch-up support
4. Implement time-shift

**Deliverable:** Full-featured IPTV app

---

## Dependencies & Libraries to Add

```gradle
dependencies {
    // Current (keep)
    implementation 'androidx.leanback:leanback:1.0.0'
    implementation 'androidx.media3:media3-exoplayer:1.2.0'
    
    // Add for refactoring
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.room:room-runtime:2.6.1'
    kapt 'androidx.room:room-compiler:2.6.1'
    implementation 'androidx.room:room-ktx:2.6.1'
    
    // Add for FFmpeg
    implementation 'tv.danmaku.ijk.media:ijkplayer-java:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-armv7a:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-arm64:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-x86:0.8.8'
    implementation 'tv.danmaku.ijk.media:ijkplayer-x86_64:0.8.8'
    
    // Add for better architecture
    implementation 'androidx.datastore:datastore-preferences:1.0.0'
    implementation 'com.google.dagger:hilt-android:2.48'
    kapt 'com.google.dagger:hilt-compiler:2.48'
}
```

---

## Risk Assessment

### Low Risk (Immediate)
- Configuration management
- Multi-architecture support
- UI improvements

### Medium Risk (Refactoring)
- Backend abstraction
- Repository pattern
- ViewModels

### High Risk (Major Changes)
- FFmpeg integration
- EPG infrastructure
- Authentication overhaul

---

## Testing Strategy

1. **Unit Tests**
   - Repository layer
   - ViewModels
   - Backend providers

2. **Integration Tests**
   - API communication
   - Database operations
   - Player engines

3. **UI Tests**
   - Leanback navigation
   - Focus handling
   - Player controls

4. **Device Testing**
   - Multiple Android TV devices
   - Different architectures
   - Various Android versions

---

## Conclusion

**Immediate Actions (Start Now):**
1. Remove hardcoded URLs (2-3 days)
2. Add multi-architecture support (1 day)
3. Improve Leanback UI (3-4 days)

**Total:** ~1 week for immediate improvements

**Refactoring (Plan for 4-6 weeks):**
1. Backend abstraction
2. Architecture refactoring
3. FFmpeg player
4. EPG & advanced features

**Recommendation:** Start with immediate actions, then plan refactoring sprints based on priority and resources.
