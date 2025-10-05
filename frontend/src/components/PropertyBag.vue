<script lang="ts">
import { usePropertiesStore, type PropertyBagValue } from '@/stores/properties.js';
import type { GameSpecification } from 'common';
import type { Ref } from 'vue';

export default {
  setup() {
    const propertiesStore = usePropertiesStore();
    return {
      propertiesStore,
    };
  },

  data() {
    return {
      lives: '',
      gameTime: '',
      isGameOver: false,
      isMissionComplete: false,
      isQuittingDialog: false,
    };
  },

  computed: {},

  props: {
    text: String,
    title: String,
    btnRedText: String,
    btnGreenText: String,
    btnRedFunction: Function,
  },

  methods: {
    async submit(isActive: Ref<boolean>) {
      isActive.value = false;
    },

    navigateToHome() {
      const activeGame = this.getActiveGame();
      this.propertiesStore.deleteGlobalPropertyBag(activeGame.name);
      this.propertiesStore.deletePropertyBag(activeGame.name);
      this.propertiesStore.deleteActiveGame();

      this.$router.push('/');
    },

    getPropertyItem(name: string): { name: string; value: PropertyBagValue; icon: String } | null {
      const value = this.propertiesStore.getPropertyBagElement(name);

      let gameProperties = this.propertiesStore.getActiveGame?.propertyBag;
      const icon = gameProperties?.filter((prop: any) => prop.name === name)[0]?.icon;

      if (value === undefined) return null;
      return { name, value, icon };
    },

    getPropertyItems(): { name: string; value: PropertyBagValue; icon: String }[] {
      const propertyBag = this.propertiesStore.getPropertyBagValuesAsObjectArray;
      let gameProperties = this.propertiesStore.getActiveGame?.propertyBag || [];

      for (const i in gameProperties) {
        gameProperties[i].value = propertyBag?.filter((prop: any) => prop.name === gameProperties[i].name)[0].value || null;
      }
      gameProperties.filter((prop: any) => prop.icon !== null);
      return gameProperties.filter((prop: any) => prop.icon !== null);
    },

    checkIfQuitting() {
      this.isQuittingDialog = true;
    },

    getActiveGame() {
      return this.propertiesStore.getActiveGame as GameSpecification;
    },
  },

  created() {},
};
</script>

<template>
  <v-dialog max-width="500">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn @click="getPropertyItems" v-bind="activatorProps" color="surface-variant" text="INFO" variant="flat"></v-btn>
      <div @change="getPropertyItems" v-for="propertyItem in getPropertyItems()">
        <div v-if="propertyItem != null">
          <span v-for="(item, index) in propertyItem.value">
            <v-icon v-if="propertyItem.icon">{{ propertyItem.icon }}</v-icon>
          </span>
        </div>
      </div>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card v-if="!isQuittingDialog">
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text v-if="getPropertyItems().length === 0">Dieses Spiel beinhaltet keine besonderen Properties.</v-card-text>
        <v-card-text v-for="propertyItem in getPropertyItems()">
          <p v-if="propertyItem !== null && propertyItem.icon !== null" style="font-weight: 600; font-size: larger">
            <v-icon v-if="propertyItem.icon" style="margin-right: 1rem">{{ propertyItem.icon }}</v-icon>
            {{ propertyItem.name }} : {{ propertyItem.value }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn class="btn-red" @click="checkIfQuitting">{{ btnRedText }}</v-btn>
          <v-spacer></v-spacer>
          <v-btn class="btn-green" @click="submit(isActive)">{{ btnGreenText }}</v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-if="isQuittingDialog">
        <v-card-title>ACHTUNG!</v-card-title>
        <v-card-text>
          <p>Bist du dir sicher, dass du das Spiel verlassen möchtest?</p>
          <p>All dein Fortschritt geht dabei verloren.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn class="btn-red" @click="navigateToHome">Spiel verlassen</v-btn>
          <v-spacer></v-spacer>
          <v-btn class="btn-green" @click="isQuittingDialog = false">Zurück</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  color: #000000;
  min-height: 70px;
  padding-top: 0;
  padding-bottom: 0;
}

.v-card-text {
  padding: 20px 16px 10px !important;
}

.v-card-actions {
  border-top: 1px solid #dedede;
  flex-wrap: wrap;
  margin-top: 10px;
}

.btn-red {
  background-color: rgba(199, 12, 0, 0.2);
  color: #c70c00;
}

.btn-green {
  background-color: rgba(196, 247, 165, 0.8);
  color: #348503;
}
</style>
