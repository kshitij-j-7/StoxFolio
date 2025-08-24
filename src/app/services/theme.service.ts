import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum Theme {
    LIGHT = 'light-mode',
    DARK = 'dark-mode',
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly THEME_KEY = 'user-theme';

    private themeSubject = new BehaviorSubject<Theme>(Theme.LIGHT);
    theme$ = this.themeSubject.asObservable(); // Observable for components

    constructor() {
        const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
        if (savedTheme) {
            this.setTheme(Theme.DARK);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? Theme.DARK : Theme.LIGHT);
        }
    }

    setTheme(theme: Theme) {
        document.body.classList.remove(Theme.LIGHT, Theme.DARK);
        document.body.classList.add(theme);

        localStorage.setItem(this.THEME_KEY, theme);
        this.themeSubject.next(theme);
    }

    toggleTheme() {
        const current = this.themeSubject.value;
        this.setTheme(current === Theme.DARK ? Theme.LIGHT : Theme.DARK);
    }

    get currentTheme(): Theme {
        return this.themeSubject.value;
    }
}
