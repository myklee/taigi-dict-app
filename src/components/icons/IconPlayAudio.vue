<template>
  <div class="icon-play-container">
    <svg
      class="play-audio"
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M19.9177 4.9473L19.4897 4.3313L18.2577 5.1873L18.6857 5.8023C21.3027 9.5713 21.3027 14.4363 18.6857 18.1973L18.2577 18.8123L19.4887 19.6693L19.9177 19.0533C22.8497 14.8393 22.8497 9.1703 19.9177 4.9473Z"
        
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17.2312 7.6226L16.8582 6.9716L15.5572 7.7166L15.9292 8.3676C17.2142 10.6126 17.2142 13.3966 15.9302 15.6336L15.5562 16.2836L16.8572 17.0306L17.2312 16.3806C18.7792 13.6836 18.7792 10.3276 17.2312 7.6226Z"
        
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.0788 7.564H2.3848V8.064C2.3828 10.688 2.3828 13.312 2.3848 15.937V16.436H7.0788L11.2048 20.013H12.6678V3.987H11.2048L7.0788 7.564Z"
        
      />
    </svg>
  </div>
</template>
<style scoped>
.icon-play-container {
  width: 32px;
  height: 32px;
  border: 1px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.play-audio {
  fill: var(--playAudioIcon);
  width: 20px;
  height: 20px;
}
</style>
