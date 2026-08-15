import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import ExcelJS from "exceljs";

const databasePath = resolve("data/applications.sqlite");
const outputPath = resolve("reports/application-log.xlsx");

const db = new DatabaseSync(databasePath);

const query = `
  SELECT *
  FROM application_log
  ORDER BY occurred_at DESC
`;

try {
  const rows = db.prepare(query).all() as Record<string, unknown>[];

  console.log(`Found ${rows.length} rows`);

  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // Create worksheet
  const worksheet = workbook.addWorksheet("Application Log");

  if (rows.length > 0) {
    // Get column names from the first row
    const columns = Object.keys(rows[0]);

    // Add columns
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
      width: 20,
    }));

    // Add rows
    for (const row of rows) {
      if (typeof row.reasons === "string") {
    try {
      const reasons = JSON.parse(row.reasons);

      if (Array.isArray(reasons)) {
        row.reasons = reasons.join(", ");
      }
    } catch {
      // Keep original value if it isn't valid JSON
    }
  }
      worksheet.addRow(row);
    }
  }

  // Format header
  const headerRow = worksheet.getRow(1);

  headerRow.font = {
    bold: true,
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  headerRow.height = 25;

  // Freeze the header row
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  // Automatically adjust column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;

    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const value = cell.value;

      if (value !== null && value !== undefined) {
        maxLength = Math.max(
          maxLength,
          String(value).length
        );
      }
    });

    column.width = Math.min(Math.max(maxLength + 2, 12), 50);
  });

  // Make reasons column wider
  const reasonsColumn = worksheet.getColumn("reasons");

  if (reasonsColumn) {
    reasonsColumn.width = 60;
  }

  // Save Excel file
  await workbook.xlsx.writeFile(outputPath);

  console.log(`Excel file created: ${outputPath}`);
} catch (error) {
  console.error("\nExport failed:");
  console.error(error);
} finally {
  db.close();
}