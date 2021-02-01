import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularClientComponent } from './angular-client.component';

describe('AngularClientComponent', () => {
  let component: AngularClientComponent;
  let fixture: ComponentFixture<AngularClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularClientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
