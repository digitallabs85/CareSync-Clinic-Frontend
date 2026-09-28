const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// const API_BASE_URL = "http://localhost:5000";

async function handleResponse(response: Response) {
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error: any = new Error(body.error || "Request failed");
        error.status = response.status;
        error.code = body.code;
        throw error;
    }
    return response.json();
}

function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
}

export const apiService = {
    login: async (credentials: { username: string; password: string }) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
        const data = await handleResponse(response);
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        if (data.permissions) localStorage.setItem("page_permissions", JSON.stringify(data.permissions));
        return data;
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("page_permissions");
        window.location.href = "/sign-in";
    },

    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    findPatientByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/?phone=${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    findPatientByMrNumber: async (mrNumber: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/?mrNumber=${mrNumber}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    saveOrUpdatePatient: async (patientData: Record<string, any>, id?: string | null) => {
        const payload = { ...patientData, id: id || undefined };
        const response = await fetch(`${API_BASE_URL}/api/patients/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    uploadPatientPhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return { success: true, url: data.secure_url, publicId: data.public_id };
    },

    getPagePermissions: (): Record<string, boolean> => {
        const defaults = {
            demographic: true,
            vitals: true,
            onlineConsultation: true,
            pharmacy: true,
        };
        const raw = localStorage.getItem('page_permissions');
        if (!raw) return defaults;
        try {
            return { ...defaults, ...JSON.parse(raw) };
        } catch {
            return defaults;
        }
    },

    verifyToken: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/verify-token/${token}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getTodayTokenByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/today-token/${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    saveVitals: async (patientId: string, vitalsData: Record<string, any>) => {
        let heightCm: number | undefined;
        if (vitalsData.Height) {
            if (vitalsData.heightUnit === 'cm') {
                heightCm = parseFloat(vitalsData.Height);
            } else {
                const [ft, inch] = vitalsData.Height.split('.');
                const totalInches = (parseInt(ft) || 0) * 12 + (parseInt(inch) || 0);
                heightCm = totalInches * 2.54;
            }
        }

        const payload = {
            patientId,
            vitals: {
                pulseRate: vitalsData.PulseRate ? parseInt(vitalsData.PulseRate) : undefined,
                bloodOxygen: vitalsData.Spo2 ? parseInt(vitalsData.Spo2) : undefined,
                systolic: vitalsData.BP?.value1 ? parseInt(vitalsData.BP.value1) : undefined,
                diastolic: vitalsData.BP?.value2 ? parseInt(vitalsData.BP.value2) : undefined,
                temperature: vitalsData.Temperature ? parseFloat(vitalsData.Temperature) : undefined,
                temperatureUnit: vitalsData.temperatureUnit,
                weight: vitalsData.Weight ? parseFloat(vitalsData.Weight) : undefined,
                height: heightCm,
                heightUnit: 'cm',
                bmi: vitalsData.bmi ? parseFloat(vitalsData.bmi) : undefined,
                patientType: vitalsData.patientType,
            },
        };
        const response = await fetch(`${API_BASE_URL}/api/vitals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    updateVitals: async (id: string, vitalsData: Record<string, any>) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(vitalsData),
        });
        return handleResponse(response);
    },

    getVitalsHistoryByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/history-by-phone/${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getVitalsByPatient: async (patientId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/patient/${patientId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getTodayPatients: async () => {
        const response = await fetch(`${API_BASE_URL}/api/patients/today`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getAllDoctors: async () => {
        const clinic = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/doctors?clinicId=${clinic.id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    alertDoctor: async (doctorId: string, vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/alert-doctor`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ doctorId, vitalsId }),
        });
        return handleResponse(response);
    },

    getAssignedDoctor: async (clinicId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/clinic/${clinicId}/assigned-doctor`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // ── Call lifecycle ──

    acceptCall: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/accept-call`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId }),
        });
        return handleResponse(response);
    },

    getCallStatus: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/call-status/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    endCall: async (vitalsId: string, reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/end-call`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, reason }),
        });
        return handleResponse(response);
    },

    // ── Doctor FCM token (doctor app only) ──

    saveDoctorToken: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/doctor-token`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token }),
        });
        return handleResponse(response);
    },

    removeDoctorToken: async () => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/doctor-token`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // ── Doctor ↔ Clinic assignment (admin panel) ──

    assignDoctorToClinic: async (doctorId: string, clinicId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/doctor-clinic-assignments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ doctorId, clinicId }),
        });
        return handleResponse(response);
    },

    unassignDoctorFromClinic: async (doctorId: string, clinicId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/admin/doctor-clinic-assignments`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ doctorId, clinicId }),
        });
        return handleResponse(response);
    },

    getClinicsForDoctor: async (doctorId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/clinics`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getDoctorsForClinic: async (clinicId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/clinic/${clinicId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getAgoraToken: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/consults/token/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getPatientByVitalsId: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/${vitalsId}/patient`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getFullReport: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/${vitalsId}/full-report`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },
};