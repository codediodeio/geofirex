# GeoFireX - Realitme GeoLocation Tools for Firestore with RxJS

Live Demo

## QuickStart

```shell
npm install firebase geofirex
```

The client is a lighweight wrapper for the Firebase SDK.

```ts
// Initnalize Firebase
// var firebase = require('firebase/app')
import * as firebase from 'firebase/app';
firebase.initializeApp(config);

// Initialize the client
import * as geofirex from 'geofirex';
const gfx = geofirex.init(firebase);
```

First, you'll need to add some geolocation data in your databse. A `collection` creates a reference to Firestore (just like the SDK), but with some extra geoquery features. The `geohash` method returns a class that helps you create geolocation data.

```ts
const cities = gfx.collection('cities');

const location = gfx.geohash(40, -119);

cities.add({ name: 'Phoenix', location });
```

Now let's make a query Firestore for _cities.location within 100km radius of a centerpoint_.

```ts
const center = gfx.point(40.1, -119.1);
const radius = 100;
const field = 'location';

const query = cities.within(center, radius, field);
```

The query returns a realtime Observable of the document data + some additional metadata.

```ts
query.subscribe(console.log);
// { ...data, geoQueryData: { distance: 1.23232, bearing: 230.23 }  }
```

## API

### `collection`

Returns a collection reference with

`within()` - Returns an Observable of queried based distance
`data()` - Returns an Observable of queried documents mapped to the data payload

### `point`

Returns a GeoHash instance

`data` - Returns data in recommended format for database writes
`coords` - Returns [lat, lng]
`hash` - Returns geohash string at precision 9
`geoPoint` Returns a firebase GeoPoint object
`geoJSON` Returns data as a GeoJSON `Feature<Point>`

`distance(to)` Calulates the haversine distance to a point.
`bearing(to)` Calulates the bearing to point to a point.

## Tips

### Save the `gfx.point` data as a document field

I recommend

### Always Order by `[Latitude, Longitude]`

The GeoJSON spec formats coords as `[Longitude, Latitude]` to represent an X/Y plane. However, the Firebase GeoPoint uses `[Latitude, Longitude]`. For consistency, this libary will always require you to use the latter format.

## Contribute
