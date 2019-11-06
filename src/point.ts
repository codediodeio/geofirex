import { Point, Feature, FirebaseSDK, Coordinates } from './interfaces';

import { neighbors, encode, toGeoJSONFeature } from './util';

import distance from '@turf/distance';
import bearing from '@turf/bearing';


import * as fb from 'firebase';

export class GeoFirePoint {
  constructor(
    public app: FirebaseSDK,
    public latitude: number,
    public longitude: number
  ) {}

  // static neighbors(str: string) {
  //   return neighbors(str);
  // }

  // static distance(to: Coordinates, from: Coordinates) {
  //   return distance(toGeoJSONFeature(to), toGeoJSONFeature(from));
  // }

  // static bearing(start: Coordinates, end: Coordinates) {
  //   return bearing(toGeoJSONFeature(start), toGeoJSONFeature(end));
  // }


  /**
   * @returns {string} geohash of length 9
   */
  hash() {
    return encode(this.latitude, this.longitude, 9);
  }

  /**
   * @returns {string[]} an array of the 8 neigbors of this point's geohash
   */
  neighbors(): string[] {
    return neighbors(this.hash());
  }

  /**
   * @returns {geojson.Feature<geojson.Point>} GeoJSON representation of the point
   */
  geoJSON(): Feature<Point> {
    return toGeoJSONFeature(this.coords());
  }

  /**
   * @returns {firestore.GeoPoint} Firestore GeoPoint representation of the point
   */
  geoPoint() {
    return new (this.app as any).firestore.GeoPoint(
      this.latitude,
      this.longitude
    ) as fb.firestore.GeoPoint;
  }

  /**
   * @returns {[Latitude, Longitude]}
   */
  coords(): Coordinates {
    return [this.latitude, this.longitude];
  }

  /**
   * @returns { {geopoint: firestore.GeoPoint, geohash: string} } recommended data format for database
   */
  data() {
    return {
      geopoint: this.geoPoint(),
      geohash: this.hash()
    };
  }

  /**
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns {number} Haversine distance to another set of coords
   */
  distance(latitude: number, longitude: number) {
    return distance(toGeoJSONFeature(this.coords()), toGeoJSONFeature([latitude, longitude]));
  }

  /**
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns {number} Haversine bearing to another set of coords
   */
  bearing(latitude: number, longitude: number) {
    return bearing(toGeoJSONFeature(this.coords()), toGeoJSONFeature([latitude, longitude]));
  }
}
