import { Router } from "express";
import { LoanModel, CustomerModel, AuditLogModel, HandLoanModel } from "@xerova/database";

const router = Router();

export function generateInstallments(loanAmount: number, rate: number, duration: number, emi: number, startDate: string) {
  const insts = [];
  let currentBalance = loanAmount;
  const monthlyRate = rate / 12 / 100;
  const baseDate = new Date(startDate || Date.now());
  const startYear = baseDate.getFullYear();
  const startMonth = baseDate.getMonth();
  const startDay = baseDate.getDate();

  for (let i = 1; i <= duration; i++) {
    const targetDate = new Date(startYear, startMonth + i, startDay);
    const expectedMonth = (startMonth + i) % 12;
    if (targetDate.getMonth() !== (expectedMonth < 0 ? expectedMonth + 12 : expectedMonth)) {
      targetDate.setDate(0); // clamp to end of intended month
    }
    const dueDate = targetDate.toISOString().split("T")[0];
    const interestPart = Math.round(currentBalance * monthlyRate);
    let principalPart = emi - interestPart;
    if (i === duration) {
      principalPart = currentBalance;
    }
    currentBalance -= principalPart;
    if (currentBalance < 0) currentBalance = 0;

    insts.push({
      instNo: i,
      dueDate,
      emiAmount: emi,
      principalPart,
      interestPart,
      status: "PENDING",
      paidAmount: 0
    });
  }
  return insts;
}

router.get("/", async (req, res) => {
  try {
    const loans = await LoanModel.find().sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: "Error fetching loans" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    let customer = body.customer;
    if (body.borrowerId && !customer) {
      customer = await CustomerModel.findOne({ id: body.borrowerId });
    } else if (customer) {
      const phone = customer.phone || customer.mobile;
      let existingCustomer = phone ? await CustomerModel.findOne({ phone }) : null;
      if (!existingCustomer) {
        const custId = customer.id || `CUST-${Date.now().toString().slice(-4)}`;
        customer.id = custId;
        existingCustomer = await CustomerModel.create({
          ...customer,
          id: custId
        });
      }
      customer = existingCustomer;
    }

    const borrowerId = customer?.id || body.borrowerId || `CUST-${Date.now().toString().slice(-4)}`;
    const loanAmount = Number(body.loanAmount) || 0;
    const interestRate = Number(body.interestRate) || 16.5;
    const durationMonths = Number(body.durationMonths) || 24;
    const emiAmount = Number(body.emiAmount) || Math.round((loanAmount * (1 + (interestRate/100)*(durationMonths/12))) / durationMonths);
    const totalDueAmount = emiAmount * durationMonths;

    const installments = generateInstallments(loanAmount, interestRate, durationMonths, emiAmount, body.disbursementDate || new Date().toISOString());

    const newLoan = await LoanModel.create({
      ...body,
      loanNo: body.loanNo || `HP-${Date.now().toString().slice(-4)}`,
      borrowerId,
      customer,
      loanAmount,
      interestRate,
      durationMonths,
      emiAmount,
      totalDueAmount,
      totalPaidAmount: 0,
      pendingAmount: totalDueAmount,
      disbursementDate: body.disbursementDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      installments,
      payments: []
    });

    if (body.handloanAmount && Number(body.handloanAmount) > 0) {
      await HandLoanModel.create({
        id: `HL-${Date.now().toString().slice(-5)}`,
        loanNo: newLoan.loanNo,
        customerName: customer?.name || "Borrower",
        borrowerName: customer?.name || "Borrower",
        phone: customer?.phone || "N/A",
        amount: Number(body.handloanAmount),
        givenDate: body.disbursementDate || new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        repaidAmount: 0,
        remarks: body.handloanRemarks || `Auxiliary advance linked to HP loan ${newLoan.loanNo}`,
        payments: []
      });
    }

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: body.officerName || "Admin",
      action: "LOAN_DISBURSED",
      details: `New Hire Purchase Loan Disbursed: ${newLoan.loanNo} for ₹${loanAmount.toLocaleString()} to ${customer?.name || "Borrower"}`
    });

    res.status(201).json(newLoan);
  } catch (err) {
    console.error("[Loans] Error creating loan:", err);
    res.status(500).json({ error: "Error creating loan ledger" });
  }
});

router.get("/:loanNo", async (req, res) => {
  try {
    const { loanNo } = req.params;
    const loan = await LoanModel.findOne({ loanNo });
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: "Error fetching loan" });
  }
});

router.put("/:loanNo", async (req, res) => {
  try {
    const { loanNo } = req.params;
    const updated = await LoanModel.findOneAndUpdate({ loanNo }, { $set: req.body }, { new: true });
    if (!updated) return res.status(404).json({ error: "Loan not found" });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "System Desk",
      action: "LOAN_UPDATED",
      details: `Loan ledger ${loanNo} updated.`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error updating loan" });
  }
});

export default router;
