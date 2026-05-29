# Playback Flow

> Phase 8 — 播放系统完整流程 | 2026-05-24

---

## 完整播放生命周期

```
1. 用户点击 SongRow
   ↓
   musicPlayerStore.play(song)
   ├── song 已在 queue 中 → queueIndex 切换
   └── song 不在 queue 中 → 追加到 queue 末尾
   ↓
   state: { currentSong: song, isPlaying: true, queue: [...], queueIndex }

2. useAudioPlayer effect [currentSong?.id, currentSong?.audio_url]
   ↓
   PlaybackStabilizer.getPlayUrl(songId) → cached URL or fetch
   ↓
   AudioManager.load(url, callbacks)
   ├── destroy() 旧 Audio (如果有)
   ├── new Audio(url)
   ├── 绑定事件: loadstart/canplay/playing/waiting/error/progress/ended
   └── AudioManager.play()
       └── audio.play().catch(handle autoplay block)

3. AudioManager RAF tick (200ms throttle, ~5fps)
   ├── playing → RAF running
   ├── paused → RAF stopped
   ├── tab hidden → RAF stopped (Page Visibility API)
   └── on each tick:
       ├── callbacks.onTimeUpdate(t, d)
       │   └── musicPlayerStore.syncTime(t, d)
       │       └── UI re-render: ProgressBar, LyricsView
       └── callbacks.onBufferedChange(pct)
           └── musicPlayerStore.setBuffered(pct)

4. useLyricsSync effect [currentTime, lyrics]
   ↓
   LyricParser.findCurrentIndex(lyrics, currentTime * 1000)
   ↓
   musicPlayerStore.setCurrentLyricIndex(idx)
   ↓
   LyricsView re-render + scrollIntoView(smooth, center)

5. AudioManager 'ended' event
   ↓
   callbacks.onEnded()
   ↓
   musicPlayerStore.next()
   ├── sequential: 到末尾 → stop
   ├── repeat: 到末尾 → 回到第 0 首
   ├── repeat-one: 永远播当前首
   ├── shuffle: Fisher-Yates 随机避开当前
   └── 回到 step 2 (load new song)
```

---

## Seek 流程

```
ProgressBar drag → onSeek(time)
  ↓
musicPlayerStore.seek(time)
  ↓ state.currentTime = time (立即更新 UI)

useAudioPlayer subscribe [state.currentTime diff > 1.5s]
  ↓
AudioManager.seek(time)
  ↓ audio.currentTime = time
```

---

## 播放模式行为

| 模式 | 下一首 (queue 末尾) | 上一首 | 图标 |
|------|---------------------|--------|------|
| sequential | 停止播放 | <3s: 上一首, >=3s: 重播 | IconList |
| repeat | 回到第 0 首 | 同上 | IconRepeat |
| repeat-one | 当前首从头播放 | 同上 | IconRepeatOnce |
| shuffle | Fisher-Yates 随机 | 同上 | IconArrowsShuffle |

---

## 队列管理

```
setQueue(songs, startIndex?)
  └── queue = songs, queueIndex = startIndex ?? 0

addToQueue(song)
  └── queue.push(song)

removeFromQueue(index)
  ├── index < queueIndex → queueIndex--
  ├── index === queueIndex (当前首) → 重算
  │   └── 删除后 queue 空 → currentSong = null, stop
  │   └── index >= queue.length → 末尾
  └── index > queueIndex → 无影响

clearQueue()
  └── queue = [], queueIndex = -1, currentSong = null, stop
```

---

## 播放恢复流程 (Phase 8)

```
APP 启动
  ↓
usePlaybackRecovery (AudioProvider mount)
  ↓
loadRecoveryState() → localStorage
  ├── 无数据 → 不恢复
  ├── 过期 (>24h) → clear
  └── 有效 → restore:
      ├── volume, playMode, muted (立即恢复)
      ├── queueIds (保存但需重新 fetch Song objects)
      └── songId, position (保存但需重新 load audio)
  ↓
每 5s auto-save (playing 时)
beforeunload 紧急保存
```

---

## 错误恢复流程

```
音频加载失败:
  AudioManager 'error' event
  ↓
  callbacks.onError(msg)
  ↓
  AudioErrorBoundary catches → 显示重试 UI
  ↓
  用户点击重试 → 调用 onRetry → 重新 load

播放 URL 过期:
  PlaybackStabilizer → URL cache miss
  ↓
  ProviderManager.execute("getPlayUrl") → 自动 fallback
  ↓
  netease → qq → kuwo → mock

Provider 全部失败:
  FallbackNotice 显示
  ↓
  PlaybackStabilizer 使用最后一次成功的 URL
  ↓
  HealthTracker 30s 探测恢复
```

---

## 音量控制

```
VolumeSlider drag → onVolumeChange(vol)
  ↓
musicPlayerStore.setVolume(vol)  [clamp 0-1]
  ↓
useAudioPlayer effect [volume, isMuted]
  ↓
AudioManager.setVolume(effVol)
  effVol = isMuted ? 0 : volume
```
