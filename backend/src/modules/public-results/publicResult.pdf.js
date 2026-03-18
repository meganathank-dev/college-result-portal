import PDFDocument from "pdfkit";

const COLORS = {
  primary: "#5F2D86",
  border: "#BFC7D1",
  text: "#111111",
  muted: "#666666",
  white: "#FFFFFF",
  lightRow: "#FAFAFA",
  headerGray: "#D9D9D9",
};

const PAGE = {
  width: 595.28,
  left: 40,
  right: 40,
  top: 35,
  usableWidth: 595.28 - 80,
};

const safe = (value) =>
  value === undefined || value === null || value === "" ? "-" : String(value);

const semesterToYear = (semesterNumber) => {
  if (!semesterNumber || Number.isNaN(Number(semesterNumber))) return "-";
  return Math.ceil(Number(semesterNumber) / 2);
};

const drawBox = (doc, x, y, width, height, radius = 4) => {
  doc.save();
  doc
    .lineWidth(0.8)
    .strokeColor(COLORS.border)
    .roundedRect(x, y, width, height, radius)
    .stroke();
  doc.restore();
};

const drawFilledHeader = (doc, text, x, y, width, height = 22) => {
  doc.save();
  doc.roundedRect(x, y, width, height, 4).fill(COLORS.primary);
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(text, x, y + 6, {
      width,
      align: "center",
    });

  doc.fillColor(COLORS.text);
};

