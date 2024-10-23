<template>
  <div class="audio-player">
    <!-- Audio Element (hidden but referenced in the script) -->
    <audio
      ref="audio"
      :src="`${this.baseSrc}${getAudioFolder(audioID)}/${audioID}.mp3`"
      @ended="audioEnded"
    >
      {{ audioID }}
    </audio>

    <!-- Play/Pause Button -->
    <button @click="togglePlay">{{ isPlaying ? "Pause" : "Play" }}</button>
  </div>
</template>

<script>
export default {
  props: {
    audioID: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isPlaying: false, // Boolean to track whether the audio is playing
      duration: 0, // Total audio duration
      currentTime: 0, // Current playback position
      baseSrc: "src/assets/audio_taigi/",
    };
  },
  computed: {
    fullSrc() {
      return `${this.baseSrc}${getAudioFolder(this.audioid)}/${audioid}.mp3`;
    },
  },
  methods: {
    // Toggle between play and pause
    togglePlay() {
      const audio = this.$refs.audio;
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },
    audioEnded() {
      this.isPlaying = false; // Set to false when audio ends
      console.log("Audio has finished playing.");
    },
    getAudioFolder(audioid) {
      console.log(audioid);
      if (audioid) {
        const audioidnum = parseInt(audioid.match(/^(\d+)\(/)[1]);
        // console.log(audioid);
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
          return "Out of range"; // Optional, if you want to handle numbers >= 29000
        }
      }
    },
  },
  mounted() {
    const audio = this.$refs.audio;
  },
  beforeDestroy() {
    const audio = this.$refs.audio;
  },
};
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
span {
  font-family: Arial, sans-serif;
  font-size: 14px;
}
</style>
