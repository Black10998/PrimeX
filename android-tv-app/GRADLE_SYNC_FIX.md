# Gradle Sync Fix Guide

## ✅ What Was Fixed

The following issues have been resolved:

1. **Removed `allprojects` block** - Conflicted with `dependencyResolutionManagement`
2. **Changed repository mode** - From `FAIL_ON_PROJECT_REPOS` to `PREFER_SETTINGS`
3. **Updated Gradle version** - To 8.2 (compatible with AGP 8.2.2)
4. **Updated Android Gradle Plugin** - To 8.2.2 (latest stable)
5. **Updated Kotlin version** - To 1.9.22 (latest stable)
6. **Changed Java version** - From 17 to 8 (better compatibility)
7. **Added Gradle Wrapper** - Complete wrapper files for consistent builds
8. **Added gradle.properties settings** - For better compatibility

## 🚀 How To Sync The Project Now

### Step 1: Pull Latest Changes

```bash
cd /path/to/PrimeX
git pull origin main
```

### Step 2: Open Project in Android Studio

1. Open Android Studio
2. Click **File** → **Open**
3. Navigate to `PrimeX/android-tv-app/` folder
4. Click **OK**

### Step 3: Wait for Gradle Sync

Android Studio will automatically start syncing. This may take 5-10 minutes the first time.

**What you should see:**
- "Gradle sync in progress..." at the bottom
- Progress bar showing download of dependencies
- Eventually: "Gradle sync finished successfully"

### Step 4: Verify Success

✅ **Success indicators:**
- No red errors in the Build tab
- Project structure visible in left panel
- "Gradle sync finished" message at bottom
- Can see `app` module with folders

❌ **If sync still fails, continue to troubleshooting below**

## 🔧 Troubleshooting Steps

### Issue 1: "SDK location not found"

**Error:**
```
SDK location not found. Define location with an ANDROID_SDK_ROOT environment variable
or by setting the sdk.dir path in your project's local.properties file
```

**Solution:**

1. In Android Studio, go to **File** → **Project Structure** → **SDK Location**
2. Note the Android SDK location path
3. Create a file named `local.properties` in the `android-tv-app` folder
4. Add this line (replace with your actual path):

**Windows:**
```properties
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

**Mac:**
```properties
sdk.dir=/Users/YourName/Library/Android/sdk
```

**Linux:**
```properties
sdk.dir=/home/YourName/Android/Sdk
```

5. Click **File** → **Sync Project with Gradle Files**

### Issue 2: "Unsupported Java version"

**Error:**
```
Unsupported Java. Your build is currently configured to use Java 17.0.x
```

**Solution:**

1. Go to **File** → **Settings** (or **Preferences** on Mac)
2. Navigate to **Build, Execution, Deployment** → **Build Tools** → **Gradle**
3. Under **Gradle JDK**, select **Embedded JDK** or **JDK 11** or higher
4. Click **Apply** and **OK**
5. Click **File** → **Sync Project with Gradle Files**

### Issue 3: "Could not resolve dependencies"

**Error:**
```
Could not resolve all dependencies for configuration ':app:debugCompileClasspath'
```

**Solution:**

1. Check your internet connection
2. In Android Studio, go to **File** → **Invalidate Caches / Restart**
3. Select **Invalidate and Restart**
4. Wait for Android Studio to restart
5. Project will sync automatically

### Issue 4: "Gradle version X.X is required"

**Error:**
```
Minimum supported Gradle version is X.X. Current version is Y.Y.
```

**Solution:**

The project now includes a Gradle Wrapper that specifies version 8.2. Android Studio should use it automatically.

If not:
1. Go to **File** → **Settings** → **Build, Execution, Deployment** → **Build Tools** → **Gradle**
2. Select **Use Gradle from: 'gradle-wrapper.properties' file**
3. Click **Apply** and **OK**
4. Sync project

### Issue 5: "Plugin [id: 'kotlin-android'] was not found"

**Error:**
```
Plugin [id: 'kotlin-android'] was not found in any of the following sources
```

**Solution:**

This should be fixed now. If you still see it:

1. Delete the `.gradle` folder in the project root
2. Delete the `build` folder in the project root
3. In Android Studio: **File** → **Invalidate Caches / Restart**
4. Select **Invalidate and Restart**

### Issue 6: "Namespace not specified"

**Error:**
```
Namespace not specified. Specify a namespace in the module's build.gradle file
```

**Solution:**

Already fixed in `app/build.gradle` with:
```gradle
android {
    namespace 'com.primex.iptv'
    ...
}
```

If you still see this error, verify the file hasn't been modified.

## 🧪 Manual Gradle Sync Test

If Android Studio sync fails, test Gradle directly:

### On Windows:
```cmd
cd android-tv-app
gradlew.bat clean
gradlew.bat build
```

### On Mac/Linux:
```bash
cd android-tv-app
./gradlew clean
./gradlew build
```

**Expected output:**
```
BUILD SUCCESSFUL in Xs
```

**If build fails:**
- Read the error message carefully
- Check the specific error in this guide
- Ensure all files were pulled from Git

## 📋 Verification Checklist

After sync completes, verify:

- [ ] No red errors in Build tab
- [ ] Project structure shows `app` module
- [ ] Can see `java` and `res` folders under `app`
- [ ] Can open `MainActivity.kt` without errors
- [ ] Can open `app/build.gradle` without errors
- [ ] Bottom status bar shows "Gradle sync finished"

## 🔍 Check Your Configuration

### Verify Gradle Version

1. Open `gradle/wrapper/gradle-wrapper.properties`
2. Should show: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-bin.zip`

