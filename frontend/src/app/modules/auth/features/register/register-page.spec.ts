import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterPage);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
