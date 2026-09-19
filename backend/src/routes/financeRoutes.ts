import { Router } from "express";
import { 
  DepositModel, 
  VoucherModel, 
  HandLoanModel, 
  SeizedVehicleModel, 
  BadDebtModel, 
  AuctionSaleModel, 
  LoanModel, 
  AuditLogModel 
} from "@xerova/database";

const router = Router();

// 1. Deposits
router.get("/deposits", async (req, res) => {
  try {
    const list = await DepositModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching deposits" }); }
});
router.post("/deposits", async (req, res) => {
  try {
    const body = req.body;
    const item = await DepositModel.create({
      ...body,
      id: body.id || `DEP-${Date.now().toString().slice(-5)}`,
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE"
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating deposit" }); }
});

// 2. Vouchers
router.get("/vouchers", async (req, res) => {
  try {
    const list = await VoucherModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching vouchers" }); }
});
router.post("/vouchers", async (req, res) => {
  try {
    const body = req.body;
    const item = await VoucherModel.create({
      ...body,
      id: body.id || `VOU-${Date.now().toString().slice(-6)}`,
      date: body.date || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error posting voucher" }); }
});

// 3. Hand Loans
router.get("/handloans", async (req, res) => {
  try {
    const list = await HandLoanModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching hand loans" }); }
});
router.post("/handloans", async (req, res) => {
  try {
    const body = req.body;
    const item = await HandLoanModel.create({
      ...body,
      id: body.id || `HL-${Date.now().toString().slice(-5)}`,
      givenDate: body.givenDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      repaidAmount: 0
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating hand loan" }); }
});
router.post("/handloans/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const hl = await HandLoanModel.findOne({ id });
    if (!hl) return res.status(404).json({ error: "Hand loan not found" });

    hl.repaidAmount = (hl.repaidAmount || 0) + Number(amount || 0);
    if (hl.repaidAmount >= hl.amount) hl.status = "PAID";
    await hl.save();

    res.json(hl);
  } catch (err) { res.status(500).json({ error: "Error recording hand loan repayment" }); }
});

// 4. Seized Vehicles
router.get("/seized", async (req, res) => {
  try {
    const list = await SeizedVehicleModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching seized vehicles" }); }
});
router.post("/seized", async (req, res) => {
  try {
    const body = req.body;
    let vehicleName = body.vehicleName;
    let rcNo = body.rcNo || body.vehicleNo;
    let customerName = body.customerName;
    let customerPhone = body.customerPhone;
    let loanBalance = body.loanBalance;

    if (body.loanNo) {
      const loan = await LoanModel.findOne({ loanNo: body.loanNo });
      if (loan) {
        loan.status = "SEIZED";
        await loan.save();
        vehicleName = vehicleName || loan.vehicle?.vehicleName || loan.vehicle?.model || "Two Wheeler";
        rcNo = rcNo || loan.vehicle?.rcNo || "TN-PENDING";
        customerName = customerName || loan.customer?.name || "Customer";
        customerPhone = customerPhone || loan.customer?.phone || loan.customer?.mobile || "N/A";
        loanBalance = loanBalance || loan.pendingAmount || loan.loanAmount;
      }
    }

    const item = await SeizedVehicleModel.create({
      ...body,
      id: body.id || `SZ-${Date.now().toString().slice(-5)}`,
      seizureDate: body.seizureDate || body.seizedDate || new Date().toISOString().split("T")[0],
      vehicleName: vehicleName || "Two Wheeler",
      vehicleNo: rcNo || "TN-PENDING",
      rcNo: rcNo || "TN-PENDING",
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "N/A",
      loanBalance: Number(loanBalance || 0),
      godownName: body.godownName || body.godownLocation || "Katpadi Main Yard",
      godownLocation: body.godownName || body.godownLocation || "Katpadi Main Yard",
      status: "IN_YARD"
    });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Recovery Officer",
      action: "VEHICLE_SEIZED",
      details: `Vehicle repossessed: ${item.vehicleName} (${item.rcNo}) from loan ${item.loanNo}. Yard: ${item.godownLocation}`
    });

    res.status(201).json(item);
  } catch (err) { 
    console.error("[Seized] Error creating record:", err);
    res.status(500).json({ error: "Error recording vehicle seizure" }); 
  }
});

router.post("/seized/:id/release", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SeizedVehicleModel.findOneAndUpdate(
      { id },
      { status: "RELEASED", releaseDate: new Date().toISOString().split("T")[0], releaseRemarks: req.body.remarks || "Released on settlement" },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Seized record not found" });
    if (item.loanNo) {
      await LoanModel.findOneAndUpdate({ loanNo: item.loanNo }, { status: "ACTIVE" });
    }
    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Recovery Officer",
      action: "VEHICLE_RELEASED",
      details: `Vehicle release authorized: ${item.vehicleName} (${item.rcNo}) for loan ${item.loanNo}.`
    });
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Error releasing vehicle" }); }
});

router.post("/seized/:id/auction", async (req, res) => {
  try {
    const { id } = req.params;
    const finalBidAmount = Number(req.body.auctionPrice || req.body.salePrice || 0);
    const item = await SeizedVehicleModel.findOneAndUpdate(
      { id },
      { status: "AUCTIONED", auctionPrice: finalBidAmount },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Seized record not found" });

    await AuctionSaleModel.create({
      id: `AUC-${Date.now().toString().slice(-5)}`,
      seizedVehicleId: item.id,
      vehicleName: item.vehicleName,
      rcNo: item.rcNo,
      buyerName: req.body.buyerName || "Public Auction Bidder",
      buyerPhone: req.body.buyerPhone || "N/A",
      basePrice: item.valuationAmount || item.loanBalance || 0,
      finalBidAmount,
      auctionDate: new Date().toISOString().split("T")[0],
      status: "COMPLETED"
    });

    if (item.loanNo) {
      const loan = await LoanModel.findOne({ loanNo: item.loanNo });
      if (loan) {
        loan.totalPaidAmount = (loan.totalPaidAmount || 0) + finalBidAmount;
        loan.pendingAmount = Math.max(0, (loan.totalDueAmount || 0) - loan.totalPaidAmount);
        if (loan.pendingAmount <= 0) {
          loan.status = "CLOSED";
        }
        await loan.save();
      }
    }

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Recovery Desk",
      action: "VEHICLE_AUCTIONED",
      details: `Seized asset auctioned: ${item.vehicleName} (${item.rcNo}) for ₹${finalBidAmount.toLocaleString()} to ${req.body.buyerName || "Bidder"}`
    });

    res.json(item);
  } catch (err) { 
    console.error("[Seized] Auction error:", err);
    res.status(500).json({ error: "Error auctioning vehicle" }); 
  }
});
router.post("/seized/:id/writeoff", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SeizedVehicleModel.findOneAndUpdate({ id }, { status: "WRITTEN_OFF" }, { new: true });
    if (!item) return res.status(404).json({ error: "Seized record not found" });

    if (item.loanNo) {
      const loan = await LoanModel.findOne({ loanNo: item.loanNo });
      await LoanModel.findOneAndUpdate({ loanNo: item.loanNo }, { status: "WRITTEN_OFF" });
      if (loan) {
        await BadDebtModel.create({
          id: `BD-${Date.now().toString().slice(-5)}`,
          loanNo: loan.loanNo,
          customerName: loan.customer?.name || item.customerName,
          originalLoanAmount: loan.loanAmount || 0,
          defaultedAmount: loan.pendingAmount || 0,
          writeOffDate: new Date().toISOString().split("T")[0],
          recoveryStatus: "UNRECOVERED",
          remarks: "Transferred from seized inventory write-off."
        });
      }
    }
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Error writing off vehicle" }); }
});

// 5. Bad Debts
router.get("/baddebts", async (req, res) => {
  try {
    const list = await BadDebtModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching bad debts" }); }
});
router.post("/baddebts", async (req, res) => {
  try {
    const item = await BadDebtModel.create({
      ...req.body,
      id: req.body.id || `BD-${Date.now().toString().slice(-5)}`,
      writeOffDate: req.body.writeOffDate || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating bad debt record" }); }
});

// 6. Auctions
router.get("/auctions", async (req, res) => {
  try {
    const list = await AuctionSaleModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching auctions" }); }
});
router.post("/auctions", async (req, res) => {
  try {
    const item = await AuctionSaleModel.create({
      ...req.body,
      id: req.body.id || `AUC-${Date.now().toString().slice(-5)}`,
      auctionDate: req.body.auctionDate || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error recording auction sale" }); }
});

export default router;
