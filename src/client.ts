// import { firestore } from 'firebase/app';
// import * as firebase from 'firebase/app';
// const firestore = firebase.firestore;
import { firestore } from './interfaces';

import { CollectionRef, QueryFn } from './collection';
import { GeoHash } from './geohash';

export class GeoFireX {
  constructor(private app: firestore.FirebaseApp) {}

  collection(path: string, query?: QueryFn): CollectionRef {
    return new CollectionRef(this.app, path, query);
  }

  geohash(latitude: number, longitude: number) {
    return new GeoHash(this.app, latitude, longitude);
  }
}

export function init(app: firestore.FirebaseApp) {
  return new GeoFireX(app);
}
