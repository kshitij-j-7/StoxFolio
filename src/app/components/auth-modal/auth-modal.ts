import { Component, EventEmitter, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Modal } from '../modal/modal';
import { IModalConfig } from '../modal/modal.interface';
import { FirestoreService } from '../../services/firestore.service';

@Component({
    selector: 'app-auth-modal',
    imports: [Modal],
    templateUrl: './auth-modal.html',
    styleUrl: './auth-modal.scss',
    standalone: true,
})
export class AuthModal {
    authService = inject(AuthService);

    close = new EventEmitter();

    modalConfig: IModalConfig = {
        isClosable: true,
        isOpen: true,
    };

    onClose() {
        this.close.emit();
    }
}
