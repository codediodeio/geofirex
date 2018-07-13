<p align="center">

<a href="https://slackin-pbfjhfxnsa.now.sh"><img src="https://slackin-pbfjhfxnsa.now.sh/badge.svg"></a>

<a href="https://circleci.com/gh/codediodeio/geofirex"><img src="https://circleci.com/gh/codediodeio/geofirex.svg?style=svg"></a>

</p>

# GeoFireX

Realtime Geolocation with Firestore & RxJS

:point_right: [Live Demo](https://geo-test-c92e4.firebaseapp.com)
:tv: [Video Tutorial](https://angularfirebase.com/lessons/geolocation-query-in-firestore-realtime/)

## :checkered_flag: QuickStart

```shell
npm install geofirex

# peer dependencies
npm install rxjs firebase
```

### Initialize

The library is a lightweight client for the Firebase Web SDK that provides tools for wrangling geolocation data in Firestore. You need a [Firebase project](https://firebase.google.com/docs/storage/web/start) to get started.

```ts
// Init Firebase
import * as firebase from 'firebase/app';
firebase.initializeApp(yourConfig);

// Init GeoFireX
import * as geofirex from 'geofirex';
const geo = geofirex.init(firebase);
```

### Write Geo Data

Next, add some geolocation data in your database. A `collection` creates a reference to Firestore (just like the SDK), but with some extra geolocation tools. The `point` method returns a class that helps you create geolocation data.

```ts
const cities = geo.collection('cities');

const point = geo.point(40, -119);

cities.add({ name: 'Phoenix', position: point.data });
```

Calling `point.data` returns an object that contains a [geohash string](https://www.movable-type.co.uk/scripts/geohash.html) and a [Firestore GeoPoint](https://firebase.google.com/docs/reference/android/com/google/firebase/firestore/GeoPoint). It should look like this in your database. You can name the object whatever you want and even save multiple points on a single document.

![](https://firebasestorage.googleapis.com/v0/b/geo-test-c92e4.appspot.com/o/point1.png?alt=media&token=0c833700-3dbd-476a-99a9-41c1143dbe97)

### Query Geo Data

Now let's query Firestore for _cities.position within 100km radius of a centerpoint_.

```ts
const center = geo.point(40.1, -119.1);
const radius = 100;
const field = 'position';

const query = cities.within(center, radius, field);
```

The query returns a realtime Observable of the document data, plus some useful metadata like _distance_ and _bearing_ from the query centerpoint.

```ts
query.subscribe(console.log);
// [{ ...documentData, queryMetadata: { distance: 1.23232, bearing: 230.23 }  }]
```

You now have a realtime stream of data to visualize on a map.

![](https://firebasestorage.googleapis.com/v0/b/geo-test-c92e4.appspot.com/o/geoquery-fire2.gif?alt=media&token=487abd17-90a3-4589-a82d-81d172ddeb25)

## :notebook: API

### `collection(path: string, query? QueryFn)`

Creates reference to a Firestore collection that can be used to make geo-queries and perform writes If you pass an optional Firestore query function, all subsequent geo-queries will be limited to this subset of documents

Example:

```ts
const collection = geo.collection('cities');
```

#### Performing Geo-Queries

`collection.within(center: GeoFirePoint, radius: number, field: string)`

Query the parent Firestore collection by geographic distance. It will return documents that exist within X kilometers of the centerpoint.

Each doc also contains returns _distance_ and _bearing_ calculated on the query on the `queryMetadata` property.

**Returns:** `Observable<object[]>`

#### Write Data

Write data just like you would in Firestore

`collection.add(data)`

Or use one of the client's conveniece methods

- `collection.setDoc(id, data)` - Set a document in the collection with an ID.
- `collection.setPoint(id, field, lat, lng)`- Add a geohash to an existing doc

#### Read Data

In addition to Geo-Queries, you can also read the collection like you would normally in Firestore, but as an Observable

- `collection.data()`- Observable of document data
- `collection.snapshot()`- Observable of Firestore QuerySnapshot

### `point(latitude: number, longitude: number)`

Returns a GeoFirePoint allowing you to create geohashes, format data, and calculate relative distance/bearing.

Example: `const point = geo.point(38, -119)`

#### Getters

- `point.hash` Returns a geohash string at precision 9
- `point.geoPoint` Returns a Firestore GeoPoint
- `point.geoJSON` Returns data as a GeoJSON `Feature<Point>`
- `point.coords` Returns coordinates as `[latitude, longitude]`
- `point.data` Returns data object suitable for saving to the Firestore database

#### Geo Calculations

- `point.distance(latitude, longitude)` Haversine distance to a point
- `point.bearing(latitude, longitude)` Haversine bearing to a point

## :pizza: Additional Features

The goal of this package is to facilitate rapid feature development with tools like MapBox, Google Maps, and D3.js. If you have an idea for a useful feature, open an issue.

### `toGeoJSON` Operator

A custom RxJS operator that transforms a collection into a [GeoJSON FeatureCollection](https://macwright.org/2015/03/23/geojson-second-bite.html#featurecollection). Very useful for tools like [MapBox](https://blog.mapbox.com/real-time-maps-for-live-events-fad0b334e4e) that can use GeoJSON to update a realtime data source.

```ts
const query = geo.collection('cars').within(...)

query.pipe( toGeoJSON() )

// Emits a single object typed as a FeatureCollection<Geometry>
{
  "type": "FeatureCollection",
  "features": [...]
}
```

#### Promises with `get`

Don't need a realtime stream? Convert any query observable to a promise by wrapping it with `get`.

```ts
import { get } from 'geofirex';

async function getCars {
    const query = geo.collection('cars').within(...)
    const cars = await get(query)
}
```

## :zap: Tips

### Scale to Massive Collections

It's possibe to build Firestore collections with billions of documents. One of the main motivations of this project was to make geoqueries possible on a queried subset of data. You can make a regular Firestore query on collection by passing a callback as the second argument, then all geoqueries will scoped these contstraints.

Note: This query requires a composite index, which you will be prompted to create with an error from Firestore on the first request.

Example:

```ts
const users = geo.collection('users', ref =>
  ref.where('status', '==', 'online')
);

const nearbyOnlineUsers = users.within(center, radius, field);
```

### Usage with RxJS < 6.2, or Ionic v3

This package requires RxJS 6.2, but you can still use it with older versions without blowing up you app by installing rxjs-compat.

Example:

```shell
npm i rxjs@latest rxjs-compat
```

### Seeing this error: `DocumentReference.set() called with invalid data`

Firestore writes cannot use custom classes, so make sure to call the `data` getter on the point.

```ts
const point = geo.point(40, -50);
// This is an ERROR
ref.add({ location: point });

// This is GOOD
ref.add({ location: point.data });
```

### Make Dynamic Queries the RxJS Way

```ts
const radius = new BehaviorSubject(1);
const cities = geo.collection('cities');

const points = this.radius.pipe(
  switchMap(rad => {
    return cities.within(center, rad, 'point');
  })
);

// Now update your query
radius.next(23);
```

### Always Order by `[Latitude, Longitude]`

The GeoJSON spec formats coords as `[Longitude, Latitude]` to represent an X/Y plane. However, the Firebase GeoPoint uses `[Latitude, Longitude]`. For consistency, this libary will always require you to use the latter format.
