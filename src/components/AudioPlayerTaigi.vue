<template>
  <div class="audio-player" :class="{ 'has-error': hasError, 'is-loading': isLoading }">
    <!-- Audio Element (hidden but referenced in the script) -->
    <audio
      ref="audio"
      :src="audioSrc"
      @ended="audioEnded"
      @error="handleAudioError"
      @loadstart="handleLoadStart"
      @canplay="handleCanPlay"
      preload="none"
    ></audio>
    
    <!-- Audio Control Button -->
    <TouchTarget
      class="audio-control"
      :class="{ 
        'is-playing': isPlaying, 
        'has-error': hasError,
        'is-loading': isLoading,
        'is-disabled': !audioSrc || (hasError && !(retryOnError && retryCount < maxRetries)),
        'network-error': networkError,
        'file-not-found': fileNotFound
      }"
      @click="togglePlay"
      :aria-label="getAriaLabel()"
      :disabled="!audioSrc || (hasError && !(retryOnError && retryCount < maxRetries))"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="hasError" class="error-indicator">
        <!-- Retry icon if retries available -->
        <svg v-if="retryOnError && retryCount < maxRetries" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
        </svg>
        <!-- Error icon if no retries -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
      </div>
      
      <!-- Play/Pause Icon -->
      <div v-else class="play-icon">
        <IconPlayAudio 
          :size="20"
          :is-playing="isPlaying"
          :show-waves="true"
          :show-indicator="false"
        />
      </div>
      
      <!-- Visual feedback overlay -->
      <div class="touch-feedback"></div>
    </TouchTarget>
    
    <!-- Error Message (for screen readers and optional display) -->
    <div v-if="hasError && showErrorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import IconPlayAudio from "./icons/IconPlayAudio.vue";
import TouchTarget from "./utility/TouchTarget.vue";

