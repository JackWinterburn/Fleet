import { useState, useRef, useCallback } from "react";
import {
  Modal,
  Button,
  Select,
  SelectItem,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  InlineNotification,
  Tag,
  ProgressIndicator,
  ProgressStep,
  FileUploaderDropContainer,
} from "@carbon/react";
import { Upload, DocumentImport, CheckmarkFilled, WarningFilled } from "@carbon/icons-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: "string" | "number";
  options?: { value: string; label: string }[];
}

interface BatchUploadProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>[]) => void;
  isPending: boolean;
  entityName: string;
  fields: FieldDef[];
}

type Step = "upload" | "mapping" | "preview" | "confirm";

function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "tsv") {
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length < 2) {
            reject(new Error("File must have at least a header row and one data row"));
            return;
          }
          const headers = data[0].map((h) => String(h).trim());
          const rows = data.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
          resolve({ headers, rows });
        },
        error: (err) => reject(err),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
          if (data.length < 2) {
            reject(new Error("File must have at least a header row and one data row"));
            return;
          }
          const headers = (data[0] as any[]).map((h) => String(h ?? "").trim());
          const rows = data.slice(1).filter((row: any) => (row as any[]).some((cell: any) => String(cell ?? "").trim() !== ""));
          resolve({ headers, rows: rows.map((r: any) => (r as any[]).map((c: any) => String(c ?? ""))) });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Please upload a CSV or Excel file."));
    }
  });
}

