import { firestore } from './interfaces';
import { GeoFireCollectionRef, QueryFn } from './collection';
import { GeoFirePoint } from './point';
export declare class GeoFireClient {
    private app;
    constructor(app: firestore.FirebaseApp);
    /**
     * Creates reference to a Firestore collection that can be used to make geo-queries and perform writes
     * If you pass a query, any subsequent geo-queries will be limited to this subset of documents
     * @param  {string} path path to collection
     * @param  {QueryFn} query? Firestore query id ref => ref.orderBy('foo').limit(5)
     * @returns {GeoFireCollectionRef}
     */
    collection(path: string, query?: QueryFn): GeoFireCollectionRef;
    /**
     * A GeoFirePoint allows you to create geohashes, format data, and calculate relative distance/bearing.
     * @param  {number} latitude
     * @param  {number} longitude
     * @returns {GeoFirePoint}
     */
    point(latitude: number, longitude: number): GeoFirePoint;
}
/**
 * Initialize the library by passing it your Firebase app
 * @param  {firestore.FirebaseApp} app
 * @returns GeoFireClient
 */
export declare function init(app: firestore.FirebaseApp): GeoFireClient;
