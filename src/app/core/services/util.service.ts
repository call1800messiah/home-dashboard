import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }


  static orderByName(a: { name: string }, b: { name: string }): 1 | -1 | 0 {
    return UtilService.orderByObjectProperty(a, b, 'name', true);
  }


  private static orderByObjectProperty(a: any, b: any, property: string, asc: boolean): 1 | -1 | 0 {
    if (a[property] < b[property]) {
      return asc ? -1 : 1;
    }
    if (a[property] > b[property]) {
      return asc ? 1 : -1;
    }
    return 0;
  }
}
