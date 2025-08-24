import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentDetails } from './investment-details';

describe('InvestmentDetails', () => {
  let component: InvestmentDetails;
  let fixture: ComponentFixture<InvestmentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
