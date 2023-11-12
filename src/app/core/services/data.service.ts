import { Injectable } from '@angular/core';

import { ApiService } from './api.service';



@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private api: ApiService
  ) {}


  delete(itemId: string, collection: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.api.deleteDocumentFromCollection(itemId, collection).then(() => {
        resolve(true);
      }).catch((error) => {
        console.error(error);
        resolve(false);
      });
    });
  }


  store(item: any, collection: string, id?: string): Promise<boolean | string> {
    return new Promise((resolve) => {
      if (id) {
        this.api.updateDocumentInCollection(id, collection, item).then(() => {
          resolve(true);
        }).catch((error) => {
          console.error(error);
          resolve(false);
        });
      } else {
        this.api.addDocumentToCollection(item, collection).then((reference) => {
          if (reference) {
            resolve(reference.id);
          } else {
            resolve(false);
          }
        }).catch((error) => {
          console.error(error);
          resolve(false);
        });
      }
    });
  }
}
