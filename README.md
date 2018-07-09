# GeoFireX

Realtime Geolocation with Firestore & RxJS

[Live Demo](https://geo-test-c92e4.firebaseapp.com)

## QuickStart

```shell
npm install firebase geofirex
```

#### Initialize

The library is a lightweight client for the Firebase SDK that provides tools for handling geolocation data in Firestore.

```ts
// Init Firebase
import * as firebase from 'firebase/app';
firebase.initializeApp(yourConfig);

// Init GeoFireX
import * as geofirex from 'geofirex';
const geo = geofirex.init(firebase);
```

#### Write Geo Data

First, you'll need to add some geolocation data in your database. A `collection` creates a reference to Firestore (just like the SDK), but with some extra geoquery features. The `geohash` method returns a class that helps you create geolocation data.

```ts
const cities = geo.collection('cities');

const point = geo.point(40, -119);

cities.add({ name: 'Phoenix', position: point.data });
```

#### Query Geo Data

Now let's make a query Firestore for _cities.position within 100km radius of a centerpoint_.

```ts
const center = geo.point(40.1, -119.1);
const radius = 100;
const field = 'position';

const query = cities.within(center, radius, field);
```

The query returns a realtime Observable of the document data + some additional metadata.

```ts
query.subscribe(console.log);
// [{ ...documentData, queryMetadata: { distance: 1.23232, bearing: 230.23 }  }]
```

## API

Better docs soon, code is well-documented via typings...

### `collection(path: string, query? QueryFn)`

Creates reference to a Firestore collection that can be used to make geo-queries and perform writes If you pass an optional Firestore query function, all subsequent geo-queries will be limited to this subset of documents

Example:

```
const collection = geo.collection('cities', ref => ref.where('zip', '==', 90201) )
```

#### Performing Geo-Queries

`collection.within(center: _GeoFirePoint_, radius: _`number`_, field: _`string`_, opts?: GeoQueryOptions):`Observable`<`object`[]>`

Query by geographic distance. `within` queries parent Firestore collection for documents that exist within X kilometers of the centerpoint.

Each doc also contains returns distance and bearing calculated on the query on the `queryMetadata` property.

**Returns:** `Observable`<`object`[]>

#### Write Data

Write data just like you would in Firestore

`collection.add(data)`

Or use one of the client's conveniece methods

- `collection.setDoc(id, data)` - Set a document in the collection with an ID.
- `collection.setPoint(lat, lng)` - Non-destructive update with a GeoFirePoint

#### Read Data

In addition to Geo-Queries, you can also read the collection like you would normally in Firestore, but as an Observable

- `collection.data()`- Observable of document data
- `collection.snapshot()`- Observable of Firestore QuerySnapshot

### `point`

Returns a GeoFirePoint allowing you to create geohashes, format data, and calculate relative distance/bearing.

`geo.point(latitude, longitude)`

#### Getters

- `point.hash` Returns a geohash string at precision 9
- `point.geoPoint` Returns a Firestore GeoPoint
- `point.geoJSON` Returns data as a GeoJSON `Feature<Point>`
- `point.coords` Returns coordinates as `[latitude, longitude]`
- `point.data` Returns data object suitable for saving to the Firestore database

#### Geo Calculations

- `point.distance(latitude, longitude)` Haversine distance to a point
- `point.bearing(latitude, longitude)` Haversine bearing to a point

## Tips

### Seeing this error: `DocumentReference.set() called with invalid data`

Firestore writes cannot use custom classes, so make sure to call the `data` getter on the point.

```ts
const point = geo.point(40, -50);
// This is an ERROR
ref.add({ location: point });

// This is GOOD
ref.add({ location: point.data });
```

### Making Dynamic Reatime Queries the RxJS Way

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

### Don't need a realtime stream? Use a Promise with async/await

```ts
import { get } from 'geofirex';

async function getCars {
    const query = geo.collection('cities').within(...)
    const cities = await get(query)
}
```

### Always Order by `[Latitude, Longitude]`

The GeoJSON spec formats coords as `[Longitude, Latitude]` to represent an X/Y plane. However, the Firebase GeoPoint uses `[Latitude, Longitude]`. For consistency, this libary will always require you to use the latter format.
