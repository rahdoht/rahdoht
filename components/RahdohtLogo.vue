<template>
  <img class="RahdohtLogo" alt="rahdoht" src="/my_couch_now.png" />
</template>

<style>
.RahdohtLogo {
  height: 100%;
  width: 100%;
  transform: rotateY(180deg);
  animation: turn 1.5s ease-out forwards 1s;
}

@keyframes turn {
  100% {
    transform: rotateY(0deg);
  }
}
</style>
