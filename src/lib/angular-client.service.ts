/**
 * Client Service for Web API Communication
 * 
 * @author Attila Németh
 * @date 1.2.2021
 */

import { HttpClient, HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, retry, timeout, map } from 'rxjs/operators';
import { AngularClientApiConfig } from './model/api_config';
import { AngularClientHttpOptions, AngularClientRequestOptions } from './model/http_options';
import { AngularClientTokenRequest, AngularClientTokenResponse } from './model/token_request';
import { AngularClientTokenService } from './model/token_service';

@Injectable({
  providedIn: 'root'
})
export class AngularClient {

  private userLoginStatus: BehaviorSubject<number> = new BehaviorSubject(0)
  private authorization: string = null
  private refreshTimeout: any = null

  constructor(private http: HttpClient,
              @Inject('ANGULAR_CLIENT_TOKEN_SERVICE') private tokenService: AngularClientTokenService,
              @Inject('ANGULAR_CLIENT_CONFIG') private clientConfig: AngularClientApiConfig) { }

  initialize() {
    this.refreshToken();
    return() => console.info('API Client Initialized');
  }

  /**
   * User Login
   * 
   * Actually an OAuth2 Access Token is requested from the API Server
   * 
   * @param username 
   * @param password 
   */
  login(username: string, password: string): void {
    const request: AngularClientTokenRequest = {
      grant_type: 'password',
      client_id: this.clientConfig.client_id,
      client_secret: this.clientConfig.client_secret,
      scope: this.clientConfig.scope,
      username: username,
      password: password,
    };
    this.getToken(request);
  }

  /**
   * User Logout
   * 
   * Access and Refresh Tokens are removed
   */
  logout(): void {
    this.userLoginStatus.next(-1);
    this.authorization = null;
    this.tokenService.deleteRefreshToken().then(() => {
      console.info('Invalid Refresh Token removed');
    });
  }

  /**
   * User Login Status as Observable (i.e. it may be subscribed)
   * Values:      0     Status unknown (server has not answered yet or login is in process)
   *              -1    User is not logged in
   *              1     User is logged in
   */
  getUserLoginStatus(): Observable<number> {
    return this.userLoginStatus.asObservable();
  }

  /**
   * A new HTTP Options instance. These options may be applied in HTTP Requests
   */
  getHttpOptions(): AngularClientHttpOptions {
    const options = new AngularClientHttpOptions(this.authorization);
    return options;
  }

  /**
   * HTTP GET Request
   * @param path
   *  Request Path, related to API Root
   * @param httpOptions 
   *  HTTP Options
   * @param requestOptions
   *  Request Options 
   */
  get(path: string, httpOptions?: AngularClientHttpOptions, requestOptions?: AngularClientRequestOptions): Observable<any> {
    if (requestOptions === null || requestOptions === undefined) {
      requestOptions = new AngularClientRequestOptions;
      requestOptions.retry = 5;
    }
    return this.http.get(this.getUrl(path), httpOptions).pipe(
      retry(requestOptions.retry),
      timeout(requestOptions.timeout),
      catchError(this.formatErrors),
    );
  }

  /**
   * HTTP POST Request
   * @param path 
   *  Request Path, related to API Root
   * @param data 
   *  Request Data to be posted
   * @param httpOptions 
   * @param requestOptions 
   */
  post(path: string, data: any, httpOptions?: AngularClientHttpOptions, requestOptions?: AngularClientRequestOptions): Observable<any> {
    if (requestOptions === null || requestOptions === undefined) {
      requestOptions = new AngularClientRequestOptions;
      requestOptions.timeout = 30000;
    }
    return this.http.post(this.getUrl(path), data, httpOptions).pipe(
      retry(requestOptions.retry),
      timeout(requestOptions.timeout),
      catchError(this.formatErrors),
    );
  }

