/**
 * Take-Home Pay Estimator
 * Note: This is a rough estimation tool, NOT definitive tax advice.
 */

export const estimateTakeHome = (ctcAnnual = 0, baseSalary = 0, variableBonus = 0) => {
  // Assume basic salary is ~50% of the stated "base salary" component for PF purposes
  const basicSalary = baseSalary * 0.5;
  
  // Employer deductions (Standard Indian payroll assumptions)
  const employerPFAnnual = basicSalary * 0.12;
  const gratuityAnnual = basicSalary * 0.0481; // 15/26 of a month per year = ~4.81%
  const insuranceAndOthers = ctcAnnual > 0 ? Math.max(0, ctcAnnual - (baseSalary + variableBonus + employerPFAnnual + gratuityAnnual)) : 0;
  const totalEmployerDeductions = employerPFAnnual + gratuityAnnual + (ctcAnnual > 0 ? 0 : insuranceAndOthers); // simplistic

  const grossSalary = (baseSalary + variableBonus);
  
  // Employee PF contribution is 12% of basic salary
  const employeePFAnnual = basicSalary * 0.12;
  
  // Professional Tax (approx 200/mo or 2400/yr for most states)
  const professionalTaxAnnual = 2400;
  
  // Total taxable income (ignoring HRA/LTA exemptions for a simplified estimate)
  // For new tax regime (simplified)
  let newTaxableIncome = (baseSalary + variableBonus) - professionalTaxAnnual;
  newTaxableIncome = Math.max(0, newTaxableIncome - 50000); // Standard deduction

  let newTotalTax = 0;
  if (newTaxableIncome > 700000) {
    if (newTaxableIncome > 1500000) {
      newTotalTax += (newTaxableIncome - 1500000) * 0.30;
      newTotalTax += 300000 * 0.20; // 12-15
      newTotalTax += 300000 * 0.15; // 9-12
      newTotalTax += 300000 * 0.10; // 6-9
      newTotalTax += 300000 * 0.05; // 3-6
    } else if (newTaxableIncome > 1200000) {
      newTotalTax += (newTaxableIncome - 1200000) * 0.20;
      newTotalTax += 300000 * 0.15;
      newTotalTax += 300000 * 0.10;
      newTotalTax += 300000 * 0.05;
    } else if (newTaxableIncome > 900000) {
      newTotalTax += (newTaxableIncome - 900000) * 0.15;
      newTotalTax += 300000 * 0.10;
      newTotalTax += 300000 * 0.05;
    } else if (newTaxableIncome > 600000) {
      newTotalTax += (newTaxableIncome - 600000) * 0.10;
      newTotalTax += 300000 * 0.05;
    } else if (newTaxableIncome > 300000) {
      newTotalTax += (newTaxableIncome - 300000) * 0.05;
    }
    newTotalTax = newTotalTax * 1.04;
  }

  // For old tax regime (simplified - assuming full 80C of 1.5L and 50k std deduction)
  let oldTaxableIncome = (baseSalary + variableBonus) - professionalTaxAnnual;
  oldTaxableIncome = Math.max(0, oldTaxableIncome - 50000 - 150000); 

  let oldTotalTax = 0;
  if (oldTaxableIncome > 500000) {
    if (oldTaxableIncome > 1000000) {
      oldTotalTax += (oldTaxableIncome - 1000000) * 0.30;
      oldTotalTax += 500000 * 0.20; // 5-10
      oldTotalTax += 250000 * 0.05; // 2.5-5
    } else if (oldTaxableIncome > 500000) {
      oldTotalTax += (oldTaxableIncome - 500000) * 0.20;
      oldTotalTax += 250000 * 0.05;
    } else if (oldTaxableIncome > 250000) {
      oldTotalTax += (oldTaxableIncome - 250000) * 0.05;
    }
    oldTotalTax = oldTotalTax * 1.04;
  }

  const getEstimates = (tax) => {
    const annualTakeHome = grossSalary - employeePFAnnual - professionalTaxAnnual - tax;
    return {
      annualEstimate: Math.round(annualTakeHome / 1000) * 1000,
      monthlyEstimate: Math.round((annualTakeHome / 12) / 1000) * 1000,
      tax: Math.round(tax)
    };
  };

  return {
    breakdown: {
      step1_ctc: ctcAnnual > 0 ? ctcAnnual : (grossSalary + employerPFAnnual + gratuityAnnual),
      employerDeductions: {
        pf: Math.round(employerPFAnnual),
        gratuity: Math.round(gratuityAnnual),
        total: Math.round(employerPFAnnual + gratuityAnnual)
      },
      step2_gross: grossSalary,
      employeeDeductions: {
        pf: Math.round(employeePFAnnual),
        pt: Math.round(professionalTaxAnnual)
      }
    },
    newRegime: getEstimates(newTotalTax),
    oldRegime: getEstimates(oldTotalTax)
  };
};
