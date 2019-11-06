import { firestore } from './interfaces';

import { Observable, combineLatest } from 'rxjs';
import { shareReplay, map, first } from 'rxjs/operators';
import { GeoFirePoint, Latitude, Longitude } from './point';
import { setPrecsion } from './util';
import { FeatureCollection, Geometry } from 'geojson';

export type QueryFn = (ref: firestore.CollectionReference) => firestore.Query;

export interface GeoQueryOptions {
  units: 'km';
}
const defaultOpts: GeoQueryOptions = { units: 'km' };

export interface SetOptions {
  merge?: boolean;
  mergeFields?: (string | FieldPath)[];
}

export interface QueryMetadata {
  bearing: number;
  distance: number;
}

export interface GeoQueryDocument {
  queryMetadata: QueryMetadata;
}

export class GeoFireCollectionRef<T> {
  private ref: firestore.CollectionReference;
  private query: firestore.Query;
  private stream: Observable<firestore.QuerySnapshot>;

  constructor(
    private app: firestore.FirebaseApp,
    private path: string,
    query?: QueryFn
  ) {
    this.ref = app.firestore().collection(path);
    if (query) this.query = query(this.ref);
    this.setStream();
  }
  /**
   * Return the QuerySnapshot as an observable
   * @returns {Observable<firestore.QuerySnapshot>}
   */
  snapshot() {
    return this.stream;
  }
  /**
   * Return the collection mapped to data payload with ID
   * @param {string} id='id'
   * @returns {Observable<any[]>}
   */
  data(id = 'id'): Observable<any[]> {
    return this.stream.pipe(snapToData(id));
  }
  /**
   * Add a document
   * @param  {any} data
   * @returns {Promise<firestore.DocumentReference>}
   */
  add(data: any): Promise<firestore.DocumentReference> {
    return this.ref.add(data);
  }
  /**
   * Delete a document in the collection based on the document ID
   * @param  {string} id
   * @returns {Promise<void>}
   */
  delete(id: string) {
    return this.ref.doc(id).delete();
  }
  /**
   * Create or update a document in the collection based on the document ID
   * @param  {string} id
   * @param  {any} data
   * @param  {SetOptions} options
   * @returns {Promise<void>}
   */
  setDoc(id: string, data: any, options?: SetOptions) {
    return this.ref.doc(id).set(data, options);
  }
  /**
   * Create or update a document in the collection based on the document ID merging fields
   * @param  {string} id
   * @param  {any} data
   * @returns {Promise<void>}
   */
  setDocMerge(id: string, data: any) {
    return this.ref.doc(id).set(data, { merge: true });
  }
  /**
   * Create or update a document with GeoFirePoint data
   * @param  {string} id document id
   * @param  {string} field name of point on the doc
   * @param  {Latitude} latitude
   * @param  {Longitude} longitude
   * @returns {Promise<void>}
   */
  setPoint(
    id: string,
    field: string,
    latitude: Latitude,
    longitude: Longitude
  ) {
    const point = new GeoFirePoint(this.app, latitude, longitude).data;
    return this.ref.doc(id).set({ [field]: point }, { merge: true });
  }

  // TODO remove?
  changeQuery(query: QueryFn) {
    this.query = query(this.ref);
    this.setStream();
  }

  private setStream() {
    this.query = this.query || this.ref;
    this.stream = createStream(this.query || this.ref).pipe(shareReplay(1));
  }

  // GEO QUERIES
  /**
   * Queries the Firestore collection based on geograpic radius
   * @param  {GeoFirePoint} center the starting point for the query, i.e gfx.point(lat, lng)
   * @param  {number} radius the radius to search from the centerpoint
   * @param  {string} field the document field that contains the GeoFirePoint data
   * @param  {GeoQueryOptions} opts=defaultOpts
   * @returns {Observable<GeoQueryDocument>} sorted by nearest to farthest
   */
  within(
    center: GeoFirePoint,
    radius: number,
    field: string,
    opts = defaultOpts
  ): Observable<(GeoQueryDocument & T)[]> {
    const precision = setPrecsion(radius);
    const radiusBuffer = radius * 1.02; // buffer for edge distances
    const centerHash = center.hash.substr(0, precision);
    const area = GeoFirePoint.neighbors(centerHash).concat(centerHash);

    const queries = area.map(hash => {
      const query = this.queryPoint(hash, field);
      return createStream(query).pipe(snapToData());
    });

    const combo = combineLatest(...queries).pipe(
      map(arr => {
        const reduced = arr.reduce((acc, cur) => acc.concat(cur));
        return reduced
          .filter(val => {
            const lat = val[field].geopoint.latitude;
            const lng = val[field].geopoint.longitude;
            return center.distance(lat, lng) <= radiusBuffer;
          })

          .map(val => {
            const lat = val[field].geopoint.latitude;
            const lng = val[field].geopoint.longitude;
            const queryMetadata = {
              distance: center.distance(lat, lng),
              bearing: center.bearing(lat, lng)
            };
            return { ...val, queryMetadata } as (GeoQueryDocument & T);
          })

          .sort((a, b) => a.queryMetadata.distance - b.queryMetadata.distance);
      }),
      shareReplay(1)
    );

    return combo;
  }

  first() {}

  private queryPoint(geohash: string, field: string) {
    const end = geohash + '~';
    return this.query
      .orderBy(`${field}.geohash`)
      .startAt(geohash)
      .endAt(end);
  }

  // withinBbox(field: string, bbox: number, opts = defaultOpts) {
  //   return 'not implemented';
  // }

  // findNearest(field: string, radius: number, opts = defaultOpts) {
  //   return 'not implemented';
  // }

  // // Expands radius until hit
  // findFirst() {
  //   return 'not implemented';
  // }
}

function snapToData(id = 'id') {
  return map((foo: firestore.QuerySnapshot) =>
    foo.docs.map(v => {
      return {
        ...(id ? { [id]: v.id } : null),
        ...v.data()
      };
    })
  );
}

/**
internal, do not use
 */
function createStream(input): Observable<any> {
  return new Observable(observer => {
    const unsubscribe = input.onSnapshot(observer);
    return { unsubscribe };
  });
}
/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the GeoFirePoint
 * @param  {boolean=false} includeProps
 */
export function toGeoJSON(field: string, includeProps: boolean = false) {
  return map((data: any[]) => {
    return {
      type: 'FeatureCollection',
      features: data.map(v =>
        GeoFirePoint.geoJSON(
          [v[field].geopoint.latitude, v[field].geopoint.longitude],
          includeProps ? { ...v } : {}
        )
      )
    } as FeatureCollection<Geometry>;
  }) as any;
}

/**
 * Helper function to convert any query from an RxJS Observable to a Promise
 * Example usage: await get( collection.within(a, b, c) )
 * @param  {Observable<any>} observable
 * @returns {Promise<any>}
 */
export function get(observable: Observable<any>): Promise<any> {
  return observable.pipe(first()).toPromise();
}
