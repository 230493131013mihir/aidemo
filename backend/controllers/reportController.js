/**
 * reportController.js
 * Controller for Farm Decision Summary Reports & Printable Outputs
 * HarvestMitra AI - ISSUE #78
 */

const farmReportService = require('../services/farmReportService');
const { FarmerProfile } = require('../models');

async function resolveFarmerParams(req) {
  const params = { ...req.query, ...(req.body || {}) };
  delete params.farmerName;
  delete params.phone;

  let profile = null;
  if (req.user?.id) {
    profile = await FarmerProfile.findOne({ where: { userId: req.user.id } }).catch(() => null);
  }

  return {
    ...params,
    farmerName: req.user?.name || "Farmer",
    phone: req.user?.phone || "",
    district: profile?.district || req.user?.district || params.district || "Surat",
    state: profile?.state || req.user?.state || params.state || "Gujarat"
  };
}

async function handleGetFarmDecisionReport(req, res) {
  try {
    const params = await resolveFarmerParams(req);
    const report = await farmReportService.generateFarmDecisionReport(params);

    if (req.query.format === 'html' || req.query.format === 'print') {
      const html = farmReportService.renderPrintableHtml(report);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    return res.status(200).json(report);
  } catch (err) {
    console.error('[ReportController Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handlePrintFarmDecisionReport(req, res) {
  try {
    const params = await resolveFarmerParams(req);
    const report = await farmReportService.generateFarmDecisionReport(params);
    const html = farmReportService.renderPrintableHtml(report);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[ReportController Print Error]:', err.message);
    return res.status(500).send(`<h2>Error generating report</h2><p>${err.message}</p>`);
  }
}

async function handleDownloadFarmDecisionReport(req, res) {
  try {
    const params = await resolveFarmerParams(req);
    const report = await farmReportService.generateFarmDecisionReport(params);
    const html = farmReportService.renderPrintableHtml(report);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="HarvestMitra_Decision_${report.reportId}.html"`
    );
    return res.status(200).send(html);
  } catch (err) {
    console.error('[ReportController Download Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleGetFarmDecisionReport,
  handlePrintFarmDecisionReport,
  handleDownloadFarmDecisionReport
};
