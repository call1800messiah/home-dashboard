import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }


  static orderByContent(a: { content: string }, b: { content: string }): 1 | -1 | 0 {
    return UtilService.orderByObjectProperty(a, b, 'content', true, true);
  }

  static orderByName(a: { name: string }, b: { name: string }): 1 | -1 | 0 {
    return UtilService.orderByObjectProperty(a, b, 'name', true, true);
  }

  static orderByOrder(a: { order: number }, b: { order: number }): 1 | -1 | 0 {
    return UtilService.orderByObjectProperty(a, b, 'order', true);
  }


  private static orderByObjectProperty(a: any, b: any, property: string, asc: boolean, local: boolean = false): 1 | -1 | 0 {
    if (local) {
      return a[property].localeCompare(b[property], 'de-DE');
    }

    if (a[property] < b[property]) {
      return asc ? -1 : 1;
    }
    if (a[property] > b[property]) {
      return asc ? 1 : -1;
    }
    return 0;
  }
}
