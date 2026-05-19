import express from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import Order from "../../models/Order.js";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browser;

/* ================= INIT PUPPETEER ================= */
(async () => {
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
})();

/* ================= HELPERS ================= */

// Date format
function formatDateTime(date) {
  const d = new Date(date);
  return {
    datePart: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    timePart: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

// Truncate long text
function truncate(text = "", max = 35) {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

// Currency format
function formatCurrency(num) {
  return Number(num).toLocaleString("en-BD");
}

/* ================= ROUTE ================= */

router.get("/invoice/:id", async (req, res) => {
  let page;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");

    const { datePart, timePart } = formatDateTime(order.createdAt);

    const publicPath = path.join(__dirname, "../../../public");
    const templatePath = path.join(
      __dirname,
      "../../../templates/invoice.html",
    );
    const cssPath = path.join(publicPath, "invoice.css");
    const imagePath = path.join(publicPath, "invoice-template.png");

    /* ================= LOAD FILES ================= */

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    const base64Image = `data:image/png;base64,${fs
      .readFileSync(imagePath)
      .toString("base64")}`;

    /* ================= BUILD ITEMS ================= */

    const itemRows = order.items
      .map((item) => {
        const price = formatCurrency(item.price);
        const total = formatCurrency(item.qty * item.price);

        return `
          <div class="row">
            <span>${truncate(item.name)}</span>
            <span>${price}</span>
            <span>${item.qty}</span>
            <span>${total}</span>
          </div>
        `;
      })
      .join("");

    /* ================= FINAL HTML ================= */

    let finalHtml = htmlTemplate
      .replace("{{orderId}}", order._id.toString())
      .replace("{{date}}", datePart)
      .replace("{{time}}", timePart)
      .replace("{{payment}}", order.paymentMethod.toUpperCase())
      .replace("{{name}}", order.billing?.name || "")
      .replace("{{phone}}", order.billing?.phone || "")
      .replace("{{address}}", order.billing?.address || "")
      .replace("{{note}}", order.billing?.note || "")
      .replace("{{items}}", itemRows)
      .replace("{{subtotal}}", formatCurrency(order.subtotal))
      .replace("{{delivery}}", formatCurrency(order.deliveryCharge))
      .replace("{{discount}}", formatCurrency(order.discount || 0))
      .replace("{{total}}", formatCurrency(order.total));

    /* ================= PUPPETEER ================= */

    page = await browser.newPage();

    await page.setContent(finalHtml, {
      waitUntil: "networkidle0",
    });

    // CSS load
    await page.addStyleTag({ path: cssPath });

    // 🔥🔥🔥 IMPORTANT FIX (body → .page)
    await page.addStyleTag({
      content: `.page { background-image: url("${base64Image}"); }`,
    });

    // Ensure fonts loaded
    await page.evaluateHandle("document.fonts.ready");

    /* ================= PDF ================= */

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate: `<div></div>`,

      footerTemplate: `
        <div style="
          width: 100%;
          font-family: Arial;
          font-size: 10px;
          padding: 0 40px 10px;
          display: flex;
          justify-content: space-between;
          color: #666;
        ">
          <span>Invoice #${order._id.toString().slice(-6)}</span>
          <span>
            Page <span class="pageNumber"></span> of 
            <span class="totalPages"></span>
          </span>
        </div>
      `,

      margin: {
        top: "20px",
        bottom: "60px",
        left: "0px",
        right: "0px",
      },
    });

    await page.close();

    /* ================= RESPONSE ================= */

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`,
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Invoice Error:", err);

    if (page) await page.close();

    res.status(500).send("Error generating invoice");
  }
});

export default router;
