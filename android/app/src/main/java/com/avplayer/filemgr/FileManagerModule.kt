package com.avplayer.filemgr

import android.app.Activity
import android.app.RecoverableSecurityException
import android.content.ContentUris
import android.content.Intent
import android.content.IntentSender
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import java.io.File

/**
 * Deletes media files using MediaStore.
 *
 * Android 11+ (R+): MediaStore.createDeleteRequest() shows the system's
 *   bulk delete dialog and the OS removes the file on confirmation.
 * Android 10 (Q): RecoverableSecurityException flow with IntentSender.
 * Android <= 9: Direct ContentResolver.delete() then File.delete() fallback.
 */
class FileManagerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var pendingDeletePromise: Promise? = null
  private var pendingDeletePath: String? = null
  private var pendingBulkDeletePromise: Promise? = null
  private var pendingBulkDeletePaths: List<String>? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "FileManager"

  @ReactMethod
  fun setImmersive(immersive: Boolean, promise: Promise) {
    val activity: Activity? = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity")
      return
    }
    activity.runOnUiThread {
      try {
        val window = activity.window
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          val controller = window.insetsController
          if (immersive) {
            controller?.hide(
              android.view.WindowInsets.Type.statusBars() or
                android.view.WindowInsets.Type.navigationBars(),
            )
            controller?.systemBarsBehavior =
              android.view.WindowInsetsController
                .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          } else {
            controller?.show(
              android.view.WindowInsets.Type.statusBars() or
                android.view.WindowInsets.Type.navigationBars(),
            )
          }
        } else {
          @Suppress("DEPRECATION")
          window.decorView.systemUiVisibility = if (immersive) {
            android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
              android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
              android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
              android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
              android.view.View.SYSTEM_UI_FLAG_FULLSCREEN or
              android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          } else {
            android.view.View.SYSTEM_UI_FLAG_VISIBLE
          }
        }
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("IMMERSIVE_FAILED", e.message, e)
      }
    }
  }

  @ReactMethod
  fun getMediaContentUri(path: String, isVideo: Boolean, promise: Promise) {
    try {
      val resolver = reactApplicationContext.contentResolver
      val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val idColumn = MediaStore.MediaColumns._ID
      val dataColumn = MediaStore.MediaColumns.DATA
      var contentUri: Uri? = null
      resolver.query(collection, arrayOf(idColumn), "$dataColumn = ?", arrayOf(path), null)
        ?.use { c ->
          if (c.moveToFirst()) {
            val id = c.getLong(c.getColumnIndexOrThrow(idColumn))
            contentUri = ContentUris.withAppendedId(collection, id)
          }
        }
      promise.resolve(contentUri?.toString())
    } catch (e: Exception) {
      promise.reject("URI_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun shareMedia(path: String, isVideo: Boolean, title: String, promise: Promise) {
    val activity: Activity? = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity")
      return
    }
    try {
      val resolver = reactApplicationContext.contentResolver
      val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val idColumn = MediaStore.MediaColumns._ID
      val dataColumn = MediaStore.MediaColumns.DATA
      var contentUri: Uri? = null
      resolver.query(collection, arrayOf(idColumn), "$dataColumn = ?", arrayOf(path), null)
        ?.use { c ->
          if (c.moveToFirst()) {
            val id = c.getLong(c.getColumnIndexOrThrow(idColumn))
            contentUri = ContentUris.withAppendedId(collection, id)
          }
        }
      if (contentUri == null) {
        promise.reject("NOT_FOUND", "Media not found in MediaStore")
        return
      }
      val mime = if (isVideo) "video/*" else "audio/*"
      val intent = Intent(Intent.ACTION_SEND).apply {
        type = mime
        putExtra(Intent.EXTRA_STREAM, contentUri)
        putExtra(Intent.EXTRA_TITLE, title)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooser = Intent.createChooser(intent, "Share with")
      chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      activity.startActivity(chooser)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SHARE_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun shareMediaBulk(
    paths: ReadableArray,
    isVideo: Boolean,
    promise: Promise,
  ) {
    val activity: Activity? = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity")
      return
    }
    try {
      val resolver = reactApplicationContext.contentResolver
      val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val uris = ArrayList<Uri>()
      val idColumn = MediaStore.MediaColumns._ID
      val dataColumn = MediaStore.MediaColumns.DATA
      for (i in 0 until paths.size()) {
        val path = paths.getString(i) ?: continue
        resolver.query(
          collection,
          arrayOf(idColumn),
          "$dataColumn = ?",
          arrayOf(path),
          null,
        )?.use { c ->
          if (c.moveToFirst()) {
            val id = c.getLong(c.getColumnIndexOrThrow(idColumn))
            uris.add(ContentUris.withAppendedId(collection, id))
          }
        }
      }
      if (uris.isEmpty()) {
        promise.reject("NOT_FOUND", "No matching files in MediaStore")
        return
      }
      val mime = if (isVideo) "video/*" else "audio/*"
      val intent = Intent(Intent.ACTION_SEND_MULTIPLE).apply {
        type = mime
        putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      val chooser = Intent.createChooser(intent, "Share with")
      chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      activity.startActivity(chooser)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SHARE_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun deleteMediaBulk(
    paths: ReadableArray,
    isVideo: Boolean,
    promise: Promise,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      // For older Android, fall back to looping deletes one at a time.
      val total = paths.size()
      var ok = 0
      for (i in 0 until total) {
        val p = paths.getString(i) ?: continue
        try {
          val file = File(p)
          if (file.exists() && file.delete()) ok += 1
        } catch (_: Exception) {}
      }
      promise.resolve(ok)
      return
    }

    val activity: Activity? = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity")
      return
    }
    try {
      val resolver = reactApplicationContext.contentResolver
      val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val uris = ArrayList<Uri>()
      val idColumn = MediaStore.MediaColumns._ID
      val dataColumn = MediaStore.MediaColumns.DATA
      val pathsList = ArrayList<String>()
      for (i in 0 until paths.size()) {
        val p = paths.getString(i) ?: continue
        pathsList.add(p)
        resolver.query(
          collection,
          arrayOf(idColumn),
          "$dataColumn = ?",
          arrayOf(p),
          null,
        )?.use { c ->
          if (c.moveToFirst()) {
            val id = c.getLong(c.getColumnIndexOrThrow(idColumn))
            uris.add(ContentUris.withAppendedId(collection, id))
          }
        }
      }
      if (uris.isEmpty()) {
        promise.resolve(0)
        return
      }
      if (pendingBulkDeletePromise != null) {
        promise.reject("BUSY", "Another bulk delete is in progress")
        return
      }
      pendingBulkDeletePromise = promise
      pendingBulkDeletePaths = pathsList
      val pi = MediaStore.createDeleteRequest(resolver, uris)
      @Suppress("DEPRECATION")
      activity.startIntentSenderForResult(
        pi.intentSender,
        REQUEST_BULK_DELETE,
        null,
        0,
        0,
        0,
        null,
      )
    } catch (e: Exception) {
      promise.reject("DELETE_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun deleteMedia(path: String, isVideo: Boolean, promise: Promise) {
    val activity: Activity? = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity to host delete dialog")
      return
    }

    val resolver = reactApplicationContext.contentResolver
    val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    val idColumn = MediaStore.MediaColumns._ID
    val dataColumn = MediaStore.MediaColumns.DATA

    var contentUri: Uri? = null
    try {
      resolver.query(collection, arrayOf(idColumn), "$dataColumn = ?", arrayOf(path), null)
        ?.use { c ->
          if (c.moveToFirst()) {
            val id = c.getLong(c.getColumnIndexOrThrow(idColumn))
            contentUri = ContentUris.withAppendedId(collection, id)
          }
        }
    } catch (e: Exception) {
      // continue: contentUri stays null, we'll try file delete fallback
    }

    // ANDROID 11+ — system delete dialog flow
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && contentUri != null) {
      try {
        val pi = MediaStore.createDeleteRequest(resolver, listOf(contentUri))
        if (pendingDeletePromise != null) {
          promise.reject("BUSY", "Another delete is in progress")
          return
        }
        pendingDeletePromise = promise
        pendingDeletePath = path
        @Suppress("DEPRECATION")
        activity.startIntentSenderForResult(
          pi.intentSender,
          REQUEST_DELETE,
          null,
          0,
          0,
          0,
          null,
        )
        return
      } catch (e: Exception) {
        promise.reject("DELETE_REQUEST_FAILED", e.message, e)
        return
      }
    }

    // ANDROID 10 — RecoverableSecurityException flow
    if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q && contentUri != null) {
      try {
        val rows = resolver.delete(contentUri!!, null, null)
        if (rows > 0) {
          promise.resolve(true)
        } else {
          promise.resolve(false)
        }
        return
      } catch (sec: SecurityException) {
        val recoverable = sec as? RecoverableSecurityException
        if (recoverable != null) {
          try {
            val intentSender = recoverable.userAction.actionIntent.intentSender
            if (pendingDeletePromise != null) {
              promise.reject("BUSY", "Another delete is in progress")
              return
            }
            pendingDeletePromise = promise
            pendingDeletePath = path
            @Suppress("DEPRECATION")
            activity.startIntentSenderForResult(
              intentSender,
              REQUEST_DELETE,
              null,
              0,
              0,
              0,
              null,
            )
            return
          } catch (e: IntentSender.SendIntentException) {
            promise.reject("DELETE_FAILED", e.message, e)
            return
          }
        }
        promise.reject("DELETE_FAILED", sec.message, sec)
        return
      }
    }

    // ANDROID <= 9 — direct file delete + content provider cleanup
    try {
      var deleted = false
      val file = File(path)
      if (file.exists()) {
        deleted = file.delete()
      }
      if (deleted && contentUri != null) {
        try {
          resolver.delete(contentUri!!, null, null)
        } catch (_: Exception) {
          // best-effort
        }
      }
      promise.resolve(deleted)
    } catch (e: Exception) {
      promise.reject("DELETE_FAILED", e.message, e)
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    if (requestCode == REQUEST_DELETE) {
      val promise = pendingDeletePromise
      pendingDeletePromise = null
      val path = pendingDeletePath
      pendingDeletePath = null
      if (promise == null) return

      val ok = resultCode == Activity.RESULT_OK
      if (ok && path != null) {
        try {
          val f = File(path)
          if (f.exists()) f.delete()
        } catch (_: Exception) {}
      }
      promise.resolve(ok)
      return
    }
    if (requestCode == REQUEST_BULK_DELETE) {
      val promise = pendingBulkDeletePromise
      pendingBulkDeletePromise = null
      val paths = pendingBulkDeletePaths ?: emptyList()
      pendingBulkDeletePaths = null
      if (promise == null) return

      if (resultCode != Activity.RESULT_OK) {
        promise.resolve(0)
        return
      }
      // Best-effort cleanup of any lingering files
      var deleted = 0
      for (p in paths) {
        try {
          val f = File(p)
          if (!f.exists()) {
            deleted += 1
          } else if (f.delete()) {
            deleted += 1
          }
        } catch (_: Exception) {}
      }
      promise.resolve(deleted)
      return
    }
  }

  override fun onNewIntent(intent: Intent) {}

  companion object {
    private const val REQUEST_DELETE = 9911
    private const val REQUEST_BULK_DELETE = 9912
  }
}
