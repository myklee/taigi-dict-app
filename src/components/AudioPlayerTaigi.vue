<template>
  <div class="audio-player">
    <!-- Audio Element (hidden but referenced in the script) -->
    <audio
      ref="audio"
      :src="audioSrc"
      @ended="audioEnded"
      @error="handleAudioError"
      preload="none"
    ></audio>
    <IconPlayAudio @click="togglePlay" :class="{ 'playing': isPlaying }"></IconPlayAudio>
  </div>
</template>

<script>
import IconPlayAudio from "./icons/IconPlayAudio.vue";

export default {
  props: {
    audioID: {
      type: String,
      required: true,
    },
  },
  components: {
    IconPlayAudio,
  },
  data() {
    return {
      isPlaying: false,
      hasError: false,
      baseSrc: "/src/assets/audio_taigi/",
    };
  },
  computed: {
    audioSrc() {
      if (!this.audioID) return "";
      const folder = this.getAudioFolder(this.audioID);
      if (folder === "Out of range") return "";
      
      // Use the public directory path for audio files
      const path = `/src/assets/audio_taigi/${folder}/${this.audioID}.mp3`;
      console.log(`Audio source path: ${path}`);
      return path;
    },
  },
  methods: {
    togglePlay() {
      if (this.hasError || !this.audioSrc) {
        console.warn("Audio not available");
        return;
      }

      const audio = this.$refs.audio;
      if (!audio) return;

      // Check if the audio file exists before playing
      this.checkAudioExists().then(exists => {
        if (!exists) {
          console.warn(`Audio file not found: ${this.audioSrc}`);
          this.hasError = true;
          return;
        }

        try {
          if (this.isPlaying) {
            audio.pause();
          } else {
            audio.play().catch(error => {
              console.error("Error playing audio:", error);
              this.hasError = true;
            });
          }
          this.isPlaying = !this.isPlaying;
        } catch (error) {
          console.error("Error toggling audio:", error);
          this.hasError = true;
        }
      });
    },
    async checkAudioExists() {
      try {
        const response = await fetch(this.audioSrc, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        console.error("Error checking audio file:", error);
        return false;
      }
    },
    audioEnded() {
      this.isPlaying = false;
    },
    handleAudioError(event) {
      console.error("Audio error for path:", this.audioSrc, event);
      this.hasError = true;
      this.isPlaying = false;
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
  beforeDestroy() {
    // Clean up audio
    const audio = this.$refs.audio;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  },
};
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
}
svg {
  flex-shrink: 0;
}
.play-taigi {
  cursor: pointer;
}
.playing {
  opacity: 0.7;
}
</style>
