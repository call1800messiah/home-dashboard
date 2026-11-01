import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LogoutComponent } from './logout.component';
import { AuthModule } from '../../auth.module';
import { testModule } from '../../../testing/test-module';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule(testModule(AuthModule))
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
