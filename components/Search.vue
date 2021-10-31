<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10" sm="8" md="8">
        <v-text-field
          v-model="number"
          append-outer-icon="mdi-send"
          clear-icon="mdi-close-circle"
          label="Enter your wassie's number"
          type="number"
          min="0"
          max="12344"
          @click:append-outer="getWassie(number)"
          @keydown.enter.prevent="getWassie(number)"
        ></v-text-field>
      </v-col>
    </v-row>
    <div v-show="showPlatitude" class="text-center">
      <v-row>
        <v-col>
          <h1>
            <span style="color:gray">Rank</span> 1
            <span style="color:gray">of</span> 12345
          </h1>
          {{ this.platitude }}
        </v-col>
      </v-row>
    </div>
    <div>
      <v-row>
        <v-col>
          <v-img
            id="wassie"
            :src="wassieSrc"
            lazy-src="/my_couch_now.png"
            height="400"
            contain
          ></v-img>
        </v-col>
      </v-row>
    </div>
    <div v-show="showPlatitude" class="text-center">
      <v-row justify="center">
        <v-col cols="10" md="8">
          <v-simple-table dense>
            <tbody>
              <tr v-for="trait in traits" :key="trait.trait_type">
                <td class="trait-type">{{ trait.trait_type }}</td>
                <td class="trait-value">{{ trait.value }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style>
.trait-type {
  text-align: left;
  color: gray;
}
.trait-value {
  text-align: right;
}
</style>

<script>
export default {
  mounted() {
    this.wassieSrc = "";
  },
  data: () => ({
    prev: null,
    number: null,
    wassieSrc: "",
    traits: [],
    showPlatitude: false,
    platitude: "",
    platitudes: [
      "looks rare",
      "excuse me ser this is one of a kind",
      "omg is this yours?",
      "they're all good wassies, brent",
      "all wassies are rare",
      "1 wassie = 1 wassie",
      "you found a unique wassie!",
      "kill this rare wassie immediately",
      "perfect for wassie soup",
      "i think loomdart's mom wanted this one",
      "this wassie would look good under a rug",
      "so much lucky",
      "there can be only one",
      "ay imma i lan boi",
      "pump it loomdart",
      "probably nothing"
    ]
  }),

  methods: {
    getWassie(number) {
      if (number != this.prev) {
        this.wassieSrc = `https://arweave.net/ABckdetHKeV8VgUoIZ53TMDKkTi56LhTf-Gb1Mdqx9c/${number}.png`;
        this.fetchTraits(number);
      }
      this.prev = number;
    },
    async fetchTraits(number) {
      let url = `https://fruuydfac2a4b4v5rip3ovqv5gg2sbaqgcgwnbnztlbt7xed7ela.arweave.net/LGlMDKAWgcDyvYoft1YV6Y2pBBAwjWaFuZrDP9yD-RY/${number}.json`;
      this.$axios.$get(url).then(resp => {
        this.traits = resp.attributes;
        this.randomPlatitude();
      });
    },
    randomPlatitude() {
      var num = Math.floor(Math.random() * this.platitudes.length);
      this.platitude = this.platitudes[num];
      this.showPlatitude = true;
    }
  }
};
</script>
