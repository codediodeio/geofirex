import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BasicGeoqueryComponent } from './basic-geoquery/basic-geoquery.component';

const routes: Routes = [{ path: '', component: BasicGeoqueryComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
