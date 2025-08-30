import { inject, Injectable } from '@angular/core';
import { ITransactionDataDto, ITransactionDto } from '../dto/transaction-dto';
import { ITransaction, TransactionType } from '../models/transaction.model';
import { IInvestmentDetails, IInvestmentTableConfig, IPeriodValue, ISchemeInvestmentDetails } from '../components/investment-table/investment-table.interface';
import { AssetsService } from './assets.service';
import { map, Observable } from 'rxjs';
import xirr from 'xirr';
import { epochToDate } from '../utils/date.utils';

interface SchemeTransaction extends ITransactionDto {
    type: TransactionType;
}

type Cashflow = { amount: number; when: Date };
type FifoLot = { quantity: number; price: number; date: Date };

interface SchemeMetrics {
    details: ISchemeInvestmentDetails;
    // Raw data to be aggregated for portfolio-level calculations
    intermediates: {
        lifetimeCashflows: Cashflow[]; // All purchases and sales
        onNoRedeemPurchaseCashflows: Cashflow[]; // Only purchases
        currentHoldingLots: FifoLot[]; // Remaining lots for 'current' xirr
    };
}

@Injectable({
    providedIn: 'root',
})
export class InvestmentDetailsService {
    private readonly assetsService = inject(AssetsService);

    public parseInvestmentTableConfig(data: ITransactionDataDto): Observable<IInvestmentTableConfig> {
        const schemes = this.groupBySchemes(data);
        const schemeCodes = Object.keys(schemes).map(Number);

        return this.assetsService.getSchemeValues(schemeCodes).pipe(
            map((schemePrices: Record<number, number>) => {
                const today = new Date();

                // --- AGGREGATION SETUP ---
                // We use .reduce() to process each scheme while simultaneously building our portfolio totals.
                const aggregationInitialState = {
                    // Final list of details for each scheme's row in the UI
                    schemeInvestmentDetails: [] as ISchemeInvestmentDetails[],

                    // Simple sum totals
                    totalInvestAmount: { current: 0, onNoRedeem: 0 },
                    totalValue: { current: 0, onNoRedeem: 0 },

                    // Raw cashflows from all schemes, to be used for true portfolio XIRR calculation
                    portfolioLifetimeCashflows: [] as Cashflow[],
                    portfolioOnNoRedeemCashflows: [] as Cashflow[],
                    portfolioCurrentHoldingLots: [] as FifoLot[],
                };

                // --- PROCESS & AGGREGATE IN ONE PASS ---
                const aggregationResult = Object.entries(schemes).reduce((acc, [codeStr, transactions]) => {
                    const code = Number(codeStr);
                    const price = schemePrices[code];

                    // 1. Calculate all metrics for the individual scheme
                    const schemeMetrics = this._calculateSchemeMetrics(code, transactions, price);

                    // 2. Store the final details for the UI table
                    acc.schemeInvestmentDetails.push(schemeMetrics.details);

                    // 3. Aggregate simple sum totals
                    acc.totalInvestAmount.current += schemeMetrics.details.investAmount.current;
                    acc.totalInvestAmount.onNoRedeem += schemeMetrics.details.investAmount.onNoRedeem;
                    acc.totalValue.current += schemeMetrics.details.value.current;
                    acc.totalValue.onNoRedeem += schemeMetrics.details.value.onNoRedeem;

                    // 4. Aggregate raw data for portfolio XIRR
                    acc.portfolioLifetimeCashflows.push(...schemeMetrics.intermediates.lifetimeCashflows);
                    acc.portfolioOnNoRedeemCashflows.push(...schemeMetrics.intermediates.onNoRedeemPurchaseCashflows);
                    acc.portfolioCurrentHoldingLots.push(...schemeMetrics.intermediates.currentHoldingLots);

                    return acc;
                }, aggregationInitialState);

                // --- CALCULATE TRUE PORTFOLIO XIRR ---

                // For 'lifetime' XIRR
                const finalPortfolioLifetimeCashflows = [...aggregationResult.portfolioLifetimeCashflows];
                if (aggregationResult.totalValue.current > 0) {
                    finalPortfolioLifetimeCashflows.push({ amount: aggregationResult.totalValue.current, when: today });
                }

                // For 'current' XIRR
                const portfolioCurrentCashflows = aggregationResult.portfolioCurrentHoldingLots.map((lot) => ({
                    amount: -(lot.quantity * lot.price),
                    when: lot.date,
                }));
                if (aggregationResult.totalValue.current > 0) {
                    portfolioCurrentCashflows.push({ amount: aggregationResult.totalValue.current, when: today });
                }

                // For 'onNoRedeem' XIRR
                const finalPortfolioOnNoRedeemCashflows = [...aggregationResult.portfolioOnNoRedeemCashflows];
                if (aggregationResult.totalValue.onNoRedeem > 0) {
                    finalPortfolioOnNoRedeemCashflows.push({ amount: aggregationResult.totalValue.onNoRedeem, when: today });
                }

                const totalInvestmentDetails: IInvestmentDetails = {
                    investAmount: aggregationResult.totalInvestAmount,
                    value: aggregationResult.totalValue,
                    xirr: {
                        current: this._safeXirr(portfolioCurrentCashflows),
                        lifetime: this._safeXirr(finalPortfolioLifetimeCashflows),
                        onNoRedeem: this._safeXirr(finalPortfolioOnNoRedeemCashflows),
                    },
                };

                return {
                    totalInvestmentDetails,
                    schemeInvestmentDetails: aggregationResult.schemeInvestmentDetails,
                };
            })
        );
    }

