package com.avplayer.video

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeVideoPlayerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var pendingPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "NativeVideoPlayer"

  @ReactMethod
  fun open(path: String, promise: Promise) {
    val activity: Activity = reactApplicationContext.currentActivity ?: run {
      promise.reject("NO_ACTIVITY", "No foreground activity")
      return
    }

    if (pendingPromise != null) {
      promise.reject("BUSY", "Video player already opening")
      return
    }

    pendingPromise = promise
    val intent =
      Intent(activity, NativeVideoPlayerActivity::class.java).apply {
        putExtra(NativeVideoPlayerActivity.EXTRA_PATH, path)
      }

    @Suppress("DEPRECATION")
    activity.startActivityForResult(intent, REQUEST_OPEN)
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    if (requestCode != REQUEST_OPEN) {
      return
    }
    pendingPromise?.resolve(null)
    pendingPromise = null
  }

  override fun onNewIntent(intent: Intent) {}

  companion object {
    private const val REQUEST_OPEN = 7721
  }
}
