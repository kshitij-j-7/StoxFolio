import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceChart } from './price-chart';

describe('PriceChart', () => {
  let component: PriceChart;
  let fixture: ComponentFixture<PriceChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
