import { firestore } from './interfaces';
import { Observable } from 'rxjs';
import { GeoFirePoint, Latitude, Longitude } from './geohash';
export declare type QueryFn = (ref: firestore.CollectionReference) => firestore.Query;
export interface GeoQueryOptions {
    units: 'km';
}
export declare class GeoFireCollectionRef {
    private app;
    private path;
    private ref;
    private query;
    private stream;
    constructor(app: firestore.FirebaseApp, path: string, query?: QueryFn);
    /**
     * Return the QuerySnapshot as an observable
     * @returns {Observable<firestore.QuerySnapshot>}
     */
    snapshot(): Observable<firestore.QuerySnapshot>;
    /**
     * Return the collection mapped to data payload with with ID
     * @param {string} id='id'
     * @returns {Observable<any[]>}
     */
    data(id?: string): Observable<any[]>;
    /**
     * Add a document
     * @param  {any} data
     * @returns {Promise<firestore.DocumentReference>}
     */
    add(data: any): Promise<firestore.DocumentReference>;
    /**
     * Delete a document in the collection based on the document ID
     * @param  {string} id
     * @returns {Promise<void>}
     */
    delete(id: string): Promise<void>;
    /**
     * Create or update a document in the collection based on the document ID
     * @param  {string} id
     * @param  {any} data
     * @returns {Promise<void>}
     */
    setDoc(id: string, data: any): Promise<void>;
    /**
     * Create or update a document with GeoFirePoint data
     * @param  {string} id document id
     * @param  {Latitude} latitude
     * @param  {Longitude} longitude
     * @param  {string='point'} field optional field to set data to
     * @returns {Promise<void>}
     */
    setPoint(id: string, latitude: Latitude, longitude: Longitude, field?: string): Promise<void>;
    changeQuery(query: QueryFn): void;
    private setStream();
    /**
     * Queries the Firestore collection based on geograpic radius
     * @param  {GeoFirePoint} center the starting point for the query, i.e gfx.point(lat, lng)
     * @param  {number} radius the radius to search from the centerpoint
     * @param  {string} field the document field that contains the GeoFirePoint data
     * @param  {GeoQueryOptions} opts=defaultOpts
     * @returns {Observable<any>}
     */
    within(center: GeoFirePoint, radius: number, field: string, opts?: GeoQueryOptions): Observable<{
        queryMetadata: {
            distance: any;
            bearing: number;
        };
    }[]>;
    private queryPoint(geohash, field);
}
/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the GeoFirePoint
 * @param  {boolean=false} includeProps
 */
export declare function toGeoJSON(field: string, includeProps?: boolean): any;
/**
 * Helper function to convert any query from an RxJS Observable to a Promise
 * Example usage: await get( collection.within(a, b, c) )
 * @param  {Observable<any>} observable
 * @returns {Promise<any>}
 */
export declare function get(observable: Observable<any>): Promise<any>;
