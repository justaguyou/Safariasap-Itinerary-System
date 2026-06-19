#!/usr/bin/env python3
"""
Run this in the same folder as admin.html:
    python3 fix_admin.py

It replaces the broken showSection function with the corrected version.
"""

import re, sys, shutil, os

TARGET = "dashboard.html"

if not os.path.exists(TARGET):
    print(f"ERROR: {TARGET} not found in current directory.")
    sys.exit(1)

shutil.copy(TARGET, TARGET + ".bak")
print(f"Backup saved as {TARGET}.bak")

with open(TARGET, "r", encoding="utf-8") as f:
    html = f.read()

# ── Pattern: match the entire showSection function (broken version) ──
pattern = re.compile(
    r"function showSection\(name\)\s*\{.*?\n      \}",
    re.DOTALL
)

replacement = """function showSection(name) {
        document
          .querySelectorAll(".page-section")
          .forEach((s) => s.classList.remove("active"));
        document.querySelectorAll(".nav-item").forEach((n) => {
          if (n.getAttribute("onclick")?.includes("'" + name + "'"))
            n.classList.add("active");
          else
            n.classList.remove("active");
        });
        document.getElementById("sec-" + name)?.classList.add("active");
        if (name === "itineraries") renderItinTable(allItins);
        if (name === "destinations") renderDestCards(allDests);
        if (name === "accommodations") renderAccomCards(allAccoms);
        if (name === "gallery") renderGalGrid();
        if (name === "invoices") { renderInvoiceTable(allInvoices); updateInvoiceStats(); }
        if (name === "costs") { renderCostTable(allCosts); }
      }"""

match = pattern.search(html)
if not match:
    print("ERROR: Could not locate showSection function. The file may already be patched or the format differs.")
    print("Apply the fix manually — see instructions below.")
    print()
    print("Find this block in admin.html:")
    print("  function showSection(name) {")
    print()
    print("Replace the entire function with:")
    print(replacement)
    sys.exit(1)

fixed = html[:match.start()] + replacement + html[match.end():]

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(fixed)

print("SUCCESS: showSection function fixed in admin.html")
print("The broken .forEach chain has been corrected.")