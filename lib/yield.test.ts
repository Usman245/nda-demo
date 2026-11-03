import { describe, expect, it } from "vitest";
import { calculate, type DealInputs } from "./yield";

// Fixture from plan.md section 4 (Anfield L6 BTL).
const fixture: DealInputs = {
  purchasePrice: 85000,
  refurbCost: 20000,
  otherCosts: 5000,
  sourcingFee: 3000,
  monthlyRent: 850,
  serviceChargeAnnual: 0,
  groundRentAnnual: 0,
  insuranceAnnual: 350,
  maintenancePct: 8,
  managementPct: 10,
  voidsWeeks: 3,
  ltvPct: 75,
  mortgageRatePct: 5.5,
};

describe("yield engine - Anfield fixture", () => {
  const out = calculate(fixture);

  it("computes rent and yields", () => {
    expect(out.annualRent).toBe(10200);
    expect(out.grossYield).toBeCloseTo(12.0, 2);
    expect(out.yieldOnCost).toBeCloseTo(9.27, 2);
  });

  it("computes running costs and net yield", () => {
    expect(out.breakdown.runningCosts).toBe(2774);
    expect(out.netYieldNoMortgage).toBeCloseTo(6.75, 2);
  });

  it("computes mortgage, cash flow and cash-on-cash", () => {
    expect(out.mortgage.loan).toBe(63750);
    expect(out.mortgage.deposit).toBe(21250);
    expect(out.mortgage.mortgageInterest).toBe(3506);
    expect(out.netCashFlow).toBe(3920);
    expect(out.cashInvested).toBe(49250);
    expect(out.cashOnCash).toBeCloseTo(7.96, 2);
  });

  it("guards against divide-by-zero", () => {
    const z = calculate({ ...fixture, purchasePrice: 0, refurbCost: 0, otherCosts: 0 });
    expect(z.grossYield).toBe(0);
    expect(z.yieldOnCost).toBe(0);
  });
});
