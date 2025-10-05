<script lang="ts">
import CustomDialog from '@/components/CustomDialog.vue';
import { Geolocation, type Position } from '@capacitor/geolocation';
import { LCircle, LControl, LControlZoom, LMap, LMarker, LPolygon, LTileLayer, LTooltip } from '@vue-leaflet/vue-leaflet';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { type GameSpecification, type Location, type MovingLocation, type PropertyBagProperty } from 'common';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { handleEvents } from '../utils/event-handler.js';
import { checkBag } from '../utils/utils';
import { usePropertiesStore, type GlobalBag } from './../stores/properties';
import PropertyBag from './PropertyBag.vue';

globalThis.L = L;

export default {
  setup() {
    const store = usePropertiesStore();
    const interval: any = null;

    return {
      store,
      interval,
    };
  },

  mounted() {
    this.updateSafeAreaInsets();
    SafeArea.addListener('safeAreaChanged', (data: any) => {
      this.updateSafeAreaInsets();
    });
  },

  created() {
    this.game = this.store.getActiveGame as GameSpecification;
    this.propertyBag = this.store.getPropertyBagValuesAsObjectArray as PropertyBagProperty[];
    this.globalBag = this.store.getGlobalPropertyBag as GlobalBag;

    this.interval = setInterval(() => {
      this.store.checkActiveGameConditions(this.showPopup);
    }, 1000);

    this.game.locations.forEach((location) => {
      this.defaultRadii[location.id] = location.radius;
    });
  },

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LControlZoom,
    LControl,
    PropertyBag,
    LPolygon,
    LTooltip,
    CustomDialog,
  },

  methods: {
    async onReady(mapObject: { setView: (arg0: number[], arg1: number) => void }) {
      try {
        let coordinates: Position | undefined;
        let permissions = await Geolocation.checkPermissions();

        if (permissions?.location !== 'granted') {
          try {
            permissions = await Geolocation.requestPermissions();
          } catch (error) {
            console.warn('Geolocation Request Permission Error:', error);
          }
        }

        switch (permissions?.location) {
          case 'prompt':
          case 'granted':
          case 'prompt-with-rationale':
            coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            break;
          case 'denied':
          default:
            throw new Error('Location permission not granted');
        }

        if (coordinates !== undefined) {
          this.overlay = false;
        }

        this.position = {
          lat: coordinates.coords.latitude,
          lng: coordinates.coords.longitude,
          acc: coordinates.coords.accuracy,
          mapCenterLat: coordinates.coords.latitude,
          mapCenterLng: coordinates.coords.longitude,
        };

        mapObject.setView([this.position.lat, this.position.lng], 20);

        const debounce = (fn: { (position: any, err: any): void; apply?: any }, wait: number | undefined) => {
          let timer: string | number | NodeJS.Timeout | undefined;
          return (...args: any) => {
            if (timer) {
              clearTimeout(timer); // clear any pre-existing timer
            }
            const context = this; // get the current context
            timer = setTimeout(() => {
              fn.apply(context, args); // call the function if time expires
            }, wait);
          };
        };

        const geoWatchHandler = debounce((position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            return;
          }

          this.position = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy,
            mapCenterLat: this.followPosition ? position.coords.latitude : this.position.mapCenterLat,
            mapCenterLng: this.followPosition ? position.coords.longitude : this.position.mapCenterLng,
          };

          // adjust location radii based on accuracy and marker style
          this.visibleLocations.forEach((location) => {
            location.radius = this.adjustLocationRadiusByAcc(location);
          });

          this.checkPositionInsideCircles(this.position);
        }, 500);

        this.setMarkerPosition();

        Geolocation.watchPosition({ enableHighAccuracy: true }, geoWatchHandler);
      } catch (error) {
        console.error('Geolocation error:', error);
      }
    },

    centerToPosition() {
      if (this.$refs.map && (this.$refs.map as any).leafletObject) {
        (this.$refs.map as any).leafletObject.setView([this.position.lat, this.position.lng], 20);
      } else {
        console.error('Map object not found:', this.$refs.map);
      }
    },

    navigateToHome() {
      this.$router.push('/');
    },

    getIcon(className: any, icon: string) {
      return L.divIcon({
        className: className,
        html: '<i class="mdi ' + icon + ' mdi-24px ' + className + '"></i>',
        iconSize: [24, 24],
        iconAnchor: [12, 18],
      });
    },

    checkPositionInsideCircles(position: { lat: number; lng: number; acc: number; mapCenterLat: number; mapCenterLng: number }) {
      const userPosition = L.latLng(position.lat, position.lng);

      this.visibleLocations.forEach((location) => {
        const circleCenter = L.latLng(location.position.lat, location.position.lng);
        const circleRadius = location.radius;

        const distanceFromCenter = circleCenter.distanceTo(userPosition);

        if (distanceFromCenter <= circleRadius) {
          if (!this.insideLocations[location.id]) {
            this.insideLocations[location.id] = true;
            //events handeln
            if (location.onEnter) {
              handleEvents(location.onEnter, this.showPopup);
            }
          }
        } else {
          if (this.insideLocations[location.id] == true) {
            this.insideLocations[location.id] = false;

            if (location.onLeave) handleEvents(location.onLeave, this.showPopup);
          }
        }
      });
    },

    updateSafeAreaInsets() {
      SafeArea.getSafeAreaInsets().then(({ insets }: any) => {
        for (const [key, value] of Object.entries(insets)) {
          document.documentElement.style.setProperty(`--safe-area-${key}`, `${value}px`);
        }
      });
    },

    async showPopup(
      title: string,
      content: string,
      btnText: string,
      type?: string | null,
      answer?: string,
      hint?: string | null,
    ) {
      this.popTitle = title;
      this.popContent = content;
      this.popBtnText = btnText;
      this.inputAnswer = answer || '';
      this.inputHint = hint || '';
      this.popupType = type || '';
      await (this.$refs.popRef as any).open();
    },

    moveMarker(location: MovingLocation, initialPos: any, targetPos: any) {
      // Calculate new position based on sine wave
      const now = Date.now();
      const elapsedTime = now - location.startTime!;

      // calculate current progress based on the elapsed duration of current trip
      const duration = location.position.movement!.duration!;
      let progress = (elapsedTime % duration) / duration;

      // reset progress to turn back to previous position once duration is reached
      if (elapsedTime > duration) progress = 1;

      const amplitudeLat = (targetPos.lat - initialPos.lat) * progress;
      const amplitudeLng = (targetPos.lng - initialPos.lng) * progress;
      const frequency = (2 * Math.PI) / duration;

      const newPositionLat = initialPos.lat + amplitudeLat * Math.sin(frequency * elapsedTime);
      const newPositionLng = initialPos.lng + amplitudeLng * Math.sin(frequency * elapsedTime);

      // Update the location's lat and long
      location.position.lat = newPositionLat;
      location.position.lng = newPositionLng;
    },

    startMarkerMovement(movingLocations: Array<MovingLocation>) {
      this.stopMarkerMovement();

      for (const location of movingLocations) {
        if (!location.startTime) {
          location.startTime = Date.now();
        }

        const initialPos = {
          lat: location.position.lat - location.position.movement!.lat,
          lng: location.position.lng - location.position.movement!.lng,
        };

        const targetPos = {
          lat: location.position.lat + location.position.movement!.lat,
          lng: location.position.lng + location.position.movement!.lng,
        };

        // Start movement interval for the current location
        const intervalId = setInterval(() => {
          this.moveMarker(location, initialPos, targetPos);
        }, 100);

        this.markerMovementIntervals[location.id] = intervalId as unknown as number;
      }
    },

    stopMarkerMovement() {
      for (const locationId in this.markerMovementIntervals) {
        clearInterval(this.markerMovementIntervals[locationId]);
      }
    },

    setMarkerPosition() {
      // set initial positions for all relative locations
      for (const index in this.game.locations) {
        if (this.game.locations[index].position.type === 'relative') {
          this.game.locations[index].position.lat += this.position.lat;
          this.game.locations[index].position.lng += this.position.lng;
        }
      }
      // start movement for all locations with movement != null
      const movingLocations: Array<MovingLocation> = this.game.locations.filter(
        (location: Location) => location.position.movement !== null,
      ) as Array<MovingLocation>;
      this.startMarkerMovement(movingLocations);
    },

    checkVisibility(location: Location) {
      for (const index in location.visibilityCheck) {
        const i = +index;
        if (
          !checkBag(
            location.visibilityCheck[i].accessor,
            location.visibilityCheck[i].key,
            location.visibilityCheck[i].value,
            location.visibilityCheck[i].operator,
          )
        ) {
          return false;
        }
      }
      return true;
    },
    calculateRadiusAdjustment(maxScalingFactor: number, maxAccuracy: number, defaultRadius: number, penalty: Boolean): number {
      let scalingFactor;

      if (penalty) {
        scalingFactor = 1 - (this.position.acc / maxAccuracy) * maxScalingFactor;
        scalingFactor = Math.max(0, scalingFactor); // ensure scaling factor is positive
      } else {
        scalingFactor = 1 + (this.position.acc / maxAccuracy) * maxScalingFactor;
        scalingFactor = Math.max(1, scalingFactor); // ensure scaling factor is at least 1
      }

      return defaultRadius * scalingFactor;
    },
    adjustLocationRadiusByAcc(location: Location): number {
      const maxAccuracy = 500; // meters, max position accuracy to consider for radius fluctuation
      const defaultRadius = this.defaultRadii[location.id];

      switch (location.style.marker) {
        case 'hostile':
          let adjustedRadiusHostile = this.calculateRadiusAdjustment(2, maxAccuracy, defaultRadius, true);
          //console.log(`adjusted radius for location ${location.name} with default radius ${defaultRadius}: ${adjustedRadiusHostile}`)
          return adjustedRadiusHostile < defaultRadius ? adjustedRadiusHostile : defaultRadius;

        case 'checkpoint':
          let adjustedRadiusCheckpoint = this.calculateRadiusAdjustment(2, maxAccuracy, defaultRadius, false);
          //console.log(`adjusted radius for location ${location.name} with default radius ${defaultRadius}: ${adjustedRadiusCheckpoint}`)
          return adjustedRadiusCheckpoint > defaultRadius ? adjustedRadiusCheckpoint : defaultRadius;

        case 'neutral':
          return defaultRadius;

        default:
          return defaultRadius;
      }
    },
  },

  unmounted() {
    this.stopMarkerMovement();
    clearInterval(this.interval);
  },

  computed: {
    visibleLocations() {
      return this.game.locations.filter((location) => this.checkVisibility(location));
    },
  },

  data() {
    return {
      locationIcon: this.getIcon('location-icon', 'mdi-circle'),
      goalIcon: this.getIcon('green-icon', 'mdi-flag-checkered'),
      enemyIcon: this.getIcon('red-icon', 'mdi-eye-outline'),
      invisibleIcon: this.getIcon('invisible-icon', 'mdi-eye-outline'),
      overlay: true,
      position: {
        lat: 48.2,
        lng: 15.6333,
        acc: 100,
        mapCenterLat: 48.2,
        mapCenterLng: 15.6333,
      },
      followPosition: false,
      zoom: 13,
      dragging: false,
      circle: {
        center: [48.213446, 15.632356],
        radius: 5,
      },
      game: {} as GameSpecification,
      markerMovementIntervals: {} as Record<string, number>,
      insideLocations: {} as Record<string, boolean>,
      defaultRadii: {} as Record<string, number>,
      popTitle: '',
      popContent: '',
      popBtnText: '',
      inputAnswer: '',
      inputHint: '',
      popupType: '',
      propertyBag: [] as PropertyBagProperty[],
      globalBag: {} as GlobalBag,
    };
  },
};
</script>

