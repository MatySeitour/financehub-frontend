/* IMPORTS */
import { OperationsExample } from "../types/seller.types";

/* FUNCTIONS */
//Calculate the total commission
export function calculateTotalCommissionFromOperations(
  operations: OperationsExample[],
): number {
  let total = 0;

  for (let i = 0; i < operations.length; i++) {
    total += operations[i].commission ?? 0;
  }

  return total;
}

//Calculate the total net profit
export function calculateNetProfitTotal(
  operations: OperationsExample[],
): number {
  let total = 0;

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    const netProfit = operation.netProfit ?? 0;
    total += netProfit;
  }

  return total;
}

export function filterOperationsByCurrencyAndDate(
  operations: OperationsExample[],
  currencyFilter: string,
  startDate: string,
  endDate: string
): OperationsExample[] {
  const filtered: OperationsExample[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];

    const matchesCurrency =
      currencyFilter === "" ||
      op.currency.toLowerCase() === currencyFilter.toLowerCase();

    const matchesStart = startDate === "" || op.date >= new Date(startDate);
    const matchesEnd = endDate === "" || op.date <= new Date(endDate);

    if (matchesCurrency && matchesStart && matchesEnd) {
      filtered.push(op);
    }
  }

  return filtered;
}
