package com.avplayer.video

import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import java.io.File

@UnstableApi
class NativeVideoPlayerActivity : ComponentActivity() {

  private var player: ExoPlayer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    WindowCompat.setDecorFitsSystemWindows(window, false)
    WindowInsetsControllerCompat(window, window.decorView).let { controller ->
      controller.hide(WindowInsetsCompat.Type.systemBars())
      controller.systemBarsBehavior =
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    val path = intent.getStringExtra(EXTRA_PATH)
    if (path.isNullOrBlank()) {
      setResult(RESULT_CANCELED)
      finish()
      return
    }

    val playerView =
      PlayerView(this).apply {
        layoutParams =
          ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
          )
        useController = true
        controllerHideOnTouch = false
        controllerShowTimeoutMs = 0
        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
        setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING)
      }
    setContentView(playerView)

    player =
      ExoPlayer.Builder(this).build().also { exo ->
        playerView.player = exo
        exo.setMediaItem(MediaItem.fromUri(resolveUri(path)))
        exo.prepare()
        exo.playWhenReady = true
      }

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          setResult(RESULT_OK)
          finish()
        }
      },
    )
  }

  override fun onStop() {
    player?.pause()
    super.onStop()
  }

  override fun onDestroy() {
    player?.release()
    player = null
    super.onDestroy()
  }

  companion object {
    const val EXTRA_PATH = "path"

    fun resolveUri(path: String): Uri {
      val trimmed = path.trim()
      return when {
        trimmed.startsWith("content://") -> Uri.parse(trimmed)
        trimmed.startsWith("file://") -> Uri.parse(trimmed)
        else -> Uri.fromFile(File(trimmed))
      }
    }
  }
}