  /**
   * HTTP PATCH Request
   * @param path 
   *  Request Path, related to API Root
   * @param data 
   *  Request Data to be posted
   * @param httpOptions 
   * @param requestOptions 
   */
  patch(path: string, data: any, httpOptions?: AngularClientHttpOptions, requestOptions?: AngularClientRequestOptions): Observable<any> {
    if (requestOptions === null || requestOptions === undefined) {
      requestOptions = new AngularClientRequestOptions;
      requestOptions.timeout = 30000;
    }
    return this.http.patch(this.getUrl(path), data, httpOptions).pipe(
      retry(requestOptions.retry),
      timeout(requestOptions.timeout),
      catchError(this.formatErrors),
    );
  }

  /**
   * HTTP DELETE Request
   * @param path 
   *  Request Path, related to API Root
   * @param httpOptions 
   * @param requestOptions 
   */
  delete(path: string, httpOptions?: AngularClientHttpOptions, requestOptions?: AngularClientRequestOptions): Observable<any> {
    if (requestOptions === null || requestOptions === undefined) {
      requestOptions = new AngularClientRequestOptions;
      requestOptions.retry = 1;
    }
    return this.http.delete(this.getUrl(path), httpOptions).pipe(
      retry(requestOptions.retry),
      timeout(requestOptions.timeout),
      catchError(this.formatErrors),
    );
  }

  private getUrl(path: string): string {
    return this.clientConfig.url + '/' + path.replace(/^\//g, '');
  }

  private refreshToken(): void {
    this.tokenService.getRefreshToken().then(token => {
      if (token === null) {
        this.userLoginStatus.next(-1);
      }
      else {
        const request: AngularClientTokenRequest = {
          grant_type: 'refresh_token',
          client_id: this.clientConfig.client_id,
          client_secret: this.clientConfig.client_secret,
          refresh_token: token,
        };
        this.getToken(request);
      }
    }).catch(() => {
      this.userLoginStatus.next(-1);
    });
  }

  private getToken(request: AngularClientTokenRequest): void {
    console.info('Requesting Access Token...');
    this.userLoginStatus.next(0);
    const formData = new FormData();
    for (let key in request) {
      formData.set(key, request[key]);
    }
    this.http.post(this.clientConfig.url + '/' + this.clientConfig.token_path, formData).pipe(
      retry(3),
      timeout(16000),
      catchError(error => {
        this.userLoginStatus.next(-1);
        this.authorization = null;
        this.tokenService.deleteRefreshToken().then(() => {
          console.info('Veraltetes Refresh Token wurde entfernt');
        });
        return this.formatErrors(error);
      }),
    ).subscribe((response: AngularClientTokenResponse) => {
      this.authorization = response.token_type + ' ' + response.access_token;
      this.tokenService.setRefreshToken(response.refresh_token);
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, (response.expires_in - 30) * 1000);
      console.info('Access Token Updated');
      this.userLoginStatus.next(1);
    });
  }

  private formatErrors(error: HttpErrorResponse) {
    console.error('HTTP', error.status);
    if (error instanceof TimeoutError) {
      return throwError('HTTP Request timed out');
    }
    switch (error.status) {
      case 422:
      case 500:
        console.warn(error.statusText);
        console.warn(error.message);
        let errorDetails: string = null
        for (let i in error.error['errors']) {
          console.warn('--', error.error['errors'][i]['status'], 
                                error.error['errors'][i]['detail']);
          errorDetails = error.statusText + ': ' + error.error['errors'][i]['detail'];
        }
        if (errorDetails !== null) {
          return throwError(errorDetails);
        }
        return throwError(error.status + ' ' + error.statusText);
        break;
      case 401:
        return throwError('HTTP 401 Unauthorized');
      case 403:
        return throwError('HTTP 403 Access Denied');
      case 404:
        return throwError('HTTP 404 Not Found');
      case 412:
        return throwError('HTTP 412 Precondition Failed');
      default:
        console.warn(error.statusText);
        console.warn('--', error.message);
        return throwError(error.message);
    }
    return throwError(error);
  }

}