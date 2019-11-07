import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { tap, map, take, finalize } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import * as geofirex from 'geofirex';
import { GeoFireQuery } from 'geofirex';


@Component({
  selector: 'app-realtime-geoquery',
  templateUrl: './realtime-geoquery.component.html',
  styleUrls: ['./realtime-geoquery.component.scss']
})
export class RealtimeGeoqueryComponent implements OnInit, OnDestroy {
  geo = geofirex.init(firebase);
  points: Observable<any[]>;
  testDoc;

  path: 'positions';
  collection: firebase.firestore.CollectionReference;
  geoQuery: GeoFireQuery;
  clicked = false;
  docId = 'testPoint' + Date.now();

  constructor() {
    this.collection = firebase.firestore().collection('positions');
    window.onbeforeunload = () => {
      this.collection.doc(this.docId).delete();
    };
  }

  ngOnInit() {
    this.geoQuery = this.geo.query('positions');
    const center = this.geo.point(34, -113);

    this.points = this.geoQuery.within(center, 200, 'pos');
    this.testDoc = this.points.pipe(
      map(arr => arr.find(o => o.id === this.docId))
    );

  }

  start() {
    this.clicked = true;
    let lat = 34 + this.rand();
    let lng = -113 + this.rand();

    const randA = this.rand();
    const randB = this.rand();

    interval(700)
      .pipe(
        take(30),
        tap(v => {
          lat += randA * Math.random();
          lng += randB * Math.random();

          const point = this.geo.point(lat, lng);
          const data = { name: 'testPoint', pos: point, allow: true };
          this.collection.doc(this.docId).set(data);

        }),
        finalize(() => {
          this.clicked = false;
          this.collection.doc(this.docId).delete();
        })
      )
      .subscribe();
  }

  trackByFn(_, doc) {
    return doc.id;
  }
  icon(id) {
    return id.includes('testPoint') ? 'https://goo.gl/dGBkRz' : null;
  }

  rand() {
    const arr = [0.15, -0.15];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  ngOnDestroy() {}
}
