import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ForgotPasswordPage);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
