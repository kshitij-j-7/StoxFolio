import { Component, Input, signal } from '@angular/core';
import { IInvestmentTableConfig } from './investment-table.interface';

@Component({
    selector: 'app-investment-table',
    imports: [],
    templateUrl: './investment-table.html',
    styleUrl: './investment-table.scss',
})
export class InvestmentTable {
    config = signal<IInvestmentTableConfig | null>(null);

    @Input('config') set _setConfig(data: IInvestmentTableConfig) {
        this.config.set(data);
    }
}
