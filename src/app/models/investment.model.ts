export interface Investment {
    id: string;
    type: InvestType;
    name: string;
    platform?: string;
    units?: number;
    purchaseAmount: number;
    purchaseDate: Date;
    currentPrice?: number;
}

export enum InvestType {
    MUTUAL_FUND = 'Mutual Fund',
    STOCK = 'Stock',
    ETF = 'ETF',
}
