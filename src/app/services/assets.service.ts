import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { IAssetListItemDto } from '../dto/asset-list-item.dto';
import { IAssetDetailsDto } from '../dto/asset-details.dto';

@Injectable({
    providedIn: 'root',
})
export class AssetsService {
    private readonly BASE_URL = 'https://api.mfapi.in/mf';

    private readonly httpClient = inject(HttpClient);

    getAssetListDto(): Observable<IAssetListItemDto[]> {
        return this.httpClient.get<IAssetListItemDto[]>(this.BASE_URL);
    }

    getAssetDetailsDto(id: number): Observable<IAssetDetailsDto> {
        return this.httpClient.get<IAssetDetailsDto>(`${this.BASE_URL}/${id}`);
    }
}
