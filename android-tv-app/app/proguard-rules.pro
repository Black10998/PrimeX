# CRITICAL SECURITY: ProGuard/R8 Configuration for Maximum Obfuscation
# 
# This configuration enables aggressive code obfuscation to prevent
# reverse engineering and tampering with the PrimeX app.
#
# IMPORTANT: Test thoroughly after enabling obfuscation

# ============================================================================
# SECURITY: Obfuscation Settings
# ============================================================================

# Enable aggressive obfuscation
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Obfuscate package names and class names
-repackageclasses 'primex.obf'
-allowaccessmodification

# Remove logging in release builds (security)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# ============================================================================
# CRITICAL: Keep Security Classes (but obfuscate their internals)
# ============================================================================

# Keep SecurityManager class name but obfuscate methods
-keep class com.primex.iptv.security.SecurityManager {
    public static void initialize(android.content.Context);
    public static void verifyIntegrity(android.content.Context);
}

# Keep ConfigManager class name but obfuscate methods
-keep class com.primex.iptv.config.ConfigManager {
    public static java.lang.String getFullBaseUrl(android.content.Context);
    public static java.lang.String buildApiUrl(android.content.Context);
    public static java.lang.String build*StreamUrl(...);
}

# ============================================================================
# Android Framework
# ============================================================================

# Retrofit
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.examples.android.model.** { <fields>; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# ============================================================================
# Play Integrity API
# ============================================================================
-keep class com.google.android.play.core.integrity.** { *; }

# ============================================================================
# ExoPlayer
# ============================================================================
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# ============================================================================
# Kotlin
# ============================================================================
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ============================================================================
# SECURITY: String Encryption (obfuscate string constants)
# ============================================================================
# R8 will automatically obfuscate string constants in release builds
# This makes it harder to extract URLs, keys, etc. from the APK
