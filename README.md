# Drupal

[![GitHub release](https://img.shields.io/github/release/attus74/angular-client.svg)](https://GitHub.com/attus74/angular-client/releases/)

## A library for Angular as Web API Client

**This library may be applied n Angular 10 (Ionic included) or 11.**

This modul has to be imported. 
Environment (details see below) and a token service (Ionic Storage, Cookie Service, or something similar, custom services, too, are allowed), too, has to be imported and provided to this service. In the readme you find examples for an Angular and an Ionic Token service. 

### Angular Example

```
npm i @attus/cookie-service
```
```ts
import { AngularClientModule } from '@attus/angular-client';
import { CookieTokenServiceService } from '@attus/cookie-service';

import { environment } from '../environments/environment';

@NgModule({
  imports: [
    AngularClientModule,
  ],
  providers: [
    {
      provide: 'ANGULAR_CLIENT_TOKEN_SERVICE',
      useClass: CookieTokenServiceService,
    },
    {
      provide: 'ANGULAR_CLIENT_CONFIG',
      useValue: environment.apiClient,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Ionic Example 
```
npm i @attus/ionic-storage
```
```ts
import { AngularClientModule } from '@attus/angular-client';
import { IonicDataStorageModule, IonicTokenService } from '@attus/ionic-storage';

import { environment } from '../environments/environment';

@NgModule({
  imports: [
    IonicModule.forRoot(), 
    AngularClientModule,
    IonicDataStorageModule,
  ],
  providers: [
    IonicTokenService,
    {
      provide: 'ANGULAR_CLIENT_TOKEN_SERVICE',
      useClass: IonicTokenService,
    },
    {
      provide: 'ANGULAR_CLIENT_CONFIG',
      useValue: environment.apiClient,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Environment must have API connection parameters:
```ts
export const environment = {
  production: false,
  apiClient: {
    url: 'https://example.com',
    token_path: 'oauth/token',
    client_id: 'abcdefgh-1234',
    client_secret: '98754',
    scope: 'scope1 scope2',
  }
};
```

## Usage

```ts

import { AngularClient, AngularClientHttpOptions } from '@attus/angular-client';

@Component({
  template: '',
})
export class MyComponent implements OnInit {

  data: MyData
  userSubscription: Subscription

  constructor(private apiClient: AngularClient) { }

  ngOnInit() {
    // Status: 1 - Authenticated, 0 - In process, -1 - Not Authenticated
    this.userSubscription = this.apiClient.getUserLoginStatus().subscribe(status => {
      if (status === 1) {
        this.getMyData().subscribe(data => {
          this.data = data;
        });
      }
    });
  }

  getMyData(id: string): Observable<MyData> {
    const options = this.apiClient.getHttpOptions();
    options.setAuthorization();
    const path: string = 'my/data/' + id;
    return this.drupal.get(path, options);
  }

  loginUser(username: string, password: string): void {
    // There is no direct answer, but you can subscribe the result, see getUserLoginStatus()
    this.apiClient.login(username, password);
  }

}
```
