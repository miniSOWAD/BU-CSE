import SSLCommerzPayment from "sslcommerz-lts";
import { Payment } from "./payment.model.js";

const APP_ORIGIN   = process.env.APP_ORIGIN   || "http://localhost:3000";  // Next.js site
const SERVER_ORIGIN= process.env.SERVER_ORIGIN|| "http://localhost:4000";  // Express/API base
const STORE_ID     = process.env.SSL_STORE_ID || "";
const STORE_PASS   = process.env.SSL_STORE_PASSWD || "";
const IS_LIVE      = (process.env.SSL_IS_LIVE || "false") === "true";

const genTranId = () => "TXN" + Date.now().toString(36) + Math.round(Math.random() * 1e6).toString(36);

export const createSession = async (req, res, next) => {
  try {
    const user = req.user; // from requireAuth
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { purpose, otherDescription = "", method, amount } = req.body;
    if (!purpose || !method || !amount) {
      return res.status(400).json({ message: "purpose, method, amount are required" });
    }

    const tranId = genTranId();

    // Save initial payment row
    await Payment.create({
      tranId,
      user: user._id,
      roll: user.roll || "N/A",
      semester: user.semester || "N/A",
      purpose,
      otherDescription,
      method,
      amount,
      status: "initiated",
      gateway: "sslcommerz",
    });

    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);

    const data = {
      total_amount: amount,
      currency: "BDT",
      tran_id: tranId,

      success_url: `${SERVER_ORIGIN}/api/payments/ssl/success`,
      fail_url:    `${SERVER_ORIGIN}/api/payments/ssl/fail`,
      cancel_url:  `${SERVER_ORIGIN}/api/payments/ssl/cancel`,
      ipn_url:     `${SERVER_ORIGIN}/api/payments/ssl/ipn`,

      shipping_method: "NO",
      product_name: purpose.replace(/_/g, " ").toUpperCase(),
      product_category: purpose,
      product_profile: "general",

      // Customer info
      cus_name:  user.name || user.fullName || "Student",
      cus_email: user.email || "student@example.com",
      cus_add1: "CSE, Barishal University",
      cus_add2: "Barishal",
      cus_city: "Barishal",
      cus_state: "Barishal",
      cus_postcode: "8200",
      cus_country: "Bangladesh",
      cus_phone: user.phone || "00000000000",
      cus_fax:   "00000000000",

      // Pass through values
      value_a: String(user._id || ""),
      value_b: String(user.roll || ""),
      value_c: String(user.semester || ""),
      value_d: purpose,
    };

    const apiRes = await sslcz.init(data);

    if (!apiRes?.GatewayPageURL) {
      return res.status(400).json({ message: "Failed to create payment session" });
    }
    return res.json({ gatewayUrl: apiRes.GatewayPageURL, tranId });
  } catch (err) {
    next(err);
  }
};

export const sslSuccess = async (req, res, next) => {
  const { val_id, tran_id } = req.body || {};
  try {
    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const validation = await sslcz.validate({ val_id });

    const ok = validation?.status === "VALID" || validation?.status === "VALIDATED";
    await Payment.findOneAndUpdate(
      { tranId: tran_id },
      { status: ok ? "success" : "failed", gatewayResponse: validation },
      { new: true }
    );

    return res.redirect(`${APP_ORIGIN}/payment/result?status=${ok ? "success" : "failed"}&tranId=${tran_id}`);
  } catch (err) {
    await Payment.findOneAndUpdate(
      { tranId: tran_id },
      { status: "failed", gatewayResponse: { error: err?.message } }
    );
    return res.redirect(`${APP_ORIGIN}/payment/result?status=failed&tranId=${tran_id}`);
  }
};

export const sslFail = async (req, res, next) => {
  const { tran_id } = req.body || {};
  try {
    await Payment.findOneAndUpdate(
      { tranId: tran_id },
      { status: "failed", gatewayResponse: req.body },
      { new: true }
    );
    return res.redirect(`${APP_ORIGIN}/payment/result?status=failed&tranId=${tran_id}`);
  } catch (err) {
    return res.redirect(`${APP_ORIGIN}/payment/result?status=failed&tranId=${tran_id || ""}`);
  }
};

export const sslCancel = async (req, res, next) => {
  const { tran_id } = req.body || {};
  try {
    await Payment.findOneAndUpdate(
      { tranId: tran_id },
      { status: "canceled", gatewayResponse: req.body },
      { new: true }
    );
    return res.redirect(`${APP_ORIGIN}/payment/result?status=canceled&tranId=${tran_id}`);
  } catch (err) {
    return res.redirect(`${APP_ORIGIN}/payment/result?status=canceled&tranId=${tran_id || ""}`);
  }
};

export const sslIpn = async (req, res, next) => {
  // Optional: keep for reconciliation. You can also validate val_id here.
  const { val_id, tran_id } = req.body || {};
  try {
    if (val_id) {
      const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
      const validation = await sslcz.validate({ val_id });
      const ok = validation?.status === "VALID" || validation?.status === "VALIDATED";
      await Payment.findOneAndUpdate(
        { tranId: tran_id },
        { status: ok ? "success" : "failed", gatewayResponse: validation },
        { new: true }
      );
    }
    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ received: false, error: err?.message });
  }
};

export const getMine = async (req, res, next) => {
  try {
    const items = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) { next(err); }
};

export const getByTranId = async (req, res, next) => {
  try {
    const pay = await Payment.findOne({ tranId: req.params.tranId }).lean();
    if (!pay) return res.status(404).json({ message: "Not found" });
    res.json(pay);
  } catch (err) { next(err); }
};
