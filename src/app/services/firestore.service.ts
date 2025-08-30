import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc } from '@angular/fire/firestore';
import { ITransaction, TransactionType } from '../models/transaction.model';
import { combineLatest, map, Observable } from 'rxjs';
import { IProfile } from '../models/profile.model';
import { IProfileDto } from '../dto/profile.dto';
import { ITransactionDataDto } from '../dto/transaction-dto';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
    private readonly firestore = inject(Firestore);

    getUserData(uid: string): Observable<IProfile | null> {
        const docRef = doc(this.firestore, `users/${uid}`);
        return (docData(docRef, { idField: 'id' }) as Observable<IProfileDto | undefined>).pipe(map((doc) => doc?.profile ?? null));
    }

    addOrUpdateUserData(data: IProfile): Promise<void> {
        const profileData: IProfileDto = {
            profile: data,
        };
        const docRef = doc(this.firestore, `users/${data.uid}`);
        return setDoc(docRef, profileData, { merge: true });
    }

    addTransactionByUser(uid: string, transaction: ITransaction): Promise<void> {
        const { type, ...payload } = transaction;
        const userTransactionDoc = doc(this.firestore, `users/${uid}/${type}/${(Date.now())}`);
        return setDoc(userTransactionDoc, payload);
    }

    getTransactionsOfType(uid: string, type: TransactionType): Observable<ITransaction[]> {
        const docRef = collection(this.firestore, `users/${uid}/${type}`);
        return collectionData(docRef) as Observable<ITransaction[]>;
    }

    getAllTransactions(uid: string): Observable<ITransactionDataDto> {
        return combineLatest([this.getTransactionsOfType(uid, TransactionType.PURCHASE), this.getTransactionsOfType(uid, TransactionType.REDEEM)]).pipe(
            map(([purchases, redeems]) => ({
                [TransactionType.PURCHASE]: purchases?.sort((a, b) => b.date - a.date),
                [TransactionType.REDEEM]: redeems?.sort((a, b) => b.date - a.date),
            }))
        );
    }
}
