import { firestore } from './interfaces';
import { CollectionRef, QueryFn } from './collection';
import { GeoHash } from './geohash';
export declare class GeoFireX {
    private app;
    constructor(app: firestore.FirebaseApp);
    collection(path: string, query?: QueryFn): CollectionRef;
    geohash(latitude: number, longitude: number): GeoHash;
}
export declare function init(app: firestore.FirebaseApp): GeoFireX;
