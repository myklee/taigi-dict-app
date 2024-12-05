<template>
  
    <div class="cooker-bg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="77"
        height="57"
        fill="none"
      >
        <g id="lid">
          <path
            fill="#C9C9C9"
            stroke="#000"
            stroke-width="4"
            d="m14.784 18 3.764-11.172c15.55-1.92 24.842-1.867 40.368 0L62.304 18z"
          />
          <mask id="a" fill="#000">
            <path d="M33 0h11l-.917 4h-9.166z" />
          </mask>
          <path fill="#000" d="M33 0h11l-.917 4h-9.166z" />
          <path
            fill="#000"
            d="M33 0v-4h-5.02L29.1.894zm11 0 3.899.894L49.02-4H44zm-.917 4v4h3.187l.712-3.106zm-9.166 0-3.9.894L30.73 8h3.187zM33 4h11v-8H33zm7.101-4.894-.917 4 7.798 1.788.917-4zM43.083 0h-9.166v8h9.166zm-5.267 3.107-.917-4L29.1.893l.917 4z"
            mask="url(#a)"
          />
        </g>
        <path
          fill="#E8753C"
          stroke="#000"
          stroke-width="4"
          d="M16.352 52c-4.62-11.782-4.653-19.991-4.39-34h53.026q-.005 1.559-.006 3.026c-.013 11.587-.02 19.18-4.817 30.974z"
        />
        <path stroke="#000" stroke-width="4" d="M66 18h7M4 18h7" />
        <path fill="#000" d="M18 54h4v3h-4zM54 54h4v3h-4z" />
        <path
          fill="#C9C9C9"
          stroke="#000"
          stroke-width="4"
          d="m32.222 51.79 1.643-15.616c2.07-.827 3.638-1.177 5.13-1.174 1.496.003 3.066.36 5.14 1.18l1.643 15.61z"
        />
        <path fill="#000" d="M37 45h4v3h-4z" />
        <circle r="2" fill="#D9D9D9" class="steam-ball" />
        <circle r="2" fill="#D9D9D9" class="steam-ball-right" />
        <circle r="2" fill="#D9D9D9" class="steam-ball delay-1" />
        <circle r="2" fill="#D9D9D9" class="steam-ball-right delay-1" />
        <circle r="2" fill="#D9D9D9" class="steam-ball delay-2" />
        <circle r="2" fill="#D9D9D9" class="steam-ball-right delay-2" />
        <!-- <circle r="2" fill="#D9D9D9" class="steam-ball delay-1" />
      <circle r="2" fill="#D9D9D9" class="steam-ball delay-2" />
      <circle r="2" fill="#D9D9D9" class="steam-ball delay-3" />

      <circle r="2" fill="#D9D9D9" class="steam-ball right" />
      <circle r="2" fill="#D9D9D9" class="steam-ball right delay-1" />
      <circle r="2" fill="#D9D9D9" class="steam-ball right delay-2" />
      <circle r="2" fill="#D9D9D9" class="steam-ball right delay-3" /> -->
      </svg>
    </div>
</template>
<script>
export default {};
</script>
<style scoped>
.cooker-bg {
  position: fixed;
  bottom: 1vh;
  left: calc(50% - 50px);
  /* right: 0; */
  background-color: var(--gunmetal);
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000000;
}


/* 
example-enter-active: Applied during the entering transition.
example-enter-from: The initial state before the transition.
example-enter-to: The final state after the entering transition.
example-leave-active: Applied during the leaving transition.
example-leave-from: The initial state before the leaving transition.
example-leave-to: The final state after the leaving transition. */

.steam-ball,
.steam-ball-right {
  width: 5px;
  height: 5px;
  opacity: 0;
  animation: steam-rise 0.6s ease-out infinite;
}
.steam-ball-right {
  animation: steam-rise-right 0.7s ease-out infinite;
}

.delay-1 {
  animation-delay: 0.05s;
}
.delay-2 {
  animation-delay: 0.22s;
}
.delay-3 {
  animation-delay: 0.3s;
}

@keyframes steam-rise {
  0% {
    transform: translateX(20px) translateY(20px) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(5px) translateY(5px) scale(2);
    opacity: 0;
  }
}
@keyframes steam-rise-right {
  0% {
    transform: translateX(57px) translateY(20px) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateX(72px) translateY(5px) scale(2);
    opacity: 0;
  }
}

#lid {
  animation: rattle 0.4s linear infinite;
  transform-origin: center center;
}

@keyframes rattle {
  0% {
    transform: rotate(-3deg);
  }
  25% {
    transform: rotate(4deg);
  }
  50% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(3deg);
  }
  100% {
    transform: rotate(-2deg);
  }
}
</style>
