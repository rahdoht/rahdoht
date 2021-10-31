<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" fixed app width="212">
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title v-text="title" />
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer absolute="!fixed" app>
      <v-row>
        <v-col class="text-left"> &copy; {{ new Date().getFullYear() }} </v-col>
        <v-col class="text-right">
          farthing for a meme? click to copy.
          <Donation :coin="eth" />
          <Donation :coin="sol" />
          <Donation :coin="btc" />
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      eth: {
        name: "eth",
        url: "/eth.png",
        address: "0x7A26f2A0B0bFe00E9c6f5E7Cf1206eEeB40245d0"
      },
      sol: {
        name: "sol",
        url: "/sol.png",
        address: "GxY4Ph2zZ2dKxNQCgfYBm7w5uxnRu4MXW8v6scx1Wp6S"
      },
      btc: {
        name: "btc",
        url: "/btc.png",
        address: "bc1q26yf733g6v5qydxrwmadnaw0mtt6xfsmnwrnee"
      },
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: "mdi-sofa-single",
          title: "welcome",
          to: "/"
        },
        {
          icon: "mdi-penguin",
          title: "wassies",
          to: "/wassies"
        }
      ],
      right: true,
      rightDrawer: false,
      title: "rahdoht"
    };
  }
};
</script>
