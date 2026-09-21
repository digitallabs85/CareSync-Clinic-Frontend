export { };

declare global {
  interface Window {
    AndroidNative?: {

      setPatientName: (name: string) => void
      setPatientAge: (age: string) => void
      setPatientGender: (gender: string) => void
      setPatientPhone: (phone: string) => void
      setPatientDob: (dob: string) => void
      /** 
       * NEW: Controls native ringtone playback for incoming calls.
       * Bypasses WebView autoplay restrictions.
       */
      playIncomingCallSound: (vitalsId: string, title: string, body: string) => void;
      stopIncomingCallSound: () => void;
      stopRingtone: () => void;
      saveAuthToken: (token: string) => void;
      saveUserType: (isDoctor: boolean) => void;  // ← ADD
      clearCallData: () => void;
      /** 
       * NEW: Triggers the native Android request for the FCM token.
       * The result is sent back via window.onFcmTokenReceived.
       */
      requestFcmToken: () => void;

      getConnectedDeviceInfo: () => string;

      sendSerialCommand: (command: string) => void;

      /** 
       * NEW: Deletes the current FCM token and unregisters the device.
       * Useful for security during Doctor Logout.
       */
      unregisterFcmDevice: () => void;

      // ─────────────────────────────────────────────────────────────────────────
      // NEW CAMERA LOADING OVERLAY (added here)
      // ─────────────────────────────────────────────────────────────────────────
      /** Shows the native camera loading overlay (spinner) */
      showCameraLoading: () => void;
      /** Hides the native camera loading overlay */
      hideCameraLoading: () => void;

      disablePullToRefresh: () => void;
      enablePullToRefresh: () => void;

      /** Sends the specific 'c' character to calibrate the scale. */
      sendWeightCalibrationCommand: (command: string) => void;

      /** Existing IoT/Hardware methods */
      sendMedicinePacket: (jsonString: string) => void;
      connectUsb: () => void;
      disconnectUsb: () => void;

      /**
       * NEW: Scans for nearby EZSHIFA_CLINIC Bluetooth devices, ignoring any cached
       * MAC address. Results are pushed back via window.onEsp32DevicesFound(jsonStr).
       */
      scanEsp32Devices: () => void;

      /**
       * NEW: Connects to a specific ESP32 device by MAC address (as selected from the
       * picker modal) and caches it for future connectUsb() calls. Result is pushed
       * back via window.onEsp32Selected(jsonStr).
       */
      selectEsp32Device: (address: string) => void;

      cancelScan: () => void;

      /** Print raw text or ESC/POS commands. */
      printReceipt: (text: string) => void;
      printRawJSON: (jsonString: string) => void;

      /** NEW: Sends structured vital report JSON to native thermal printer. */
      printVitalReport: (jsonString: string) => void;

      /** NEW: Sends structured prescription JSON to native thermal printer. */
      printThermal: (jsonString: string) => void;

      /** NEW: Send a Base64 encoded PNG/JPG. */
      printImage: (base64Data: string) => void;

      /** Optional: Get printer status (Out of paper, Disconnected, etc.) */
      getPrinterStatus?: () => string;

      /** Requests a fresh glucose reading from the meter. The result will be sent via window.onGlucoseReceived. */
      requestGlucoseReading?: () => void;

      // ─────────────────────────────────────────────────────────────────────────
      // NEW: OPEN KARDIA APP
      // ─────────────────────────────────────────────────────────────────────────
      /** Opens the external Kardia ECG app. */
      openKardiaApp: () => void;

      // ─────────────────────────────────────────────────────────────────────────
      // OPEN LOCAL ECG FILE
      // ─────────────────────────────────────────────────────────────────────────
      /**
       * Opens the locally downloaded ECG PDF file using the system's default PDF viewer.
       * @param filename - The name of the ECG file (e.g., "ecg-2025-01-15.pdf")
       */
      openLocalEcgFile: (filename: string) => void;
      
      // ─────────────────────────────────────────────────────────────────────────
      // ECG PENDING FILE (polling from native storage)
      // ─────────────────────────────────────────────────────────────────────────
      /** 
       * Called by the web layer to retrieve any pending ECG file name.
       * Returns the file name (e.g., "ecg-2025-01-15.pdf") or an empty string.
       * After calling, the stored file name is cleared on native side.
       */
      getPendingEcgFile: () => string;

      /**
       * Explicitly clears the stored pending ECG file on the native side.
       */
      clearPendingEcgFile: () => void;

      /** 
      * Reads the ECG file from Downloads and sends its Base64 content to the web page.
      * The web side must define window.receiveEcgFile(base64, filename).
      */
     sendEcgFileToWeb: (filename: string) => void;
     
     stopEcgService: () => void;  // ← ADD
     // ─────────────────────────────────────────────────────────────────────────
      // NEW: PDF DOWNLOAD (Added Here)
      // ─────────────────────────────────────────────────────────────────────────
      /** 
       * Downloads a PDF file to the device's Downloads folder.
       * @param base64Data - The Base64 encoded PDF data
       * @param fileName - The desired file name (e.g., "report.pdf")
       */
      downloadPDF: (base64Data: string, fileName: string) => void;
    };

    /** 
     * NEW: Receives the FCM token from Android. 
     * Format: '{"token": "xyz...", "error": null}' 
     */
    onFcmTokenReceived?: (jsonString: string) => void;

    /** Optional: Receives status after unregistration attempt */
    onFcmUnregistered?: (jsonString: string) => void;

    /** NEW: Notify JS if the print job finished or failed */
    onPrintResult?: (success: boolean, message: string) => void;

    /** Refined Statuses for USB Connection */
    onUsbStatus?: (status: "CONNECTED" | "DISCONNECTED" | "DEVICE_NOT_FOUND" | "PERMISSION_DENIED" | string) => void;

    /** Listeners called FROM Android TO JavaScript */
    onSerialData?: (data: string) => void;

    // ─────────────────────────────────────────────────────────────────────────
    // GLUCOSE METER CALLBACK (from Android to JS)
    // ─────────────────────────────────────────────────────────────────────────
    /** Receives a glucose value from the Accu‑Chek Guide meter (mg/dL). */
    onGlucoseReceived?: (mgdl: number) => void;

    // ─────────────────────────────────────────────────────────────────────────
    // ECG FILE DETECTION CALLBACK (from Android to JS)
    // ─────────────────────────────────────────────────────────────────────────
    /** Called when the Android native code detects a new file starting with 'ecg-*' in the Downloads folder. */
    onEcgFileDetected?: (filename: string) => void;

    // ─────────────────────────────────────────────────────────────────────────
    // RECEIVE ECG FILE CONTENT (push from Android)
    // ─────────────────────────────────────────────────────────────────────────
    /** Called by Android when an ECG file is detected and its Base64 content is ready. */
    receiveEcgFile?: (base64: string, filename: string) => void;


    // ─────────────────────────────────────────────────────────────────────────
    // PDF DOWNLOAD RESULT CALLBACK (Added Here)
    // ─────────────────────────────────────────────────────────────────────────
    /** 
     * Called by Android when a PDF download completes or fails.
     * @param success - True if download succeeded, false otherwise
     * @param message - Success or error message
     */
    onPDFDownloadResult?: (success: boolean, message: string) => void;
  }
}