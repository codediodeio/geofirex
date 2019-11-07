// import { firestore } from './interfaces';

import { Observable, combineLatest, Subject } from 'rxjs';
import {
  shareReplay,
  map,
  first,
  finalize,
  takeUntil
} from 'rxjs/operators';

import { FeatureCollection, Geometry } from './interfaces';
import { neighbors, toGeoJSONFeature, distance, bearing, setPrecision } from './util';

import * as fb from 'firebase/app';
import { FirebaseSDK } from './interfaces';
import { FirePoint } from './client';

export type QueryFn = (
  ref: fb.firestore.CollectionReference
) => fb.firestore.Query;

export interface GeoQueryOptions {
  units?: 'km';
  log?: boolean;
}
const defaultOpts: GeoQueryOptions = { units: 'km', log: false };

export interface HitMetadata {
  bearing: number;
  distance: number;
}

export interface GeoQueryDocument {
  hitMetadata: HitMetadata;
}

export class GeoFireQuery<T = any> {
  constructor(
    private app: FirebaseSDK,
    private ref?: fb.firestore.CollectionReference | fb.firestore.Query | string
  ) {
    if (typeof ref === 'string') {
      this.ref = this.app.firestore().collection(ref);
    }
  }
  // GEO QUERIES
  /**
   * Queries the Firestore collection based on geograpic radius
   * @param  {FirePoint} center the starting point for the query, i.e gfx.point(lat, lng)
   * @param  {number} radius the radius to search from the centerpoint
   * @param  {string} field the document field that contains the FirePoint data
   * @param  {GeoQueryOptions} opts=defaultOpts
   * @returns {Observable<GeoQueryDocument>} sorted by nearest to farthest
   */
  within(
    center: FirePoint,
    radius: number,
    field: string,
    opts?: GeoQueryOptions
  ): Observable<(GeoQueryDocument & T)[]> {
    opts = { ...defaultOpts, ...opts };
    const tick = Date.now();
    const precision = setPrecision(radius);
    const radiusBuffer = radius * 1.02; // buffer for edge distances
    const centerHash = center.geohash.substr(0, precision);
    const area = neighbors(centerHash).concat(centerHash);

    const { latitude: centerLat, longitude: centerLng } = center.geopoint;

    // Used to cancel the individual geohash subscriptions
    const complete = new Subject();

    // Map geohash neighbors to individual queries
    const queries = area.map(hash => {
      const query = this.queryPoint(hash, field);
      return createStream(query).pipe(
        snapToData(),
        takeUntil(complete)
      );
    });

    // Combine all queries concurrently
    const combo = combineLatest(...queries).pipe(
      map(arr => {
        // Combine results into a single array
        const reduced = arr.reduce((acc, cur) => acc.concat(cur));

        // Filter by radius
        const filtered = reduced.filter(val => {
          const { latitude, longitude } = val[field].geopoint;

          return (
            distance([centerLat, centerLng], [latitude, longitude]) <=
            radiusBuffer
          );
        });

        // Optional logging
        if (opts.log) {
          console.group('GeoFireX Query');
          console.log(`🌐 Center ${[centerLat, centerLng]}. Radius ${radius}`);
          console.log(`📍 Hits: ${reduced.length}`);
          console.log(`⌚ Elapsed time: ${Date.now() - tick}ms`);
          console.log(`🟢 Within Radius: ${filtered.length}`);
          console.groupEnd();
        }

        // Map and sort to final output
        return filtered
          .map(val => {
            const { latitude, longitude } = val[field].geopoint;

            const hitMetadata = {
              distance: distance([centerLat, centerLng], [latitude, longitude]),
              bearing: bearing([centerLat, centerLng], [latitude, longitude])
            };
            return { ...val, hitMetadata } as (GeoQueryDocument & T);
          })

          .sort((a, b) => a.hitMetadata.distance - b.hitMetadata.distance);
      }),
      shareReplay(1),
      finalize(() => {
        opts.log && console.log('✋ Query complete');
        complete.next(true);
      })
    );

    return combo;
  }

  private queryPoint(geohash: string, field: string) {
    const end = geohash + '~';
    return (this.ref as fb.firestore.CollectionReference)
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
  return map((querySnapshot: fb.firestore.QuerySnapshot) =>
    querySnapshot.docs.map(v => {
      return {
        ...(id ? { [id]: v.id } : null),
        ...v.data()
      };
    })
  );
}

/**
internal, do not use. Converts callback to Observable. 
 */
function createStream(input): Observable<any> {
  return new Observable(observer => {
    const unsubscribe = input.onSnapshot(
      val => observer.next(val),
      err => observer.error(err)
    );
    return { unsubscribe };
  });
}
/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the FirePoint
 * @param  {boolean=false} includeProps
 */
export function toGeoJSON(field: string, includeProps: boolean = false) {
  return map((data: any[]) => {
    return {
      type: 'FeatureCollection',
      features: data.map(v =>
        toGeoJSONFeature(
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
