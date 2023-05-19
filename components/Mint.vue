<template>
  <v-container>
    <v-row justify="center">
      <v-col>
        <v-text-field v-model="parent" label="Parent cig ID" type="parent" min="0" max="9999"
          @blur="getCig(parent)"></v-text-field>
        <v-text-field v-model="literature" label="literature" type="string"
          @blur="updateLiterature(literature)"></v-text-field>
        <v-text-field v-model="collection" label="collection" type="string"
          @blur="updateCollection(collection)"></v-text-field>
        <v-btn @click="mint(parent, literature, collection)">Mint</v-btn>
      </v-col>
    </v-row>
    <div>
      <v-row>
        <v-col>
          <v-img id="cig" :src="cigSrc" lazy-src="/cigaiwrette.jpg" height="400" contain></v-img>
        </v-col>
      </v-row>
    </div>
    <div v-show="showTraits" class="text-center">
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
import Web3 from "web3";
import contractABI from "@/contracts/Cigawrote.json";

export default {
  mounted() {
    this.cigSrc = "";
  },
  data: () => ({
    prev: null,
    parent: null,
    literature: "10,000 things",
    collection: "rip pappachaga",
    cigSrc: "",
    traits: [],
    showTraits: false
  }),

  methods: {
    getCig(parent) {
      if (parent != this.prev) {
        this.cigSrc = `https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link/${parent}.jpg`;
        this.fetchTraits(parent);
      }
      this.prev = parent;
      this.showTraits = true;
    },
    updateLiterature(literature) {
      this.literature = literature;
      console.log(`updating literature to ${literature}`);
    },
    updateCollection(collection) {
      this.collection = collection;
      console.log(`updating collection to ${collection}`);
    },
    async fetchTraits(parent) {
      let url = `https://bafybeidgwnebxxrcjj3glcxtncvkeuokynlvb3oimrp4nwmv7sds34lela.ipfs.dweb.link/${parent}.json`;
      this.$axios.$get(url).then(resp => {
        this.traits = resp.attributes;
      });
    },
    async mint(parent, literature, collection) {
      if (parent === null) {
        throw new Error('Must choose a parent cig');
      }
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Web3 is not available');
      }

      // const contractABI = require("/Cigawrote.json");

      // Create a Web3 instance
      // const web3 = new Web3(window.ethereum);
      const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
      const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

      // Request access to the user's MetaMask accounts
      // const accounts = window.ethereum.request({ method: 'eth_requestAccounts' });
      // const recipientAddress = accounts[0];
      const recipientAddress = "0x7A26f2A0B0bFe00E9c6f5E7Cf1206eEeB40245d0";

      // Create the contract instance
      const contract = new web3.eth.Contract(contractABI.abi);
      contract.options.address = contractAddress;

      const payableAmount = web3.utils.toWei('0.0069', 'ether');

      // Prompt the user for the IPFS image URI with the ipfsLink as the default value
      const ipfsImageUri = "ipfs://cigv2/0.json";
      console.log("Minting with IPFS URI:", ipfsImageUri);

      // Call the safeMinconsole.log("Minting with IPFS URI:", ipfsImageUri);
      try {
        let result = await contract.methods.safeMint(recipientAddress, ipfsImageUri, literature, parent, collection).send({
          value: payableAmount,
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
          // from: "0x5fbdb2315678afecb367f032d93f642f64180aa3"
        });
        console.log(result);
      } catch (error) {
        console.error(`problemos: ${JSON.stringify(error)}`)
      }

      let owner = contract.methods.ownerOf(0);
      console.log(owner);

      // After successful minting, set the token ID
      // const newTokenId = result.events.Transfer.returnValues.tokenId; // Adjust this line based on your contract's logic to get the newly minted token ID
      // setTokenId(newTokenId);

    }
  }
};
</script>
