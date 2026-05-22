package com.avplayer.audio

import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max

class VideoMetadataRetrieverModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "VideoMetadataRetriever"
    }

    @ReactMethod
    fun getMetadata(path: String, options: ReadableMap?, promise: Promise) {
        val retriever = MediaMetadataRetriever()

        try {
            configureDataSource(retriever, path)

            val durationMs =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                    ?.toLongOrNull() ?: 0L
            val rawWidth =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
                    ?.toIntOrNull() ?: 0
            val rawHeight =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
                    ?.toIntOrNull() ?: 0
            val rotation =
                retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
                    ?.toIntOrNull() ?: 0

            val width =
                if (rotation == 90 || rotation == 270) rawHeight else rawWidth
            val height =
                if (rotation == 90 || rotation == 270) rawWidth else rawHeight

            val previewTimes = buildPreviewTimes(durationMs, options)
            val thumbnailUri = generatePreviewFrame(retriever, path, previewTimes)

            val map = Arguments.createMap()
            map.putInt("duration", (durationMs / 1000L).toInt())
            map.putInt("width", width)
            map.putInt("height", height)
            map.putInt("rotation", rotation)
            if (thumbnailUri == null) {
                map.putNull("thumbnailUri")
            } else {
                map.putString("thumbnailUri", thumbnailUri)
            }
            promise.resolve(map)
        } catch (error: Exception) {
            promise.reject(
                "VIDEO_METADATA_ERROR",
                "Retriever failed for $path: ${error.message}",
                error,
            )
        } finally {
            try {
                retriever.release()
            } catch (_: Exception) {
                // Ignore cleanup failures.
            }
        }
    }

    private fun configureDataSource(
        retriever: MediaMetadataRetriever,
        rawPath: String,
    ) {
        when {
            rawPath.startsWith("content://") -> {
                retriever.setDataSource(reactApplicationContext, Uri.parse(rawPath))
            }

            rawPath.startsWith("file://") -> {
                val localPath = rawPath.removePrefix("file://")
                retriever.setDataSource(localPath)
            }

            else -> {
                retriever.setDataSource(rawPath)
            }
        }
    }

    private fun buildPreviewTimes(durationMs: Long, options: ReadableMap?): List<Long> {
        val requested = mutableListOf<Long>()
        if (options?.hasKey("previewTimesMs") == true) {
            val previewTimes = options.getArray("previewTimesMs")
            requested.addAll(readPreviewTimes(previewTimes))
        }
        if (requested.isEmpty()) {
            requested.addAll(listOf(750L, 1500L, 3000L, 0L))
        }

        val maxTimestamp = max(0L, durationMs - 1L)
        return requested
            .map { timeMs -> timeMs.coerceIn(0L, maxTimestamp) }
            .distinct()
    }

    private fun readPreviewTimes(previewTimes: ReadableArray?): List<Long> {
        if (previewTimes == null) {
            return emptyList()
        }

        val values = mutableListOf<Long>()
        for (index in 0 until previewTimes.size()) {
            val value = previewTimes.getDouble(index).toLong()
            values.add(max(0L, value))
        }
        return values
    }

    private fun generatePreviewFrame(
        retriever: MediaMetadataRetriever,
        path: String,
        previewTimes: List<Long>,
    ): String? {
        val cacheDir = File(reactApplicationContext.cacheDir, "video-thumbnails")
        if (!cacheDir.exists()) {
            cacheDir.mkdirs()
        }

        val pathHash = hashPath(path)
        for (timeMs in previewTimes) {
            val cacheFile =
                File(cacheDir, "video-thumb-$pathHash-$timeMs-v2.jpg")
            if (cacheFile.exists()) {
                return "file://${cacheFile.absolutePath}"
            }

            val frame = extractFrame(retriever, timeMs)
            if (frame == null) {
                continue
            }

            try {
                if (isEffectivelyBlack(frame)) {
                    continue
                }
                FileOutputStream(cacheFile).use { stream ->
                    frame.compress(Bitmap.CompressFormat.JPEG, 90, stream)
                    stream.flush()
                }
                return "file://${cacheFile.absolutePath}"
            } finally {
                frame.recycle()
            }
        }
        return null
    }

    private fun extractFrame(
        retriever: MediaMetadataRetriever,
        timeMs: Long,
    ): Bitmap? {
        val frameAtUs = timeMs * 1000L
        return if (android.os.Build.VERSION.SDK_INT >= 27) {
            retriever.getScaledFrameAtTime(
                frameAtUs,
                MediaMetadataRetriever.OPTION_CLOSEST,
                360,
                360,
            )
        } else {
            retriever.getFrameAtTime(
                frameAtUs,
                MediaMetadataRetriever.OPTION_CLOSEST,
            )?.let { raw ->
                Bitmap.createScaledBitmap(raw, 360, 360, true).also {
                    if (it !== raw) {
                        raw.recycle()
                    }
                }
            }
        }
    }

    private fun isEffectivelyBlack(bitmap: Bitmap): Boolean {
        if (bitmap.width <= 0 || bitmap.height <= 0) {
            return true
        }

        val stepX = max(1, bitmap.width / 12)
        val stepY = max(1, bitmap.height / 12)
        var luminanceSum = 0L
        var samples = 0

        var y = 0
        while (y < bitmap.height) {
            var x = 0
            while (x < bitmap.width) {
                val pixel = bitmap.getPixel(x, y)
                val luminance =
                    (Color.red(pixel) * 299 +
                        Color.green(pixel) * 587 +
                        Color.blue(pixel) * 114) / 1000
                luminanceSum += luminance.toLong()
                samples += 1
                x += stepX
            }
            y += stepY
        }

        if (samples == 0) {
            return true
        }

        return luminanceSum / samples < 22L
    }

    private fun hashPath(path: String): Int {
        var hash = 0
        for (char in path) {
            hash = (hash * 31 + char.code) % 2147483647
        }
        return kotlin.math.abs(hash)
    }
}
