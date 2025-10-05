import { createRouter, createWebHistory } from 'vue-router';
import { usePropertiesStore } from '../stores/properties';
import GameView from '../views/GameView.vue';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
    },
  ],
});

// wait until store is ready
router.beforeEach(async (to, from, next) => {
  const store = usePropertiesStore();

  if (!store.getIsInitialising) {
    store.setIsInitialising(true);
    console.info('initialising store');
    await store.init();
  }

  next();
});

export default router;
