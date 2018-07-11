import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap, map, take, finalize } from 'rxjs/operators';
import * as firebaseApp from 'firebase/app';
import * as geofirex from 'geofirex';
import { GeoFireCollectionRef } from 'geofirex';
import { Point, Feature } from 'geojson';

@Component({
  selector: 'app-realtime-geoquery',
  templateUrl: './realtime-geoquery.component.html',
  styleUrls: ['./realtime-geoquery.component.scss']
})
export class RealtimeGeoqueryComponent implements OnInit, OnDestroy {
  geo = geofirex.init(firebaseApp);
  points: Observable<any>;
  testDoc;

  collection: GeoFireCollectionRef;
  clicked;
  docId;

  constructor() {
    window.onbeforeunload = () => {
      this.collection.delete(this.docId);
    };
  }

  ngOnInit() {
    this.collection = this.geo.collection('positions');
    const center = this.geo.point(34, -113);

    this.points = this.collection.within(center, 200, 'pos');
    this.testDoc = this.points.pipe(
      map(arr => arr.find(o => o.id === this.docId))
    );

    // this.testDoc.subscribe(x => {
    //   if (x && x.pos.geopoint.latitude === 32.9) {
    //     this.clicked = false;
    //   } else {
    //     this.clicked = true;
    //   }
    // });
  }

  start() {
    this.clicked = true;
    let lat = 34 + this.rand();
    let lng = -113 + this.rand();

    const randA = this.rand();
    const randB = this.rand();
    this.docId = 'testPoint' + Date.now();
    interval(700)
      .pipe(
        take(30),
        tap(v => {
          lat += randA * Math.random();
          lng += randB * Math.random();

          const point = this.geo.point(lat, lng);
          const data = { name: 'testPoint', pos: point.data, allow: true };
          this.collection.setDoc(this.docId, data);
          console.log(v);
        }),
        finalize(() => {
          this.clicked = false;
          // this.collection.setPoint('testPoint', 32.9, -114.2, 'pos');
          this.collection.delete(this.docId);
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
