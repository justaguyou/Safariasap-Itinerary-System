/**
 * Safari ASAP Dashboard PDF Patch
 * Run: node patch_dashboard.js dashboard.html
 * Output: dashboard_patched.html
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'dashboard copy.html';
const outputFile = process.argv[3] || inputFile.replace(/\.html$/, '_patched.html');

if (!fs.existsSync(inputFile)) {
  console.error(`❌  File not found: ${inputFile}`);
  process.exit(1);
}

let html = fs.readFileSync(inputFile, 'utf8');

/* ─────────────────────────────────────────────────
   PATCH 1 — Replace pdfStyleClassic
   ───────────────────────────────────────────────── */
const newClassic = `function pdfStyleClassic(it, lang) {
        lang = lang || "en";
        const { price, incl, excl, hi } = pdfMeta(it);
        const style = "classic";
        const gold = "#F19233";
        const dkBrn = "#3C2414";
        const linen = "#FAF7F0";
        const txtC = "#5C3E22";

        /* ── PAGE STYLES shared across all pages ── */
        const sharedPageStyles = \`
          <style>
            .pdf-page { background:\${linen}; }
            .page-hdr-bar {
              background:\${dkBrn};
              padding: 12px 44px 10px;
              display:flex; align-items:center; justify-content:space-between;
              border-bottom: 4px solid \${gold};
            }
            .page-footer-bar {
              background:\${dkBrn};
              padding: 10px 44px;
              display:flex; align-items:center; justify-content:space-between;
            }
            .page-content { padding: 36px 44px 28px; }
            .section-title {
              font-family:'Oswald',sans-serif;
              font-size:11px; letter-spacing:3.5px;
              text-transform:uppercase; color:\${gold};
              margin-bottom:22px;
              border-bottom:1px solid rgba(241,146,51,.22);
              padding-bottom:8px;
            }
          </style>
        \`;

        const pageHeader = (it) => \`
          <div class="page-hdr-bar">
            <div style="display:flex;align-items:center;gap:14px;">
              \${logoHeaderHTML(it)}
            </div>
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(241,146,51,.55);">
              \${esc(it.reference_code || '')}
            </span>
          </div>
        \`;

        const pageFooter = (it) => \`
          <div class="page-footer-bar">
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.6);">
              \${esc(it.title || '')}
            </span>
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.55);">
              \${esc(L(it, 'confidential', 'Confidential Proposal'))}
            </span>
          </div>
        \`;

        return (
          pdfHead(it.title, linen, lang) + sharedPageStyles +

          /* ══ WELCOME PAGE ══ */
          pdfWelcomePage(it, style) +

          /* ══ PAGE 1 — COVER + OVERVIEW ══ */
          '<div class="pdf-page">' +
          '<div style="background:' + dkBrn + ';padding:44px 44px 34px;position:relative;overflow:hidden;">' +
          '<div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:' + gold + ';"></div>' +
          '<div style="position:absolute;top:20px;right:44px;z-index:2;">' + logoHeaderHTML(it) + '</div>' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:rgba(241,146,51,.6);margin-bottom:16px;">' + esc(L(it, 'proposal', 'Safari ASAP · Itinerary Proposal')) + '</div>' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:38px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff;line-height:1.15;margin-bottom:10px;">' + esc(it.title) + '</div>' +
          (it.client_name ? '<div style="font-size:16px;color:rgba(232,213,168,.72);margin-bottom:22px;">' + esc(L(it, 'preparedFor', 'Prepared for')) + ' ' + esc(it.client_name) + '</div>' : '') +
          '<div style="display:flex;gap:32px;flex-wrap:wrap;">' +
          (it.duration_label ? '<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">' + esc(L(it, 'duration', 'Duration')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:17px;color:#E8D5A8;">' + esc(it.duration_label) + '</div></div>' : '') +
          (it.group_size ? '<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">' + esc(L(it, 'group', 'Group')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:17px;color:#E8D5A8;">' + it.group_size + ' Pax</div></div>' : '') +
          (it.start_date ? '<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">' + esc(L(it, 'departure', 'Departure')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:17px;color:#E8D5A8;">' + fmtDate(it.start_date) + '</div></div>' : '') +
          (price ? '<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">' + esc(L(it, 'from', 'From')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:17px;color:#E8D5A8;">' + esc(price) + '</div></div>' : '') +
          (it.reference_code ? '<div><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">' + esc(L(it, 'reference', 'Reference')) + '</div><div style="font-family:monospace;font-size:15px;color:#E8D5A8;">' + esc(it.reference_code) + '</div></div>' : '') +
          '</div></div>' +
          (it.hero_image ? '<div style="height:260px;overflow:hidden;"><img src="' + esc(it.hero_image) + '" style="width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.85);" onerror="this.style.display=\\'none\\'"/></div>' : '') +
          '<div class="page-content">' +
          (it.overview ? pdfSectionHdr(L(it, 'overview', 'Overview'), style) + '<div style="font-size:15px;color:' + txtC + ';line-height:2;margin-bottom:28px;">' + esc(it.overview) + '</div>' : '') +
          (hi.length ? pdfSectionHdr(L(it, 'tourHighlights', 'Tour Highlights'), style) + pdfHighlights(hi, style) : '') +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 2 — DAY-BY-DAY ══ */
          '<div class="pdf-page">' +
          pageHeader(it) +
          '<div class="page-content">' +
          pdfSectionHdr(L(it, 'dayByDay', 'Day-by-Day Programme'), style) +
          pdfDaysHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 3 — INCLUSIONS + PRICING ══ */
          '<div class="pdf-page">' +
          pageHeader(it) +
          '<div class="page-content">' +
          pdfSectionHdr(L(it, 'whatsIncluded', "What\\'s Included"), style) +
          pdfInclExcl(incl, excl, style, it) +
          pdfSectionHdr(L(it, 'pricing', 'Pricing'), style) +
          pricingTableHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          '</div></body></html>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 2 — Replace pdfStyleMinimal
   ───────────────────────────────────────────────── */
const newMinimal = `function pdfStyleMinimal(it, lang) {
        lang = lang || "en";
        const { price, incl, excl, hi } = pdfMeta(it);
        const style = "minimal";
        const gold = "#F19233";
        const dark = "#3C2414";
        const txtC = "#5C3E22";
        const subC = "#9C7A50";
        const bar = '<div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:' + gold + ';"></div>';
        const pad = 'padding:36px 44px 28px 54px;';

        const pageHeader = (it) => \`
          <div style="position:relative;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:\${gold};"></div>
            <div style="padding:12px 44px 12px 54px;border-bottom:1px solid rgba(241,146,51,.2);display:flex;align-items:center;justify-content:space-between;">
              \${logoHeaderHTML(it)}
              <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(241,146,51,.5);">
                \${esc(it.reference_code || '')}
              </span>
            </div>
          </div>
        \`;

        const pageFooter = (it) => \`
          <div style="border-top:1px solid rgba(241,146,51,.2);padding:10px 44px 10px 54px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(100,70,40,.45);">
              \${esc(it.title || '')}
            </span>
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.5);">
              \${esc(L(it,'confidential','Confidential Proposal'))}
            </span>
          </div>
        \`;

        return (
          pdfHead(it.title, '#FFFFFF', lang) +
          pdfWelcomePage(it, style) +

          /* ══ PAGE 1 — COVER + OVERVIEW ══ */
          '<div class="pdf-page" style="background:#fff;display:flex;flex-direction:column;min-height:880px;position:relative;">' +
          bar +
          '<div style="' + pad + 'flex-shrink:0;border-bottom:1px solid rgba(241,146,51,.2);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div style="font-family:\\'Oswald\\',sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(241,146,51,.65);">' + esc(L(it, 'proposal', 'Safari ASAP · Itinerary Proposal')) + '</div>' +
          logoHeaderHTML(it) + '</div>' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:30px;font-weight:700;color:' + dark + ';letter-spacing:.5px;text-transform:uppercase;line-height:1.15;margin-bottom:8px;">' + esc(it.title) + '</div>' +
          (it.client_name ? '<div style="font-size:14px;color:' + subC + ';margin-bottom:18px;">' + esc(it.client_name) + '</div>' : '') +
          '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
          (it.duration_label ? '<div style="font-size:12px;color:' + subC + ';"><span style="font-weight:700;color:' + dark + ';">' + esc(L(it, 'duration', 'Duration')) + ': </span>' + esc(it.duration_label) + '</div>' : '') +
          (it.group_size ? '<div style="font-size:12px;color:' + subC + ';"><span style="font-weight:700;color:' + dark + ';">' + esc(L(it, 'group', 'Group')) + ': </span>' + it.group_size + ' Pax</div>' : '') +
          (price ? '<div style="font-size:12px;color:' + subC + ';"><span style="font-weight:700;color:' + dark + ';">' + esc(L(it, 'from', 'From')) + ': </span>' + esc(price) + '</div>' : '') +
          (it.reference_code ? '<div style="font-size:11px;color:' + subC + ';font-family:monospace;">' + esc(it.reference_code) + '</div>' : '') +
          '</div></div>' +
          (it.hero_image ? '<div style="height:220px;overflow:hidden;flex-shrink:0;"><img src="' + esc(it.hero_image) + '" style="width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.88);" onerror="this.style.display=\\'none\\'"/></div>' : '') +
          '<div style="' + pad + 'flex:1;">' +
          (it.overview ? '<div style="font-size:14px;color:' + txtC + ';line-height:2;margin-bottom:24px;max-width:520px;">' + esc(it.overview) + '</div>' : '') +
          (hi.length ? '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:' + gold + ';margin-bottom:12px;">' + esc(L(it, 'highlights', 'Highlights')) + '</div>' + pdfHighlights(hi, style) : '') +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 2 — DAY-BY-DAY ══ */
          '<div class="pdf-page" style="background:#fff;display:flex;flex-direction:column;min-height:880px;position:relative;">' +
          bar +
          pageHeader(it) +
          '<div style="' + pad + 'flex:1;"><div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;border-bottom:1px solid rgba(241,146,51,.18);padding-bottom:8px;">' + esc(L(it, 'dayByDay', 'Day-by-Day Programme')) + '</div>' +
          pdfDaysHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 3 — INCLUSIONS + PRICING (OWN PAGE) ══ */
          '<div class="pdf-page" style="background:#fff;display:flex;flex-direction:column;position:relative;">' +
          bar +
          pageHeader(it) +
          '<div style="' + pad + 'flex:1;">' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;border-bottom:1px solid rgba(241,146,51,.18);padding-bottom:8px;">' + esc(L(it, 'whatsIncluded', "What\\'s Included")) + '</div>' +
          pdfInclExcl(incl, excl, style, it) +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;margin-top:10px;border-bottom:1px solid rgba(241,146,51,.18);padding-bottom:8px;">' + esc(L(it, 'pricing', 'Pricing')) + '</div>' +
          pricingTableHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          '</div></body></html>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 3 — Replace pdfStyleBold
   ───────────────────────────────────────────────── */
const newBold = `function pdfStyleBold(it, lang) {
        lang = lang || "en";
        const { price, incl, excl, hi } = pdfMeta(it);
        const style = "bold";
        const bodyBg = "#2E3B2E";
        const gold = "#F19233";
        const white = "#E8D5A8";
        const divC = "rgba(241,146,51,.15)";

        const pageHeader = (it) => \`
          <div style="padding:12px 42px;background:rgba(0,0,0,.25);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid \${divC};">
            \${logoHeaderHTML(it)}
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(241,146,51,.45);">
              \${esc(it.reference_code || '')}
            </span>
          </div>
        \`;

        const pageFooter = (it) => \`
          <div style="padding:10px 42px;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:space-between;border-top:1px solid \${divC};">
            <span style="font-family:'Oswald',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.55);">
              \${esc(it.title || '')}
            </span>
            <span style="font-family:'Oswald',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.4);">
              \${esc(L(it,'confidential','Confidential Proposal'))}
            </span>
          </div>
        \`;

        return (
          pdfHead(it.title, bodyBg, lang) +
          "<style>body,html{background:#1a2a1a!important;}</style>" +
          pdfWelcomePage(it, style) +

          /* ══ PAGE 1 — COVER + OVERVIEW ══ */
          '<div class="pdf-page" style="background:' + bodyBg + ';">' +
          '<div style="padding:34px 42px 26px;flex-shrink:0;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;">' +
          logoHeaderHTML(it) +
          '<span style="font-family:\\'Oswald\\',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(241,146,51,.4);">' + esc(L(it, 'proposalShort', 'Itinerary Proposal')) + '</span></div>' +
          '<div style="padding:22px 26px;background:rgba(241,146,51,.09);border:1px solid ' + divC + ';border-left:5px solid ' + gold + ';border-radius:0 4px 4px 0;">' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:28px;font-weight:700;color:' + white + ';letter-spacing:1px;text-transform:uppercase;line-height:1.2;margin-bottom:10px;">' + esc(it.title) + '</div>' +
          (it.client_name ? '<div style="font-size:14px;color:rgba(232,213,168,.7);margin-bottom:16px;">' + esc(it.client_name) + '</div>' : '') +
          '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
          (it.duration_label ? '<div><div style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.45);">' + esc(L(it, 'duration', 'Duration')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:15px;color:' + gold + ';">' + esc(it.duration_label) + '</div></div>' : '') +
          (it.group_size ? '<div><div style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.45);">' + esc(L(it, 'group', 'Group')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:15px;color:' + gold + ';">' + it.group_size + ' Pax</div></div>' : '') +
          (it.start_date ? '<div><div style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.45);">' + esc(L(it, 'departure', 'Departure')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:15px;color:' + gold + ';">' + fmtDate(it.start_date) + '</div></div>' : '') +
          (price ? '<div><div style="font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(241,146,51,.45);">' + esc(L(it, 'from', 'From')) + '</div><div style="font-family:\\'Oswald\\',sans-serif;font-size:15px;color:' + gold + ';">' + esc(price) + '</div></div>' : '') +
          '</div></div></div>' +
          (it.hero_image ? '<div style="height:200px;overflow:hidden;flex-shrink:0;margin:0 42px;border:1px solid ' + divC + ';border-radius:3px;"><img src="' + esc(it.hero_image) + '" style="width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.72);" onerror="this.style.display=\\'none\\'"/></div>' : '') +
          '<div style="padding:28px 42px 20px;flex:1;">' +
          (it.overview ? pdfSectionHdr(L(it, 'overview', 'Overview'), style) + '<div style="font-size:14px;color:rgba(232,213,168,.82);line-height:2;margin-bottom:24px;">' + esc(it.overview) + '</div>' : '') +
          (hi.length ? pdfSectionHdr(L(it, 'highlights', 'Highlights'), style) + pdfHighlights(hi, style) : '') +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 2 — DAY-BY-DAY ══ */
          '<div class="pdf-page" style="background:' + bodyBg + ';display:flex;flex-direction:column;min-height:880px;">' +
          pageHeader(it) +
          '<div style="padding:30px 42px 20px;flex:1;">' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;border-bottom:1px solid ' + divC + ';padding-bottom:8px;">' + esc(L(it, 'dayByDay', 'Day-by-Day Programme')) + '</div>' +
          pdfDaysHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          /* ══ PAGE 3 — INCLUSIONS + PRICING (OWN PAGE) ══ */
          '<div class="pdf-page" style="background:' + bodyBg + ';display:flex;flex-direction:column;">' +
          pageHeader(it) +
          '<div style="padding:30px 42px 28px;flex:1;">' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;border-bottom:1px solid ' + divC + ';padding-bottom:8px;">' + esc(L(it, 'whatsIncluded', "What\\'s Included")) + '</div>' +
          pdfInclExcl(incl, excl, style, it) +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';margin-bottom:24px;margin-top:10px;border-bottom:1px solid ' + divC + ';padding-bottom:8px;">' + esc(L(it, 'pricing', 'Pricing')) + '</div>' +
          pricingTableHTML(it, style) +
          '</div>' +
          pageFooter(it) +
          '</div>' +

          '</div></body></html>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 4 — Improved pricingTableHTML with bigger fonts
   ───────────────────────────────────────────────── */
const newPricingTable = `function pricingTableHTML(it, style) {
        const pt = safeJSON(it.pricing_table, []);
        const surcharges = safeJSON(it.surcharges, []);
        if (!pt.length && !it.single_supplement && !surcharges.length && !it.pricing_notes) return '';
        const isDark = style === 'bold';
        const cur = it.price_currency || 'USD';
        const sym = { USD: '$', EUR: '€', GBP: '£', TZS: 'TSh' }[cur] || '$';
        const bg     = isDark ? 'rgba(0,0,0,.2)' : '#F7F2EA';
        const bdr    = isDark ? 'rgba(241,146,51,.2)' : 'rgba(241,146,51,.25)';
        const cellC  = isDark ? 'rgba(232,213,168,.85)' : '#3C2414';
        const hdrBg  = isDark ? '#3C2414' : '#3C2414';
        const hdrC   = '#FFFFFF';
        const altRow = isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.65)';
        let html = '<div style="margin-bottom:24px;background:' + bg + ';border:1px solid ' + bdr + ';border-radius:3px;overflow:hidden;">';
        if (pt.length) {
          html += '<table style="width:100%;border-collapse:collapse;">';
          html += '<thead><tr>';
          html += '<th style="background:' + hdrBg + ';color:' + hdrC + ';font-family:\\'Oswald\\',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;text-align:left;">' + esc(L(it, 'package', 'Package')) + '</th>';
          html += '<th style="background:' + hdrBg + ';color:' + hdrC + ';font-family:\\'Oswald\\',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;text-align:center;">' + esc(L(it, 'pax', 'Pax')) + '</th>';
          html += '<th style="background:' + hdrBg + ';color:' + hdrC + ';font-family:\\'Oswald\\',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;text-align:right;">' + esc(L(it, 'pricePerPerson', 'Price / Person')) + ' (' + cur + ')</th>';
          html += '<th style="background:' + hdrBg + ';color:' + hdrC + ';font-family:\\'Oswald\\',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:10px 14px;text-align:right;">' + esc(L(it, 'total', 'Total')) + ' (' + cur + ')</th>';
          html += '</tr></thead><tbody>';
          pt.forEach(function(r, i) {
            const rowBg = i % 2 === 0 ? altRow : 'transparent';
            html += '<tr style="background:' + rowBg + '">';
            html += '<td style="padding:10px 14px;font-size:13px;color:' + cellC + ';font-weight:600;">' + esc(r.package) + '</td>';
            html += '<td style="padding:10px 14px;font-size:13px;color:' + cellC + ';text-align:center;">' + r.pax + '</td>';
            html += '<td style="padding:10px 14px;font-size:13px;color:' + cellC + ';text-align:right;">' + sym + Number(r.price_per_person || 0).toLocaleString() + '</td>';
            html += '<td style="padding:10px 14px;font-size:14px;color:' + (isDark ? '#F19233' : '#3C2414') + ';font-weight:700;text-align:right;">' + sym + Number(r.total || 0).toLocaleString() + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table>';
        }
        const extras = [];
        if (it.single_supplement)
          extras.push('<span style="font-size:13px;">' + esc(L(it, 'singleSupplement', 'Single Supplement')) + ': <strong>' + sym + Number(it.single_supplement).toLocaleString() + '</strong></span>');
        surcharges.forEach(function(s) {
          if (s.label)
            extras.push('<span style="font-size:13px;">' + esc(s.label) + ': <strong>' + sym + Number(s.amount || 0).toLocaleString() + '</strong></span>');
        });
        if (extras.length)
          html += '<div style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:16px;color:' + cellC + ';border-top:1px solid ' + bdr + ';">' + extras.join('') + '</div>';
        if (it.pricing_notes)
          html += '<div style="padding:12px 14px;font-size:13px;color:' + cellC + ';border-top:1px solid ' + bdr + ';font-style:italic;line-height:1.7;">' + esc(it.pricing_notes) + '</div>';
        html += '</div>';
        return html;
      }`;

/* ─────────────────────────────────────────────────
   PATCH 5 — Better font sizes in pdfHighlights
   ───────────────────────────────────────────────── */
const newHighlights = `function pdfHighlights(hi, style) {
        if (!hi.length) return '';
        const isDark = style === 'bold';
        const itemC = isDark ? 'rgba(232,213,168,.85)' : '#5C3E22';
        const dotC  = '#F19233';
        return (
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin-bottom:22px;">' +
          hi.map(h =>
            '<div style="font-size:13px;color:' + itemC + ';display:flex;align-items:flex-start;gap:8px;line-height:1.65;">' +
            '<span style="color:' + dotC + ';font-size:9px;margin-top:4px;flex-shrink:0;">★</span>' +
            esc(h) + '</div>'
          ).join('') +
          '</div>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 6 — Better font sizes in pdfInclExcl
   ───────────────────────────────────────────────── */
const newInclExcl = `function pdfInclExcl(incl, excl, style, it) {
        it = it || {};
        if (!incl.length && !excl.length) return '';
        const isDark = style === 'bold';
        const titleC  = isDark ? '#E8D5A8' : '#3C2414';
        const itemC   = isDark ? 'rgba(232,213,168,.82)' : '#5C3E22';
        const inclDot = isDark ? '#6ac97c' : '#27ae60';
        const exclDot = isDark ? '#e07676' : '#c0392b';
        const bgC     = isDark ? 'rgba(0,0,0,.15)' : 'rgba(241,146,51,.05)';
        const bdrC    = isDark ? 'rgba(241,146,51,.12)' : 'rgba(241,146,51,.18)';
        return (
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:20px;background:' + bgC + ';border:1px solid ' + bdrC + ';border-radius:4px;margin-bottom:26px;">' +
          (incl.length ?
            '<div>' +
            '<div style="font-family:\\'Oswald\\',sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:' + inclDot + ';border-bottom:1.5px solid ' + inclDot + '44;padding-bottom:7px;margin-bottom:14px;">✓ ' + esc(L(it, 'included', 'Included')) + '</div>' +
            incl.map(i =>
              '<div style="font-size:13px;color:' + itemC + ';margin-bottom:7px;display:flex;gap:8px;align-items:flex-start;line-height:1.6;">' +
              '<span style="color:' + inclDot + ';font-size:9px;margin-top:3px;flex-shrink:0;">✓</span>' + esc(i) + '</div>'
            ).join('') +
            '</div>' : ''
          ) +
          (excl.length ?
            '<div>' +
            '<div style="font-family:\\'Oswald\\',sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:' + exclDot + ';border-bottom:1.5px solid ' + exclDot + '44;padding-bottom:7px;margin-bottom:14px;">✗ ' + esc(L(it, 'notIncluded', 'Not Included')) + '</div>' +
            excl.map(i =>
              '<div style="font-size:13px;color:' + itemC + ';margin-bottom:7px;display:flex;gap:8px;align-items:flex-start;line-height:1.6;">' +
              '<span style="color:' + exclDot + ';font-size:9px;margin-top:3px;flex-shrink:0;">✗</span>' + esc(i) + '</div>'
            ).join('') +
            '</div>' : ''
          ) +
          '</div>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 7 — Better font sizes in pdfDaysHTML
   ───────────────────────────────────────────────── */
const newDaysHTML = `function pdfDaysHTML(it, style) {
        const days = safeJSON(it.days, []);
        if (!days.length)
          return '<p style="color:#aaa;font-style:italic;font-size:14px;padding:18px 0;">' + esc(L(it, 'noDays', 'No itinerary days added.')) + '</p>';
        const isDark = style === 'bold';
        const divCol = isDark ? 'rgba(241,146,51,.1)' : 'rgba(241,146,51,.18)';
        return days.map(function(d, di) {
          const acts = (d.activities || []).join(' · ');
          const galPhotos  = resolveGalPhotos(d.gallery_photos || []);
          const accomImgs  = d.accommodation_images || [];
          const destMosaic = buildDestMosaicHTML(galPhotos);
          const accomBlock = buildAccomBlockHTML(d.accommodation_id, d.accommodation_name, d.meal_plan, accomImgs, style, d);
          const badgeBg = isDark ? '#F19233' : '#3C2414';
          const badgeC  = isDark ? '#3C2414' : '#F19233';
          const titleC  = isDark ? '#E8D5A8' : '#3C2414';
          const locC    = '#F19233';
          const txtC    = isDark ? 'rgba(232,213,168,.82)' : '#3C2414';
          const metaC   = isDark ? 'rgba(241,146,51,.65)' : '#8B6244';
          return (
            '<div class="day-block" style="margin-bottom:' + (di < days.length - 1 ? '36px' : '0') + ';padding-bottom:' + (di < days.length - 1 ? '36px' : '0') + ';border-bottom:' + (di < days.length - 1 ? '1px solid ' + divCol : 'none') + ';">' +
            '<div class="page-hdr" style="display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap;">' +
            '<div style="background:' + badgeBg + ';color:' + badgeC + ';font-family:\\'Oswald\\',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;white-space:nowrap;border-radius:2px;">' + esc(L(it, 'day', 'Day')) + ' ' + d.day + '</div>' +
            (d.title ? '<div style="font-family:\\'Oswald\\',sans-serif;font-size:20px;font-weight:600;color:' + titleC + ';letter-spacing:.5px;">' + esc(d.title) + '</div>' : '') +
            (d.location ? '<div style="font-size:13px;color:' + locC + ';letter-spacing:.5px;text-transform:uppercase;display:flex;align-items:center;gap:5px;"><span style="font-size:8px;color:rgba(241,146,51,.5);">●</span>' + esc(d.location) + '</div>' : '') +
            '</div>' +
            (d.route || d.driving_hours ?
              '<div style="display:flex;gap:22px;font-size:13px;color:' + metaC + ';margin-bottom:12px;flex-wrap:wrap;">' +
              (d.route ? '<span style="display:flex;align-items:center;gap:6px;"><span style="color:' + locC + ';">→</span>' + esc(d.route) + '</span>' : '') +
              (d.driving_hours ? '<span>🚗 ' + d.driving_hours + 'h ' + esc(L(it, 'drive', 'drive')) + '</span>' : '') +
              '</div>' : '') +
            (d.description ? '<div style="font-size:14px;color:' + txtC + ';line-height:1.95;margin-bottom:12px;">' + esc(d.description) + '</div>' : '') +
            (acts ? '<div style="font-size:13px;color:' + metaC + ';margin-bottom:10px;font-weight:600;">◈ ' + esc(acts) + '</div>' : '') +
            destMosaic +
            accomBlock +
            '</div>'
          );
        }).join('');
      }`;

/* ─────────────────────────────────────────────────
   PATCH 8 — Larger overview / body text in pdfWelcomePage
   ───────────────────────────────────────────────── */
const newWelcomePage = `function pdfWelcomePage(it, style) {
        const wl = safeJSON(it.welcome_letter, {});
        const hasContent = wl.body || wl.greeting || wl.signature;
        const welcomeHero = wl.hero_image || it.hero_image || '';
        if (!hasContent && !welcomeHero && !it.title) return '';
        const isDark = style === 'bold';
        const pageBg = isDark ? '#2E3B2E' : '#FAF7F0';
        const gold   = '#F19233';
        const titleC = isDark ? '#FFFFFF'  : '#3C2414';
        const bodyC  = isDark ? 'rgba(232,213,168,.85)' : '#3C2414';
        const subC   = isDark ? 'rgba(241,146,51,.55)'  : 'rgba(100,70,40,.55)';
        const divC   = isDark ? 'rgba(241,146,51,.2)'   : 'rgba(241,146,51,.3)';
        return (
          '<div class="pdf-page" style="background:' + pageBg + ';min-height:880px;display:flex;flex-direction:column;">' +
          '<div style="position:absolute;left:0;top:0;bottom:0;width:5px;background:' + gold + ';z-index:2;"></div>' +
          (welcomeHero ?
            '<div style="position:relative;height:300px;overflow:hidden;flex-shrink:0;">' +
            '<img src="' + esc(welcomeHero) + '" style="width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.72);" onerror="this.style.display=\\'none\\'"/>' +
            '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.25) 0%,' + (isDark ? 'rgba(46,59,46,.7)' : 'rgba(250,247,240,.6)') + ' 100%);"></div>' +
            '<div style="position:absolute;top:20px;left:42px;z-index:2;">' + logoHeaderHTML(it) + '</div>' +
            (it.title ?
              '<div style="position:absolute;bottom:0;left:0;right:0;padding:22px 52px 26px;background:linear-gradient(transparent,rgba(0,0,0,.72));z-index:2;">' +
              '<div style="font-family:\\'Oswald\\',sans-serif;font-size:28px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff;line-height:1.15;">' + esc(it.title) + '</div>' +
              (it.client_name ? '<div style="font-size:14px;color:rgba(232,213,168,.85);margin-top:6px;">' + esc(L(it, 'preparedExclusively', 'Prepared exclusively for')) + ' <strong>' + esc(it.client_name) + '</strong></div>' : '') +
              '</div>' : '') +
            '</div>'
            :
            '<div style="padding:28px 52px 28px;border-bottom:1px solid ' + divC + ';flex-shrink:0;">' +
            '<div style="margin-bottom:22px;">' + logoHeaderHTML(it) + '</div>' +
            (it.title ? '<div style="font-family:\\'Oswald\\',sans-serif;font-size:28px;font-weight:700;color:' + titleC + ';text-transform:uppercase;letter-spacing:1px;">' + esc(it.title) + '</div>' : '') +
            '</div>'
          ) +
          '<div style="padding:32px 52px 40px;flex:1;display:flex;flex-direction:column;justify-content:space-between;">' +
          '<div>' +
          '<div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">' +
          '<div style="width:32px;height:1.5px;background:' + gold + ';flex-shrink:0;"></div>' +
          '<div style="font-family:\\'Oswald\\',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:' + gold + ';">' + esc(L(it, 'personalWelcome', 'A Personal Welcome')) + '</div>' +
          '<div style="flex:1;height:1px;background:' + divC + ';"></div>' +
          '</div>' +
          (wl.greeting ?
            '<div style="font-family:\\'Oswald\\',sans-serif;font-size:18px;font-weight:500;color:' + titleC + ';margin-bottom:18px;letter-spacing:.3px;">' + esc(wl.greeting) + '</div>' : '') +
          (wl.body ?
            '<div style="font-size:14px;line-height:2.05;color:' + bodyC + ';max-width:540px;white-space:pre-line;">' + esc(wl.body) + '</div>' : '') +
          '</div>' +
          '<div style="margin-top:30px;">' +
          '<div style="width:42px;height:1.5px;background:' + gold + ';margin-bottom:16px;"></div>' +
          (wl.closing ? '<div style="font-size:13px;color:' + subC + ';margin-bottom:6px;font-style:italic;">' + esc(wl.closing) + '</div>' : '') +
          (wl.signature ? '<div style="font-family:\\'Oswald\\',sans-serif;font-size:16px;font-weight:600;color:' + (isDark ? gold : titleC) + ';letter-spacing:.5px;">' + esc(wl.signature) + '</div>' : '') +
          (wl.date_line ? '<div style="font-size:10px;color:' + subC + ';letter-spacing:1.5px;text-transform:uppercase;margin-top:6px;">' + esc(wl.date_line) + '</div>' : '') +
          '<div style="margin-top:26px;font-size:34px;opacity:.08;color:' + gold + ';user-select:none;">✦</div>' +
          '</div></div></div>'
        );
      }`;

/* ─────────────────────────────────────────────────
   PATCH 9 — Update pdfHead for better print CSS
   ───────────────────────────────────────────────── */
const newPdfHead = `function pdfHead(title, bgColor, lang) {
        lang = lang || 'en';
        bgColor = bgColor || '#FAF7F0';
        const outerBg = bgColor === '#2E3B2E' ? '#1a2a1a' : '#E8DCC8';
        return (
          '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="UTF-8"/><title>' + esc(title) + '</title>' +
          '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>' +
          '<style>' +
          '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}' +
          'html{font-size:16px;background:' + outerBg + '}' +
          "body{font-family:'Montserrat',sans-serif;background:" + outerBg + ';min-height:100vh;padding:32px 0 60px;}' +
          '.pdf-wrap{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:0;box-shadow:0 8px 48px rgba(0,0,0,.28)}' +
          '.pdf-page{background:#fff;width:100%;position:relative;}' +
          '@media print{' +
          '@page{margin:12mm 10mm 12mm 10mm;size:A4 portrait}' +
          'html,body{background:#fff!important;padding:0!important}' +
          'body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}' +
          '.pdf-wrap{max-width:none!important;margin:0!important;box-shadow:none!important;}' +
          '.pdf-page{width:100%!important;page-break-after:always;break-after:page;}' +
          '.pdf-page:last-child{page-break-after:auto;break-after:auto;}' +
          '.no-print{display:none!important}' +
          '.day-block{page-break-inside:avoid;break-inside:avoid}' +
          '.accom-block{page-break-inside:avoid;break-inside:avoid}' +
          '.section-block{page-break-inside:avoid;break-inside:avoid}' +
          '.page-hdr{page-break-after:avoid;break-after:avoid}' +
          '}' +
          '.no-print{position:fixed;top:20px;right:24px;z-index:9999;display:flex;gap:10px;align-items:center}' +
          '.pdf-print-btn{background:#F19233;color:#fff;border:none;padding:10px 22px;font-family:\\'Oswald\\',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .2s}' +
          '.pdf-print-btn:hover{background:#3C2414}' +
          ".pdf-print-btn svg{width:15px;height:15px;fill:currentColor}" +
          '</style></head><body>' +
          '<div class="no-print"><button class="pdf-print-btn" onclick="window.print()"><svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>Print / Save PDF</button></div>' +
          '<div class="pdf-wrap">'
        );
      }`;

// ── Apply patches ──────────────────────────────────────────────────────────

function replaceFn(source, fnName, newFnBody) {
  // Match: "function fnName(" through the matching closing "}"
  // We'll use a simple brace-counter approach embedded in regex + manual scan
  const startMarker = 'function ' + fnName + '(';
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) {
    console.warn(`⚠️  Could not find function: ${fnName}`);
    return source;
  }
  // Find the opening brace
  let braceStart = source.indexOf('{', startIdx);
  if (braceStart === -1) return source;
  let depth = 1;
  let i = braceStart + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  const before = source.slice(0, startIdx);
  const after  = source.slice(i);
  console.log(`✅  Patched function: ${fnName}`);
  return before + newFnBody + after;
}

html = replaceFn(html, 'pdfHead',          newPdfHead);
html = replaceFn(html, 'pdfWelcomePage',   newWelcomePage);
html = replaceFn(html, 'pdfHighlights',    newHighlights);
html = replaceFn(html, 'pdfInclExcl',      newInclExcl);
html = replaceFn(html, 'pricingTableHTML', newPricingTable);
html = replaceFn(html, 'pdfDaysHTML',      newDaysHTML);
html = replaceFn(html, 'pdfStyleClassic',  newClassic);
html = replaceFn(html, 'pdfStyleMinimal',  newMinimal);
html = replaceFn(html, 'pdfStyleBold',     newBold);

fs.writeFileSync(outputFile, html, 'utf8');
console.log(`\n🎉  Done!  Output → ${outputFile}`);
PATCHEOF

