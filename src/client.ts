/* eslint-disable @typescript-eslint/no-explicit-any */
import { FirebaseApp } from "firebase/app";
import { GeoPoint, QueryConstraint } from "firebase/firestore";

import { GeoFireQuery } from "./query";
import { encode, distance, bearing } from "./util";

export interface FirePoint {
  geopoint: GeoPoint,
  geohash: string
}

export class GeoFireClient {
  constructor(public app: FirebaseApp) { }
  
  /**
   * Creates reference to a Firestore collection that can be used to make geoqueries
   * @param  {firestore.CollectionReference | firestore.Query | string} ref path to collection
   * @returns {GeoFireQuery}
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  query<T>(ref: any, constraint: QueryConstraint = null): GeoFireQuery<T> {
    return new GeoFireQuery(this.app, ref, constraint);
  }

  /**
   * Creates an object with a geohash. Save it to a field in Firestore to make geoqueries. 
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns FirePoint
   */
  point(latitude: number, longitude: number): FirePoint {
    return {
      geopoint: new GeoPoint(
        latitude,
        longitude
      ) as GeoPoint,
      geohash: encode(latitude, longitude, 9)
    };
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
    );
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
    );
  }
}

/**
 * Initialize the library by passing it your Firebase app
 * @param  {firestore.FirebaseApp} app
 * @returns GeoFireClient
 */
export function init(app: FirebaseApp): GeoFireClient {
  return new GeoFireClient(app);
}
