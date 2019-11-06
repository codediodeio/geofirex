import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { config, mockResponse } from './util';

import * as _ from 'lodash';
import 'jest';

import { GeoFirePoint } from '../src/point';
import { GeoFireCollectionRef, toGeoJSON, get } from '../src/collection';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { first, take, switchMap } from 'rxjs/operators';

import { GeoFireClient } from '../src/client';

describe('RxGeofire', () => {
  let gfx: GeoFireClient;
  beforeAll(() => {
    firebase.initializeApp(config);
    const firestore = firebase.firestore();
    // const settings = { timestampsInSnapshots: true };
    // firestore.settings(settings);

    gfx = new GeoFireClient( firebase );
  });

  test('says hello', () => {
    expect(firebase.apps.length).toBe(1);
    expect(gfx.app).toBe( firebase );
  });

  describe('GeoHash', () => {
    let point: GeoFirePoint;
    beforeEach(() => {
      point = gfx.point(38, -119);
    });

    test('should initilize with accessors', () => {
      expect(point).toBeInstanceOf(GeoFirePoint);
      expect(point.geoPoint()).toBeInstanceOf(firebase.firestore.GeoPoint);
      expect(point.data().geopoint).toBeInstanceOf(firebase.firestore.GeoPoint);
    });

    test('should create a GeoHash', () => {
      expect(point.hash().length).toBe(9);
    });

    test('should return its neighbors', () => {
      expect(point.neighbors()).toBeInstanceOf(Array);
      expect(point.neighbors().length).toBe(8);
    });

    test('should calculate distance', () => {
      const p = gfx.point(40.5, -80.0);
      expect(p.distance(40.49100679636276, -80)).toBeCloseTo(1.0);
      expect(p.distance(-20, 30)).toBeCloseTo(13099.698);
    });

    test('should calculate bearing', () => {
      const p = gfx.point(40.5, -80.0);
      expect(p.bearing(42, -80)).toBeCloseTo(0);
      expect(p.bearing(40, -80)).toBeCloseTo(180);
      expect(p.bearing(40.5, -80.005)).toBeCloseTo(-90);
    });
  });

  describe('CollectionRef', () => {
    let ref: GeoFireCollectionRef;
    let hash;
    let phx;
    beforeEach(() => {
      ref = gfx.collection('cities');
      hash = gfx.point(33.45, -112.1);
      phx = { id: 'phoenix', name: 'Phoenix, AZ', position: hash.data() };
    });

    test('should return an Observable', done => {
      expect(ref.data()).toBeInstanceOf(Observable);

      ref
        .data()
        .pipe(first())
        .subscribe(val => {
          expect(val).toContainEqual({ id: 'paris', name: 'Paris, FR' });
          expect(val).toBeInstanceOf(Array);
          done();
        });
    });

    test('should filter docs with a query and be able to change its query', done => {
      ref = gfx.collection('cities', ref =>
        ref.where('name', '==', 'Austin, TX')
      );

      ref.data().subscribe(val => {
        expect(val.length).toBe(1);
        expect(val[0]).toEqual({ id: 'austin', name: 'Austin, TX' });
      });

      setTimeout(() => {
        ref
          .data()
          .pipe(first())
          .subscribe(val => {
            expect(val[0]).toEqual({ id: 'austin', name: 'Austin, TX' });
          });
      }, 50);

      setTimeout(() => {
        ref.changeQuery(ref => ref.where('name', '==', 'Hilo, HI'));
        ref
          .data()
          .pipe(first())
          .subscribe(val => {
            expect(val.length).toBe(1);
            expect(val[0]).toEqual({ id: 'hilo', name: 'Hilo, HI' });
            done();
          });
      }, 100);
    });

    test('should add items to the database', async done => {
      await ref.setDoc('phoenix', phx);
      ref
        .data()
        .pipe(first())
        .subscribe(val => {
          expect(val).toContainEqual(phx);
          done();
        });
    });

    test('should remove items to the database', async done => {
      ref.delete('phoenix');
      sleep(200);
      ref
        .data()
        .pipe(first())
        .subscribe(arr => {
          expect(_.find(arr, val => val.id === 'phoenix')).toBeUndefined();
          done();
        });
    });

    test('the "get" function should convert an observable to a promise', async done => {
      const query = ref.data();
      const promise = get(query);

      expect(promise).toBeInstanceOf(Promise);

      const data = await promise;
      expect(data.length).toBeGreaterThan(1);
      done();
    });
  });

  describe('within(...) queries', () => {
    let ref: GeoFireCollectionRef;
    let center;
    beforeEach(() => {
      ref = gfx.collection('bearings');
      center = gfx.point(40.5, -80.0);
    });

    test('work with compound Firestore queries', async done => {
      const ref = gfx.collection('compound', ref =>
        ref.where('color', '==', 'blue')
      );
      const point = gfx.point(38, -119);
      const query = ref.within(point, 50, 'point');

      const val = await resolve(query);
      expect(val.length).toBe(1);
      done();
    });

    test('should return 16 positions within 10km radius', async done => {
      const query = ref.within(center, 10, 'pos');
      expect(query).toBeInstanceOf(Observable);

      const val = await resolve(query);
      expect(val.length).toBe(16);
      done();
    });

    test('should work with switchMap', async done => {
      const rad = new BehaviorSubject(0.5);

      const query = rad.pipe(
        switchMap(n => {
          return ref.within(center, n, 'pos');
        })
      );

      expect(query).toBeInstanceOf(Observable);

      const val = await resolve(query);
      expect(val.length).toBe(4);
      done();
    });

    test('should return 4 positions within 0.5km radius', async done => {
      const query = ref.within(center, 0.5, 'pos');

      const val = await resolve(query);
      expect(val.length).toBe(4);
      done();
    });

    test('should update the query in realtime on add/delete', async done => {
      const query = ref.within(center, 0.5, 'pos');
      let i = 1;
      query.pipe(take(3)).subscribe(val => {
        if (i === 1) {
          expect(val.length).toBe(4);
          ref.setDoc('testPoint', { pos: gfx.point(40.49999, -80).data() });
          i++;
        } else if (i === 2) {
          expect(val.length).toBe(5);
          ref.delete('testPoint');
          done();
        } else {
          expect(val.length).toBe(4);
        }
      });
    });
  });

  describe('Custom Operators', () => {
    test('toGeoJSON should map a collection to GeoJSON', async done => {
      const val = (await get(of(mockResponse).pipe(toGeoJSON('point')))) as any;
      expect(val.type).toEqual('FeatureCollection');
      done();
    });
  });

  describe('Query Shape', () => {
    let ref: GeoFireCollectionRef<any>;
    let center;
    let data;
    beforeAll(async () => {
      ref = gfx.collection('bearings');
      center = gfx.point(40.5, -80.0);
      data = await get(ref.within(center, 5, 'pos'));
    });
    test('should have query metadata', async done => {
      expect(data[0].queryMetadata.bearing).toBeDefined();
      expect(data[0].queryMetadata.distance).toBeDefined();
      done();
    });
    test('should be ordered by distance', async done => {
      const first = data[0].queryMetadata.distance;
      const last = data[data.length - 1].queryMetadata.distance;
      expect(first).toBeCloseTo(0.2);
      expect(last).toBeCloseTo(5);
      expect(first).toBeLessThan(last);
      done();
    });
  });
});

function sleep(delay) {
  const start = Date.now();
  while (Date.now() < start + delay);
}

function resolve(obsv, n = 1) {
  return obsv.pipe(take(n)).toPromise();
}
