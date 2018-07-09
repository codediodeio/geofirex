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

Better docs soon...

### `init(app: FirebaseApp)`

Initializes the GeoFireClient

```ts
import * as firebase from 'firebase/app';
import * as geofirex from 'geofirex';
firebase.initializeApp(yourConfig);

const geo = geofirex.init(firebase);
```

### `collection`

Creates reference to a Firestore collection that can be used to make geo-queries and perform writes If you pass a query, any subsequent geo-queries will be limited to this subset of documents

**Parameters:**

| Param            | Type     | Description                  |
| ---------------- | -------- | ---------------------------- |
| path             | `string` | path to collection           |
| `Optional` query | QueryFn  | callback for firestore query |

#### collection.within(center: _GeoFirePoint_, radius: _`number`_, field: _`string`_, opts?: GeoQueryOptions): `Observable`<`object`[]>`

Queries the Firestore collection based on geograpic radius

**Parameters:**

| Param                | Type            | Default value | Description                                               |
| -------------------- | --------------- | ------------- | --------------------------------------------------------- |
| center               | GeoFirePoint    | -             | the starting point for the query, i.e geo.point(lat, lng) |
| radius               | `number`        | -             | the radius to search from the centerpoint                 |
| field                | `string`        | -             | the document field that contains the GeoFirePoint data    |
| `Default value` opts | GeoQueryOptions | defaultOpts   |

**Returns:** `Observable`<`object`[]>

### `point`

Returns a GeoFirePoint allowing you to create geohashes, format data, and calculate relative distance/bearing.

`geo.point(latitude, longitude)`

#### Getters

- `hash` Returns a geohash string at precision 9
- `geoPoint` Returns a Firestore GeoPoint
- `geoJSON` Returns data as a GeoJSON `Feature<Point>`
- `coords` Returns coordinates as `[latitude, longitude]`
- `data` Returns data object suitable for saving to the Firestore database

#### Geo Calculations

- `distance(latitude, longitude)` Haversine distance to a point
- `bearing(latitude, longitude)` Haversine bearing to a point

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
