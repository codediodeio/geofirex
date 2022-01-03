/* eslint-disable @typescript-eslint/no-explicit-any */
import { FirebaseApp } from "firebase/app";
import { collection, CollectionReference, DocumentData, endAt, Firestore, getFirestore, onSnapshot, orderBy, query, Query, QueryConstraint, QuerySnapshot, startAt, where } from "firebase/firestore";

import { Observable, combineLatest, Subject } from "rxjs";
import { shareReplay, map, first, finalize, takeUntil } from "rxjs/operators";

import { FeatureCollection, Geometry } from "./interfaces";
import {
  neighbors,
  toGeoJSONFeature,
  distance,
  bearing,
  setPrecision,
} from "./util";

import { FirePoint } from "./client";

export type QueryFn = (
  ref: CollectionReference
) => Query;

export interface GeoQueryOptions {
  units?: "km";
  log?: boolean;
  category?: string;
}

export interface HitMetadata {
  bearing: number;
  distance: number;
}

export interface GeoQueryDocument {
  hitMetadata: HitMetadata;
}

const defaultOpts: GeoQueryOptions = {
  units: "km",
  log: false,
  category: null,
};


export class GeoFireQuery<T = any> {

  firestore: Firestore;
  collectionRef: CollectionReference;
  collectionQuery: Query;

