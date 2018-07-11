import { firestore, Point, Feature } from './interfaces';

import { neighbors, encode, flip } from './util';

import distance from '@turf/distance';
import bearing from '@turf/bearing';

export type Latitude = number;
export type Longitude = number;
export type Coordinates = [Latitude, Longitude];

export class GeoFirePoint {
  constructor(
    public app: firestore.FirebaseApp,
    public latitude: number,
    public longitude: number
  ) {}

  static neighbors(str: string) {
    return neighbors(str);
  }

  static distance(to: Coordinates, from: Coordinates) {
    return distance(GeoFirePoint.geoJSON(to), GeoFirePoint.geoJSON(from));
  }

  static bearing(start: Coordinates, end: Coordinates) {
    return bearing(GeoFirePoint.geoJSON(start), GeoFirePoint.geoJSON(end));
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
  /**
   * @returns {string} geohash of length 9
   */
  get hash() {
    return encode(this.latitude, this.longitude, 9);
  }

  /**
   * @returns {string[]} an array of the 8 neigbors of this point's geohash
   */
  get neighbors(): string[] {
    return GeoFirePoint.neighbors(this.hash);
  }

  /**
   * @returns {geojson.Feature<geojson.Point>} GeoJSON representation of the point
   */
  get geoJSON(): Feature<Point> {
    return GeoFirePoint.geoJSON(this.coords);
  }

  /**
   * @returns {firestore.GeoPoint} Firestore GeoPoint representation of the point
   */
  get geoPoint() {
    return new (this.app as any).firestore.GeoPoint(
      this.latitude,
      this.longitude
    ) as firestore.GeoPoint;
  }

  /**
   * @returns {[Latitude, Longitude]}
   */
  get coords(): Coordinates {
    return [this.latitude, this.longitude];
  }

  /**
   * @returns { {geopoint: firestore.GeoPoint, geohash: string} } recommended data format for database
   */
  get data() {
    return {
      geopoint: this.geoPoint,
      geohash: this.hash
    };
  }

  /**
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns {number} Haversine distance to another set of coords
   */
  distance(latitude: number, longitude: number) {
    return GeoFirePoint.distance(this.coords, [latitude, longitude]);
  }

  /**
   * @param  {number} latitude
   * @param  {number} longitude
   * @returns {number} Haversine bearing to another set of coords
   */
  bearing(latitude: number, longitude: number) {
    return GeoFirePoint.bearing(this.coords, [latitude, longitude]);
  }
}
