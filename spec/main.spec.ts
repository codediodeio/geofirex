import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { config, mockResponse } from './util';

import * as _ from 'lodash';
import 'jest';

import { GeoFireQuery, toGeoJSON, get, GeoQueryDocument } from '../src/query';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';

import { neighbors, distance, bearing } from '../src/util';

import { GeoFireClient, FirePoint } from '../src/client';

const COLLECTION_BEARINGS = 'bearings';

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
      const p: FirePoint = gfx.point(40.5, -80.0);
      expect(gfx.distance(p, gfx.point(40.49100679636276, -80))).toBeCloseTo(1.0);
      expect(gfx.distance(p, gfx.point(-20, 30) )).toBeCloseTo(13099.698);
    });

    test('should calculate bearing', () => {
      const p: FirePoint = gfx.point(40.5, -80.0);
      expect(gfx.bearing(p, gfx.point(42, -80))).toBeCloseTo(0);
      expect(gfx.bearing(p, gfx.point(40, -80))).toBeCloseTo(180);
      expect(gfx.bearing(p, gfx.point(40.5, -80.005))).toBeCloseTo(-90);
    });
  });

  describe('within(...) queries', () => {
    let ref: GeoFireQuery<any>;
    let center: FirePoint;

    beforeEach(() => {
      ref = gfx.query(COLLECTION_BEARINGS);
      center = gfx.point(40.5, -80.0);
    });

    test('remove test point from db', (done: jest.DoneCallback) => {
      const dbRef = firebase.firestore().collection(COLLECTION_BEARINGS).doc('testPoint');
      dbRef.delete();
      done();
    });

    test('work with compound Firestore queries', async (done: jest.DoneCallback) => {
      const radius = 50;
      const dbRef: firebase.firestore.Query<firebase.firestore.DocumentData> = firebase.firestore().collection('compound').where('color', '==', 'blue')
      const point: FirePoint = gfx.point(38, -119);
      const query: Observable<GeoQueryDocument[]> = gfx.query(dbRef).within(point, radius, 'point');
      const val: GeoQueryDocument[] = await resolve(query);
      expect(val.length).toBe(1);
      done();
    });

    test('should return 16 positions within 10km radius', async (done: jest.DoneCallback) => {
      const radius = 10;
      const query: Observable<GeoQueryDocument[]> = ref.within(center, radius, 'pos');
      expect(query).toBeInstanceOf(Observable);

      const val: GeoQueryDocument[] = await resolve(query);
      expect(val.length).toBe(16);
      done();
    });

    test('should work with switchMap', async (done: jest.DoneCallback) => {
      const rad = new BehaviorSubject(0.5);
      const query: Observable<GeoQueryDocument[]> = rad.pipe(
        switchMap<number, Observable<GeoQueryDocument[]>>((radius: number) => {
          return ref.within(center, radius, 'pos');
        })
      );
      expect(query).toBeInstanceOf(Observable);

      const val: GeoQueryDocument[] = await resolve(query);
      expect(val.length).toBe(4);
      done();
    });

    test('should return 4 positions within 0.5km radius', async (done: jest.DoneCallback) => {
      const radius = 0.5;
      const query: Observable<GeoQueryDocument[]> = ref.within(center, radius, 'pos');
      const val: GeoQueryDocument[] = await resolve(query);
      expect(val.length).toBe(4);
      done();
    });
  });

  describe('Custom Operators', () => {

    test('toGeoJSON should map a collection to GeoJSON', async (done: jest.DoneCallback) => {
      const val = (await get(of(mockResponse).pipe(toGeoJSON('point')))) as any;
      expect(val.type).toEqual('FeatureCollection');
      done();
    });
  });

  describe('Query Shape', () => {
    let ref: GeoFireQuery<any>;
    let center: FirePoint;
    let data: any;

    beforeAll(async () => {
      ref = gfx.query(COLLECTION_BEARINGS);
      center = gfx.point(40.5, -80.0);
      data = await get(ref.within(center, 5, 'pos'));
    });

    test('should have query metadata', async (done: jest.DoneCallback) => {
        expect(data[0].hitMetadata.bearing).toBeDefined();
        expect(data[0].hitMetadata.distance).toBeDefined();
        done();
    });

    test('should be ordered by distance', async (done: jest.DoneCallback) => {
      const first = data[0].hitMetadata.distance;
      const last = data[data.length - 1].hitMetadata.distance;
      expect(first).toBeCloseTo(0.2);
      expect(data.length).toBe(12);
      expect(last).toBeCloseTo(5);
      expect(first).toBeLessThan(last);
      done();
    });

    test('should update the query in realtime on add/delete', async (done: jest.DoneCallback) => {
      const radius = 0.4;
      const query: Observable<GeoQueryDocument[]> = ref.within(center, radius, 'pos');
      const dbRef = firebase.firestore().collection(COLLECTION_BEARINGS).doc('testPoint');
      await dbRef.delete();
      
      let i = 1;
      query.pipe(
        take(3)
      )
      .subscribe((val: GeoQueryDocument[]) => {
        if (i === 1) {
          i++;
          expect(val.length).toBe(4);
          dbRef.set({ pos: gfx.point(40.49999, -80) });
        } else if (i === 2) {
          i++;
          dbRef.delete();
          expect(val.length).toBe(5);
        } else {
          expect(val.length).toBe(4);
          done();
        }
      });
    });
  });
});


function resolve(obsv: any, n = 1) {
  return obsv.pipe(take(n)).toPromise();
}