export default {
  props: {
    audioID: {
      type: String,
      required: true,
    },
    showErrorMessage: {
      type: Boolean,
      default: false,
    },
    retryOnError: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['audio-error', 'audio-play', 'audio-ended', 'audio-retry'],
  components: {
    IconPlayAudio,
    TouchTarget,
  },
  data() {
    return {
      isPlaying: false,
      hasError: false,
      isLoading: false,
      errorMessage: '',
      retryCount: 0,
      maxRetries: 2,
      baseSrc: "/src/assets/audio_taigi/",
      audioLoadTimeout: null,
      networkError: false,
      fileNotFound: false,
    };
  },
  computed: {
    audioSrc() {
      if (!this.audioID) return "";
      const folder = this.getAudioFolder(this.audioID);
      if (folder === "Out of range") return "";
      
      // Use Supabase Storage URL for audio files
      const path = `${folder}/${this.audioID}.mp3`;
      const supabaseUrl = `https://oqwvljqwtearyepyaslo.supabase.co/storage/v1/object/public/audio-files/${path}`;
      console.log(`Audio source path: ${supabaseUrl}`);
      return supabaseUrl;
    },
  },
  methods: {
    async togglePlay() {
      if (this.hasError || !this.audioSrc || this.isLoading) {
        if (this.hasError && this.retryOnError && this.retryCount < this.maxRetries) {
          this.retryPlayback();
        }
        return;
      }

      const audio = this.$refs.audio;
      if (!audio) return;

      try {
        if (this.isPlaying) {
          audio.pause();
          this.isPlaying = false;
        } else {
          this.isLoading = true;
          
          // Set a loading timeout
          this.audioLoadTimeout = setTimeout(() => {
            if (this.isLoading) {
              this.handleError('Audio loading timeout', 'network');
            }
          }, 10000); // 10 second timeout
          
          // Check if the audio file exists before playing
          const exists = await this.checkAudioExists();
          if (!exists) {
            return; // Error already handled in checkAudioExists
          }

          await audio.play();
          this.isPlaying = true;
          this.hasError = false;
          this.errorMessage = '';
          this.networkError = false;
          this.fileNotFound = false;
          
          // Clear timeout on successful play
          if (this.audioLoadTimeout) {
            clearTimeout(this.audioLoadTimeout);
            this.audioLoadTimeout = null;
          }
          
          // Emit success event
          this.$emit('audio-play', { audioId: this.audioID });
        }
      } catch (error) {
        this.handleError(`Error playing audio: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    },

    retryPlayback() {
      this.retryCount++;
      this.hasError = false;
      this.errorMessage = '';
      this.isLoading = false;
      this.networkError = false;
      this.fileNotFound = false;
      
      // Clear any existing timeout
      if (this.audioLoadTimeout) {
        clearTimeout(this.audioLoadTimeout);
        this.audioLoadTimeout = null;
      }
      
      // Reset audio element
      const audio = this.$refs.audio;
      if (audio) {
        audio.load();
      }
      
      // Emit retry event
      this.$emit('audio-retry', { 
        audioId: this.audioID, 
        retryCount: this.retryCount 
      });
      
      // Try playing again after a short delay
      setTimeout(() => {
        this.togglePlay();
      }, 500);
    },

    handleError(message, errorType = 'generic') {
      console.error(message);
      this.hasError = true;
      this.isPlaying = false;
      this.isLoading = false;
      
      // Clear any existing timeout
      if (this.audioLoadTimeout) {
        clearTimeout(this.audioLoadTimeout);
        this.audioLoadTimeout = null;
      }
      
      // Set error type flags
      this.networkError = errorType === 'network';
      this.fileNotFound = errorType === 'notfound';
      
      // Set user-friendly error messages
      if (this.retryOnError && this.retryCount < this.maxRetries) {
        if (errorType === 'network') {
          this.errorMessage = 'Network error. Tap to retry.';
        } else if (errorType === 'notfound') {
          this.errorMessage = 'Audio file not found. Tap to retry.';
        } else {
          this.errorMessage = 'Audio failed to load. Tap to retry.';
        }
      } else {
        this.errorMessage = 'Audio not available';
      }
      
      // Emit error event for parent components
      this.$emit('audio-error', {
        message: this.errorMessage,
        type: errorType,
        canRetry: this.retryOnError && this.retryCount < this.maxRetries,
        audioId: this.audioID
      });
    },

    getAriaLabel() {
      if (this.hasError) {
        return this.retryOnError && this.retryCount < this.maxRetries 
          ? 'Audio failed to load, click to retry'
          : 'Audio not available';
      }
      if (this.isLoading) {
        return 'Loading audio...';
      }
      if (this.isPlaying) {
        return 'Pause audio pronunciation';
      }
      return 'Play audio pronunciation';
    },

    handleLoadStart() {
      this.isLoading = true;
    },

    handleCanPlay() {
      this.isLoading = false;
    },
    async checkAudioExists() {
      try {
        // Set a timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(this.audioSrc, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            this.handleError(`Audio file not found: ${this.audioID}`, 'notfound');
          } else {
            this.handleError(`HTTP error ${response.status}: ${response.statusText}`, 'network');
          }
          return false;
        }
        
        return true;
      } catch (error) {
        if (error.name === 'AbortError') {
          this.handleError('Request timeout - audio file took too long to load', 'network');
        } else {
          this.handleError(`Network error checking audio file: ${error.message}`, 'network');
        }
        return false;
      }
    },
    audioEnded() {
      this.isPlaying = false;
      this.isLoading = false;
      
      // Clear timeout if still active
      if (this.audioLoadTimeout) {
        clearTimeout(this.audioLoadTimeout);
        this.audioLoadTimeout = null;
      }
      
      // Emit ended event
      this.$emit('audio-ended', { audioId: this.audioID });
    },
    handleAudioError(event) {
      let errorType = 'generic';
      let errorMessage = `Audio error for path: ${this.audioSrc}`;
      
      // Determine error type based on the audio element's error
      const audio = this.$refs.audio;
      if (audio && audio.error) {
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_ABORTED:
            errorMessage += ' - Playback aborted';
            errorType = 'aborted';
            break;
          case audio.error.MEDIA_ERR_NETWORK:
            errorMessage += ' - Network error';
            errorType = 'network';
            break;
          case audio.error.MEDIA_ERR_DECODE:
            errorMessage += ' - Decode error';
            errorType = 'decode';
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage += ' - Source not supported';
            errorType = 'unsupported';
            break;
          default:
            errorMessage += ' - Unknown error';
        }
      }
      
      this.handleError(errorMessage, errorType);
    },
    getAudioFolder(audioid) {
      if (!audioid) return "Out of range";
      
      try {
        const match = audioid.match(/^(\d+)\(/);
        if (!match) return "Out of range";
        
        const audioidnum = parseInt(match[1]);
        
        if (audioidnum < 1000) {
          return "0";
        } else if (audioidnum >= 1000 && audioidnum < 2000) {
          return "1";
        } else if (audioidnum >= 2000 && audioidnum < 3000) {
          return "2";
        } else if (audioidnum >= 3000 && audioidnum < 4000) {
          return "3";
        } else if (audioidnum >= 4000 && audioidnum < 5000) {
          return "4";
        } else if (audioidnum >= 5000 && audioidnum < 6000) {
          return "5";
        } else if (audioidnum >= 6000 && audioidnum < 7000) {
          return "6";
        } else if (audioidnum >= 7000 && audioidnum < 8000) {
          return "7";
        } else if (audioidnum >= 8000 && audioidnum < 9000) {
          return "8";
        } else if (audioidnum >= 9000 && audioidnum < 10000) {
          return "9";
        } else if (audioidnum >= 10000 && audioidnum < 11000) {
          return "10";
        } else if (audioidnum >= 11000 && audioidnum < 12000) {
          return "11";
        } else if (audioidnum >= 12000 && audioidnum < 13000) {
          return "12";
        } else if (audioidnum >= 13000 && audioidnum < 14000) {
          return "13";
        } else if (audioidnum >= 14000 && audioidnum < 15000) {
          return "14";
        } else if (audioidnum >= 15000 && audioidnum < 16000) {
          return "15";
        } else if (audioidnum >= 16000 && audioidnum < 17000) {
          return "16";
        } else if (audioidnum >= 17000 && audioidnum < 18000) {
          return "17";
        } else if (audioidnum >= 18000 && audioidnum < 19000) {
          return "18";
        } else if (audioidnum >= 19000 && audioidnum < 20000) {
          return "19";
        } else if (audioidnum >= 20000 && audioidnum < 21000) {
          return "20";
        } else if (audioidnum >= 21000 && audioidnum < 22000) {
          return "21";
        } else if (audioidnum >= 22000 && audioidnum < 23000) {
          return "22";
        } else if (audioidnum >= 23000 && audioidnum < 24000) {
          return "23";
        } else if (audioidnum >= 24000 && audioidnum < 25000) {
          return "24";
        } else if (audioidnum >= 25000 && audioidnum < 26000) {
          return "25";
        } else if (audioidnum >= 26000 && audioidnum < 27000) {
          return "26";
        } else if (audioidnum >= 27000 && audioidnum < 28000) {
          return "27";
        } else if (audioidnum >= 28000 && audioidnum < 29000) {
          return "28";
        } else {
          return "Out of range";
        }
      } catch (error) {
        console.error("Error parsing audio ID:", error);
        return "Out of range";
      }
    },
  },
  mounted() {
    // Initialize audio element
    const audio = this.$refs.audio;
    if (audio) {
      audio.load();
    }
  },
  beforeUnmount() {
    // Clean up audio
    const audio = this.$refs.audio;
    if (audio) {
      audio.pause();
      audio.src = "";
      audio.load();
    }
    
    // Clear any pending timeout
    if (this.audioLoadTimeout) {
      clearTimeout(this.audioLoadTimeout);
      this.audioLoadTimeout = null;
    }
  },
};
</script>

<style scoped>
.audio-player {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.audio-control {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target-min, 44px);
  min-height: var(--touch-target-min, 44px);
  border-radius: var(--radius-lg, 8px);
  background: transparent;
  border: 1px solid var(--gunmetal, #2d3143);
  color: var(--frenchGray, #acabb5);
  cursor: pointer;
  transition: all var(--transition-normal, 250ms ease);
  overflow: hidden;
}

.audio-control:hover:not(.is-disabled) {
  border-color: var(--slateGray, #6e83a0);
  color: var(--white, #f3f3f3);
  background: rgba(110, 131, 160, 0.1);
}

.audio-control:focus-visible {
  outline: 2px solid var(--slateGray, #6e83a0);
  outline-offset: 2px;
}

.audio-control.is-playing {
  background: rgba(110, 131, 160, 0.2);
  border-color: var(--slateGray, #6e83a0);
  color: var(--white, #f3f3f3);
}

.audio-control.is-loading {
  cursor: wait;
  border-color: var(--slateGray, #6e83a0);
}

.audio-control.has-error {
  border-color: #dc2626;
  color: #dc2626;
}

.audio-control.has-error:hover:not(.is-disabled) {
  background: rgba(220, 38, 38, 0.1);
}

/* Different error state colors */
.audio-control.has-error.network-error {
  border-color: #f59e0b;
  color: #f59e0b;
}

.audio-control.has-error.network-error:hover:not(.is-disabled) {
  background: rgba(245, 158, 11, 0.1);
}

.audio-control.has-error.file-not-found {
  border-color: #6b7280;
  color: #6b7280;
}

.audio-control.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.play-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.touch-feedback {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}

.audio-control:active:not(.is-disabled) .touch-feedback {
  opacity: 0.1;
}

.error-message {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-1, 4px);
  padding: var(--space-2, 8px);
  background: var(--raisinBlack, #1a1d29);
  border: 1px solid #dc2626;
  border-radius: var(--radius-md, 4px);
  font-size: var(--font-size-xs, 12px);
  color: #dc2626;
  text-align: center;
  z-index: 10;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .audio-control {
    min-width: var(--touch-target-comfortable, 48px);
    min-height: var(--touch-target-comfortable, 48px);
  }
  
  .play-icon,
  .loading-indicator,
  .error-indicator {
    width: 24px;
    height: 24px;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .audio-control {
    border-width: 2px;
  }
  
  .audio-control:focus-visible {
    outline-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .audio-control,
  .touch-feedback,
  .spinner {
    transition: none;
    animation: none;
  }
  
  .spinner {
    border-top-color: transparent;
    border-right-color: currentColor;
  }
}
</style>
