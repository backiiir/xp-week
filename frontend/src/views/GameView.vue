<script lang="ts">
import { type GameSpecification } from 'common';
import { defineComponent, nextTick, onMounted, reactive, ref } from 'vue';
import CustomDialog from '../components/CustomDialog.vue';
import Map from '../components/Map.vue';
import router from './../router';
import { usePropertiesStore } from './../stores/properties.js';

export default defineComponent({
  setup() {
    const store = usePropertiesStore();
    const customDialogRef = ref<any>(null);
    const activeGame = ref({} as GameSpecification);
    const state = reactive({
      showDialogCompleted: false, // Neuer Zustand, initial false
    });

    onMounted(async () => {
      await store.getGameJson();
      activeGame.value = await store.getActiveGame;

      if (Object.keys(activeGame.value).length === 0) {
        router.push('/');
      } else {
        nextTick(async () => {
          if (activeGame.value.instructions && customDialogRef.value) {
            try {
              await customDialogRef.value.open();
            } finally {
              state.showDialogCompleted = true; // Setzen auf true im finally Block
            }
          }
        });
      }
    });

    return {
      Map,
      store,
      activeGame,
      customDialogRef,
      state,
    };
  },

  data() {
    return {
      activeGame: {} as GameSpecification,
    };
  },

  methods: {
    navigateToHome() {
      this.$router.push('/');
    },
  },

  components: {
    Map,
    CustomDialog,
  },
});
</script>

<template>
  <main>
    <CustomDialog
      v-if="activeGame.instructions"
      :title="activeGame.instructions.title"
      :text="activeGame.instructions.text"
      :buttonText="activeGame.instructions.btnText"
      ref="customDialogRef"
    />
    <Map v-if="state.showDialogCompleted"></Map>
  </main>
</template>

<style scoped>
.v-toolbar {
  background: none;
  margin: 10px 0 20px;
}

.v-btn--icon.v-btn--density-default {
  width: auto;
}

.v-toolbar__content > .v-btn:last-child {
  margin-inline-end: 0;
}
</style>
