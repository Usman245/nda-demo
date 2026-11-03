export type DealInputs = {
  purchasePrice: number;
  refurbCost: number;
  otherCosts: number;
  sourcingFee: number;
  monthlyRent: number;
  serviceChargeAnnual: number;
  groundRentAnnual: number;
  insuranceAnnual: number;
  maintenancePct: number;
  managementPct: number;
  voidsWeeks: number;
  ltvPct: number;
  mortgageRatePct: number;
};

const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);

// Money lines are rounded to whole £ so the table a buyer reads always adds up
// (e.g. 10,200 - 2,774 - 3,506 = 3,920). Percentages are derived from those figures.
const r = Math.round;

export function calculate(i: DealInputs) {
  const annualRent = i.monthlyRent * 12;

  const totalCost = i.purchasePrice + i.refurbCost + i.otherCosts;

  const grossYield = pct(annualRent, i.purchasePrice);
  const yieldOnCost = pct(annualRent, totalCost);

  const management = r(annualRent * (i.managementPct / 100));
  const maintenance = r(annualRent * (i.maintenancePct / 100));
  const voids = r(annualRent * (i.voidsWeeks / 52));
  const runningCosts =
    management +
    maintenance +
    voids +
    i.insuranceAnnual +
    i.serviceChargeAnnual +
    i.groundRentAnnual;

  const netYieldNoMortgage = pct(annualRent - runningCosts, totalCost);

  const loan = r(i.purchasePrice * (i.ltvPct / 100));
  const deposit = i.purchasePrice - loan;
  const mortgageInterest = r(loan * (i.mortgageRatePct / 100));

  const netCashFlow = annualRent - runningCosts - mortgageInterest;
  const cashInvested = deposit + i.refurbCost + i.otherCosts + i.sourcingFee;
  const cashOnCash = pct(netCashFlow, cashInvested);

  return {
    annualRent,
    totalCost,
    grossYield,
    yieldOnCost,
    breakdown: {
      management,
      maintenance,
      voids,
      insurance: i.insuranceAnnual,
      serviceCharge: i.serviceChargeAnnual,
      groundRent: i.groundRentAnnual,
      runningCosts,
    },
    netYieldNoMortgage,
    mortgage: { loan, deposit, mortgageInterest },
    netCashFlow,
    cashInvested,
    cashOnCash,
    paybackYears: netCashFlow > 0 ? cashInvested / netCashFlow : null,
  };
}

export type YieldResult = ReturnType<typeof calculate>;
