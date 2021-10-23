<template>
  <img
    class="RahdohtLogo"
    alt="rahdoht"
    src="/my_couch_now.png"
  >
</template>

<style>
.RahdohtLogo {
  height: 380px;
  width: 380px;
  transform: rotateY(560deg);
  animation: turn 3.5s ease-out forwards 1s;
}

@keyframes turn {
  100% {
    transform: rotateY(0deg);
  }
}
</style>
