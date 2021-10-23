<template>
  <v-container>
    <v-row>
      <v-col>
        <v-text-field
          v-model='message'
          append-outer-icon='mdi-send'
          filled
          clear-icon='mdi-close-circle'
          clearable
          label='Enter your wassie number'
          type='number'
          @click:append-outer='getWassie(message)'
          @keydown.enter.prevent='getWassie(message)'
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-img
          id='wassie'
          :src=wassieSrc
          lazy-src='/my_couch_now.png'
          height='400'
          contain
        ></v-img>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        {{ this.platitude }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    mounted () {
      // this.wassieSrc = '/my_couch_now.png';
      this.wassieSrc = '';
    },
    data: () => ({
      prev: 0,
      message: null,
      wassieSrc: '',
      platitude: '',
      platitudes: [
        'so rare',
        'excuse me ser this is one of a kind',
        'omg is this yours?',
        'they\'re all good wassies, brent',
        'all wassies are rare',
        '1 wassie = 1 wassie',
        'you found a unique wassie!',
        'kill this rare wassie immediately',
        'perfect for wassie soup',
        'i think loomdart\'s mom wanted this one',
        'this wassie would look good under a rug',
        'so much lucky',
      ],
    }),

    methods: {
      getWassie (num) {
        this.wassieSrc = `https://arweave.net/ABckdetHKeV8VgUoIZ53TMDKkTi56LhTf-Gb1Mdqx9c/${num}.png`
        if ( num != this.prev ) {
          this.randomPlatitude();
        }
        this.prev = num;
      },
      randomPlatitude () {
        var num = Math.floor(Math.random() * this.platitudes.length);
        this.platitude = 'Rank #1: ' + this.platitudes[num];
      }
    },
  }
</script>