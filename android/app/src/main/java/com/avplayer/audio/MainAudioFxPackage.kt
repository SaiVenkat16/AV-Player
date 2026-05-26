package com.avplayer.audio

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.avplayer.video.NativeVideoPlayerModule

class MainAudioFxPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      MainAudioFxModule(reactContext),
      MetadataRetrieverModule(reactContext),
      VideoMetadataRetrieverModule(reactContext),
      NativeVideoPlayerModule(reactContext),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
