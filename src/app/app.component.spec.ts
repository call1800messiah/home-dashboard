import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const setup = async (isHandset: boolean) => {
    await TestBed.configureTestingModule({
      imports: [
        MatSidenavModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      declarations: [
        AppComponent,
      ],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: isHandset, breakpoints: { [Breakpoints.Handset]: isHandset } }) },
        },
      ],
      // The header and sidebar need the auth and data services, which aren't under test here.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('keeps the sidenav open beside the content on larger screens', async () => {
    const app = (await setup(false)).componentInstance;

    expect(app.sideNavOpen).toBeTrue();
    expect(app.sideNavMode).toBe('side');
  });

  it('closes the sidenav and overlays it on handsets', async () => {
    const app = (await setup(true)).componentInstance;

    expect(app.sideNavOpen).toBeFalse();
    expect(app.sideNavMode).toBe('over');
  });

  it('toggles the sidenav when the header asks for it', async () => {
    const fixture = await setup(false);
    const header = fixture.nativeElement.querySelector('app-header') as HTMLElement;

    header.dispatchEvent(new Event('toggleSidenav'));
    expect(fixture.componentInstance.sideNavOpen).toBeFalse();

    header.dispatchEvent(new Event('toggleSidenav'));
    expect(fixture.componentInstance.sideNavOpen).toBeTrue();
  });

  it('renders the routed content inside the main area', async () => {
    const fixture = await setup(false);

    expect(fixture.nativeElement.querySelector('main router-outlet')).toBeTruthy();
  });
});