<template style="">
  <v-overlay :model-value="overlay" class="flex align-center justify-center" persistent>
    <div class="loading-overlay">
      <p class="overlay-title">Warten auf deine Position...</p>
      <v-progress-circular color="primary" size="64" indeterminate> </v-progress-circular>
    </div>
  </v-overlay>
  <div style="height: 100dvh">
    <CustomDialog
      :title="popTitle"
      :text="popContent"
      :buttonText="popBtnText"
      :hint="inputHint"
      :answer="inputAnswer"
      :needs-input-field="inputAnswer != ''"
      :is-game-over="popupType === 'lose'"
      :is-mission-complete="popupType === 'win'"
      ref="popRef"
    />
    <l-map
      ref="map"
      v-model:zoom="zoom"
      :center="[position.mapCenterLat, position.mapCenterLng]"
      @ready="onReady"
      :options="{ zoomControl: false }"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>

      <!-- own postition -->
      <l-marker :lat-lng="position" v-if="position.lat && position.lng" :icon="locationIcon"></l-marker>
      <l-circle :lat-lng="position" v-if="position.lat && position.lng" :radius="position.acc" :interactive="false"></l-circle>

      <div v-for="location in visibleLocations" :key="location.id">
        <l-circle
          :lat-lng="[location.position.lat, location.position.lng]"
          :radius="location.radius"
          :interactive="false"
          :fill="true"
          :fill-opacity="location.style.marker == 'neutral' ? 0.2 : 0.8"
          :color="
            location.style.marker == 'hostile'
              ? 'rgba(199, 12, 0, 0.2)'
              : location.style.marker == 'checkpoint'
                ? 'rgba(196, 247, 165, 0.8)'
                : location.style.marker == 'neutral'
                  ? 'gray'
                  : '#81868c'
          "
          :stroke="location.style.marker == 'neutral' ? true : false"
        ></l-circle>

        <l-marker
          v-if="location.style.marker !== 'neutral'"
          :lat-lng="[location.position.lat, location.position.lng]"
          :icon="location.style.marker == 'hostile' ? enemyIcon : location.style.marker == 'checkpoint' ? goalIcon : locationIcon"
          class="hide"
        >
          <l-tooltip>{{ location.name }}</l-tooltip>
        </l-marker>
      </div>

      <l-control-zoom position="bottomleft"></l-control-zoom>
      <l-control position="bottomright">
        <v-btn icon class="current-location-btn">
          <v-icon @click="centerToPosition">mdi-crosshairs-gps</v-icon>
        </v-btn>
      </l-control>
      <l-control position="topright">
        <property-bag title="Spielinformationen" btnGreenText="Fortsetzen" btnRedText="Beenden"></property-bag>
      </l-control>
      <l-control position="topleft">
        <v-switch v-model="followPosition" color="info" label="Standortverfolgung" :value="true" class="switch-follow-position" />
      </l-control>
    </l-map>
  </div>
</template>

<style>
.location-icon {
  color: #3388ff;
}

.green-icon {
  color: #348503;
}

.red-icon {
  color: #bb0000;
}

.invisible-icon {
  color: transparent;
}

.hide {
  color: deeppink;
}

.switch-follow-position .v-selection-control {
  min-height: 36px !important;
}

.leaflet-control-attribution a {
  display: none !important;
}

.current-location-btn .v-btn__content,
.switch-follow-position .v-label {
  color: black !important;
}
</style>

<style scoped>
.leaflet-top .leaflet-control {
  margin-top: var(--safe-area-top);
}

.v-overlay {
  background: black;
  opacity: 0.7;
}

.loading-overlay {
  display: flex !important;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.overlay-title {
  font-weight: bold;
  color: #fff;
}

.leaflet-left .leaflet-control {
  margin-left: var(--safe-area-left + 1rem);
}

.leaflet-right .leaflet-control {
  margin-right: var(--safe-area-right + 1rem);
}

.switch-follow-position {
  height: 36px;
  background-color: white;
  border-radius: 5px;
  padding: 0 16px;
}
</style>
