import { Router } from "express";
import { ReceiptModel, LoanModel, AuditLogModel } from "@xerova/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const receipts = await ReceiptModel.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching receipts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const amount = Number(body.amount) || 0;
    const penalty = Number(body.penaltyCollected) || 0;

    const receipt = await ReceiptModel.create({
      ...body,
      receiptNo: body.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
      date: body.date || new Date().toISOString().split("T")[0],
      amount,
      penaltyCollected: penalty
    });

    // Reconcile loan schedule
    if (body.loanNo) {
      const loan = await LoanModel.findOne({ loanNo: body.loanNo });
      if (loan) {
        loan.totalPaidAmount = (loan.totalPaidAmount || 0) + amount;
        loan.pendingAmount = Math.max(0, (loan.totalDueAmount || 0) - loan.totalPaidAmount);
        if (loan.pendingAmount === 0) {
          loan.status = "CLOSED";
        }

        // Apply amount to pending installments
        let remaining = amount;
        if (loan.installments && Array.isArray(loan.installments)) {
          for (const inst of loan.installments) {
            if (remaining <= 0) break;
            if (inst.status !== "PAID") {
              const due = inst.emiAmount - inst.paidAmount;
              if (remaining >= due) {
                inst.paidAmount = inst.emiAmount;
                inst.status = "PAID";
                inst.paidDate = receipt.date;
                inst.receiptNo = receipt.receiptNo;
                remaining -= due;
              } else {
                inst.paidAmount += remaining;
                inst.status = "PARTIAL";
                remaining = 0;
              }
            }
          }
        }

        loan.payments = loan.payments || [];
        loan.payments.push({
          receiptNo: receipt.receiptNo,
          amount,
          date: receipt.date,
          mode: receipt.paymentMode || "CASH"
        });

        await loan.save();
      }
    }

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: body.collectorName || "Cashier Counter",
      action: "RECEIPT_POSTED",
      details: `EMI Receipt ${receipt.receiptNo} collected: ₹${amount.toLocaleString()} from ${body.customerName || body.loanNo} via ${body.paymentMode || "CASH"}`
    });

    res.status(201).json(receipt);
  } catch (err) {
    console.error("[Receipts] Error creating receipt:", err);
    res.status(500).json({ error: "Error posting EMI collection receipt" });
  }
});

export default router;
