import { handleEvents } from '@/utils/event-handler';
import { checkBag } from '@/utils/utils';
import { CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { type GameList, type GameSpecification } from 'common';
import { defineStore, type StoreDefinition } from 'pinia';
import router from '../router/index';

export type PropertyBagValue = string | number | boolean | Array<string | number> | null;

interface StoreState {
  propertyBag: { [key: string]: PropertyBagValue } | null;
  globalPropertyBag: GlobalBag | null;
  gameList: GameList | null;
  activeGame: GameSpecification | null;
  isInitialising: boolean;
}

export interface GlobalBag {
  gameStartTime: Date;
}

export const usePropertiesStore = defineStore('properties', {
  state: (): StoreState => {
    return {
      propertyBag: null,
      globalPropertyBag: null,
      gameList: null,
      activeGame: null,
      isInitialising: false,
    };
  },

  getters: {
    getIsInitialising: (state: StoreState) => state.isInitialising,
    getGameList: (state: StoreState) => state.gameList,
    getActiveGame: (state: StoreState) => state.activeGame,
    getPropertyBag: (state: StoreState) => state.propertyBag,
    getPropertyBagValuesAsObjectArray: (state: StoreState) => {
      if (state.propertyBag) {
        return Object.keys(state.propertyBag).map((name) => {
          if (state.propertyBag) return { name, value: state.propertyBag[name] };
          else return { name, value: null };
        });
      } else return [];
    },

    getPropertyBagElement: (state: StoreState) => (key: string) => {
      if (state.propertyBag === null) return {} as PropertyBagValue;
      else return state.propertyBag[key] as PropertyBagValue;
    },

    getGlobalPropertyBag: (state: StoreState) => state.globalPropertyBag,
  },

  actions: {
    async setPropertyBagValues(
      gamekey: string,
      values: { [key: string]: PropertyBagValue },
      showPopup?: (
        title: string,
        content: string,
        btnText: string,
        type?: string | null,
        answer?: string,
        hint?: string | null,
      ) => Promise<void>,
    ) {
      if (this.propertyBag === null) this.propertyBag = {};

      for (const key in values) {
        this.propertyBag[key] = values[key];
      }

      await Preferences.set({ key: 'game_' + gamekey + '_bag', value: JSON.stringify(this.propertyBag) });

      if (showPopup) {
        this.checkActiveGameConditions(showPopup);
      }
    },

    async setPropertyBagElement(
      gamekey: string,
      key: string,
      value: PropertyBagValue,
      showPopup?: (
        title: string,
        content: string,
        btnText: string,
        type?: string | null,
        answer?: string,
        hint?: string | null,
      ) => Promise<void>,
    ) {
      if (this.propertyBag === null) this.propertyBag = {};

      this.propertyBag[key] = value;
      await Preferences.set({ key: 'game_' + gamekey + '_bag', value: JSON.stringify(this.propertyBag) });

      if (showPopup) {
        this.checkActiveGameConditions(showPopup);
      }
    },

    async removePropertyBagElement(gamekey: string, key: string) {
      if (this.propertyBag === null) return;

      delete this.propertyBag[key];
      await Preferences.set({ key: 'game_' + gamekey + '_bag', value: JSON.stringify(this.propertyBag) });
    },

    async deletePropertyBag(gamekey: string) {
      this.propertyBag = null;
      await Preferences.remove({ key: 'game_' + gamekey + '_bag' });
    },

    async reloadPropertyBagIfExists(gamekey: string): Promise<boolean> {
      const storeValue = await Preferences.get({ key: 'game_' + gamekey + '_bag' });

      if (storeValue.value) {
        this.propertyBag = JSON.parse(storeValue.value);
        return true;
      } else {
        // if no property bag is stored, set the property bag values from the active games json
        for await (const element of this.activeGame?.propertyBag || []) {
          await this.setPropertyBagElement(this.activeGame?.name, element.name, element.value);
        }
        return false;
      }
    },

    async setGlobalPropertyBag(gamekey: string, value: GlobalBag) {
      this.globalPropertyBag = value;
      await Preferences.set({ key: 'game_' + gamekey + '_globalBag', value: JSON.stringify(this.globalPropertyBag) });
    },

    async resetGlobalPropertyBag(gamekey: string) {
      this.globalPropertyBag = { gameStartTime: new Date() };
      await Preferences.set({ key: 'game_' + gamekey + '_globalBag', value: JSON.stringify(this.globalPropertyBag) });
    },

    async deleteGlobalPropertyBag(gamekey: string) {
      this.globalPropertyBag = null;
      await Preferences.remove({ key: 'game_' + gamekey + '_globalBag' });
    },

    async reloadGlobalPropertyBagIfExists(gamekey: string): Promise<boolean> {
      const storeValue = await Preferences.get({ key: 'game_' + gamekey + '_globalBag' });

      if (storeValue.value) {
        this.globalPropertyBag = JSON.parse(storeValue.value);
        return true;
      } else {
        this.resetGlobalPropertyBag(gamekey);
        return false;
      }
    },

    // Returns the time elapsed in ms of the activeGame
    getTimeElapesed() {
      if (this.globalPropertyBag === null || !this.globalPropertyBag.gameStartTime) {
        console.error('gameStartTime ist nicht definiert oder globalPropertyBag ist null');
        return 0;
      }

      const gameStartTime = new Date(this.globalPropertyBag.gameStartTime);

      if (isNaN(gameStartTime.getTime())) {
        console.error('gameStartTime ist kein gültiges Datum');
        return 0;
      }

      const now = new Date();
      const diff = now.getTime() - gameStartTime.getTime();
      return diff;
    },

    async reloadActiveGameIfExists(): Promise<boolean> {
      const storeValue = await Preferences.get({ key: 'activeGame' });

      if (storeValue.value) {
        this.activeGame = JSON.parse(storeValue.value);
        return true;
      } else return false;
    },

    async deleteActiveGame() {
      this.activeGame = null;
      await Preferences.remove({ key: 'activeGame' });
    },

    async reloadGameListIfExists(): Promise<boolean> {
      const storeValue = await Preferences.get({ key: 'gameList' });

      if (storeValue.value) {
        this.gameList = JSON.parse(storeValue.value);
        return true;
      } else return false;
    },

    async setActiveGame(url: string, doNotFetch: boolean = false): Promise<boolean> {
      let data = null;

      if (!doNotFetch) {
        try {
          data = await CapacitorHttp.request({
            url: url,
            method: 'GET',
          });
        } catch (e) {
          console.warn(e);
        }
      }

      // Check if the data is the same as the current active game and if so try to reload its content or if data is empty
      if (!data?.data || (data?.data && this.activeGame?.name === data.data.name)) {
        let isDataAvailable: boolean = await this.reloadActiveGameIfExists();

        // if nothing is in the store set the data
        if (!isDataAvailable && data?.data) {
          this.activeGame = data.data as GameSpecification;
          await Preferences.set({ key: 'activeGame', value: JSON.stringify(data.data) });
        }
        // if nothing is in the store and no data is available, redirect to the start page
        else if (!isDataAvailable) {
          router.push('/');
          return false;
        }
      }
      // If the data is different, set the new active game
      else {
        this.activeGame = data.data as GameSpecification;
        await Preferences.set({ key: 'activeGame', value: JSON.stringify(data.data) });
      }

      await this.reloadGlobalPropertyBagIfExists((this.activeGame as GameSpecification).name);
      await this.reloadPropertyBagIfExists((this.activeGame as GameSpecification).name);

      return true;
    },

    async checkActiveGameConditions(
      showPopup: (
        title: string,
        content: string,
        btnText: string,
        type?: string | null,
        answer?: string,
        hint?: string | null,
      ) => Promise<void>,
    ) {
      const gameConditions = (this.activeGame as GameSpecification)?.gameConditions || [];

      for await (const gameCondition of gameConditions) {
        const conditionCheckResult = checkBag(
          gameCondition.condition?.accessor,
          gameCondition.condition?.key,
          gameCondition.condition?.value,
          gameCondition.condition?.operator,
        );

        if (conditionCheckResult) {
          handleEvents(gameCondition.events, showPopup, gameCondition.type);
          if (gameCondition.type == 'win' || gameCondition.type == 'lose') {
            this.deleteGlobalPropertyBag((this.activeGame as GameSpecification)?.name);
            this.deletePropertyBag((this.activeGame as GameSpecification)?.name);
            this.deleteActiveGame();
          }
          break;
        }
      }
    },

    async getGameJson() {
      const activeGameStoreValue = await Preferences.get({ key: 'activeGame' });
      if (activeGameStoreValue.value) {
        this.activeGame = JSON.parse(activeGameStoreValue.value);
      }

      return this.activeGame;
    },

    setIsInitialising(value: boolean) {
      this.isInitialising = value;
    },

    // Called on router.beforeEach
    async init() {
      const storeValue = await Preferences.get({ key: 'propertyBag' });
      this.propertyBag = storeValue.value ? JSON.parse(storeValue.value) : null;

      try {
        const data = await CapacitorHttp.request({
          url: 'https://it231507-20233.php.fhstp.cc/games.json',
          method: 'GET',
        });

        this.gameList = (data.data as GameList) || {};
        await Preferences.set({ key: 'gameList', value: JSON.stringify(this.gameList) });

        await this.setActiveGame('', true);

        return this.gameList;
      } catch (e) {
        console.warn(e);
        const storeValue = await Preferences.get({ key: 'gameList' });
        this.gameList = storeValue.value ? JSON.parse(storeValue.value) : {};

        await this.setActiveGame('', true);
        return this.gameList;
      }
    },
  },
}) as StoreDefinition;
