# FAQ — MISC Pro Frequently Asked Questions

## Calculations

**Q: Why is my total cost showing $0.00?**
A: You need to click "Run Estimation" button in the estimation module header. The total only updates after you explicitly run the calculation. If it's still $0, make sure you have entered all required fields (stringer size, rail type, rail length, etc.).

**Q: Why doesn't the calculation update when I change a value?**
A: Individual field previews (the grey read-only values) update automatically in real-time as you type. The Calculation Summary at the bottom updates only when you click "Run Estimation".

**Q: What does scrap factor mean?**
A: Scrap factor is the percentage of extra steel to order to account for cutting waste. At the default 10%, if your project needs 100 lbs of steel, the system adds 10 lbs for waste, so the total billed is 110 lbs.

**Q: How do I change the steel price for just one project without affecting others?**
A: Click the "Rates" button (or "Custom Rates Active" if already overridden) in the estimation module header. Set your project-specific rate in the "Local Pricing Overrides" modal. These rates apply only to this project.

**Q: Why is intermediate rails set automatically?**
A: The Suggestion Engine auto-sets intermediate rails to (Lines − 1). A 2-Line rail has 1 intermediate rail; a 3-Line has 2. You can override this manually in the Intermediate Rails field.

**Q: Tax rate is always showing 6% — how do I change it?**
A: Admins can change the global tax rate in Settings → Pricing Settings. Estimators can set a project-specific tax rate in the Local Pricing Overrides modal.

## Projects

**Q: How do I find a project?**
A: Use the sidebar search (🔍 icon) or go to Projects and use the search/filter bar at the top.

**Q: Can I duplicate a project?**
A: Yes. Right-click (or use the 3-dot menu) on any project in the list. Select "Duplicate". This creates a copy with a new project number.

**Q: How do I delete a project?**
A: Open the project in the Project Detail page. Use the 3-dot menu in the header → "Archive Project". Projects are never hard-deleted.

**Q: What is "Use Details" in the Matching Projects history?**
A: When you type a project name, the system shows past projects with similar names. "Use Details" copies that project's stakeholder info (customer, location, AISC cert, etc.) into your new project as a starting template.

**Q: How do I go to the estimation module for a specific project?**
A: Open the project in Project Detail. Click the "Go to Estimation Module" button at the bottom. This saves any changes and takes you directly to the Stair & Railings calculator pre-loaded with that project's data.

## Workflow

**Q: Who can change the project status?**
A: The workflow action bar shows available transitions. Estimators can move their own projects from Assigned → In Progress → Review. Admins can move projects through all stages.

**Q: I submitted a project by mistake — can I revert it?**
A: Yes, admins can reopen a submitted project. Contact your admin to move the project back to Review status.

**Q: What triggers a notification?**
A: Notifications are sent when: you are assigned to a project, a project you created is moved to Review status, and when someone comments on your project.

## Reports & Export

**Q: My Excel BOM has blank cost columns — why?**
A: The estimation has not been run. Go to the estimation module and click "Run Estimation". Then try the Excel export again.

**Q: Can I export to PDF?**
A: Yes. Use the printer/export icon in the main header. Select "Print PDF" to open a print-ready report. Use Ctrl+P in your browser to save as PDF.

**Q: How do I export the BOM Excel file?**
A: In the Stair & Railings or Railings estimation module, click the "Excel BOM" button in the header actions bar.
