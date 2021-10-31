<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card
        class="mx-auto"
        max-width="500"
        >
        <RahdohtLogo />
        <v-card-title class="headline">
          bienvenue au jardin de rahdoht
        </v-card-title>
        <v-card-subtitle>
          just a couch doing its part
        </v-card-subtitle>
        <v-card-text>
          <NuxtLink to=/wassies>
            All Wassies Are Rare Calculator
          </NuxtLink>
        </v-card-text>
        <v-card-text class="text-right">
          <a href="https://twitter.com/rahdoht" target="_blank">
            <img src="/twitter.svg" class="links" />
          </a>
          <a href="https://github.com/rahdoht" target="_blank">
            <img src="/github.png" class="links" />
          </a>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style>
.links {
  max-height: 28px;
}
</style>