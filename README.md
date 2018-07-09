# GeoFireX

Realtime Geolocation with Firestore & RxJS

[Live Demo](https://geo-test-c92e4.firebaseapp.com)

## QuickStart

```shell
npm install firebase geofirex
```

The library is a lightweight client for the Firebase SDK that provides tools for handling geolocation data in Firestore.

```ts
// Initnalize Firebase
import * as firebase from 'firebase/app';
firebase.initializeApp(yourConfig);

// Initialize the client
import * as geofirex from 'geofirex';
const geo = geofirex.init(firebase);
```

First, you'll need to add some geolocation data in your database. A `collection` creates a reference to Firestore (just like the SDK), but with some extra geoquery features. The `geohash` method returns a class that helps you create geolocation data.

```ts
const cities = geo.collection('cities');

const point = geo.point(40, -119);

cities.add({ name: 'Phoenix', position: point.data });
```

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
// { ...documentData, queryMetadata: { distance: 1.23232, bearing: 230.23 }  }
```

## API

Better docs soon...

### `init`

Initializes the GeoFireClient

### `collection`

Returns a GeoFireCollectionRef instance

### `point`

Returns a GeoFirePoint instance

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
const cities = db.collection('cities');

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
