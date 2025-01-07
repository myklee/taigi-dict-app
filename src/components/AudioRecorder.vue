<template>
  <div class="audio-recorder">
    <h1>Audio Recorder</h1>
    <button @click="startRecording" :disabled="isRecording">
      Start Recording
    </button>
    <button @click="stopRecording" :disabled="!isRecording">
      Stop Recording
    </button>
    <audio v-if="audioURL" :src="audioURL" controls></audio>
    <button v-if="audioURL" @click="uploadAudio">Upload Audio</button>
  </div>
</template>

<script>
import { ref } from "vue";
import { supabase } from "/src/supabase.js";

export default {
  props: {
    wordId: {
      type: Number,
      required: true,
    },
    mknoll: {
      type: Boolean,
    },
  },
  setup(props) {
    const mediaRecorder = ref(null);
    const audioChunks = ref([]);
    const isRecording = ref(false);
    const audioURL = ref(null);

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorder.value = new MediaRecorder(stream);

        mediaRecorder.value.ondataavailable = (event) => {
          audioChunks.value.push(event.data);
        };

        mediaRecorder.value.onstop = () => {
          const blob = new Blob(audioChunks.value, { type: "audio/webm" });
          audioURL.value = URL.createObjectURL(blob);
        };

        mediaRecorder.value.start();
        isRecording.value = true;
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Microphone access is required for recording.");
      }
    };

    const stopRecording = () => {
      if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
        mediaRecorder.value.stop();
        isRecording.value = false;
      }
    };

    const uploadAudio = async () => {
      if (!audioURL.value) return;

      const response = await fetch(audioURL.value);
      const blob = await response.blob();

      const fileName = `audio-${props.wordId}-${Date.now()}.webm`;

      try {
        const { data, error } = await supabase.storage
          .from("audio-files")
          .upload(fileName, blob);

        if (error) {
          console.error("Error uploading audio:", error);
          alert("Failed to upload audio.");
          return;
        }

        const publicUrl = supabase.storage
          .from("audio-files")
          .getPublicUrl(fileName).data.publicUrl;

        if (props.mknoll) {
          const { error: dbError } = await supabase
            .from("maryknoll")
            .update({
              audio_url: publicUrl,
            })
            .eq("id", props.wordId);
          if (dbError) {
            console.error("Error saving audio URL to database:", dbError);
          } else {
            alert(`Audio uploaded successfully for word ID ${props.wordId}`);
          }
        } else {
          alert("didnt work");
          console.log(props.wordId);
          // const { error: dbError } = await supabase
          //   .from("words")
          //   .update({
          //     audio_url: publicUrl,
          //   })
          //   .eq("id", props.wordId);
          // if (dbError) {
          //   console.error("Error saving audio URL to database:", dbError);
          // } else {
          //   alert(`Audio uploaded successfully for word ID ${props.wordId}`);
          // }
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
      }
    };

    return {
      startRecording,
      stopRecording,
      uploadAudio,
      isRecording,
      audioURL,
    };
  },
};
</script>