### Verify AGP Version

1. Open `build.gradle` (project level)
2. Should show: `classpath 'com.android.tools.build:gradle:8.2.2'`

### Verify Kotlin Version

1. Open `build.gradle` (project level)
2. Should show: `ext.kotlin_version = '1.9.22'`

### Verify Java Version

1. Open `app/build.gradle`
2. Should show:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
}
```

## 🆘 Still Having Issues?

### Get Detailed Error Information

1. In Android Studio, click **View** → **Tool Windows** → **Build**
2. Look for the full error message
3. Copy the complete error text

### Common Error Patterns

**Pattern**: `Could not find method module()`
**Cause**: Old Gradle syntax
**Status**: ✅ Fixed - no longer using deprecated methods

**Pattern**: `FAIL_ON_PROJECT_REPOS`
**Cause**: Conflicting repository configuration
**Status**: ✅ Fixed - changed to PREFER_SETTINGS

**Pattern**: `allprojects` block
**Cause**: Deprecated in modern Gradle
**Status**: ✅ Fixed - removed from build.gradle

## 📞 Next Steps After Successful Sync

Once Gradle sync succeeds:

1. ✅ Configure server URL in `app/build.gradle` line 14
2. ✅ Build APK: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. ✅ Install on Android TV device
4. ✅ Test activation flow

## 🎯 Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `build.gradle` | Removed `allprojects` | Conflicts with modern Gradle |
| `build.gradle` | Updated AGP to 8.2.2 | Latest stable version |
| `build.gradle` | Updated Kotlin to 1.9.22 | Latest stable version |
| `settings.gradle` | Changed to `PREFER_SETTINGS` | Allows project repos |
| `app/build.gradle` | Changed Java to 1.8 | Better compatibility |
| `gradle/wrapper/` | Added wrapper files | Consistent Gradle version |
| `gradle.properties` | Added build features | Better compatibility |

## ✅ Expected Result

After following this guide, you should have:

- ✅ Gradle sync completes successfully
- ✅ No errors in Build tab
- ✅ Project structure fully loaded
- ✅ Ready to configure and build APK

---

**Last Updated**: December 21, 2024  
**Gradle Version**: 8.2  
**AGP Version**: 8.2.2  
**Kotlin Version**: 1.9.22
