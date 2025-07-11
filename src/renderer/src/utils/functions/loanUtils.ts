/* IMPORTS */
import { Installment, LoanExample, SellerExample } from "../types/seller.types";
import { addDays, addMonths, addWeeks, format } from "date-fns";

/* FUNCTIONS */
//Get the next due date for loans table
export function getNextDueDate(loan: LoanExample): {
  date: Date | null;
  dateString: string;
} {
  const nextInstallment = loan.installments.find(
    (installment) => !installment.pay || installment.pay < installment.value,
  );

  if (!nextInstallment) {
    return { date: null, dateString: "Totalmente pagado" };
  }

  // Convertir string "dd/MM/yyyy" a Date
  const [day, month, year] = nextInstallment.dueDate.split("/");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return { date, dateString: nextInstallment.dueDate };
}
//Calculate the net profit of all loans
export function calculateNetProfitForLoans(loans: LoanExample[]): number {
  let totalProfit = 0;

  for (let i = 0; i < loans.length; i++) {
    const loan = loans[i];
    let fullPayments = 0;

    for (let j = 0; j < loan.installments.length; j++) {
      const inst = loan.installments[j];
      if (inst.pay === inst.value) {
        fullPayments++;
      }
    }

    const grossProfit =
      loan.installmentValue * loan.numberOfInstallments - loan.principal;
    const commission = loan.commission ?? 0;
    const adjustedProfit = grossProfit - commission;
    const profitPerInstallment = adjustedProfit / loan.numberOfInstallments;
    const netProfit = profitPerInstallment * fullPayments;

    totalProfit += netProfit;
  }

  return totalProfit;
}
//Simulate installments for loans
export function generateInstallments(loan: LoanExample): Installment[] {
  const installments: Installment[] = [];

  for (let i = 0; i < loan.numberOfInstallments; i++) {
    let dueDate: Date;

    if (loan.paymentFrecuency === "mensual") {
      dueDate = addMonths(loan.firstDueDate, i);
    } else if (loan.paymentFrecuency === "semanal") {
      dueDate = addWeeks(loan.firstDueDate, i);
    } else if (loan.paymentFrecuency === "quincenal") {
      dueDate = addWeeks(loan.firstDueDate, i * 2);
    } else if (loan.paymentFrecuency === "diario") {
      dueDate = addDays(loan.firstDueDate, i);
    } else {
      dueDate = loan.firstDueDate;
    }

    installments.push({
      id: i + 1,
      number: i + 1,
      value: loan.installmentValue,
      dueDate: format(dueDate, "dd/MM/yyyy"),
      pay: null,
    });
  }
  return installments;
}
//Add installments to every loan
export function addInstallmentsToLoans(seller: SellerExample): SellerExample {
  const updatedLoans: LoanExample[] = [];

  for (let i = 0; i < seller.loans.length; i++) {
    const loan = seller.loans[i];
    const updatedLoan = {
      ...loan,
      installments: generateInstallments(loan),
    };
    updatedLoans.push(updatedLoan);
  }

  return {
    ...seller,
    loans: updatedLoans,
  };
}

export function calculateTotalCommissionFromLoans(
  loans: LoanExample[],
): number {
  let total = 0;

  for (let i = 0; i < loans.length; i++) {
    const loan = loans[i];
    const isFullyPaid = loan.installments.every(
      (inst) => inst.pay === inst.value,
    );

    if (isFullyPaid) {
      total += loan.commission ?? 0;
    }
  }

  return total;
}

export function filterLoansByCurrencyAndDueDate(
  loans: LoanExample[],
  currencyFilter: string,
  startDate: string,
  endDate: string
): LoanExample[] {
  const filtered: LoanExample[] = [];

  for (let i = 0; i < loans.length; i++) {
    const loan = loans[i];

    const matchesCurrency =
      currencyFilter === "" ||
      loan.currency.toLowerCase() === currencyFilter.toLowerCase();

    const { date: nextDueDate } = getNextDueDate(loan);
    const dueDateStr = nextDueDate
      ? nextDueDate.toISOString().split("T")[0]
      : null;

    const matchesStart = startDate === "" || (dueDateStr && dueDateStr >= startDate);
    const matchesEnd = endDate === "" || (dueDateStr && dueDateStr <= endDate);

    if (matchesCurrency && matchesStart && matchesEnd) {
      filtered.push(loan);
    }
  }

  return filtered;
}
