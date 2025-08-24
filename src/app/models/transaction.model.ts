export interface ITransaction extends ITransactionDto {
    schemeCode: number;
    type: TransactionType;
}

export enum TransactionType {
    PURCHASE = 'PURCHASE',
    REDEEM = 'REDEEM',
}
