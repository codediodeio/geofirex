// import * as firebase from 'firebase/app';
// const firestore = firebase.firestore;
import { firestore } from './interfaces';
// const firestore = firestoreStuff.FirebaseNamespace.firestore;

// import FirebaseApp from from '@firebase/app-types';

import { Observable, combineLatest } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { GeoHash } from './geohash';
import { setPrecsion } from './util';

export type QueryFn = (ref: firestore.CollectionReference) => firestore.Query;

const defaultOpts = { units: 'km' };

export class CollectionRef {
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

  snapshot() {
    return this.stream;
  }

  data() {
    return this.stream.pipe(snapToData());
  }

  add(data) {
    return this.ref.add(data) as Promise<firestore.DocumentReference>;
  }

  delete(id) {
    return this.ref.doc(id).delete();
  }

  addAt(id, data) {
    return this.ref.doc(id).set(data);
  }

  changeQuery(query: QueryFn) {
    this.query = query(this.ref);
    this.setStream();
  }

  private setStream() {
    this.query = this.query || this.ref;
    this.stream = createStream(this.query || this.ref).pipe(shareReplay(1));
  }

  // GEO QUERIES

  within(center: GeoHash, radius: number, field: string, opts = defaultOpts) {
    const precision = setPrecsion(radius);
    const centerHash = center.hash.substr(0, precision);
    const area = GeoHash.neighbors(centerHash).concat(centerHash);

    // console.log(precision, radius);

    const queries = area.map(hash => {
      const query = this.queryPoint(hash, field);
      return createStream(query).pipe(snapToData());
    });

    return combineLatest(...queries).pipe(
      map(arr => {
        return arr
          .reduce((acc, cur) => acc.concat(cur))

          .filter(val => {
            const lat = val[field].geopoint.latitude;
            const lng = val[field].geopoint.longitude;
            return center.distance(lat, lng) <= radius * 1.1;
          })

          .map(val => {
            const lat = val[field].geopoint.latitude;
            const lng = val[field].geopoint.longitude;
            return { ...val, distance: center.distance(lat, lng) };
          });
      }),
      shareReplay(1)
    );
  }

  private queryPoint(geohash: string, field: string) {
    const end = geohash + '~';
    return this.query
      .orderBy(`${field}.geohash`)
      .startAt(geohash)
      .endAt(end);
  }

  withinBbox(field: string, bbox: number, opts = defaultOpts) {
    return 'not implemented';
  }

  findNearest(field: string, radius: number, opts = defaultOpts) {
    return 'not implemented';
  }

  // Expands radius until hit
  findFirst() {
    return 'not implemented';
  }
}

function snapToData() {
  return map((foo: firestore.QuerySnapshot) =>
    foo.docs.map(v => {
      return {
        id: v.id,
        ...v.data()
      };
    })
  );
}

function createStream(input): Observable<any> {
  return Observable.create(observer => {
    input.onSnapshot({
      next(val) {
        observer.next(val);
      }
    });
  });
}
