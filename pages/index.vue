<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card class="mx-auto" max-width="400">
        <RahdohtLogo />
        <v-card-title class="headline">
          bienvenue au jardin de rahdoht
        </v-card-title>
        <v-card-subtitle>
          expanding into the metaverse
        </v-card-subtitle>
        <v-card-text>
          <NuxtLink to=/wassies>
            All Wassies are Rare Calculator
          </NuxtLink>
          <hr class="my-3" />
          <a href="https://twitter.com/rahdoht" target="_blank">
            <img src="/twitter.png" height="28" />
          </a>
          <a href="https://github.com/rahdoht" target="_blank">
            <img src="/octocat.jpg" height="28" />
          </a>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
