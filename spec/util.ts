export const config = {
  apiKey: 'AIzaSyBTyQHGGFTooUvfR0_PpfVx8TI8Q7K-0HA',
  authDomain: 'geo-test-c92e4.firebaseapp.com',
  databaseURL: 'https://geo-test-c92e4.firebaseio.com',
  projectId: 'geo-test-c92e4',
  storageBucket: 'geo-test-c92e4.appspot.com',
  messagingSenderId: '200126650097'
};

import * as firebase from 'firebase/app';

export const mockResponse = [
  {
    title: 'mock1',
    point: {
      geopoint: new firebase.firestore.GeoPoint(28, -119),
      geohash: 'xxxxxxxxx'
    },
    hitMetadata: {
      bearing: 90.2,
      distance: 120.2
    }
  },
  {
    title: 'mock2',
    point: {
      geopoint: new firebase.firestore.GeoPoint(38, -90),
      geohash: 'xxxxxxxxx'
    },
    hitMetadata: {
      bearing: 40.2,
      distance: 20.2
    }
  }
];
