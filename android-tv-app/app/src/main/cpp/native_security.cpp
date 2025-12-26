/**
 * Native Security Layer - C++ Implementation
 * 
 * CRITICAL SECURITY:
 * - Implements security checks in native code
 * - Harder to reverse engineer than Java/Kotlin
 * - Stores sensitive data in native memory
 * - Performs integrity verification at native level
 * 
 * This provides an additional layer of security that's significantly
 * harder to bypass than pure Java/Kotlin implementations.
 */

#include <jni.h>
#include <string>
#include <android/log.h>
#include <unistd.h>
#include <sys/ptrace.h>

#define LOG_TAG "NativeSecurity"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// CRITICAL: Expected package name (obfuscated in native code)
static const char* EXPECTED_PACKAGE = "com.primex.iptv";

// CRITICAL: PrimeX backend URL (stored in native memory)
static const char* PRIMEX_DOMAIN = "prime-x.live";
static const char* PRIMEX_PROTOCOL = "https";

// CRITICAL: Encrypted AppKey stored in native memory
// This is XOR encrypted with a key derived from the app signature
// In production, use proper AES encryption
static const unsigned char ENCRYPTED_APP_KEY[] = {
    // This should be your actual AppKey XOR encrypted
    // Replace with actual encrypted bytes
    0x50, 0x52, 0x49, 0x4D, 0x45, 0x58, 0x5F, 0x41,
    0x50, 0x50, 0x5F, 0x4B, 0x45, 0x59, 0x5F, 0x45,
    0x4E, 0x43, 0x52, 0x59, 0x50, 0x54, 0x45, 0x44
};

static const int APP_KEY_LENGTH = sizeof(ENCRYPTED_APP_KEY);

// XOR encryption key (derived from signature in production)
static const unsigned char XOR_KEY[] = {
    0x42, 0x4C, 0x41, 0x43, 0x4B, 0x31, 0x30, 0x39,
    0x39, 0x38, 0x5F, 0x50, 0x52, 0x49, 0x4D, 0x45,
    0x58, 0x5F, 0x53, 0x45, 0x43, 0x55, 0x52, 0x45
};

/**
 * Anti-debugging check using ptrace
 * If a debugger is attached, ptrace will fail
 */
static bool isDebuggerAttached() {
    // Try to attach ptrace to ourselves
    // If we're already being debugged, this will fail
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        LOGE("Debugger detected via ptrace");
        return true;
    }
    
    // Detach ptrace
    ptrace(PTRACE_DETACH, 0, 1, 0);
    return false;
}

/**
 * Check if running in emulator by examining CPU info
 */
static bool isEmulator() {
    // Check CPU info for emulator indicators
    FILE* fp = fopen("/proc/cpuinfo", "r");
    if (fp == nullptr) {
        return false;
    }
    
    char line[256];
    bool isEmu = false;
    
    while (fgets(line, sizeof(line), fp)) {
        // Check for common emulator CPU signatures
        if (strstr(line, "goldfish") != nullptr ||
            strstr(line, "ranchu") != nullptr ||
            strstr(line, "vbox") != nullptr ||
            strstr(line, "qemu") != nullptr) {
            isEmu = true;
            break;
        }
    }
    
    fclose(fp);
    return isEmu;
}

/**
 * Verify package name matches expected value
 */
extern "C" JNIEXPORT jboolean JNICALL
Java_com_primex_iptv_security_NativeSecurity_verifyPackageName(
        JNIEnv* env,
        jobject /* this */,
        jstring packageName) {
    
    const char* pkgName = env->GetStringUTFChars(packageName, nullptr);
    
    bool isValid = (strcmp(pkgName, EXPECTED_PACKAGE) == 0);
    
    if (!isValid) {
        LOGE("Package name mismatch: %s", pkgName);
    }
    
    env->ReleaseStringUTFChars(packageName, pkgName);
    return isValid;
}

/**
 * Get PrimeX domain from native memory
 * This is harder to extract than from Java strings
 */
extern "C" JNIEXPORT jstring JNICALL
Java_com_primex_iptv_security_NativeSecurity_getPrimexDomain(
        JNIEnv* env,
        jobject /* this */) {
    
    // Perform anti-debugging check
    if (isDebuggerAttached()) {
        LOGE("Debugger detected - terminating");
        exit(1);
    }
    
    // Check for emulator
    if (isEmulator()) {
        LOGE("Emulator detected");
        // In production, uncomment to enforce:
        // exit(1);
    }
    
    return env->NewStringUTF(PRIMEX_DOMAIN);
}

/**
 * Get PrimeX protocol from native memory
 */
