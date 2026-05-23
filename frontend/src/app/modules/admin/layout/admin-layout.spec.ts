import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminLayout);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
