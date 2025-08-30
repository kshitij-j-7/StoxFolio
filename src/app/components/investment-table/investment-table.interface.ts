export interface IInvestmentTableConfig {
    totalInvestmentDetails: IInvestmentDetails;
    schemeInvestmentDetails: ISchemeInvestmentDetails[];
}

export interface IPeriodValue {
    current: number;
    lifetime?: number;
    onNoRedeem: number;
}

export interface IInvestmentDetails {
    investAmount: IPeriodValue;
    value: IPeriodValue;
    xirr: IPeriodValue;
}

export interface ISchemeInvestmentDetails extends IInvestmentDetails {
    schemeCode: number;
    schemeName?: string;
}
