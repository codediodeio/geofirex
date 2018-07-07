import { firestore } from './interfaces';
import { Observable } from 'rxjs';
import { GeoHash } from './geohash';
export declare type QueryFn = (ref: firestore.CollectionReference) => firestore.Query;
export declare class CollectionRef {
    private app;
    private path;
    private ref;
    private query;
    private stream;
    constructor(app: firestore.FirebaseApp, path: string, query?: QueryFn);
    snapshot(): Observable<firestore.QuerySnapshot>;
    data(): Observable<{
        id: string;
    }[]>;
    add(data: any): Promise<firestore.DocumentReference>;
    delete(id: any): Promise<void>;
    addAt(id: any, data: any): Promise<void>;
    changeQuery(query: QueryFn): void;
    private setStream();
    within(center: GeoHash, radius: number, field: string, opts?: {
        units: string;
    }): Observable<{
        distance: any;
        id: string;
    }[]>;
    private queryPoint(geohash, field);
    withinBbox(field: string, bbox: number, opts?: {
        units: string;
    }): string;
    findNearest(field: string, radius: number, opts?: {
        units: string;
    }): string;
    findFirst(): string;
}
