import { usePropertiesStore } from '@/stores/properties';
import { checkBag } from '@/utils/utils';
import type { BackToMenuEventType, BagEventType, GameSpecification, InputEventType, PopupEventType } from 'common';
import router from '../router/index';

export async function handleEvents(
  events: Array<BagEventType | PopupEventType | InputEventType | BackToMenuEventType> | null,
  showPopup: (
    title: string,
    content: string,
    btnText: string,
    type?: string | null,
    answer?: string,
    hint?: string | null,
  ) => Promise<void>,
  type?: string,
) {
  if (!events) {
    return;
  }
  for (const event of events) {
    if (
      event.condition &&
      !checkBag(event.condition.accessor, event.condition.key, event.condition.value, event.condition.operator)
    ) {
      //continues to the next event
      continue;
    }

    try {
      switch (event.eventType) {
        case 'bag':
          const bagEvent = event as BagEventType;
          handleBagEvent(bagEvent, showPopup);
          break;
        case 'popup':
          const popupEvent = event as PopupEventType;
          await showPopup(popupEvent.title, popupEvent.text, popupEvent.btnText, type);
          break;
        case 'input':
          const inputEvent = event as InputEventType;
          await showPopup(inputEvent.title, inputEvent.text, inputEvent.btnText, type, inputEvent.answer, inputEvent.hint);

          break;
        case 'backToMenu':
          router.push('/');
          break;
      }
    } finally {
      if (event.nextEvent) {
        handleEvents([event.nextEvent], showPopup);
      }
    }
  }
}

function handleBagEvent(
  bagEvent: BagEventType,
  showPopup: (
    title: string,
    content: string,
    btnText: string,
    type?: string | null,
    answer?: string,
    hint?: string | null,
  ) => Promise<void>,
) {
  const store = usePropertiesStore();
  const activeGame: GameSpecification = store.getActiveGame;
  let bagElement = store.getPropertyBagElement(bagEvent.property.key);
  switch (bagEvent.property.action) {
    case 'add':
      if (typeof bagEvent.property.value === 'number' || typeof bagEvent.property.value === 'string') {
        bagElement += bagEvent.property.value;
      } else if (bagEvent.property.value instanceof Array) {
        bagElement.push(...bagEvent.property.value);
      } else {
        console.error('Invalid value type for action add');
      }
      break;
    case 'remove':
      if (typeof bagEvent.property.value === 'number') {
        bagElement -= bagEvent.property.value;
      } else if (typeof bagEvent.property.value === 'string') {
        bagElement.replace(bagEvent.property.value, '');
      } else if (bagEvent.property.value instanceof Array) {
        for (const value of bagEvent.property.value) {
          const index = bagElement.indexOf(value);
          if (index > -1) {
            bagElement.splice(index, 1);
          }
        }
      } else {
        console.error('Invalid value type for action remove');
      }
      break;
    case 'update':
      bagElement = bagEvent.property.value;
      break;
  }
  store.setPropertyBagElement(activeGame.name, bagEvent.property.key, bagElement, showPopup);
}
