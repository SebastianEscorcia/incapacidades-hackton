import { inject, Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment.development';
import { currentUser } from '../models/currentUser.response';
import { loginPayload } from '../models/login.payload';
import { AuthService } from '../service/auth.service';
import { NavegarByRol } from '@/core/services/navegarByRol.service';

interface authStoreValue {
  user: currentUser | null;
  rol: string;
  roles: string[];
  token: string | null;
  isLogin: boolean;
}

const authStoreInitialValue: authStoreValue = {
  user: null,
  rol: '',
  roles: [],
  token: null,
  isLogin: false,
};

const userKey = environment.KEY_USER;
const rolKey = environment.ROL;
const tokenKey = environment.TOKEN;

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly navegarByRol = inject(NavegarByRol);

  private readonly state = signal<authStoreValue>(authStoreInitialValue);

  readonly user = computed(() => this.state().user);
  readonly rol = computed(() => this.state().rol);
  readonly roles = computed(() => this.state().roles);
  readonly token = computed(() => this.state().token);
  readonly isLogin = computed(() => this.state().isLogin);

  constructor() {
    this.initFromLocalStorage();
  }

  private initFromLocalStorage() {
    const usuario = localStorage.getItem(userKey);
    const rol = localStorage.getItem(rolKey);
    const token = localStorage.getItem(tokenKey);

    try {
      if (usuario && token) {
        const parsedUser = JSON.parse(usuario);
        this.setUser(parsedUser);
        this.setToken(token);

        if (rol) {
          this.setRol(JSON.parse(rol));
        }

        this.setIsLogin();
      } else {
        this.resetAuth();
      }
    } catch (error) {
      console.error('Error leyendo localStorage', error);
      this.deleteSessionData();
      this.resetAuth();
    }
  }

  async currentUser() {
    return await firstValueFrom(this.authService.Profile());
  }

  async login(payload: loginPayload) {
    try {
      const response = await firstValueFrom(this.authService.Login(payload));

      if (response && response.data) {
        const token = response.data.accessToken;
        if (token) {
          this.setToken(token);
        }
        const profileResponse = await this.currentUser();
        if (profileResponse && profileResponse.data) {
          const userData = profileResponse.data;
          const roles = userData.roles || [];
          const primaryRole = roles.length > 0 ? roles[0].toLowerCase().trim() : '';

          this.setUser(userData);
          this.setRol(primaryRole);
          this.setRoles(roles);
          this.setIsLogin();

          if (primaryRole) {
            this.navegarByRol.navegarByRol(primaryRole);
          } else {
            console.warn('No se pudo determinar el rol del usuario para la navegación.');
          }
        }
      }
      return response;
    } catch (error) {
      console.error('Error en el flujo:', error);
      throw error;
    }
  }

  // async forgot(email: userForgot) {
  //   return await firstValueFrom(this.authService.Forgot(email));
  // }

  // async change(password: userForgotChangePasswordPayload) {
  //   return await firstValueFrom(this.authService.ChangePasswordForgot(password));
  // }

  setUser(user: currentUser) {
    if (!user) return;
    localStorage.setItem(userKey, JSON.stringify(user));
    this.state.update((s) => ({ ...s, user }));
  }

  setRol(rol: string) {
    localStorage.setItem(rolKey, JSON.stringify(rol));
    this.state.update((s) => ({ ...s, rol }));
  }

  setRoles(roles: string[]) {
    this.state.update((s) => ({ ...s, roles }));
  }

  setToken(token: string) {
    localStorage.setItem(tokenKey, token);
    this.state.update((s) => ({ ...s, token }));
  }

  resetRoles() {
    this.state.update((s) => ({ ...s, roles: [] }));
  }

  setIsLogin() {
    this.state.update((s) => ({ ...s, isLogin: true }));
  }

  resetAuth() {
    this.state.set(authStoreInitialValue);
  }

  deleteSessionData() {
    localStorage.removeItem(rolKey);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }
}