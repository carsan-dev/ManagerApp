package com.sportsmanagerapp

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InstallPermissionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "InstallPermissionModule"
    }

    @ReactMethod
    fun canInstallApks(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val canInstall = reactApplicationContext.packageManager.canRequestPackageInstalls()
                promise.resolve(canInstall)
            } else {
                // En versiones anteriores a Android 8, no se necesita este permiso específico
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openInstallPermissionSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                // En versiones anteriores, abrir ajustes de seguridad generales
                val intent = Intent(Settings.ACTION_SECURITY_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
