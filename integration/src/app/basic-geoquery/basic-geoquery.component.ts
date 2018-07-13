import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
    const radius = 0.5;
    const field = 'pos';

    const collection = this.geo.collection('users', ref =>
      ref.where('status', '==', 'single').where('online', '==', true)
    );
  }

  update(v) {
    this.radius.next(v);
  }
}
