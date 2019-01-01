import { firestore } from './interfaces';

import { GeoFireCollectionRef, QueryFn, get } from './collection';
import { GeoFirePoint } from './point';

export class GeoFireClient {
  constructor(private app: firestore.FirebaseApp) {}
  /**
   * Creates reference to a Firestore collection that can be used to make geo-queries and perform writes
   * If you pass a query, any subsequent geo-queries will be limited to this subset of documents
   * @param  {string} path path to collection
   * @param  {QueryFn} query? Firestore query id ref => ref.orderBy('foo').limit(5)
   * @returns {GeoFireCollectionRef}
   */
  collection(path: string, query?: QueryFn): GeoFireCollectionRef {
    return new GeoFireCollectionRef(this.app, path, query);
  }
  /**
   * A GeoFirePoint allows you to create geohashes, format data, and calculate relative distance/bearing.
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns {GeoFirePoint}
   */
  point(latitude: number, longitude: number): GeoFirePoint {
    return new GeoFirePoint(this.app, latitude, longitude);
  }
  /**
   * Returns the firebase instance used by the client
   * @returns {firestore.FirebaseApp}
   */
  getFirebaseApp() {
    return this.app;
  }
}
/**
 * Initialize the library by passing it your Firebase app
 * @param  {firestore.FirebaseApp} app
 * @returns GeoFireClient
 */
export function init(app: firestore.FirebaseApp): GeoFireClient {
  return new GeoFireClient(app);
}
