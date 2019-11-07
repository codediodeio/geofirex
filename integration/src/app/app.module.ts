import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AgmCoreModule } from '@agm/core';
import { AgmSnazzyInfoWindowModule } from '@agm/snazzy-info-window';

import { BasicGeoqueryComponent } from './basic-geoquery/basic-geoquery.component';
import { RealtimeGeoqueryComponent } from './realtime-geoquery/realtime-geoquery.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
export const config = {
  apiKey: 'AIzaSyBTyQHGGFTooUvfR0_PpfVx8TI8Q7K-0HA',
  authDomain: 'geo-test-c92e4.firebaseapp.com',
  databaseURL: 'https://geo-test-c92e4.firebaseio.com',
  projectId: 'geo-test-c92e4',
  storageBucket: 'geo-test-c92e4.appspot.com',
  messagingSenderId: '200126650097'
};

@NgModule({
  declarations: [
    AppComponent,
    BasicGeoqueryComponent,
    RealtimeGeoqueryComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBTyQHGGFTooUvfR0_PpfVx8TI8Q7K-0HA'
    }),
    AgmSnazzyInfoWindowModule,
    AngularFireModule.initializeApp(config),
    AngularFirestoreModule.enablePersistence()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
