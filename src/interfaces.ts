import * as fb from 'firebase/app';

/**
 * Represents Firebase JS (Web) or Firebase Admin (Node)
 * Web ES6 example: import firebase from 'firebase/app'
 * Cloud Functions example: const admin = require('firebase-amdin')
 */
export type FirebaseSDK = typeof fb;

export type Latitude = number;
export type Longitude = number;
export type Coordinates = [Latitude, Longitude];

/**
 * The valid values for the "type" property of GeoJSON geometry objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
export type GeoJsonGeometryTypes =
  | 'Point'
  | 'LineString'
  | 'MultiPoint'
  | 'Polygon'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/**
 * The value values for the "type" property of GeoJSON Objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
export type GeoJsonTypes =
  | 'FeatureCollection'
  | 'Feature'
  | GeoJsonGeometryTypes;

/**
 * Bounding box
 * https://tools.ietf.org/html/rfc7946#section-5
 */
export type BBox =
  | [number, number, number, number]
  | [number, number, number, number, number, number];

/**
 * A Position is an array of coordinates.
 * https://tools.ietf.org/html/rfc7946#section-3.1.1
 * Array should contain between two and three elements.
 * The previous GeoJSON specification allowed more elements (e.g., which could be used to represent M values),
 * but the current specification only allows X, Y, and (optionally) Z to be defined.
 */
export type Position = number[]; // [number, number] | [number, number, number];

/**
 * The base GeoJSON object.
 * https://tools.ietf.org/html/rfc7946#section-3
 * The GeoJSON specification also allows foreign members
 * (https://tools.ietf.org/html/rfc7946#section-6.1)
 * Developers should use "&" type in TypeScript or extend the interface
 * to add these foreign members.
 */
export interface GeoJsonObject {
  // Don't include foreign members directly into this type def.
  // in order to preserve type safety.
  // [key: string]: any;
  /**
   * Specifies the type of GeoJSON object.
   */
  type: GeoJsonTypes;
  /**
   * Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections.
   * https://tools.ietf.org/html/rfc7946#section-5
   */
  bbox?: BBox;
}

/**
 * Union of GeoJSON objects.
 */
export type GeoJSON = Geometry | Feature | FeatureCollection;

/**
 * A geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3
 */
export interface GeometryObject extends GeoJsonObject {
  type: GeoJsonGeometryTypes;
}

/**
 * Union of geometry objects.
 * https://tools.ietf.org/html/rfc7946#section-3
 */
export type Geometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection;

/**
 * Point geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.2
 */
export interface Point extends GeometryObject {
  type: 'Point';
  coordinates: Position;
}

/**
 * MultiPoint geometry object.
 *  https://tools.ietf.org/html/rfc7946#section-3.1.3
 */
export interface MultiPoint extends GeometryObject {
  type: 'MultiPoint';
  coordinates: Position[];
}

/**
 * LineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.4
 */
export interface LineString extends GeometryObject {
  type: 'LineString';
  coordinates: Position[];
}

/**
 * MultiLineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.5
 */
export interface MultiLineString extends GeometryObject {
  type: 'MultiLineString';
  coordinates: Position[][];
}

/**
 * Polygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.6
 */
export interface Polygon extends GeometryObject {
  type: 'Polygon';
  coordinates: Position[][];
}

/**
 * MultiPolygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.7
 */
export interface MultiPolygon extends GeometryObject {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

/**
 * Geometry Collection
 * https://tools.ietf.org/html/rfc7946#section-3.1.8
 */
export interface GeometryCollection extends GeometryObject {
  type: 'GeometryCollection';
  geometries: Geometry[];
}

export type GeoJsonProperties = { [name: string]: any } | null;

/**
 * A feature object which contains a geometry and associated properties.
 * https://tools.ietf.org/html/rfc7946#section-3.2
 */
export interface Feature<
  G extends GeometryObject | null = Geometry,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: 'Feature';
  /**
   * The feature's geometry
   */
  geometry: G;
  /**
   * A value that uniquely identifies this feature in a
   * https://tools.ietf.org/html/rfc7946#section-3.2.
   */
  id?: string | number;
  /**
   * Properties associated with this feature.
   */
  properties: P;
}

/**
 * A collection of feature objects.
 *  https://tools.ietf.org/html/rfc7946#section-3.3
 */
export interface FeatureCollection<
  G extends GeometryObject | null = Geometry,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: 'FeatureCollection';
  features: Array<Feature<G, P>>;
}
