import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, share, shareReplay, tap } from 'rxjs/operators';
import * as firebaseApp from 'firebase/app';
import * as geofirex from 'geofirex';

@Component({
  selector: 'app-basic-geoquery',
  templateUrl: './basic-geoquery.component.html',
  styleUrls: ['./basic-geoquery.component.scss']
})
export class BasicGeoqueryComponent implements OnInit {
  geo = geofirex.init(firebaseApp);
  points: Observable<any>;

  radius = new BehaviorSubject(0.5);

  constructor() {}

  ngOnInit() {
    const center = this.geo.point(40.5, -80.0);
    const field = 'pos';

    this.points = this.radius.pipe(
      switchMap(r => {
        console.log('new rad');
        return this.geo.query('bearings').within(center, r, field, { log: true });
      }),
      shareReplay(1)
    );

    // this.radius.pipe(
    //   switchMap(v => interval(500).pipe(tap(console.log)) )
    // ).subscribe()
  }

  update(v) {
    this.radius.next(v);
  }
}
