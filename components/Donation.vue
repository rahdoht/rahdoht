<template>
  <span>
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <span
          v-bind="attrs"
          v-on="on"
          @click="copyToClipboard, (snackbar = true)"
        >
          <img :src="coin.url" class="cryptoicon" />
        </span>
        <v-snackbar v-model="snackbar" :timeout="timeout">
          <center>{{ snackbarText }}</center>
        </v-snackbar>
      </template>
      <span>{{ coin.address }}</span>
    </v-tooltip>
  </span>
</template>

<style>
.cryptoicon {
    vertical-align: middle;
    max-height: 18px;
}
</style>

<script>
export default {
  data() {
    return {
      snackbar: false,
      snackbarText: "wallet address copied to clipboard",
      timeout: 1234
    };
  },
  props: ["coin"],
  methods: {
    copyToClipboard() {
      navigator.clipboard.writeText(coin.address);
    }
  }
};
</script>
