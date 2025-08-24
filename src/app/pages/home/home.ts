import { Component, computed, inject } from '@angular/core';
import { AssetsService } from '../../services/assets.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AuthModal } from '../../components/auth-modal/auth-modal';
import { FirestoreService } from '../../services/firestore.service';
import { ITransaction, TransactionType } from '../../models/transaction.model';
import { Timestamp } from 'firebase/firestore';
import { of, switchMap } from 'rxjs';

@Component({
    selector: 'app-home',
    imports: [AuthModal],
    templateUrl: './home.html',
    styleUrl: './home.scss',
    standalone: true,
})
export class Home {
    private readonly assetsService = inject(AssetsService);
    private readonly firestoreService = inject(FirestoreService);
    readonly authService = inject(AuthService);

    showModal = false;
    readonly userId = toSignal(this.authService.user);
    readonly user = toSignal(
        this.authService.user.pipe(
            switchMap((user) => (user ? this.firestoreService.getUserData(user.uid) : of(null)))
        ),
        { initialValue: null }
    );

    loginWithGoogle() {
        this.authService.loginWithGoogle();
    }

    logout() {
        this.authService.logout();
    }
}
