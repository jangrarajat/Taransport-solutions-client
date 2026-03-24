import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { backendUrl } from '../../utils/backendUrl';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { refreshToken } from '../../api/api';

const BulkImportModal = ({ isOpen, onClose, showNotification, onSuccess }) => {
  const [importType, setImportType] = useState('bilty');
  const [file, setFile] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [showAllRows, setShowAllRows] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          setFullData(json);
          setShowAllRows(false);
          setStep(3);
        } catch (err) {
          showNotification(false, "Error reading file: " + err.message);
          setStep(2);
        } finally {
          setIsProcessingFile(false);
        }
      };
      reader.onerror = () => {
        showNotification(false, "Error reading file");
        setIsProcessingFile(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    setImportResult(null);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const endpoint = importType === 'bilty'
          ? `${backendUrl}/api/bill/bulk-bilty`
          : `${backendUrl}/api/bill/bulk-transaction`;

        const response = await axios.post(endpoint, { entries: json }, { withCredentials: true });
        console.log(response.data);
        setImportResult(response.data);
        if (response.data.success) {
          showNotification(true, response.data.message);
          onSuccess && onSuccess();
          resetModal();
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          showNotification(false, response.data.message);
        }
      } catch (error) {
        console.log(error.response, "Import failed");
        if (error.response?.status === 401) {
          const isRefreshed = await refreshToken();
          if (isRefreshed) {
            handleSubmit();
            return;
          }
        } else if (error.response?.status === 413) {
          showNotification(false, "File too large. Please split into smaller files or contact support.");
        } else if (error.response?.status === 500) {
          showNotification(false, "Server error. Please try again later.");
        } else {
          showNotification(false, "Bulk entry failed: " + (error.response?.data?.message || error.message));
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    reader.onerror = () => {
      showNotification(false, "Error reading file");
      setIsSubmitting(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setFullData([]);
    setFileName('');
    setImportResult(null);
    setImportType('bilty');
    setShowAllRows(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const previewData = showAllRows ? fullData : fullData.slice(0, 10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Bulk Import</h2>
          <X onClick={handleClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" size={20} />
        </div>

        {importResult && (
          <div className="mb-6 p-4 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              ) : (
                <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              )}
              <h3 className="font-black text-slate-800 dark:text-white">Import Summary</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{importResult.message}</p>
            {importResult.errors && importResult.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer">
                  View Errors ({importResult.errors.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1">
                  {importResult.errors.slice(0, 20).map((err, idx) => (
                    <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300">
                      <span className="font-mono">Row {idx + 1}:</span> {err.error}
                    </div>
                  ))}
                  {importResult.errors.length > 20 && (
                    <p className="text-slate-500 dark:text-slate-400 italic">... and {importResult.errors.length - 20} more errors</p>
                  )}
                </div>
              </details>
            )}
            {importResult.skipped && importResult.skipped.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs font-bold text-yellow-600 dark:text-yellow-400 cursor-pointer">
                  View Skipped (Duplicates) ({importResult.skipped.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1">
                  {importResult.skipped.slice(0, 20).map((skip, idx) => (
                    <div key={idx} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-300">
                      <span className="font-mono">Row {idx + 1}:</span> {skip.reason}
                    </div>
                  ))}
                  {importResult.skipped.length > 20 && (
                    <p className="text-slate-500 dark:text-slate-400 italic">... and {importResult.skipped.length - 20} more skipped</p>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">Select the type of records to import:</p>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => { setImportType('bilty'); setStep(2); }}
                className="flex-1 min-w-[180px] p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
              >
                <FileSpreadsheet size={32} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <span className="font-black uppercase text-blue-700 dark:text-blue-300">Bilty Records</span>
              </button>
              <button
                onClick={() => { setImportType('transaction'); setStep(2); }}
                className="flex-1 min-w-[180px] p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group"
              >
                <FileSpreadsheet size={32} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                <span className="font-black uppercase text-green-700 dark:text-green-300">Transaction Entries</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {importType === 'bilty'
                ? "Upload an Excel file with columns: InvoiceNo, DateOfIssueOfInvoice, NameOfRecipient, GSTINNo, Quantity, Packages, LRNO, VehicleNo, Destination, ratePMT, advanceCash, desilOnRent, petrolPump, challanNO, DONo, DINo, TotalInvoiceValue"
                : "Upload an Excel file with columns: DateOfIssueOfInvoice, NameOfRecipient, VehicleNo, Amount, remark, Destination"}
            </p>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={32} className="text-slate-400 dark:text-slate-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Click to upload Excel file</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">.xlsx, .xls, or .csv</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">Back</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-green-600 dark:text-green-400">File: {fileName}</p>
              {isProcessingFile && <ButtonLoaders />}
            </div>
            {fullData.length > 0 && (
              <div className="overflow-x-auto border rounded-lg dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                    <tr>
                      {Object.keys(fullData[0]).map(key => (
                        <th key={key} className="px-2 py-2 border-b dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{String(val).slice(0, 50)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center p-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Total {fullData.length} rows</span>
                  {fullData.length > 10 && (
                    <button
                      onClick={() => setShowAllRows(!showAllRows)}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {showAllRows ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {showAllRows ? "Show Less" : "Show All"}
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? <ButtonLoaders /> : "Confirm Import"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;