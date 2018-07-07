import { firestore } from './interfaces';
import { Point, Feature } from 'geojson';
export declare type Latitude = number;
export declare type Longitude = number;
export declare type Coordinates = [Latitude, Longitude];
export declare class GeoHash {
    app: firestore.FirebaseApp;
    latitude: number;
    longitude: number;
    constructor(app: firestore.FirebaseApp, latitude: number, longitude: number);
    static neighbors(str: string): string[];
    static dist(to: Coordinates, from: Coordinates): any;
    static geoJSON(coordinates: Coordinates, props?: any): Feature<Point>;
    readonly hash: string;
    readonly neighbors: string[];
    readonly geoJSON: Feature<Point>;
    readonly geoPoint: firestore.GeoPoint;
    readonly coords: Coordinates;
    readonly data: {
        geopoint: firestore.GeoPoint;
        geohash: string;
    };
    distance(latitude: number, longitude: number): any;
}
