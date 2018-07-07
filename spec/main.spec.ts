import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { config } from './util';

import * as _ from 'lodash';
import 'jest';

import { GeoHash } from '../src/geohash';
import { CollectionRef } from '../src/collection';
import { Observable } from 'rxjs';
import { first, take } from 'rxjs/operators';

import { GeoFireX } from '../src/client';

describe('RxGeofire', () => {
  let gfx;
  beforeAll(() => {
    firebase.initializeApp(config);
    const firestore = firebase.firestore();
    const settings = { timestampsInSnapshots: true };
    firestore.settings(settings);

    gfx = new GeoFireX(firebase);
  });

  test('says hello', () => {
    expect(firebase.apps.length).toBe(1);
  });

  describe('GeoHash', () => {
    let point: GeoHash;
    beforeEach(() => {
      point = gfx.geohash(38, -119);
    });

    test('should initilize with accessors', () => {
      expect(point).toBeInstanceOf(GeoHash);
      expect(point.geoPoint).toBeInstanceOf(firebase.firestore.GeoPoint);
    });

    test('should create a GeoHash', () => {
      expect(point.hash.length).toBe(9);
    });

    test('should return its neighbors', () => {
      expect(point.neighbors).toBeInstanceOf(Array);
      expect(point.neighbors.length).toBe(8);
    });

    test('should calculate distance', () => {
      const p = gfx.geohash(40.5, -80.0);
      expect(p.distance(40.49100679636276, -80)).toBeCloseTo(1.0);
      expect(p.distance(-20, 30)).toBeCloseTo(13099.698);
    });
  });

  describe('CollectionRef', () => {
    let ref: CollectionRef;
    let hash;
    let phx;
    beforeEach(() => {
      ref = gfx.collection('cities');
      hash = gfx.geohash(33.45, -112.1);
      phx = { id: 'phoenix', name: 'Phoenix, AZ', position: hash.data };
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
      await ref.addAt('phoenix', phx);
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
        .subscribe(val => {
          expect(_.find(val, { id: 'phoenix' })).toBeUndefined();
          done();
        });
    });
  });

  describe('geoqueries', () => {
    let ref: CollectionRef;
    let center;
    beforeEach(() => {
      ref = gfx.collection('bearings');
      center = gfx.geohash(40.5, -80.0);
    });

    test('should return 16 positions within 10km radius', async done => {
      const query = ref.within(center, 10, 'pos');
      expect(query).toBeInstanceOf(Observable);

      const val = await resolve(query);
      expect(val.length).toBe(16);
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
          ref.addAt('testPoint', { pos: gfx.geohash(40.49999, -80).data });
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
});

// import { seed } from './seed';
// seed();
function sleep(delay) {
  const start = Date.now();
  while (Date.now() < start + delay);
}

function resolve(obsv, n = 1) {
  return obsv.pipe(take(n)).toPromise();
}
