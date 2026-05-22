package com.avplayer.audio

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

  override fun getName(): String = "MainAudioFx"

  private fun ensureEqualizer(): Equalizer {
    val existing = equalizer
    if (existing != null) {
      return existing
    }
    val created = Equalizer(0, 0)
    created.enabled = true
    equalizer = created
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
      ensureEqualizer().enabled = enabled
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
      eq.setBandLevel(androidBandIndex.toShort(), clamped)
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun resetBands() {
    try {
      val eq = ensureEqualizer()
      for (i in 0 until eq.numberOfBands) {
        eq.setBandLevel(i.toShort(), 0)
      }
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun setBassBoostEnabled(enabled: Boolean, strengthPermille: Int) {
    try {
      if (bassBoost == null) {
        bassBoost = BassBoost(0, 0)
      }
      val bb = bassBoost ?: return
      bb.enabled = enabled
      if (enabled && bb.strengthSupported) {
        val s = strengthPermille.coerceIn(0, 1000).toShort()
        bb.setStrength(s)
      }
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun setVirtualizerEnabled(enabled: Boolean, strengthPermille: Int) {
    try {
      if (virtualizer == null) {
        virtualizer = Virtualizer(0, 0)
      }
      val vz = virtualizer ?: return
      vz.enabled = enabled
      if (enabled && vz.strengthSupported) {
        val s = strengthPermille.coerceIn(0, 1000).toShort()
        vz.setStrength(s)
      }
    } catch (_: Exception) {
    }
  }

  override fun invalidate() {
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
    super.invalidate()
  }
}
