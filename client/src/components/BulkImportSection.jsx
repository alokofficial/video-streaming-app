import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import API from "../services/api";

export default function BulkImportSection({ onSuccess }) {
  const [importType, setImportType] = useState("drive"); // "drive", "youtube", "pdf"
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [existingDbIds, setExistingDbIds] = useState(new Set());

  // Field constraints matching backend validation
  const FIELD_LIMITS = {
    title: 65,
    description: 150,
    driveFileId: 100,
  };

  const countLetters = (val) => String(val || "").trim().length;

  // Fetch existing IDs from DB to prevent duplicate display in preview grid
  const fetchExistingDbIds = async (type) => {
    let endpoint = "";
    if (type === "drive") {
      endpoint = "/videos";
    } else if (type === "youtube") {
      endpoint = "/youtube/export";
    } else if (type === "pdf") {
      endpoint = "/documents";
    }

    try {
      const response = await API.get(endpoint);
      const data = response.data;
      if (Array.isArray(data)) {
        const ids = data
          .map((item) => {
            if (type === "youtube") return String(item.videoId || "").trim();
            return String(item.driveFileId || "").trim();
          })
          .filter(Boolean);
        setExistingDbIds(new Set(ids));
      } else {
        setExistingDbIds(new Set());
      }
    } catch (err) {
      console.error("Failed to fetch existing database IDs:", err);
      setExistingDbIds(new Set());
    }
  };

  // Fetch existing IDs when type changes or on mount
  useEffect(() => {
    fetchExistingDbIds(importType);
  }, [importType]);

  // Flexible column mapper based on import type
  const normalizeRow = (rowObj) => {
    const normalized = {
      title: "",
      description: "",
      category: "",
      subheading: "",
      driveFileId: "",
      videoId: "",
      thumbnail: "",
      allowedEmails: "",
      qualities: "",
    };

    Object.entries(rowObj).forEach(([key, val]) => {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_/-]+/g, "");
      const cleanVal = String(val || "").trim();

      if (
        cleanKey === "title" ||
        cleanKey === "videotitle" ||
        cleanKey === "documenttitle" ||
        cleanKey === "pdftitle"
      ) {
        normalized.title = cleanVal;
      } else if (
        cleanKey === "drivefileid" ||
        cleanKey === "googlefileid" ||
        cleanKey === "fileid" ||
        cleanKey === "driveid" ||
        cleanKey === "googledrivefileid" ||
        cleanKey === "googledrivepdffileid"
      ) {
        normalized.driveFileId = cleanVal;
      } else if (
        cleanKey === "youtubevideoid" ||
        cleanKey === "videoid" ||
        cleanKey === "ytid" ||
        cleanKey === "youtubeid"
      ) {
        normalized.videoId = cleanVal;
      } else if (cleanKey === "description" || cleanKey === "desc") {
        normalized.description = cleanVal;
      } else if (cleanKey === "category" || cleanKey === "heading") {
        normalized.category = cleanVal;
      } else if (cleanKey === "subheading" || cleanKey === "sub") {
        normalized.subheading = cleanVal;
      } else if (
        cleanKey === "thumbnail" ||
        cleanKey === "thumbnailurl" ||
        cleanKey === "thumb"
      ) {
        normalized.thumbnail = cleanVal;
      } else if (
        cleanKey === "allowedemails" ||
        cleanKey === "emails" ||
        cleanKey === "visibletomailids" ||
        cleanKey === "visibletogroups"
      ) {
        normalized.allowedEmails = cleanVal;
      } else if (
        cleanKey === "qualities" ||
        cleanKey === "qualityoptions" ||
        cleanKey === "quality"
      ) {
        normalized.qualities = cleanVal;
      }
    });

    return normalized;
  };

  const parseQualitiesClient = (qualitiesStr) => {
    if (!qualitiesStr) return [];
    const parts = qualitiesStr.split(/[,\n]/);
    return parts
      .map((part) => {
        const [label, ...fileIdParts] = part.split(":");
        return {
          label: String(label || "").trim(),
          driveFileId: fileIdParts.join(":").trim(),
        };
      })
      .filter((q) => q.label && q.driveFileId);
  };

  // Row validator function depending on selected import type
  const validateRow = (row, processedSheetIds) => {
    const errors = [];

    // Title checks
    if (!row.title) {
      errors.push("Title is required");
    }

    if (importType === "drive") {
      // Google Drive Video checks
      const cleanId = String(row.driveFileId || "").trim();
      if (!cleanId) {
        errors.push("Google Drive File ID is required");
      } else {
        if (countLetters(cleanId) > FIELD_LIMITS.driveFileId) {
          errors.push(`Drive File ID exceeds maximum ${FIELD_LIMITS.driveFileId} characters`);
        }
        if (existingDbIds.has(cleanId)) {
          errors.push("Google Drive File ID already exists in library");
        }
        if (processedSheetIds.has(cleanId)) {
          errors.push("Duplicate Google Drive File ID in spreadsheet");
        }
        processedSheetIds.add(cleanId);
      }

      if (row.description && countLetters(row.description) > FIELD_LIMITS.description) {
        errors.push(`Description exceeds maximum ${FIELD_LIMITS.description} characters`);
      }

      const qualities = parseQualitiesClient(row.qualities);
      qualities.forEach((q) => {
        if (countLetters(q.driveFileId) > FIELD_LIMITS.driveFileId) {
          errors.push(`Quality '${q.label}' Drive File ID exceeds maximum ${FIELD_LIMITS.driveFileId} characters`);
        }
      });
    } else if (importType === "youtube") {
      // YouTube Video checks
      const cleanId = String(row.videoId || "").trim();
      if (!cleanId) {
        errors.push("YouTube Video ID is required");
      } else {
        if (existingDbIds.has(cleanId)) {
          errors.push("YouTube Video ID already exists in library");
        }
        if (processedSheetIds.has(cleanId)) {
          errors.push("Duplicate YouTube Video ID in spreadsheet");
        }
        processedVideoIdsCheck(cleanId, processedSheetIds);
      }
    } else if (importType === "pdf") {
      // PDF Document checks
      const cleanId = String(row.driveFileId || "").trim();
      if (!cleanId) {
        errors.push("Google Drive PDF File ID is required");
      } else {
        if (countLetters(cleanId) > FIELD_LIMITS.driveFileId) {
          errors.push(`Drive File ID exceeds maximum ${FIELD_LIMITS.driveFileId} characters`);
        }
        if (existingDbIds.has(cleanId)) {
          errors.push("PDF Document File ID already exists in library");
        }
        if (processedSheetIds.has(cleanId)) {
          errors.push("Duplicate PDF Document File ID in spreadsheet");
        }
        processedSheetIds.add(cleanId);
      }

      if (row.description && countLetters(row.description) > FIELD_LIMITS.description) {
        errors.push(`Description exceeds maximum ${FIELD_LIMITS.description} characters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const processedVideoIdsCheck = (id, processedSheetIds) => {
    processedSheetIds.add(id);
  };

  // Switch import type and clear previous file/data
  const handleTypeChange = (type) => {
    setImportType(type);
    setFile(null);
    setParsedData([]);
    setImportStatus(null);
  };

  // Generate and download Excel Template dynamically
  const handleDownloadTemplate = () => {
    let templateData = [];
    let columnWidths = [];

    if (importType === "drive") {
      templateData = [
        {
          "Video Title": "Introduction to React",
          "Google Drive File ID": "1ABCdefGHIjklMNOpqrsTUVwxyz123456",
          "Description": "A comprehensive introductory guide to React components and hooks.",
          "Category": "Web Development",
          "Subheading": "Module 1: React Basics",
          "Thumbnail URL": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
          "Allowed Emails": "student1@example.com, student2@example.com",
          "Qualities": "720p: 1a2b3c4d5e..., 1080p: 6f7g8h9i0j...",
        },
        {
          "Video Title": "Advanced Node.js Scaling",
          "Google Drive File ID": "1XYZabcDEFjklMNOpqrsTUVwxyz987654",
          "Description": "Deep dive into clustering, child processes, and thread pools in Node.js.",
          "Category": "Backend Engineering",
          "Subheading": "Module 4: Performance & Scaling",
          "Thumbnail URL": "",
          "Allowed Emails": "",
          "Qualities": "",
        }
      ];
      columnWidths = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 35 }, { wch: 45 }, { wch: 35 }];
    } else if (importType === "youtube") {
      templateData = [
        {
          "Video Title": "Learn Advanced CSS Grid",
          "YouTube Video ID": "35yX16T6Axs",
          "Category": "Frontend Development",
          "Subheading": "Module 2: Layouts",
          "Thumbnail URL": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400",
          "Allowed Emails": "designer@example.com, developer@example.com",
        },
        {
          "Video Title": "React 19 Futures",
          "YouTube Video ID": "dQw4w9WgXcQ",
          "Category": "Web Development",
          "Subheading": "Module 1: React Basics",
          "Thumbnail URL": "",
          "Allowed Emails": "",
        }
      ];
      columnWidths = [{ wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 35 }, { wch: 45 }];
    } else if (importType === "pdf") {
      templateData = [
        {
          "Document Title": "React Course Syllabus",
          "Google Drive PDF File ID": "1docABCdefGHIjklMNOpqrsTUVwxyz12345",
          "Description": "Weekly timeline and guidelines for the React development training program.",
          "Category": "Syllabus",
          "Subheading": "Syllabus Documents",
          "Thumbnail URL": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400",
          "Allowed Emails": "student1@example.com, student2@example.com",
        },
        {
          "Document Title": "CSS Cheat Sheet",
          "Google Drive PDF File ID": "1docXYZabcDEFjklMNOpqrsTUVwxyz98765",
          "Description": "A quick reference guide for CSS selectors, properties, and flexbox.",
          "Category": "Resources",
          "Subheading": "Quick Reference",
          "Thumbnail URL": "",
          "Allowed Emails": "",
        }
      ];
      columnWidths = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 45 }];
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, `${importType}_bulk_import_template.xlsx`);
  };

  // Perform bulk export/download
  const handleExportData = async () => {
    setIsExporting(true);
    setImportStatus({
      type: "loading",
      message: `Fetching ${importType === "pdf" ? "documents" : "videos"} for export...`,
    });

    let endpoint = "";
    if (importType === "drive") {
      endpoint = "/videos";
    } else if (importType === "youtube") {
      endpoint = "/youtube/export";
    } else if (importType === "pdf") {
      endpoint = "/documents";
    }

    try {
      const response = await API.get(endpoint);
      const rawData = response.data;

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setImportStatus({
          type: "error",
          message: `No ${importType === "pdf" ? "PDF documents" : importType === "youtube" ? "YouTube videos" : "Drive videos"} found to export.`,
        });
        setIsExporting(false);
        return;
      }

      let exportData = [];
      let columnWidths = [];

      if (importType === "drive") {
        exportData = rawData.map((item) => ({
          "Video Title": item.title || "",
          "Google Drive File ID": item.driveFileId || "",
          "Description": item.description || "",
          "Category": item.category || "General",
          "Subheading": item.subheading || "Featured",
          "Thumbnail URL": item.thumbnail || "",
          "Allowed Emails": Array.isArray(item.allowedEmails) ? item.allowedEmails.join(", ") : "",
          "Qualities": Array.isArray(item.qualities)
            ? item.qualities.map((q) => `${q.label}: ${q.driveFileId}`).join(", ")
            : "",
        }));
        columnWidths = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 35 }, { wch: 45 }, { wch: 35 }];
      } else if (importType === "youtube") {
        exportData = rawData.map((item) => ({
          "Video Title": item.title || "",
          "YouTube Video ID": item.videoId || "",
          "Category": item.category || "YouTube",
          "Subheading": item.subheading || "Protected YouTube Videos",
          "Thumbnail URL": item.thumbnail || "",
          "Allowed Emails": Array.isArray(item.allowedEmails) ? item.allowedEmails.join(", ") : "",
        }));
        columnWidths = [{ wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 35 }, { wch: 45 }];
      } else if (importType === "pdf") {
        exportData = rawData.map((item) => ({
          "Document Title": item.title || "",
          "Google Drive PDF File ID": item.driveFileId || "",
          "Description": item.description || "",
          "Category": item.category || "PDFs",
          "Subheading": item.subheading || "PDF",
          "Thumbnail URL": item.thumbnail || "",
          "Allowed Emails": Array.isArray(item.allowedEmails) ? item.allowedEmails.join(", ") : "",
        }));
        columnWidths = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 35 }, { wch: 45 }];
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");
      worksheet["!cols"] = columnWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `${importType}_bulk_export_${dateStr}.xlsx`);

      setImportStatus({
        type: "success",
        message: `Successfully exported ${exportData.length} items to Excel!`,
      });

    } catch (err) {
      console.error(err);
      setImportStatus({
        type: "error",
        message: err.response?.data?.message || err.message || "Bulk export failed.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Parse Excel File
  const handleFileParse = (uploadedFile) => {
    if (!uploadedFile) return;
    setIsValidating(true);
    setFile(uploadedFile);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (json.length === 0) {
          setImportStatus({
            type: "error",
            message: "The uploaded file contains no data rows.",
          });
          setParsedData([]);
          setIsValidating(false);
          return;
        }

        const processedSheetIds = new Set();

        const validatedRows = json.map((row, idx) => {
          const normalized = normalizeRow(row);
          const validation = validateRow(normalized, processedSheetIds);
          return {
            id: idx + 1,
            data: normalized,
            isValid: validation.isValid,
            errors: validation.errors,
          };
        });

        setParsedData(validatedRows);
      } catch (err) {
        console.error(err);
        setImportStatus({
          type: "error",
          message: "Failed to parse the Excel file. Please ensure it is a valid spreadsheet.",
        });
      } finally {
        setIsValidating(false);
      }
    };

    reader.onerror = () => {
      setImportStatus({
        type: "error",
        message: "File reading error. Please try uploading again.",
      });
      setIsValidating(false);
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      const ext = droppedFile.name.split(".").pop().toLowerCase();
      if (ext === "xls" || ext === "xlsx") {
        handleFileParse(droppedFile);
      } else {
        setImportStatus({
          type: "error",
          message: "Unsupported file type. Please select a valid .xls or .xlsx file.",
        });
      }
    }
  };

  // Perform bulk import
  const handleImportSubmit = async () => {
    const validRows = parsedData.filter((row) => row.isValid).map((row) => row.data);

    if (validRows.length === 0) {
      setImportStatus({
        type: "error",
        message: "No valid rows to import.",
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({
      type: "loading",
      message: `Uploading and importing ${validRows.length} items...`,
    });

    let endpoint = "";
    let payload = {};

    if (importType === "drive") {
      endpoint = "/videos/bulk";
      payload = { videos: validRows };
    } else if (importType === "youtube") {
      endpoint = "/youtube/bulk";
      payload = { videos: validRows };
    } else if (importType === "pdf") {
      endpoint = "/documents/bulk";
      payload = { documents: validRows };
    }

    try {
      const response = await API.post(endpoint, payload);
      setImportStatus({
        type: "success",
        message: response.data.message || `Successfully imported ${validRows.length} items!`,
      });
      
      setTimeout(() => {
        if (onSuccess) onSuccess(importType);
      }, 2000);

    } catch (err) {
      console.error(err);
      setImportStatus({
        type: "error",
        message: err.response?.data?.message || err.message || "Bulk import failed. Please verify sheet format.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30">
      
      <div className="mb-6 flex flex-col justify-between gap-4 border-b app-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bulk Import & Export</h1>
          <p className="mt-1 text-sm app-muted">Upload an Excel spreadsheet with item details or export current items.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="rounded-xl btn-secondary px-4 py-2.5 text-sm font-bold shadow-md transition-all duration-300"
          >
            📥 Download Template
          </button>
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="rounded-xl btn-primary-blue px-4 py-2.5 text-sm font-bold shadow-md transition-all duration-300"
          >
            {isExporting ? "⏳ Exporting..." : "📤 Export Current Data"}
          </button>
        </div>
      </div>

      {/* Segment Selector for Import Type */}
      <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 dark:bg-black/40 p-1 border border-slate-200/50 dark:border-white/5 max-w-md">
        <button
          type="button"
          onClick={() => handleTypeChange("drive")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all ${
            importType === "drive"
              ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
              : "app-muted hover:text-white"
          }`}
        >
          📹 Drive Videos
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("youtube")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all ${
            importType === "youtube"
              ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
              : "app-muted hover:text-white"
          }`}
        >
          🔴 YouTube Videos
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("pdf")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all ${
            importType === "pdf"
              ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
              : "app-muted hover:text-white"
          }`}
        >
          📄 PDF Documents
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
          dragOver
            ? "border-red-500 bg-red-500/10 scale-[0.99] shadow-inner"
            : "border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-slate-50/50 dark:bg-black/10"
        }`}
      >
        <span className="mb-3 text-4xl">📊</span>
        <h3 className="mb-1 text-lg font-semibold">
          {file ? `Selected File: ${file.name}` : `Drag and drop your ${importType === 'pdf' ? 'PDF' : importType === 'youtube' ? 'YouTube' : 'Drive'} Excel sheet here`}
        </h3>
        <p className="mb-4 text-xs app-muted">Accepts .xlsx and .xls formats</p>
        
        <label className="relative cursor-pointer rounded-xl btn-secondary px-5 py-2.5 text-sm font-bold transition-all">
          Browse File
          <input
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileParse(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Status Alert Panels */}
      {importStatus && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm font-medium transition-all ${
            importStatus.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : importStatus.type === "loading"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            {importStatus.type === "loading" ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : importStatus.type === "success" ? (
              <span>✅</span>
            ) : (
              <span>⚠️</span>
            )}
            <span>{importStatus.message}</span>
          </div>
        </div>
      )}

      {/* Parsing state loading indication */}
      {isValidating && (
        <div className="mt-8 flex justify-center py-6">
          <div className="flex items-center gap-3 text-sm font-bold app-muted">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Parsing and validating spreadsheet data...
          </div>
        </div>
      )}

      {/* Excel Preview Grid */}
      {!isValidating && parsedData.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-bold">Import Data Preview ({parsedData.length} records found)</h2>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-emerald-400 border border-emerald-500/20">
                ✅ {validCount} Ready to Import
              </span>
              {invalidCount > 0 && (
                <span className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-rose-400 border border-rose-500/20">
                  ❌ {invalidCount} Invalid
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-auto rounded-xl border app-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900/90 text-slate-300 font-bold border-b app-border backdrop-blur-md">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">{importType === 'pdf' ? 'Document Title' : 'Video Title'}</th>
                  <th className="p-3">
                    {importType === 'youtube' ? 'YouTube Video ID' : 'Google Drive ID'}
                  </th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Subheading</th>
                  <th className="p-3">Validation Message</th>
                </tr>
              </thead>
              <tbody className="divide-y app-border bg-slate-950/20">
                {parsedData.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/10 transition-colors ${
                      row.isValid ? "" : "bg-rose-500/5 dark:bg-rose-950/10 text-rose-300"
                    }`}
                  >
                    <td className="p-3 font-semibold">{row.id}</td>
                    <td className="p-3">
                      {row.isValid ? (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-[10px] text-emerald-400 border border-emerald-500/20">
                          VALID
                        </span>
                      ) : (
                        <span className="rounded bg-rose-500/10 px-2 py-0.5 font-bold text-[10px] text-rose-400 border border-rose-500/20">
                          INVALID
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium max-w-[150px] truncate">{row.data.title || "—"}</td>
                    <td className="p-3 font-mono max-w-[150px] truncate">
                      {importType === 'youtube' ? (row.data.videoId || "—") : (row.data.driveFileId || "—")}
                    </td>
                    <td className="p-3 max-w-[100px] truncate">{row.data.category || "—"}</td>
                    <td className="p-3 max-w-[100px] truncate">{row.data.subheading || "—"}</td>
                    <td className="p-3 max-w-[200px] text-xs app-muted whitespace-pre-line">
                      {row.isValid ? (
                        <span className="text-emerald-400 font-medium">Ready</span>
                      ) : (
                        row.errors.join("\n")
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setImportStatus(null);
              }}
              className="rounded-xl btn-secondary px-5 py-3 font-bold text-sm"
              disabled={isImporting}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              className="rounded-xl btn-primary-red px-6 py-3 font-bold text-sm shadow-lg disabled:opacity-50"
              disabled={validCount === 0 || isImporting}
            >
              🚀 {isImporting ? "Importing..." : `Import ${validCount} Items`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
