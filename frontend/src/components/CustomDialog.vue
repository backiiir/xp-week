<script lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { required, sameAs } from '@vuelidate/validators';
import { defineComponent, type Ref } from 'vue';

export default defineComponent({
  setup() {
    const v$ = useVuelidate();
    return { v$ };
  },

  data() {
    return {
      userInput: '',
      isVisible: false,
      resolver: null as ((value: unknown) => void) | null,
      showValidationErrors: false,
    };
  },

  props: {
    buttonText: String,
    title: String,
    text: String,
    hint: String,
    answer: String,
    needsInputField: {
      type: Boolean,
      default: false,
    },
    isGameOver: {
      type: Boolean,
      default: false,
    },
    isMissionComplete: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    navigateToHome() {
      this.$router.push('/');
    },

    open(): Promise<unknown> {
      this.isVisible = true;
      this.userInput = ''; // Reset user input each time the dialog opens
      this.showValidationErrors = false; // Reset validation errors visibility
      return new Promise((resolve) => {
        this.resolver = resolve;
      });
    },

    async close() {
      this.userInput = this.userInput.trim();
      this.showValidationErrors = true; // Enable validation error display
      const isInputValid = await this.v$.$validate();
      if (!isInputValid) {
        return;
      }
      this.userInput = '';

      this.isVisible = false;
      if (this.resolver) {
        this.resolver('closed');
        this.resolver = null;
      }
      this.showValidationErrors = false;
    },
  },

  validations() {
    if (this.needsInputField) {
      return {
        userInput: {
          required,
          sameAs: sameAs(this.answer),
        },
      };
    }
  },
});
</script>

<template>
  <v-overlay
    v-model="isVisible"
    class="d-flex align-center justify-center"
    location-strategy="connected"
    scroll-strategy="block"
    persistent
  >
    <v-card>
      <v-card-title :class="isMissionComplete ? 'mission-complete-title' : isGameOver ? 'game-over-title' : ''">{{
        title
      }}</v-card-title>
      <v-card-text> {{ text }} </v-card-text>
      <v-card-subtitle v-if="needsInputField">
        <div v-if="showValidationErrors && v$.userInput.$error" v-for="error in v$.userInput.$errors">
          <small v-if="error.$validator == 'required'" style="color: red">Feld darf nicht leer sein</small>
          <small v-if="error.$validator == 'sameAs' && v$.userInput.$errors.length == 1" style="color: red"
            >Falsche Antwort</small
          >
          <br />
          <small v-if="error.$validator == 'sameAs' && v$.userInput.$errors.length == 1" style="color: blue">{{ hint }}</small>
        </div>
        <v-text-field @input="v$.$reset()" v-model="userInput" variant="outlined"></v-text-field>
      </v-card-subtitle>
      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn :text="buttonText" id="dialogCloseBtn" @click="close()"></v-btn>
      </v-card-actions>
    </v-card>
  </v-overlay>
</template>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
  background-color: rgba(21, 128, 254, 0.2);
  color: #1580fe;
  min-height: 70px;
  padding: 15px;
  white-space: pre-wrap;
}

::v-deep .v-overlay__content {
  min-width: 90% !important;
}

.mission-complete-title {
  background-color: rgba(196, 247, 165, 0.8);
  color: #348503;
}

.game-over-title {
  background-color: rgba(199, 12, 0, 0.2);
  color: #c70c00;
}

.v-card {
  margin: 10px;
}

.v-card-text {
  padding: 20px 16px 10px !important;
}

.v-card-subtitle {
  padding: 0px 16px 10px !important;
}

.v-card-actions {
  border-top: 1px solid #dedede;
  flex-wrap: wrap;
  margin-top: 10px;
}

.v-btn {
  background: #1976d2;
  color: white;
}

.btn-home {
  background: white;
  color: #1976d2;
}
</style>