  constructor(
    private app: FirebaseApp,
    private reference?: CollectionReference | string,
    private constraint: QueryConstraint = null,
  ) {
    this.firestore = getFirestore(this.app);
    if (typeof this.reference === "string") {
      this.collectionRef = collection(this.firestore, this.reference);
    } else {
      this.collectionRef = this.reference;
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
    const queries = area.map((hash: string) => {
      const q: Query<DocumentData> = this.queryPoint(hash, field);
      return createStream(q).pipe(snapToData(), takeUntil(complete));
      // return createStream(q).subscribe(pipe(snapToData(), takeUntil(complete)));
    });

    // Combine all queries concurrently
    const combo = combineLatest(...queries).pipe(
      map((arr: any) => {
        // Combine results into a single array
        const reduced = arr.reduce((acc: any, cur: any) => acc.concat(cur));

        // Filter by radius
        const filtered = reduced.filter((val: any) => {
          const { latitude, longitude } = val[field].geopoint;

          return (
            distance([centerLat, centerLng], [latitude, longitude]) <=
            radiusBuffer
          );
        });

        // Optional logging
        if (opts.log) {
          console.group("GeoFireX Query");
          console.log(`🌐 Center ${[centerLat, centerLng]}. Radius ${radius}`);
          console.log(`📍 Hits: ${reduced.length}`);
          console.log(`⌚ Elapsed time: ${Date.now() - tick}ms`);
          console.log(`🟢 Within Radius: ${filtered.length}`);
          console.groupEnd();
        }

        // Map and sort to final output
        return filtered
          .map((val: any) => {
            const { latitude, longitude } = val[field].geopoint;

            const hitMetadata: HitMetadata = {
              bearing: bearing([centerLat, centerLng], [latitude, longitude]),
              distance: distance([centerLat, centerLng], [latitude, longitude]),
            };
            return { ...val, hitMetadata } as GeoQueryDocument & T;
          })

          .sort((a: any, b: any) => a.hitMetadata.distance - b.hitMetadata.distance);
      }),
      shareReplay(1),
      finalize(() => {
        opts.log && console.log("✋ Query complete");
        complete.next(true);
      })
    );

    return combo;
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
  withinCategory(
    center: FirePoint,
    radius: number,
    field: string,
    opts?: GeoQueryOptions
  ): Observable<any[]> {
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
    const queries = area.map((hash: string) => {
      const q: Query<DocumentData> = this.queryPoint(hash, field, opts.category);
      return createStream(q).pipe(snapToData(), takeUntil(complete));
      // return createStream(q).subscribe(pipe(snapToData(), takeUntil(complete)));
    });

    // Combine all queries concurrently
    const combo = combineLatest(...queries).pipe(
      map((arr: any) => {
        // Combine results into a single array
        const reduced = arr.reduce((acc: any, cur: any) => acc.concat(cur));

        // Filter by radius
        const filtered = reduced.filter((val: any) => {
          const { latitude, longitude } = val[field].geopoint;

          return (
            distance([centerLat, centerLng], [latitude, longitude]) <=
            radiusBuffer
          );
        });

        // Optional logging
        if (opts.log) {
          console.group("GeoFireX Query");
          console.log(`🌐 Center ${[centerLat, centerLng]}. Radius ${radius}`);
          console.log(`📍 Hits: ${reduced.length}`);
          console.log(`⌚ Elapsed time: ${Date.now() - tick}ms`);
          console.log(`🟢 Within Radius: ${filtered.length}`);
          console.groupEnd();
        }

        // Map and sort to final output
        return filtered
          .map((val: any) => {
            const { latitude, longitude } = val[field].geopoint;

            const hitMetadata: HitMetadata = {
              distance: distance([centerLat, centerLng], [latitude, longitude]),
              bearing: bearing([centerLat, centerLng], [latitude, longitude]),
            };
            return { ...val, hitMetadata };
          })

          .sort((a: any, b: any) => a.hitMetadata.distance - b.hitMetadata.distance);
      }),
      shareReplay(1),
      finalize(() => {
        opts.log && console.log("✋ Query complete");
        complete.next(true);
      })
    );

    return combo;
  }

  private queryPoint(geohash: string, field: string, category: string = null) {
    const end = geohash + "~";
    if (category) {
      if (this.constraint === null) {
        const collectionQuery = query(
          this.collectionRef,
          where("categories", "array-contains", category),
          orderBy(`${field}.geohash`),
          startAt(geohash),
          endAt(end)
        );
        return collectionQuery;
      } else {
        const collectionQuery = query(
          this.collectionRef,
          this.constraint,
          where("categories", "array-contains", category),
          orderBy(`${field}.geohash`),
          startAt(geohash),
          endAt(end)
        );
        return collectionQuery;
      }
    } else {
      if (this.constraint === null) {
        const collectionQuery = query(
          this.collectionRef,
          orderBy(`${field}.geohash`),
          startAt(geohash),
          endAt(end)
        );
        return collectionQuery;
      } else {
        const collectionQuery = query(
          this.collectionRef,
          this.constraint,
          orderBy(`${field}.geohash`),
          startAt(geohash),
          endAt(end)
        );
        return collectionQuery;
      }
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
}

function snapToData(id = "id") {
  return map((querySnapshot: QuerySnapshot) =>
    querySnapshot.docs.map((v: any) => {
      return {
        ...(id ? { [id]: v.id } : null),
        ...v.data(),
      };
    })
  );
}

/**
internal, do not use. Converts callback to Observable. 
 */
function createStream(input: Query<DocumentData>): any {  // }: Observable<any> {
  return new Observable((observer) => {
    const unsubscribe = onSnapshot(input,
      (val: any) => observer.next(val),
      (err: any) => observer.error(err)
    );
    return { unsubscribe };
  });
  /*
  return new Observable((observer) => {
    const unsubscribe = input.onSnapshot(
      (val: any) => observer.next(val),
      (err: any) => observer.error(err)
    );
    return { unsubscribe };
  });
  */
}

/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the FirePoint
 * @param  {boolean=false} includeProps
 */
export function toGeoJSON(field: string, includeProps: boolean = false): any {
  return map((data: any[]) => {
    return {
      type: "FeatureCollection",
      features: data.map((v: any) =>
        toGeoJSONFeature(
          [v[field].geopoint.latitude, v[field].geopoint.longitude],
          includeProps ? { ...v } : {}
        )
      ),
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
