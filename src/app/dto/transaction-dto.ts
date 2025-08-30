import { TransactionType, ITransaction } from '../models/transaction.model';

export interface ITransactionDto {
    id?: number;
    date: number;
    price: number;
    quantity: number;
}

export type ITransactionDataDto = {
    [i in TransactionType]: ITransaction[];
};
