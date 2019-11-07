import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { config, mockResponse } from './util';

import * as _ from 'lodash';
import 'jest';

import { GeoFireQuery, toGeoJSON, get } from '../src/query';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

import { neighbors, distance, bearing } from '../src/util';

import { GeoFireClient, FirePoint } from '../src/client';

describe('GeoFireX', () => {
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

  describe('FirePoint', () => {
    let point: FirePoint;
    beforeEach(() => {
      point = gfx.point(38, -119);
    });

    test('should initilize an object with a Firestore GeoPoint', () => {
      expect(point.geopoint).toBeInstanceOf(firebase.firestore.GeoPoint);
    });

    test('should create a GeoHash', () => {
      expect(point.geohash.length).toBe(9);
    });

    test('should calculate neighbors', () => {
      expect(neighbors(point.geohash)).toBeInstanceOf(Array);
      expect(neighbors(point.geohash).length).toBe(8);
    });

    test('should calculate distance', () => {
      const p = gfx.point(40.5, -80.0);
      expect(gfx.distance(p, gfx.point(40.49100679636276, -80))).toBeCloseTo(1.0);
      expect(gfx.distance(p, gfx.point(-20, 30) )).toBeCloseTo(13099.698);
    });

    test('should calculate bearing', () => {
      const p = gfx.point(40.5, -80.0);
      expect(gfx.bearing(p, gfx.point(42, -80))).toBeCloseTo(0);
      expect(gfx.bearing(p, gfx.point(40, -80))).toBeCloseTo(180);
      expect(gfx.bearing(p, gfx.point(40.5, -80.005))).toBeCloseTo(-90);
    });
  });

  describe('within(...) queries', () => {
    let ref: GeoFireQuery;
    let center;
    let dbRef
    beforeEach(() => {
      // dbRef
      ref = gfx.query('bearings');
      center = gfx.point(40.5, -80.0);
    });

    test('work with compound Firestore queries', async done => {
      const dbRef = firebase.firestore().collection('compound').where('color', '==', 'blue')
      const point = gfx.point(38, -119);
      const query = gfx.query(dbRef).within(point, 50, 'point');

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


  });

  describe('Custom Operators', () => {
    test('toGeoJSON should map a collection to GeoJSON', async done => {
      const val = (await get(of(mockResponse).pipe(toGeoJSON('point')))) as any;
      expect(val.type).toEqual('FeatureCollection');
      done();
    });
  });

  describe('Query Shape', () => {
    let ref: GeoFireQuery<any>;
    let center;
    let data;
    beforeAll(async () => {
      ref = gfx.query('bearings');
      center = gfx.point(40.5, -80.0);
      data = await get(ref.within(center, 5, 'pos'));
    });
    test('should have query metadata', async done => {

        expect(data[0].hitMetadata.bearing).toBeDefined();
        expect(data[0].hitMetadata.distance).toBeDefined();
        done();

    });
    test('should be ordered by distance', async done => {
      const first = data[0].hitMetadata.distance;
      const last = data[data.length - 1].hitMetadata.distance;
      expect(first).toBeCloseTo(0.2);
      expect(data.length).toBe(12);
      expect(last).toBeCloseTo(5);
      expect(first).toBeLessThan(last);
      done();
    });

    test('should update the query in realtime on add/delete', async done => {
      const query = ref.within(center, 0.4, 'pos');
      const dbRef = firebase.firestore().doc('bearings/testPoint');
      let i = 1;
      query.pipe(take(3)).subscribe(async val => {
        if (i === 1) {
          expect(val.length).toBe(4);
          i++;
          dbRef.set({ pos: gfx.point(40.49999, -80) });
        } else if (i === 2) {
          dbRef.delete();
          expect(val.length).toBe(5);
          i++;
        } else {
          expect(val.length).toBe(4);
          done();
        }
      });
    });
  });
});


function resolve(obsv, n = 1) {
  return obsv.pipe(take(n)).toPromise();
}
