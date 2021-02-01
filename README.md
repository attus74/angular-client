# Drupal

[![GitHub release](https://img.shields.io/github/release/attus74/angular-client.svg)](https://GitHub.com/attus74/angular-client/releases/)

## A library for Angular as Web API Client

**This library may be applied n Angular 10 (Ionic included) or 11.**

This modul has to be imported. 
Environment (details see below) and a token service (Ionic Storage, Cookie Service, or something similar, custom services, too, are allowed), too, has to be imported and provided to this service. In the readme you find examples for an Angular and an Ionic Token service. 

```ts
import { DrupalModule } from '@attus/drupal';

import { IonicTokenService } from '@attus/ionic-storage';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    DrupalModule,
  ],
  providers: [
    {
      provide: 'DRUPAL_TOKEN_SERVICE',
      useClass: IonicTokenService,
    },
    {
      provide: 'DRUPAL_CONFIG',
      useValue: environment.drupal,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Environment must have Drupal connection parameters:
```ts
export const environment = {
  production: false,
  drupal: {
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

import {DrupalService} from '@attus/drupal';

@Component({
  template: '',
})
export class MyComponent implements OnInit {

  data: MyData
  userSubscription: Subscription

  constructor(private drupal: DrupalService) { }

  ngOnInit() {
    // Status: 1 - Authenticated, 0 - In process, -1 - Not Authenticated
    this.userSubscription = this.drupal.getUserLoginStatus().subscribe(status => {
      if (status === 1) {
        this.getMyData();
      }
    });
  }

  getMyData(id: string): Observable<MyData> {
    const options = this.drupal.getHttpOptions();
    const path: string = 'my/data/' + id;
    return this.drupal.get(path, options);
  }

  loginUser(username: string, password: string): void {
    // There is no direct answer, but you can subscribe the result, see getUserLoginStatus()
    this.drupal.login(username, password);
  }

}
```
