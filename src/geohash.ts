// import { firestore } from 'firebase/app';
// import * as firebase from 'firebase/app';
// const firestore = firebase.firestore;

import { firestore } from './interfaces';

import { Point, Feature } from 'geojson';
import { neighbors, encode, flip } from './util';

import distance from '@turf/distance';

export type Latitude = number;
export type Longitude = number;
export type Coordinates = [Latitude, Longitude];

export class GeoHash {
  constructor(
    public app: firestore.FirebaseApp,
    public latitude: number,
    public longitude: number
  ) {}

  static neighbors(str: string) {
    return neighbors(str);
  }

  static dist(to: Coordinates, from: Coordinates) {
    return distance(GeoHash.geoJSON(to), GeoHash.geoJSON(from));
  }

  static geoJSON(coordinates: Coordinates, props?: any): Feature<Point> {
    coordinates = flip(coordinates) as Coordinates;
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates
      },
      properties: props
    };
  }

  get hash() {
    return encode(this.latitude, this.longitude, 9);
  }

  get neighbors() {
    return GeoHash.neighbors(this.hash);
  }

  get geoJSON(): Feature<Point> {
    return GeoHash.geoJSON(this.coords);
  }

  get geoPoint() {
    return new (this.app as any).firestore.GeoPoint(
      this.latitude,
      this.longitude
    ) as firestore.GeoPoint;
  }

  get coords(): Coordinates {
    return [this.latitude, this.longitude];
  }

  get data() {
    return {
      geopoint: this.geoPoint,
      geohash: this.hash
    };
  }

  distance(latitude: number, longitude: number) {
    return GeoHash.dist(this.coords, [latitude, longitude]); //distance(this.point, point([lng, lat]));
  }
}
