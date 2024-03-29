import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';

const routes = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [HomeComponent, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
