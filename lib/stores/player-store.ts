import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface PlayerState {
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number

  // Stem controls
  mutedStems: string[] // Array of stem IDs
  stemVolumes: Record<string, number> // stemId -> volume (0-1)
  soloStem: string | null // Only play this stem
  previousMutedStems: string[] // Store mute state before solo

  // Playback controls
  playbackSpeed: number // 0.5x to 2x
  isLooping: boolean
  loopRegion: { start: number; end: number } | null

  // Actions - Playback
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void

  // Actions - Stem controls
  toggleMute: (stemId: string) => void
  setVolume: (stemId: string, volume: number) => void
  setSolo: (stemId: string | null) => void
  muteAll: () => void
  unmuteAll: () => void

  // Actions - Playback controls
  setPlaybackSpeed: (speed: number) => void
  toggleLoop: () => void
  setLoopRegion: (start: number | null, end: number | null) => void

  // Actions - Reset
  resetPlayer: () => void
}

const initialState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  mutedStems: [],
  stemVolumes: {},
  soloStem: null,
  previousMutedStems: [],
  playbackSpeed: 1,
  isLooping: false,
  loopRegion: null,
}

export const usePlayerStore = create<PlayerState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================================================================
      // PLAYBACK CONTROLS
      // ============================================================================

      play: () => set({ isPlaying: true }),

      pause: () => set({ isPlaying: false }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      seek: (time) => {
        const { duration, loopRegion } = get()
        let newTime = time

        // Clamp to duration
        newTime = Math.max(0, Math.min(duration, newTime))

        // If looping, clamp to loop region
        if (loopRegion) {
          newTime = Math.max(loopRegion.start, Math.min(loopRegion.end, newTime))
        }

        set({ currentTime: newTime })
      },

      setDuration: (duration) => {
        // Set duration to the maximum of existing or new duration
        set((state) => ({
          duration: Math.max(state.duration, duration)
        }))
      },

      setCurrentTime: (time) => {
        const { duration, loopRegion, isLooping } = get()

        // Handle looping
        if (isLooping && loopRegion) {
          if (time >= loopRegion.end) {
            set({ currentTime: loopRegion.start })
            return
          }
        } else if (time >= duration) {
          // End of track
          set({ isPlaying: false, currentTime: 0 })
          return
        }

        set({ currentTime: time })
      },

      // ============================================================================
      // STEM CONTROLS
      // ============================================================================

      toggleMute: (stemId) => {
        const { soloStem } = get()

        // Can't mute/unmute when in solo mode
        if (soloStem) return

        set((state) => ({
          mutedStems: state.mutedStems.includes(stemId)
            ? state.mutedStems.filter((id) => id !== stemId)
            : [...state.mutedStems, stemId]
        }))
      },

      setVolume: (stemId, volume) => {
        // Clamp volume between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume))

        set((state) => ({
          stemVolumes: { ...state.stemVolumes, [stemId]: clampedVolume }
        }))
      },

      setSolo: (stemId) => {
        if (!stemId) {
          // Clear solo mode - restore previous mute state
          set((state) => ({
            soloStem: null,
            mutedStems: state.previousMutedStems,
            previousMutedStems: []
          }))
          return
        }

        // Enter solo mode
        set((state) => {
          const allStemIds = Object.keys(state.stemVolumes)
          return {
            soloStem: stemId,
            previousMutedStems: state.mutedStems, // Save current mute state
            mutedStems: allStemIds.filter((id) => id !== stemId) // Mute all except solo
          }
        })
      },

      muteAll: () => {
        set((state) => ({
          mutedStems: Object.keys(state.stemVolumes)
        }))
      },

      unmuteAll: () => set({ mutedStems: [], soloStem: null }),

      // ============================================================================
      // PLAYBACK CONTROLS
      // ============================================================================

      setPlaybackSpeed: (speed) => {
        // Clamp speed between 0.5x and 2x
        const clampedSpeed = Math.max(0.5, Math.min(2, speed))
        set({ playbackSpeed: clampedSpeed })
      },

      toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),

      setLoopRegion: (start, end) => {
        if (start === null || end === null) {
          set({ loopRegion: null })
        } else {
          set({ loopRegion: { start, end } })
        }
      },

      // ============================================================================
      // RESET
      // ============================================================================

      resetPlayer: () => set(initialState)
    }),
    { name: 'player-store' }
  )
)
