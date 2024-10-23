<template>
  <div class="audio-player">
    <!-- Audio Element (hidden but referenced in the script) -->
    <audio
      ref="audio"
      :src="`${this.baseSrc}${getAudioFolder(audioID)}/${audioID}.mp3`"
      @ended="audioEnded"
    ></audio>
    <IconPlayAudio @click="togglePlay"></IconPlayAudio>
    <!-- Play/Pause Button -->
    <!-- <div class="play-taigi play-audio" @click="togglePlay">
      <svg
        v-if="isPlaying"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3 5.76923C3 4.23983 4.19884 3 5.67769 3H7.98347C9.46232 3 10.6612 4.23983 10.6612 5.76923V18.2308C10.6612 19.7602 9.46232 21 7.98347 21H5.67769C4.19884 21 3 19.7602 3 18.2308V5.76923ZM5.67769 4.73077H7.98347C8.53804 4.73077 8.9876 5.1957 8.9876 5.76923V18.2308C8.9876 18.8043 8.53804 19.2692 7.98347 19.2692H5.67769C5.12312 19.2692 4.67355 18.8043 4.67355 18.2308V5.76923C4.67355 5.1957 5.12312 4.73077 5.67769 4.73077Z"
          fill="#ccc"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M13.3388 5.76923C13.3388 4.23983 14.5377 3 16.0165 3H18.3223C19.8012 3 21 4.23983 21 5.76923V18.2308C21 19.7602 19.8012 21 18.3223 21H16.0165C14.5377 21 13.3388 19.7602 13.3388 18.2308V5.76923ZM16.0165 4.73077H18.3223C18.8769 4.73077 19.3264 5.1957 19.3264 5.76923V18.2308C19.3264 18.8043 18.8769 19.2692 18.3223 19.2692H16.0165C15.462 19.2692 15.0124 18.8043 15.0124 18.2308V5.76923C15.0124 5.1957 15.462 4.73077 16.0165 4.73077Z"
          fill="#ccc"
        />
      </svg>
      <svg
        v-else
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.7907 9.87402C20.4031 10.8189 20.4031 13.1811 18.7907 14.126L7.62791 20.6674C6.0155 21.6123 4 20.4312 4 18.5415L4 5.45853C4 3.56877 6.0155 2.38767 7.62791 3.33255L18.7907 9.87402ZM17.8605 12.4906C18.2326 12.2726 18.2326 11.7274 17.8605 11.5094L6.69767 4.96792C6.32558 4.74987 5.86046 5.02243 5.86046 5.45853L5.86046 18.5415C5.86046 18.9776 6.32558 19.2501 6.69767 19.0321L17.8605 12.4906Z"
          fill="#ccc"
        />
      </svg>
    </div> -->
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
      isPlaying: false, // Boolean to track whether the audio is playing
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
  height: 24px;
}
.play-taigi {
  cursor: pointer;
}
</style>
