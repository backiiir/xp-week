import 'material-icons/iconfont/material-icons.css';
import './assets/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

// Vuetify
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';

const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App).use(vuetify);

app.use(createPinia());
app.use(router);

app.mount('#app');

try {
  ScreenOrientation.lock({ orientation: 'portrait' });
} catch (error) {
  console.warn(error);
}
