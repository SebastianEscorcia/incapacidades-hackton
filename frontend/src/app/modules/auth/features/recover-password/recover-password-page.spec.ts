import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { RecoverPasswordPage } from './recover-password-page';

describe('RecoverPasswordPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoverPasswordPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RecoverPasswordPage);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
