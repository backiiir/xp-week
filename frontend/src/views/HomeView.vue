<script lang="ts">
import gameViewImageDefault from '@/assets/default-game.png';
import { type GameList } from 'common';
import { defineComponent, nextTick, ref } from 'vue';
import CustomDialog from '../components/CustomDialog.vue';
import PropertyBag from '../components/PropertyBag.vue';
import { usePropertiesStore } from './../stores/properties.js';

export default defineComponent({
  setup() {
    const store = usePropertiesStore();
    const customDialogRef = ref<any>(null);
    const customDialogRef1 = ref<any>(null);

    return {
      store,
      customDialogRef,
      customDialogRef1,
    };
  },

  created() {
    this.loadGames();
  },

  updated() {
    const testElement = document.getElementById('ackDialogGameNotLoading');
    const dialogCloseBtn = testElement?.querySelector('#dialogCloseBtn');
    dialogCloseBtn?.addEventListener('click', () => {
      if (this.$refs.customDialogRef1) (this.$refs.customDialogRef1 as any).close();
    });
  },

  data() {
    return {
      games: {} as GameList,
      gameViewImageDefault: gameViewImageDefault,
    };
  },

  components: {
    PropertyBag,
    CustomDialog,
  },

  methods: {
    async loadGames() {
      this.games = this.store.getGameList;

      nextTick(() => {
        if (this.$refs.customDialogRef && Object.keys(this.games).length === 0) (this.$refs.customDialogRef as any).open();
      });
    },
    navigateToProfile() {
      this.$router.push('/profile');
    },
    async navigateToGame(gameSource: string) {
      const result = await this.store.setActiveGame(gameSource);
      if (result) this.$router.push('/game');
      else if (this.$refs.customDialogRef1) (this.$refs.customDialogRef1 as any).open();
    },
  },
});
</script>

<template>
  <div id="container">
    <h3 class="text-center">Willkommen bei</h3>
    <h1 class="text-center">Xtreme Games</h1>

    <main>
      <CustomDialog
        title="Fehler"
        text="Die Spiele konnten nicht vom Server geladen werden! Beende die App und starte diese neu!"
        buttonText="Verstanden"
        ref="customDialogRef"
      />

      <CustomDialog
        id="ackDialogGameNotLoading"
        title="Fehler"
        text="Das ausgewählte Spiel konnte nicht geladen werden! Beende die App und versuche es später nochmal!"
        buttonText="Verstanden"
        ref="customDialogRef1"
      />

      <v-card v-for="g in games.games" @click="navigateToGame(g.source)">
        <v-img height="150px" :src="g.previewImage ? g.previewImage : gameViewImageDefault" cover></v-img>
        <v-card-title>{{ g.name }}</v-card-title>
      </v-card>
    </main>
  </div>
</template>

<style scoped>
h1,
h3 {
  line-height: 1;
}

h3 {
  margin-top: 25px;
  margin-bottom: 5px;
}

h1 {
  margin-bottom: 35px;
}

#container {
  padding: 2rem;
}

.v-btn--icon.v-btn--density-default {
  width: auto;
}

.v-toolbar__content > .v-btn:last-child {
  margin-inline-end: 0;
}

.v-card {
  margin-bottom: 30px;
}

.v-card-title {
  padding: 20px;
}
</style>