export default function BatchUpload({ open, onClose, onSubmit, isPending, entityName, fields }: BatchUploadProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const resetState = useCallback(() => {
    setStep("upload");
    setFileHeaders([]);
    setFileRows([]);
    setMapping({});
    setError(null);
    setFileName("");
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileAdded = async (_e: any, { addedFiles }: { addedFiles: File[] }) => {
    const file = addedFiles[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    try {
      const { headers, rows } = await parseFile(file);
      setFileHeaders(headers);
      setFileRows(rows);
      const autoMap: Record<string, string> = {};
      fields.forEach((field) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === field.key.toLowerCase() ||
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase().replace(/[\s_-]+/g, "") === field.key.toLowerCase().replace(/[\s_-]+/g, "") ||
            h.toLowerCase().replace(/[\s_-]+/g, "") === field.label.toLowerCase().replace(/[\s_-]+/g, "")
        );
        if (match) {
          autoMap[field.key] = match;
        }
      });
      setMapping(autoMap);
      setStep("mapping");
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
    }
  };

  const getMappedData = (): Record<string, any>[] => {
    return fileRows.map((row) => {
      const item: Record<string, any> = {};
      fields.forEach((field) => {
        const headerName = mapping[field.key];
        if (!headerName) return;
        const colIdx = fileHeaders.indexOf(headerName);
        if (colIdx === -1) return;
        let val: any = row[colIdx]?.trim() ?? "";
        if (val === "") {
          val = undefined;
          return;
        }
        if (field.type === "number") {
          const n = Number(val);
          if (!isNaN(n)) val = n;
          else val = undefined;
        }
        if (val !== undefined) {
          item[field.key] = val;
        }
      });
      return item;
    });
  };

  const validateMapping = () => {
    const missing = fields.filter((f) => f.required && !mapping[f.key]);
    if (missing.length > 0) {
      setError(`Required fields not mapped: ${missing.map((f) => f.label).join(", ")}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleProceedToPreview = () => {
    if (validateMapping()) {
      setStep("preview");
    }
  };

  const handleConfirm = () => {
    const data = getMappedData();
    const validData = data.filter((item) => {
      return fields.filter((f) => f.required).every((f) => item[f.key] !== undefined && item[f.key] !== "");
    });
    onSubmit(validData);
  };

  const previewData = step === "preview" || step === "confirm" ? getMappedData() : [];
  const validCount = previewData.filter((item) =>
    fields.filter((f) => f.required).every((f) => item[f.key] !== undefined && item[f.key] !== "")
  ).length;
  const invalidCount = previewData.length - validCount;

  const stepIndex = step === "upload" ? 0 : step === "mapping" ? 1 : step === "preview" ? 2 : 3;

  const previewHeaders = fields
    .filter((f) => mapping[f.key])
    .map((f) => ({ key: f.key, header: f.label }));

  const previewRows = previewData.slice(0, 50).map((row, idx) => {
    const isValid = fields.filter((f) => f.required).every((f) => row[f.key] !== undefined && row[f.key] !== "");
    const mapped: { id: string; _valid: boolean; [key: string]: any } = { id: String(idx), _valid: isValid };
    fields.forEach((f) => {
      if (mapping[f.key]) {
        mapped[f.key] = row[f.key] !== undefined ? String(row[f.key]) : "—";
      }
    });
    return mapped;
  });

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      modalHeading={`Batch Upload ${entityName}s`}
      passiveModal={step === "upload"}
      primaryButtonText={
        step === "mapping"
          ? "Preview Data"
          : step === "preview"
          ? isPending
            ? `Uploading ${validCount} ${entityName}s...`
            : `Upload ${validCount} ${entityName}s`
          : undefined
      }
      secondaryButtonText={step !== "upload" ? (step === "mapping" ? "Back" : "Back") : undefined}
      onRequestSubmit={
        step === "mapping"
          ? handleProceedToPreview
          : step === "preview"
          ? handleConfirm
          : undefined
      }
      onSecondarySubmit={
        step === "mapping"
          ? () => { setStep("upload"); setError(null); }
          : step === "preview"
          ? () => { setStep("mapping"); setError(null); }
          : undefined
      }
      primaryButtonDisabled={isPending || (step === "preview" && validCount === 0)}
      size="lg"
      data-testid="modal-batch-upload"
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <ProgressIndicator currentIndex={stepIndex} spaceEqually>
          <ProgressStep label="Upload File" data-testid="step-upload" />
          <ProgressStep label="Map Columns" data-testid="step-mapping" />
          <ProgressStep label="Preview & Confirm" data-testid="step-preview" />
        </ProgressIndicator>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          lowContrast
          hideCloseButton={false}
          onCloseButtonClick={() => setError(null)}
          style={{ marginBottom: "1rem" }}
          data-testid="notification-error"
        />
      )}

      {step === "upload" && (
        <div style={{ padding: "2rem 0" }}>
          <FileUploaderDropContainer
            accept={[".csv", ".xlsx", ".xls", ".tsv"]}
            labelText="Drag and drop a CSV or Excel file here, or click to browse"
            onAddFiles={handleFileAdded}
            data-testid="file-drop-zone"
          />
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", opacity: 0.7 }}>
            Supported formats: .csv, .xlsx, .xls, .tsv
          </p>
          {fileName && (
            <Tag type="blue" style={{ marginTop: "0.5rem" }} data-testid="tag-filename">
              {fileName}
            </Tag>
          )}
        </div>
      )}

      {step === "mapping" && (
        <div>
          <p style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Map columns from your file to {entityName} fields. Required fields are marked with *.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {fields.map((field) => (
              <Select
                key={field.key}
                id={`map-${field.key}`}
                labelText={`${field.label}${field.required ? " *" : ""}`}
                value={mapping[field.key] || ""}
                onChange={(e: any) => {
                  setMapping((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }));
                  setError(null);
                }}
                data-testid={`select-map-${field.key}`}
              >
                <SelectItem value="" text="— Not mapped —" />
                {fileHeaders.map((h) => (
                  <SelectItem key={h} value={h} text={h} />
                ))}
              </Select>
            ))}
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <Tag type="green" data-testid="tag-valid-count">
              <CheckmarkFilled size={12} style={{ marginRight: "0.25rem" }} />
              {validCount} valid
            </Tag>
            {invalidCount > 0 && (
              <Tag type="red" data-testid="tag-invalid-count">
                <WarningFilled size={12} style={{ marginRight: "0.25rem" }} />
                {invalidCount} invalid (will be skipped)
              </Tag>
            )}
            {previewData.length > 50 && (
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                Showing first 50 of {previewData.length} rows
              </span>
            )}
          </div>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            <DataTable rows={previewRows} headers={previewHeaders}>
              {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps, getTableProps }) => (
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Status</TableHeader>
                      {tableHeaders.map((header: any) => (
                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row: any, idx: number) => {
                      const isValid = previewRows[idx]?._valid;
                      return (
                        <TableRow {...getRowProps({ row })} key={row.id} data-testid={`row-preview-${idx}`}>
                          <TableCell>
                            {isValid ? (
                              <Tag size="sm" type="green">OK</Tag>
                            ) : (
                              <Tag size="sm" type="red">Missing</Tag>
                            )}
                          </TableCell>
                          {row.cells.map((cell: any) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </div>
        </div>
      )}
    </Modal>
  );
}
