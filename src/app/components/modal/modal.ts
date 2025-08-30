import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IModalConfig } from './modal.interface';

enum State {
    OPEN = 'OPEN',
    OPENING = 'OPENING',
    CLOSING = 'CLOSING',
    CLOSE = 'CLOSE',
}

@Component({
    selector: 'app-modal',
    imports: [NgClass],
    templateUrl: './modal.html',
    styleUrl: './modal.scss',
    standalone: true,
})
export class Modal {
    private readonly ANIMATION_DURATION = 400;

    State = State;
    state = State.CLOSE;

    modalConfig = signal<IModalConfig | null>(null);
    @Input('config') set _setConfig(config: IModalConfig) {
        this.modalConfig.set(config);
        if (config?.isOpen) {
            this.state = State.OPENING;
            setTimeout(() => {
                this.state = State.OPEN;
            }, this.ANIMATION_DURATION);
        } else {
            this.close(true);
        }
    }
    @Output() onClose = new EventEmitter();

    close(isForced?: boolean) {
        if (!isForced) {
            if (this.state !== State.OPEN || !this.modalConfig()?.isClosable) return;
        }
        this.state = State.CLOSING;
        setTimeout(() => {
            this.onClose.emit();
            this.state = State.CLOSE;
        }, this.ANIMATION_DURATION);
    }
}
