import { IMFPriceDto } from './mf-price.dto';

export interface IAssetDetailsDto {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
    isin_growth: string;
    isin_div_reinvestment: any;
    data: IMFPriceDto[]; // All asset have of type mfPrice in https://api.mfapi.in/
}
