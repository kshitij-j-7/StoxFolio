import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { AssetsService } from '../../services/assets.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { AuthModal } from '../../components/auth-modal/auth-modal';
import { FirestoreService } from '../../services/firestore.service';
import { of, switchMap } from 'rxjs';
import { PriceChart } from '../../components/price-chart/price-chart';
import { InvestmentTable } from '../../components/investment-table/investment-table';
import { InvestmentDetailsService } from '../../services/investment-details.service';

@Component({
    selector: 'app-home',
    imports: [AuthModal, PriceChart, InvestmentTable],
    templateUrl: './home.html',
    styleUrl: './home.scss',
    standalone: true,
})
export class Home {
    
    private readonly assetsService = inject(AssetsService);
    private readonly firestoreService = inject(FirestoreService);
    private readonly investmentDetailsService = inject(InvestmentDetailsService);
    readonly authService = inject(AuthService);

    showAuthModal = signal(false);
    readonly userId = toSignal(this.authService.user);
    readonly user = toSignal(this.authService.user.pipe(switchMap((user) => (user ? this.firestoreService.getUserData(user.uid) : of(null)))), { initialValue: null });

    loginWithGoogle() {
        this.authService.loginWithGoogle();
    }

    logout() {
        this.authService.logout();
    }

    toggleAuthModal(isOpen: boolean) {
        this.showAuthModal.set(isOpen);
    }
}
