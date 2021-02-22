import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { delay, map, switchMap, take, tap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

import { Place } from './place.model';
import { PlaceLocation } from './location.model';

import { environment } from '../../environments/environment';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private backendUrl = environment.backendUrl;
  private _places = new BehaviorSubject<Place[]>([]);

  public get places() {
    return this._places.asObservable();
  }

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient
  ) {}

  getPlace(id: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        return this.httpClient.get<PlaceData>(
          this.backendUrl + `/offered-places/${id}.json?access_token=${token}`
        );
      }),
      map((placeData) => {
        return new Place(
          id,
          placeData.title,
          placeData.description,
          placeData.imageUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId,
          placeData.location
        );
      })
    );
  }

  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        return this.httpClient.get<{ [key: string]: PlaceData }>(
          this.backendUrl + `/offered-places.json?access_token=${token}`
        );
      }),
      map((resData) => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        return places;
      }),
      tap((places) => {
        this._places.next(places);
      })
    );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation
  ) {
    let generatedId: string;
    let fetchedUserId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(
      take(1),
      switchMap((userId) => {
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap((token) => {
        if (!fetchedUserId) {
          throw new Error('No user found!');
        }
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          'https://sevillaconsciente.org/wp-content/uploads/2020/12/img_prod_nueva_york_manhattan_1170x600.jpg',
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          location
        );
        return this.httpClient.post<{ name: string }>(
          this.backendUrl + `/offered-places.json?access_token=${token}`,
          {
            ...newPlace,
            id: null,
          }
        );
      }),
      switchMap((resData) => {
        generatedId = resData.name;
        return this.places;
      }),
      take(1),
      tap((places) => {
        newPlace.id = generatedId;
        this._places.next(places.concat(newPlace));
      })
    );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        fetchedToken = token;
        return this.places;
      }),
      take(1),
      switchMap((places) => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap((places) => {
        const updatedPlaceIndex = places.findIndex((p) => p.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.httpClient.put(
          this.backendUrl +
            `/offered-places/${placeId}.json?access_token=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null }
        );
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );
  }
}
