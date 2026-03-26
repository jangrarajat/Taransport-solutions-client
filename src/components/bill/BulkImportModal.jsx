import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown, ChevronUp, List, Truck, Copy } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { backendUrl } from '../../utils/backendUrl';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { refreshToken } from '../../api/api';
import { io } from 'socket.io-client';

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
  const [isComplete, setIsComplete] = useState(false);
  
  // Failed entries popup state
  const [showFailedPopup, setShowFailedPopup] = useState(false);
  const [failedEntries, setFailedEntries] = useState([]);
  const [vehicleNotRegisteredEntries, setVehicleNotRegisteredEntries] = useState([]);
  const [duplicateEntries, setDuplicateEntries] = useState([]);
  const [otherErrors, setOtherErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  // Progress state
  const [progress, setProgress] = useState(null);
  const [socket, setSocket] = useState(null);
  const [importId, setImportId] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  
  // Refs to track completion
  const socketCompletedRef = useRef(false);
  const axiosRequestSentRef = useRef(false);
  const finalResultProcessedRef = useRef(false);

  // Unique ID generator
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Connect to Socket.IO
  useEffect(() => {
    const renderBackendUrl = import.meta.env.VITE_BACKEND_URL || 'https://taransport-solutions-system.onrender.com';
    
    let socketUrl = renderBackendUrl;
    if (socketUrl.startsWith('https://')) {
      socketUrl = socketUrl.replace('https://', 'wss://');
    } else if (socketUrl.startsWith('http://')) {
      socketUrl = socketUrl.replace('http://', 'ws://');
    }

    console.log('Connecting to Socket.IO at:', socketUrl);

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setConnectionError(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnectionError(true);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

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
          setImportResult(null);
          setProgress(null);
          setIsComplete(false);
          socketCompletedRef.current = false;
          axiosRequestSentRef.current = false;
          finalResultProcessedRef.current = false;
          setFailedEntries([]);
          setVehicleNotRegisteredEntries([]);
          setDuplicateEntries([]);
          setOtherErrors([]);
          setSuccessCount(0);
          setShowFailedPopup(false);
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
    setProgress(null);
    setIsComplete(false);
    socketCompletedRef.current = false;
    axiosRequestSentRef.current = false;
    finalResultProcessedRef.current = false;
    setFailedEntries([]);
    setVehicleNotRegisteredEntries([]);
    setDuplicateEntries([]);
    setOtherErrors([]);
    setSuccessCount(0);
    setShowFailedPopup(false);

    const newImportId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setImportId(newImportId);

    if (socket && socket.connected) {
      socket.emit('join', newImportId);
      socket.off('progress');
      
      socket.on('progress', (data) => {
        console.log('Progress update:', data);
        setProgress(data);
        
        if (data.type === 'complete') {
          socketCompletedRef.current = true;
          setIsComplete(true);
          setIsSubmitting(false);
          setSuccessCount(data.succeeded || 0);
          
          // Separate errors by type
          const vehicleErrors = [];
          const otherErrs = [];
          
          if (data.errors && data.errors.length > 0) {
            data.errors.forEach(err => {
              if (err.error && (err.error.includes('not registered') || err.vehicleNotRegistered)) {
                vehicleErrors.push(err);
              } else {
                otherErrs.push(err);
              }
            });
          }
          
          // Store failed entries
          const failed = (data.errors || []).map((err, idx) => ({
            lrno: err.lrno || err.data?.LRNO || err.entry?.LRNO || 'N/A',
            vehicleNo: err.vehicleNo || err.data?.VehicleNo || err.entry?.VehicleNo || 'N/A',
            error: err.error,
            row: err.row || idx + 1,
            isVehicleError: err.error && (err.error.includes('not registered') || err.vehicleNotRegistered)
          }));
          
          // Store skipped entries (duplicates)
          const skipped = (data.skipped || []).map((skip, idx) => ({
            lrno: skip.lrno || (skip.reason ? (skip.reason.match(/LRNO '([^']+)'/)?.[1] || 'N/A') : 'N/A'),
            vehicleNo: skip.vehicleNo || skip.entry?.VehicleNo || 'N/A',
            reason: skip.reason,
            row: skip.row || idx + 1,
            isDuplicate: true
          }));
          
          setFailedEntries(failed);
          setVehicleNotRegisteredEntries(vehicleErrors);
          setDuplicateEntries(skipped);
          setOtherErrors(otherErrs);
          
          if (failed.length > 0 || skipped.length > 0) {
            setShowFailedPopup(true);
          }
          
          // Show final notification
          if (data.failed === 0 && data.skipped === 0 && data.succeeded > 0) {
            showNotification(true, `${data.succeeded} records imported successfully!`);
          } else if (data.succeeded > 0 && data.skipped > 0 && data.failed === 0) {
            showNotification(true, `${data.succeeded} records imported, ${data.skipped} duplicates skipped.`);
          } else if (data.succeeded > 0 && data.skipped > 0 && data.failed > 0) {
            showNotification(false, `${data.succeeded} imported, ${data.failed} failed, ${data.skipped} duplicates skipped.`);
          } else if (data.skipped > 0 && data.succeeded === 0 && data.failed === 0) {
            showNotification(true, `All ${data.skipped} records are duplicates.`);
          } else if (data.failed > 0 && data.skipped === 0) {
            showNotification(false, `${data.failed} records failed.`);
          }
          
          setImportResult({
            success: true,
            message: `Completed: ${data.succeeded} succeeded, ${data.failed} failed, ${data.skipped} skipped.`,
            errors: data.errors,
            summary: {
              succeeded: data.succeeded || 0,
              failed: data.failed || 0,
              skipped: data.skipped || 0,
              total: data.total || 0
            }
          });
          finalResultProcessedRef.current = true;
          
          if (data.failed === 0) {
            setTimeout(() => {
              resetModal();
              onClose();
            }, 3000);
          }
          if (onSuccess) onSuccess();
        }
      });
    } else {
      console.warn('Socket not connected');
      showNotification(false, "Connection error. Please refresh and try again.");
      setIsSubmitting(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const endpoint = importType === 'bilty'
        ? `${backendUrl}/api/bill/bulk-bilty`
        : `${backendUrl}/api/bill/bulk-transaction`;

      axiosRequestSentRef.current = true;
      
      try {
        const response = await axios.post(endpoint, { entries: json, importId: newImportId }, { 
          withCredentials: true,
          timeout: 600000
        });
        
        console.log('API Response:', response.data);
        
        if (!socketCompletedRef.current && !finalResultProcessedRef.current) {
          if (response.data.success) {
            setSuccessCount(response.data.summary?.succeeded || 0);
            
            const skipped = (response.data.skipped || []).map((skip, idx) => ({
              lrno: skip.lrno || (skip.reason ? (skip.reason.match(/LRNO '([^']+)'/)?.[1] || 'N/A') : 'N/A'),
              vehicleNo: skip.vehicleNo || skip.entry?.VehicleNo || 'N/A',
              reason: skip.reason,
              row: skip.row || idx + 1,
              isDuplicate: true
            }));
            
            const vehicleErrors = response.data.errors ? response.data.errors.filter(err => err.error && err.error.includes('not registered')) : [];
            const otherErrs = response.data.errors ? response.data.errors.filter(err => !err.error || !err.error.includes('not registered')) : [];
            const failed = (response.data.errors || []).map((err, idx) => ({
              lrno: err.lrno || err.entry?.LRNO || 'N/A',
              vehicleNo: err.vehicleNo || err.entry?.VehicleNo || 'N/A',
              error: err.error,
              row: err.row || idx + 1,
              isVehicleError: err.error && err.error.includes('not registered')
            }));
            
            setImportResult({
              success: true,
              message: response.data.message,
              errors: response.data.errors,
              summary: {
                succeeded: response.data.summary?.succeeded || 0,
                failed: response.data.summary?.failed || 0,
                skipped: response.data.summary?.skipped || 0,
                total: response.data.summary?.total || 0
              }
            });
            setFailedEntries(failed);
            setVehicleNotRegisteredEntries(vehicleErrors);
            setDuplicateEntries(skipped);
            setOtherErrors(otherErrs);
            
            if (failed.length > 0 || skipped.length > 0) {
              setShowFailedPopup(true);
            }
            
            if (response.data.summary?.failed === 0 && response.data.summary?.skipped === 0) {
              showNotification(true, `${response.data.summary?.succeeded || 0} records imported!`);
            } else if (response.data.summary?.succeeded > 0 && response.data.summary?.skipped > 0 && response.data.summary?.failed === 0) {
              showNotification(true, `${response.data.summary?.succeeded} imported, ${response.data.summary?.skipped} duplicates skipped.`);
            } else if (response.data.summary?.skipped > 0 && response.data.summary?.succeeded === 0 && response.data.summary?.failed === 0) {
              showNotification(true, `All ${response.data.summary?.skipped} records are duplicates.`);
            } else if (response.data.summary?.failed > 0) {
              showNotification(false, `${response.data.summary?.failed} records failed.`);
            }
          }
        }
        
      } catch (error) {
        console.error('Axios error (ignored):', error.message);
        if (!socketCompletedRef.current && !finalResultProcessedRef.current && progress && progress.processed > 0) {
          console.log('Import is in progress via socket, ignoring axios error');
        }
      } finally {
        if (!socketCompletedRef.current) {
          setTimeout(() => {
            if (!socketCompletedRef.current) {
              setIsSubmitting(false);
            }
          }, 1000);
        }
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
    setProgress(null);
    setImportId(null);
    setIsSubmitting(false);
    setIsComplete(false);
    socketCompletedRef.current = false;
    axiosRequestSentRef.current = false;
    finalResultProcessedRef.current = false;
    setFailedEntries([]);
    setVehicleNotRegisteredEntries([]);
    setDuplicateEntries([]);
    setOtherErrors([]);
    setSuccessCount(0);
    setShowFailedPopup(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const closeFailedPopup = () => {
    setShowFailedPopup(false);
    if (importResult && importResult.summary && importResult.summary.failed === 0) {
      resetModal();
      onClose();
    }
  };

  const previewData = showAllRows ? fullData : fullData.slice(0, 10);
  const percent = progress && progress.type === 'progress' ? (progress.processed / progress.total) * 100 : 0;
  const remaining = progress && progress.type === 'progress' ? progress.total - progress.processed : 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Failed Entries Popup - Simplified */}
      {showFailedPopup && (duplicateEntries.length > 0 || failedEntries.length > 0) && (
        <div className="fixed inset-0 z-[200] bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl max-h-[80vh] overflow-hidden animate-in zoom-in duration-300">
            <div className="flex justify-between items-center border-b dark:border-slate-700 p-5 sticky top-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${duplicateEntries.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {duplicateEntries.length > 0 ? (
                    <Copy className="text-yellow-600 dark:text-yellow-400" size={24} />
                  ) : (
                    <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {duplicateEntries.length > 0 ? 'Duplicate Records Found' : 'Failed Records'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {successCount > 0 && `${successCount} records imported successfully. `}
                    {duplicateEntries.length > 0 && `${duplicateEntries.length} duplicate(s) skipped. `}
                    {failedEntries.length > 0 && `${failedEntries.length} record(s) failed.`}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeFailedPopup}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {/* Duplicate/Skipped Entries - LRNOs only */}
              {duplicateEntries.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Copy className="text-yellow-500" size={18} />
                    <h4 className="text-sm font-black text-yellow-600 dark:text-yellow-400 uppercase">Skipped - Already Exist</h4>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-mono break-words">
                      {duplicateEntries.map(skip => skip.lrno).filter(lr => lr !== 'N/A').join(', ')}
                    </p>
                    {duplicateEntries.filter(s => s.lrno === 'N/A').length > 0 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        * {duplicateEntries.filter(s => s.lrno === 'N/A').length} record(s) without LRNO
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Vehicle Not Registered Errors */}
              {vehicleNotRegisteredEntries.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="text-red-500" size={18} />
                    <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase">Unregistered Vehicles</h4>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200 font-mono break-words">
                      {vehicleNotRegisteredEntries.map(err => `${err.vehicleNo} (LRNO: ${err.lrno || 'N/A'})`).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Other Errors */}
              {otherErrors.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="text-red-500" size={18} />
                    <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase">Other Errors</h4>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {otherErrors.map(err => `Row ${err.row}: ${err.error}`).join('; ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t dark:border-slate-700 p-5 flex gap-3">
              <button
                onClick={closeFailedPopup}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-black text-xs uppercase hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
              {vehicleNotRegisteredEntries.length > 0 && (
                <button
                  onClick={() => {
                    setShowFailedPopup(false);
                    window.location.href = '/reports';
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-black text-xs uppercase hover:bg-green-700 transition-colors"
                >
                  Add Vehicles
                </button>
              )}
              {(failedEntries.length > 0 || duplicateEntries.length > 0) && (
                <button
                  onClick={() => {
                    setShowFailedPopup(false);
                    resetModal();
                    setStep(2);
                  }}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-black text-xs uppercase hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase">Bulk Import</h2>
            {!isSubmitting && !progress && !isComplete && (
              <X onClick={handleClose} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" size={20} />
            )}
          </div>

          {/* Connection Error Warning */}
          {connectionError && !progress && (
            <div className="mb-6 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Real-time progress is unavailable. Import will still complete, but you won't see live updates.
              </p>
            </div>
          )}

          {/* Live Progress UI */}
          {progress && progress.type !== 'complete' && (
            <div className="mb-6 p-6 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-300">Importing Data...</span>
                </div>
                <span className="text-sm font-black text-blue-700 dark:text-blue-300">{progress.processed} / {progress.total}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-4">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
              </div>
              
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p className="font-mono bg-white/50 dark:bg-slate-800/50 p-2 rounded">
                  {progress.success === false ? '⚠️' : '✅'} Processing: 
                  <span className="font-bold ml-1">LRNO {progress.currentLRNO || 'N/A'}</span> 
                  <span className="mx-1">|</span>
                  <span className="font-bold">Vehicle: {progress.currentVehicle || 'N/A'}</span>
                </p>
                <p>📊 Remaining: <span className="font-bold">{remaining}</span> entries</p>
                {progress.success === false && progress.error && (
                  <p className="text-orange-500 bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
                    {progress.isDuplicate ? '⏭️ Duplicate skipped: ' : '⚠️ '}{progress.error}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 text-center">
                  ⏳ Please wait while your data is being imported. Do not close this window.
                </p>
              </div>
            </div>
          )}

          {/* Final Summary */}
          {importResult && (
            <div className="mb-6 p-4 rounded-lg border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                <h3 className="font-black text-slate-800 dark:text-white">Import Summary</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{importResult.message}</p>
              
              {importResult.summary && (
                <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                    <span className="font-black text-green-600">✅ {importResult.summary.succeeded || 0}</span>
                    <span className="text-slate-500 ml-1">Imported</span>
                  </div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                    <span className="font-black text-yellow-600">⏭️ {importResult.summary.skipped || 0}</span>
                    <span className="text-slate-500 ml-1">Skipped</span>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded">
                    <span className="font-black text-red-600">❌ {importResult.summary.failed || 0}</span>
                    <span className="text-slate-500 ml-1">Failed</span>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                    <span className="font-black text-blue-600">📊 {importResult.summary.total || 0}</span>
                    <span className="text-slate-500 ml-1">Total</span>
                  </div>
                </div>
              )}
              
              {(failedEntries.length > 0 || duplicateEntries.length > 0) && (
                <button
                  onClick={() => setShowFailedPopup(true)}
                  className="mt-3 w-full py-2 bg-yellow-600 text-white rounded font-black text-xs uppercase hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                >
                  <List size={14} />
                  View Details ({duplicateEntries.length > 0 ? `${duplicateEntries.length} Duplicates` : `${failedEntries.length} Failed`})
                </button>
              )}
              
              <div className="mt-4">
                <button
                  onClick={handleClose}
                  className="w-full py-2 bg-blue-600 text-white rounded font-black text-xs uppercase hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Select Type */}
          {step === 1 && !isSubmitting && !progress && !importResult && !isComplete && (
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

          {/* Step 2: Upload File */}
          {step === 2 && !isSubmitting && !progress && !importResult && !isComplete && (
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
                  <span className="text-xs text-slate-500 dark:text-slate-400">.xlsx, .xls, or .csv (Max 10MB)</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">Back</button>
              </div>
            </div>
          )}

          {/* Step 3: Preview and Confirm */}
          {step === 3 && !isSubmitting && !progress && !importResult && !isComplete && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">📄 File: {fileName}</p>
                {isProcessingFile && <ButtonLoaders />}
              </div>
              {fullData.length > 0 && (
                <div className="overflow-x-auto border rounded-lg dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        {Object.keys(fullData[0] || {}).map((key, idx) => (
                          <th key={`header-${key}-${idx}`} className="px-2 py-2 border-b dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                        </tr>
                       </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {previewData.map((row, rowIdx) => (
                        <tr key={`row-${rowIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {Object.values(row).map((val, colIdx) => (
                            <td key={`cell-${rowIdx}-${colIdx}`} className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {String(val).slice(0, 50)}
                              </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center p-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>📊 Total {fullData.length} rows</span>
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
                <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                  Back
                </button>
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
    </>
  );
};

export default BulkImportModal;