extern "C" JNIEXPORT jstring JNICALL
Java_com_primex_iptv_security_NativeSecurity_getPrimexProtocol(
        JNIEnv* env,
        jobject /* this */) {
    
    return env->NewStringUTF(PRIMEX_PROTOCOL);
}

/**
 * Perform comprehensive native security check
 * Returns true if all checks pass
 */
extern "C" JNIEXPORT jboolean JNICALL
Java_com_primex_iptv_security_NativeSecurity_performSecurityCheck(
        JNIEnv* env,
        jobject /* this */) {
    
    LOGI("Performing native security checks...");
    
    // Check 1: Anti-debugging
    if (isDebuggerAttached()) {
        LOGE("Security check failed: Debugger detected");
        return false;
    }
    
    // Check 2: Emulator detection
    if (isEmulator()) {
        LOGE("Security check failed: Emulator detected");
        // In production, return false to enforce
        // return false;
    }
    
    // Check 3: Verify process name
    char processName[256];
    FILE* fp = fopen("/proc/self/cmdline", "r");
    if (fp != nullptr) {
        if (fgets(processName, sizeof(processName), fp) != nullptr) {
            if (strcmp(processName, EXPECTED_PACKAGE) != 0) {
                LOGE("Security check failed: Process name mismatch");
                fclose(fp);
                return false;
            }
        }
        fclose(fp);
    }
    
    LOGI("Native security checks passed");
    return true;
}

/**
 * Decrypt AppKey using XOR encryption
 * In production, use proper AES-256 encryption
 */
static void decryptAppKey(unsigned char* output, int length) {
    for (int i = 0; i < length && i < APP_KEY_LENGTH; i++) {
        output[i] = ENCRYPTED_APP_KEY[i] ^ XOR_KEY[i % sizeof(XOR_KEY)];
    }
}

/**
 * Get decrypted AppKey
 * CRITICAL: Only returns key if all security checks pass
 */
extern "C" JNIEXPORT jstring JNICALL
Java_com_primex_iptv_security_NativeSecurity_getAppKey(
        JNIEnv* env,
        jobject /* this */) {
    
    // CRITICAL: Perform security checks before returning key
    if (isDebuggerAttached()) {
        LOGE("Debugger detected - refusing to decrypt AppKey");
        return env->NewStringUTF("");
    }
    
    if (isEmulator()) {
        LOGE("Emulator detected - refusing to decrypt AppKey");
        // In production, return empty string:
        // return env->NewStringUTF("");
    }
    
    // Decrypt AppKey
    unsigned char decrypted[APP_KEY_LENGTH + 1];
    decryptAppKey(decrypted, APP_KEY_LENGTH);
    decrypted[APP_KEY_LENGTH] = '\0';
    
    // Return decrypted key
    return env->NewStringUTF(reinterpret_cast<const char*>(decrypted));
}

/**
 * Encrypt data using XOR (for demonstration)
 * In production, use proper AES-256 encryption
 */
extern "C" JNIEXPORT jstring JNICALL
Java_com_primex_iptv_security_NativeSecurity_encryptData(
        JNIEnv* env,
        jobject /* this */,
        jstring data) {
    
    const char* input = env->GetStringUTFChars(data, nullptr);
    int inputLen = strlen(input);
    
    unsigned char* encrypted = new unsigned char[inputLen + 1];
    
    for (int i = 0; i < inputLen; i++) {
        encrypted[i] = input[i] ^ XOR_KEY[i % sizeof(XOR_KEY)];
    }
    encrypted[inputLen] = '\0';
    
    jstring result = env->NewStringUTF(reinterpret_cast<const char*>(encrypted));
    
    delete[] encrypted;
    env->ReleaseStringUTFChars(data, input);
    
    return result;
}

/**
 * Calculate simple checksum of native library
 * This can detect if the .so file has been modified
 */
extern "C" JNIEXPORT jint JNICALL
Java_com_primex_iptv_security_NativeSecurity_getNativeChecksum(
        JNIEnv* env,
        jobject /* this */) {
    
    // Simple checksum of critical strings and data
    int checksum = 0;
    
    for (int i = 0; EXPECTED_PACKAGE[i] != '\0'; i++) {
        checksum += EXPECTED_PACKAGE[i];
    }
    
    for (int i = 0; PRIMEX_DOMAIN[i] != '\0'; i++) {
        checksum += PRIMEX_DOMAIN[i];
    }
    
    for (int i = 0; i < APP_KEY_LENGTH; i++) {
        checksum += ENCRYPTED_APP_KEY[i];
    }
    
    return checksum;
}
