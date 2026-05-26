package com.avplayer.audio

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.Virtualizer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = "MainAudioFx")
class MainAudioFxModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var equalizer: Equalizer? = null
  private var bassBoost: BassBoost? = null
  private var virtualizer: Virtualizer? = null

  private var currentSessionId: Int = 0
  private var isEnabled = true
  private val bandLevels = HashMap<Int, Short>()
  private var isBassBoostEnabled = false
  private var bassBoostStrength: Short = 0
  private var isVirtualizerEnabled = false
  private var virtualizerStrength: Short = 0

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent == null) return
      val action = intent.action
      val sessionId = intent.getIntExtra(AudioEffect.EXTRA_AUDIO_SESSION, -1)
      if (sessionId == -1 || sessionId == 0) return

      if (AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION == action) {
        bindToSession(sessionId)
      } else if (AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION == action) {
        if (sessionId == currentSessionId) {
          releaseEffects()
          currentSessionId = 0
        }
      }
    }
  }

  init {
    val filter = IntentFilter().apply {
      addAction(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION)
      addAction(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION)
    }
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      reactContext.registerReceiver(receiver, filter)
    }
  }

  override fun getName(): String = "MainAudioFx"

  private fun bindToSession(sessionId: Int) {
    if (sessionId == 0 || sessionId == currentSessionId) {
      return
    }

    releaseEffects()
    currentSessionId = sessionId

    try {
      val eq = Equalizer(0, sessionId)
      eq.enabled = isEnabled
      for ((band, level) in bandLevels) {
        if (band >= 0 && band < eq.numberOfBands) {
          eq.setBandLevel(band.toShort(), level)
        }
      }
      equalizer = eq
    } catch (_: Exception) {
    }

    try {
      val bb = BassBoost(0, sessionId)
      bb.enabled = isBassBoostEnabled
      if (isBassBoostEnabled && bb.strengthSupported) {
        bb.setStrength(bassBoostStrength)
      }
      bassBoost = bb
    } catch (_: Exception) {
    }

    try {
      val vz = Virtualizer(0, sessionId)
      vz.enabled = isVirtualizerEnabled
      if (isVirtualizerEnabled && vz.strengthSupported) {
        vz.setStrength(virtualizerStrength)
      }
      virtualizer = vz
    } catch (_: Exception) {
    }
  }

  private fun ensureEqualizer(): Equalizer {
    val existing = equalizer
    if (existing != null) return existing
    // Use session 0 (global output mix) if no specific session detected
    val sid = if (currentSessionId != 0) currentSessionId else 0
    val created = Equalizer(0, sid)
    created.enabled = isEnabled
    for ((band, level) in bandLevels) {
      if (band >= 0 && band < created.numberOfBands) {
        created.setBandLevel(band.toShort(), level)
      }
    }
    equalizer = created
    currentSessionId = sid
    // Also create bass/virtualizer on same session
    if (bassBoost == null) {
      try {
        val bb = BassBoost(0, sid)
        bb.enabled = isBassBoostEnabled
        if (isBassBoostEnabled && bb.strengthSupported) bb.setStrength(bassBoostStrength)
        bassBoost = bb
      } catch (_: Exception) {}
    }
    if (virtualizer == null) {
      try {
        val vz = Virtualizer(0, sid)
        vz.enabled = isVirtualizerEnabled
        if (isVirtualizerEnabled && vz.strengthSupported) vz.setStrength(virtualizerStrength)
        virtualizer = vz
      } catch (_: Exception) {}
    }
    return created
  }

  @ReactMethod
  fun getBandCount(promise: Promise) {
    try {
      val eq = ensureEqualizer()
      promise.resolve(eq.numberOfBands.toInt())
    } catch (e: Exception) {
      promise.reject("EQ", e.message, e)
    }
  }

  @ReactMethod
  fun setGlobalFxEnabled(enabled: Boolean) {
    try {
      isEnabled = enabled
      equalizer?.enabled = enabled
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun setBandMillibels(androidBandIndex: Int, millibel: Int) {
    try {
      val eq = ensureEqualizer()
      if (androidBandIndex < 0 || androidBandIndex >= eq.numberOfBands) {
        return
      }
      val range = eq.bandLevelRange
      val min = range[0].toInt()
      val max = range[1].toInt()
      val clamped = millibel.coerceIn(min, max).toShort()

      bandLevels[androidBandIndex] = clamped

      eq.setBandLevel(androidBandIndex.toShort(), clamped)
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun resetBands() {
    try {
      val eq = ensureEqualizer()
      for (i in 0 until eq.numberOfBands) {
        bandLevels[i] = 0
        eq.setBandLevel(i.toShort(), 0)
      }
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun setBassBoostEnabled(enabled: Boolean, strengthPermille: Int) {
    try {
      isBassBoostEnabled = enabled
      val s = strengthPermille.coerceIn(0, 1000).toShort()
      bassBoostStrength = s

      if (bassBoost == null) {
        bassBoost = BassBoost(0, if (currentSessionId != 0) currentSessionId else 0)
      }
      val bb = bassBoost ?: return
      bb.enabled = enabled
      if (enabled && bb.strengthSupported) {
        bb.setStrength(s)
      }
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun setVirtualizerEnabled(enabled: Boolean, strengthPermille: Int) {
    try {
      isVirtualizerEnabled = enabled
      val s = strengthPermille.coerceIn(0, 1000).toShort()
      virtualizerStrength = s

      if (virtualizer == null) {
        virtualizer = Virtualizer(0, if (currentSessionId != 0) currentSessionId else 0)
      }
      val vz = virtualizer ?: return
      vz.enabled = enabled
      if (enabled && vz.strengthSupported) {
        vz.setStrength(s)
      }
    } catch (_: Exception) {
    }
  }

  private fun releaseEffects() {
    try {
      equalizer?.release()
    } catch (_: Exception) {
    }
    equalizer = null
    try {
      bassBoost?.release()
    } catch (_: Exception) {
    }
    bassBoost = null
    try {
      virtualizer?.release()
    } catch (_: Exception) {
    }
    virtualizer = null
  }

  override fun invalidate() {
    try {
      reactContext.unregisterReceiver(receiver)
    } catch (_: Exception) {
    }
    releaseEffects()
    super.invalidate()
  }
}