    // Processes a single scheme's transactions in ONE PASS.
    // Returns final calculated details for the UI row AND the intermediate raw data
    // needed for portfolio-level aggregation.

    private _calculateSchemeMetrics(schemeCode: number, transactions: SchemeTransaction[], currentPrice: number): SchemeMetrics {
        const fifoStack: FifoLot[] = [];
        const lifetimeCashflows: Cashflow[] = [];
        const onNoRedeemPurchaseCashflows: Cashflow[] = [];
        let totalPurchasedUnits = 0;
        let totalInvestedOnNoRedeem = 0;
        const today = new Date();

        for (const t of transactions) {
            const date = epochToDate(t.date);
            const amount = t.quantity * t.price;

            if (t.type === TransactionType.PURCHASE) {
                fifoStack.push({ quantity: t.quantity, price: t.price, date });
                const purchaseOutflow = { amount: -amount, when: date };
                lifetimeCashflows.push(purchaseOutflow);
                onNoRedeemPurchaseCashflows.push(purchaseOutflow);
                totalPurchasedUnits += t.quantity;
                totalInvestedOnNoRedeem += amount;
            } else {
                // REDEMPTION
                lifetimeCashflows.push({ amount: amount, when: date });
                let qtyToRemove = t.quantity;
                while (qtyToRemove > 0 && fifoStack.length > 0) {
                    const lot = fifoStack[0];
                    if (lot.quantity <= qtyToRemove) {
                        qtyToRemove -= lot.quantity;
                        fifoStack.shift();
                    } else {
                        lot.quantity -= qtyToRemove;
                        qtyToRemove = 0;
                    }
                }
            }
        }

        // --- Calculate final values for this scheme ---
        const currentInvestedAmount = fifoStack.reduce((sum, lot) => sum + lot.quantity * lot.price, 0);
        const remainingUnits = fifoStack.reduce((sum, lot) => sum + lot.quantity, 0);
        const currentValue = remainingUnits * currentPrice;
        const onNoRedeemValue = totalPurchasedUnits * currentPrice;

        // --- Calculate XIRR for this scheme ONLY ---

        // Lifetime XIRR for this scheme
        const schemeLifetimeCashflows = [...lifetimeCashflows];
        if (currentValue > 0) {
            schemeLifetimeCashflows.push({ amount: currentValue, when: today });
        }

        // Current XIRR for this scheme
        const schemeCurrentCashflows = fifoStack.map((lot) => ({
            amount: -(lot.quantity * lot.price),
            when: lot.date,
        }));
        if (currentValue > 0) {
            schemeCurrentCashflows.push({ amount: currentValue, when: today });
        }

        // OnNoRedeem XIRR for this scheme
        const schemeOnNoRedeemCashflows = [...onNoRedeemPurchaseCashflows];
        if (onNoRedeemValue > 0) {
            schemeOnNoRedeemCashflows.push({ amount: onNoRedeemValue, when: today });
        }

        // --- Assemble the final return object ---
        return {
            details: {
                schemeCode,
                investAmount: { current: currentInvestedAmount, onNoRedeem: totalInvestedOnNoRedeem },
                value: { current: currentValue, onNoRedeem: onNoRedeemValue },
                xirr: {
                    current: this._safeXirr(schemeCurrentCashflows),
                    lifetime: this._safeXirr(schemeLifetimeCashflows),
                    onNoRedeem: this._safeXirr(schemeOnNoRedeemCashflows),
                },
            },
            intermediates: {
                lifetimeCashflows, // Raw purchases/sales without terminal value
                onNoRedeemPurchaseCashflows, // Raw purchases without terminal value
                currentHoldingLots: fifoStack, // Remaining lots
            },
        };
    }

    private groupBySchemes(data: ITransactionDataDto): Record<number, SchemeTransaction[]> {
        const returnData: Record<number, SchemeTransaction[]> = {};

        for (const [type, transactions] of Object.entries(data) as [TransactionType, ITransaction[]][]) {
            transactions.forEach((transaction) => {
                if (!returnData[transaction.schemeCode]) {
                    returnData[transaction.schemeCode] = [];
                }
                returnData[transaction.schemeCode].push({
                    ...transaction,
                    type: type,
                });
            });
        }
        return returnData;
    }

    private _safeXirr(cashflows: Cashflow[]): number {
        const hasPositive = cashflows.some((cf) => cf.amount > 0);
        const hasNegative = cashflows.some((cf) => cf.amount < 0);

        if (!hasPositive || !hasNegative) {
            return 0;
        }
        try {
            const rate = xirr(cashflows);
            return isFinite(rate) ? rate * 100 : 0;
        } catch (err) {
            console.warn('XIRR calculation failed', err);
            return 0;
        }
    }
}
