package com.avplayer.audio

import android.media.MediaMetadataRetriever
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.File

class MetadataRetrieverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MetadataRetriever"
    }

    @ReactMethod
    fun getMetadata(path: String, promise: Promise) {
        val retriever = MediaMetadataRetriever()
        try {
            var cleanPath = path
            if (cleanPath.startsWith("file://")) {
                cleanPath = cleanPath.substring(7)
            }

            val file = File(cleanPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "File not found at: $cleanPath")
                return
            }

            retriever.setDataSource(reactApplicationContext, android.net.Uri.fromFile(file))
            val map = Arguments.createMap()
            
            // Basic Tags
            val title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
            val artist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
            val album = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
            val genre = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE)
            val year = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)
            
            map.putString("title", title ?: "")
            map.putString("artist", artist ?: "")
            map.putString("album", album ?: "")
            map.putString("genre", genre ?: "")
            map.putString("year", year ?: "")
            
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            if (durationStr != null) {
                map.putInt("duration", durationStr.toInt() / 1000)
            } else {
                map.putInt("duration", 0)
            }

            // Extract Album Art
            val artBytes = retriever.embeddedPicture
            if (artBytes != null) {
                val base64Art = Base64.encodeToString(artBytes, Base64.NO_WRAP)
                map.putString("albumArtBase64", base64Art)
            }

            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("METADATA_ERROR", "Retriever failed for $path: ${e.message}")
        } finally {
            try {
                retriever.release()
            } catch (e: Exception) {}
        }
    }
}