const drawKVRow = (
  doc,
  label,
  value,
  x,
  y,
  labelWidth = 140,
  valueWidth = 330,
) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(label, x, y, {
      width: labelWidth,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(safe(value), x + labelWidth, y, {
      width: valueWidth,
    });
};

const buildTitleLine = (examSession, summary) => {
  const semLabel = summary?.semester?.label?.toUpperCase() || "SEMESTER";
  const year = examSession?.examYear || "";
  const month = examSession?.examMonth
    ? String(examSession.examMonth).replace(/_/g, " ")
    : "";
  return `RESULTS OF ${semLabel} : [${year} - ${month}]`;
};

export const buildPublishedResultPdf = ({ resultData, collegeName }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "portrait",
        margin: 40,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const { student, examSession, subjectResults, summary, arrearSummary } =
        resultData;

      let y = PAGE.top;

      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(COLORS.text)
        .text(collegeName, PAGE.left, y, {
          width: PAGE.usableWidth,
          align: "center",
        });

      y += 24;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("GRADE SHEET", PAGE.left, y, {
          width: PAGE.usableWidth,
          align: "center",
        });

      y += 18;

      drawFilledHeader(
        doc,
        buildTitleLine(examSession, summary),
        PAGE.left,
        y,
        PAGE.usableWidth,
        24,
      );
      y += 34;

      // Student Details
      drawFilledHeader(
        doc,
        "STUDENT DETAILS",
        PAGE.left,
        y,
        PAGE.usableWidth,
        22,
      );
      y += 22;

      const detailsHeight = 175;
      drawBox(doc, PAGE.left, y, PAGE.usableWidth, detailsHeight);

      let rowY = y + 12;
      const rowGap = 15;

      drawKVRow(
        doc,
        "Register Number",
        student.registerNumber,
        PAGE.left + 12,
        rowY,
      );
      rowY += rowGap;
      drawKVRow(doc, "Student Name", student.fullName, PAGE.left + 12, rowY);
      rowY += rowGap;
      drawKVRow(
        doc,
        "Department",
        student.department?.name,
        PAGE.left + 12,
        rowY,
      );
      rowY += rowGap;
      drawKVRow(doc, "Program", student.program?.name, PAGE.left + 12, rowY);
      rowY += rowGap;
      drawKVRow(
        doc,
        "Regulation",
        student.regulation?.name,
        PAGE.left + 12,
        rowY,
      );
      rowY += rowGap;
      drawKVRow(doc, "Batch", student.batch?.label, PAGE.left + 12, rowY);
      rowY += rowGap;
      drawKVRow(
        doc,
        "Current Semester",
        student.currentSemester?.label,
        PAGE.left + 12,
        rowY,
      );
      rowY += rowGap;
      drawKVRow(
        doc,
        "Exam Session",
        `${safe(examSession?.name)} ${examSession?.examYear ? `(${examSession.examYear})` : ""}`.trim(),
        PAGE.left + 12,
        rowY,
      );
      rowY += rowGap;
      drawKVRow(doc, "GPA", summary?.gpa ?? 0, PAGE.left + 12, rowY);
      rowY += rowGap;
      drawKVRow(doc, "CGPA", summary?.cgpa ?? 0, PAGE.left + 12, rowY);

      y += detailsHeight + 16;

      // Subject Table
      drawFilledHeader(
        doc,
        "SUBJECT-WISE GRADE DETAILS",
        PAGE.left,
        y,
        PAGE.usableWidth,
        22,
      );
      y += 24;

      const tableX = PAGE.left;
      const tableWidth = PAGE.usableWidth;

      const columns = [
        { key: "sem", label: "Sem", x: tableX, width: 28, align: "center" },
        {
          key: "year",
          label: "Year",
          x: tableX + 28,
          width: 32,
          align: "center",
        },
        {
          key: "subjectCode",
          label: "Code",
          x: tableX + 60,
          width: 58,
          align: "center",
        },
        {
          key: "subjectName",
          label: "Name of the Course",
          x: tableX + 118,
          width: 224,
          align: "left",
        },
        {
          key: "credits",
          label: "Cr",
          x: tableX + 342,
          width: 34,
          align: "center",
        },
        {
          key: "result",
          label: "Result",
          x: tableX + 376,
          width: 42,
          align: "center",
        },
        {
          key: "grade",
          label: "Grade",
          x: tableX + 418,
          width: 48,
          align: "center",
        },
        {
          key: "gradePoint",
          label: "GP",
          x: tableX + 466,
          width: 49,
          align: "center",
        },
      ];

      doc.save();
      doc.rect(tableX, y, tableWidth, 24).fill(COLORS.headerGray);
      doc.restore();

      doc.font("Helvetica-Bold").fontSize(8.2);
      columns.forEach((col) => {
        doc.text(col.label, col.x + 2, y + 7, {
          width: col.width - 4,
          align: col.align,
        });
      });

      doc.save();
      doc.lineWidth(0.6).strokeColor(COLORS.border);
      doc.rect(tableX, y, tableWidth, 24).stroke();
      columns.slice(1).forEach((col) => {
        doc
          .moveTo(col.x, y)
          .lineTo(col.x, y + 24)
          .stroke();
      });
      doc.restore();

      y += 24;
      doc.font("Helvetica").fontSize(8.3);

      subjectResults.forEach((item, index) => {
        const row = {
          sem: item.sourceSemester?.number ?? "-",
          year: semesterToYear(item.sourceSemester?.number),
          subjectCode: item.subjectCode || "-",
          subjectName: item.subjectName || "-",
          credits: Number(item.credits || 0).toFixed(2),
          result: item.result || "-",
          grade: item.grade || "-",
          gradePoint: Number(item.gradePoint || 0).toFixed(2),
        };

        const subjectHeight = Math.max(
          22,
          doc.heightOfString(row.subjectName, { width: 216 }) + 8,
        );
        if (index % 2 === 0) {
          doc.save();
          doc.rect(tableX, y, tableWidth, subjectHeight).fill(COLORS.lightRow);
          doc.restore();
        }

        doc.save();
        doc.lineWidth(0.5).strokeColor(COLORS.border);
        doc.rect(tableX, y, tableWidth, subjectHeight).stroke();
        columns.slice(1).forEach((col) => {
          doc
            .moveTo(col.x, y)
            .lineTo(col.x, y + subjectHeight)
            .stroke();
        });
        doc.restore();

        columns.forEach((col) => {
          const topPad = col.key === "subjectName" ? 5 : 7;
          doc.text(String(row[col.key]), col.x + 2, y + topPad, {
            width: col.width - 4,
            align: col.align,
          });
        });

        y += subjectHeight;
      });

      y += 18;

      // Summary
      drawFilledHeader(
        doc,
        "RESULT SUMMARY",
        PAGE.left,
        y,
        PAGE.usableWidth,
        22,
      );
      y += 22;

      const summaryHeight = 96;
      drawBox(doc, PAGE.left, y, PAGE.usableWidth, summaryHeight);

      let sy = y + 12;
      const leftX = PAGE.left + 12;
      const rightX = PAGE.left + 270;

      drawKVRow(
        doc,
        "Registered Subjects",
        summary?.totalRegisteredSubjects ?? 0,
        leftX,
        sy,
        120,
        80,
      );
      drawKVRow(
        doc,
        "Passed Subjects",
        summary?.totalPassedSubjects ?? 0,
        rightX,
        sy,
        110,
        60,
      );

      sy += 15;
      drawKVRow(
        doc,
        "Failed Subjects",
        summary?.totalFailedSubjects ?? 0,
        leftX,
        sy,
        120,
        80,
      );
      drawKVRow(
        doc,
        "Registered Credits",
        summary?.totalRegisteredCredits ?? 0,
        rightX,
        sy,
        110,
        60,
      );

      sy += 15;
      drawKVRow(
        doc,
        "Earned Credits",
        summary?.totalEarnedCredits ?? 0,
        leftX,
        sy,
        120,
        80,
      );
      drawKVRow(
        doc,
        "Pending Arrears",
        arrearSummary?.totalPendingArrears ?? 0,
        rightX,
        sy,
        110,
        60,
      );

      sy += 15;
      drawKVRow(
        doc,
        "Cleared Arrears",
        arrearSummary?.totalClearedArrears ?? 0,
        leftX,
        sy,
        120,
        80,
      );
      drawKVRow(doc, "GPA", summary?.gpa ?? 0, rightX, sy, 110, 60);

      sy += 15;
      drawKVRow(doc, "CGPA", summary?.cgpa ?? 0, leftX, sy, 120, 80);

      y += summaryHeight + 18;

      doc.save();
      doc
        .moveTo(PAGE.left, y)
        .lineTo(PAGE.left + PAGE.usableWidth, y)
        .strokeColor(COLORS.border)
        .stroke();
      doc.restore();

      y += 10;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          "This is a system-generated grade sheet. Marks are not displayed in the public copy.",
          PAGE.left,
          y,
          { width: PAGE.usableWidth, align: "center" },
        );

      y += 12;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, PAGE.left, y, {
        width: PAGE.usableWidth,
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
