// import * as Chance from 'chance';
// import { config } from './util';

// // Instantiate Chance so it can be used
// var chance = new Chance();
// import * as _ from 'lodash';

// import * as firebase from 'firebase/app';
// if (firebase.apps.length) {
//   firebase.initializeApp(config);
// }

// const firestore = firebase.firestore();
// const settings = { timestampsInSnapshots: true };

// firestore.settings(settings);

// import { GeoHash } from '../src/geohash';
// import { CollectionRef } from '../src/collection';

// export function seedRandom() {
//   const ref = new CollectionRef('test-locations');
//   const latRng = { min: 33, max: 35 };
//   const lngRng = { min: -114, max: -112 };
//   for (const i in Array(10).fill(1)) {
//     const pos = new GeoHash(chance.latitude(latRng), chance.longitude(lngRng))
//       .data();
//     const data = {
//       name: chance.name(),
//       pos
//     };

//     ref.addAt(_.kebabCase(data.name), data);
//     console.log(data);
//   }
// }

// import { destination } from '@turf/turf';

// export function seedInterval() {
//   const center = new GeoHash(40.5, -80.0);
//   const bearings = [0, 90, 180, 270];

//   for (const i of [0.2, 1, 5, 10, 25, 50, 100, 1000]) {
//     for (const b of bearings) {
//       const coords = destination([center.longitude, center.latitude], i, b)
//         .geometry.coordinates;
//       const point = new GeoHash(coords[1], coords[0]);
//       const name = `${i}_distance-${b}_bearing`;
//       // ref.addAt(name, { pos: point.data() });
//     }
//   }
// }

// export async function seedOne(gfx: GeoFireClient) {
//     const col = gfx.collection('compound');
//     const point = gfx.point(38, -119);
//     await col.setDoc(`foo${Date.now()}`, { point: point.data(), color: 'blue' });
//     console.log('foo');
//   }
