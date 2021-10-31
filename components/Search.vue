<template>
  <v-container>
    <v-row>
      <v-col>
        <v-text-field
          v-model="message"
          append-outer-icon="mdi-send"
          filled
          clear-icon="mdi-close-circle"
          clearable
          label="Enter your wassie's number"
          type="number"
          min="0"
          max="12344"
          @click:append-outer="getWassie(message)"
          @keydown.enter.prevent="getWassie(message)"
        ></v-text-field>
      </v-col>
    </v-row>
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
    <div v-show="showPlatitude">
      <v-row>
        <v-col>
          <h2>
            <span style="color:gray">Rank</span> 1
            <span style="color:gray">of</span> 12345
          </h2>
          <br />{{ this.platitude }}
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
export default {
  mounted() {
    this.wassieSrc = "";
  },
  data: () => ({
    prev: 0,
    message: null,
    wassieSrc: "",
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
    getWassie(num) {
      // this.traits = `https://fruuydfac2a4b4v5rip3ovqv5gg2sbaqgcgwnbnztlbt7xed7ela.arweave.net/LGlMDKAWgcDyvYoft1YV6Y2pBBAwjWaFuZrDP9yD-RY/${num}.json`;
      this.wassieSrc = `https://arweave.net/ABckdetHKeV8VgUoIZ53TMDKkTi56LhTf-Gb1Mdqx9c/${num}.png`;
      if (num != this.prev) {
        this.randomPlatitude();
      }
      this.prev = num;
    },
    randomPlatitude() {
      var num = Math.floor(Math.random() * this.platitudes.length);
      this.platitude = this.platitudes[num];
      this.showPlatitude = true;
    }
  }
};
</script>
