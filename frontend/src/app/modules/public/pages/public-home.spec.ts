import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PublicHome } from './public-home';

describe('PublicHome', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicHome],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PublicHome);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
