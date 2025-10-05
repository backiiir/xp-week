import { Location } from '../generated/models/location';

export interface MovingLocation extends Location {
  /**
   * The time the player started moving.
   */
  startTime?: number | null;
}
