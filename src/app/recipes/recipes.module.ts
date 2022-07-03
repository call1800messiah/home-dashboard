import { NgModule } from '@angular/core';

import { ListComponent } from './components/list/list.component';
import { RecipesRoutingModule } from './recipes-routing.module';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    SharedModule,
    RecipesRoutingModule,
  ]
})
export class RecipesModule { }
