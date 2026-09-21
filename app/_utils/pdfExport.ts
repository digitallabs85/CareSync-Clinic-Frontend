// src/utils/pdfExport.ts
import jsPDF from 'jspdf';

/**
 * Universal PDF download function - works on Android WebView and browsers
 */
export const downloadPDF = (
  doc: jsPDF, 
  fileName: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  console.log('[PDF] export called, fileName:', fileName);
  try {
    const pdfBlob = doc.output('blob');
    console.log('[PDF] blob size:', pdfBlob.size);

    const android = (window as any).AndroidNative;
    console.log('[PDF] window.AndroidNative =', android);

    if (android && typeof android.downloadPDF === 'function') {
      console.log('[PDF] Bridge found, converting to Base64...');
      const reader = new FileReader();
      reader.onload = function() {
        const base64 = (reader.result as string).split(',')[1];
        console.log('[PDF] Base64 length:', base64.length);
        android.downloadPDF(base64, fileName);
        console.log('[PDF] Bridge call sent');
        onSuccess?.();
      };
      reader.onerror = function() {
        console.error('[PDF] FileReader error');
        onError?.('Failed to read PDF data');
      };
      reader.readAsDataURL(pdfBlob);
    } else {
      console.warn('[PDF] No Android bridge, falling back to browser download');
      doc.save(fileName);
      onSuccess?.();
    }
  } catch (error) {
    console.error('[PDF] Download failed:', error);
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  }
};