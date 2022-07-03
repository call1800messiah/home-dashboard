import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { HeaderComponent } from './components/header/header.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SidebarComponent } from './components/sidebar/sidebar.component';



@NgModule({
  declarations: [
    PageNotFoundComponent,
    HeaderComponent,
    SidebarComponent
  ],
  imports: [
    SharedModule,
    MatToolbarModule,
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
  ]
})
export class CoreModule { }
