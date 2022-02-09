import { FirebaseSDK } from './interfaces';

import { GeoFireQuery } from './query';
import { encode, distance, bearing } from './util';

import { GeoPoint, CollectionReference, Query } from 'firebase/firestore';

export interface FirePoint {
  geopoint: GeoPoint,
  geohash: string
}

export class GeoFireClient {
  constructor(public app: FirebaseSDK) {}
  /**
   * Creates reference to a Firestore collection that can be used to make geoqueries
   * @param  {CollectionReference | Query | string} ref path to collection
   * @returns {GeoFireQuery}
   */
  query<T>(ref: CollectionReference | Query | string): GeoFireQuery<T> {
    return new GeoFireQuery(this.app, ref);
  }

  /**
   * Creates an object with a geohash. Save it to a field in Firestore to make geoqueries. 
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns FirePoint
   */
  point(latitude: number, longitude: number): FirePoint {
    return {
      geopoint: new GeoPoint(latitude, longitude),
      geohash: encode(latitude, longitude, 9)
    }
  }
  /**
   * Haversine distance between points
   * @param  {FirePoint} from
   * @param  {FirePoint} to
   * @returns number
   */
  distance(from: FirePoint, to: FirePoint): number {
      return distance(
        [from.geopoint.latitude, from.geopoint.longitude],
        [to.geopoint.latitude, to.geopoint.longitude]
      )
    }

  /**
   * Haversine bearing between points
   * @param  {FirePoint} from
   * @param  {FirePoint} to
   * @returns number
   */
  bearing(from: FirePoint, to: FirePoint): number {
      return bearing(
        [from.geopoint.latitude, from.geopoint.longitude],
        [to.geopoint.latitude, to.geopoint.longitude]
      )
    }
  }
/**
 * Initialize the library by passing it your Firebase app
 * @param  {FirebaseApp} app
 * @returns GeoFireClient
 */
export function init(app: FirebaseSDK): GeoFireClient {
  return new GeoFireClient(app);
}
