// ===== LANGCHAIN API MODULE =====
// Points to our local LangChain backend server
const LANGCHAIN_API_URL = 'http://localhost:3000/api/recommend';

// How many ms to wait before giving up on the LangChain server
const API_TIMEOUT_MS = 30000; // 30 seconds (LLM can be slow)

/**
 * Wraps fetch() with a timeout so we never block the UI forever.
 */
function fetchWithTimeout(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`LangChain server did not respond within ${timeoutMs / 1000}s. Is 'node server.js' running?`)),
      timeoutMs
    );
    fetch(url, options)
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Send patient data to LangChain backend and return doctor recommendations.
 * @param {Object} patientData
 * @returns {Promise<{doctors: Array|null, success: boolean, error: string|null}>}
 */
async function sendToWebhook(patientData) {
  const payload = {
    name: patientData.name || '',
    email: patientData.email || '',
    location: patientData.location || '',
    specialization: patientData.specialization || '',
    experience: String(patientData.experience || '0'),
    rating: String(patientData.rating || '4'),
    education: patientData.education || 'Any',
    budget: patientData.budget || 'Any',
    appointmentType: patientData.appointmentType || 'Both',
  };

  console.log('[SmartDoc] Sending payload to LangChain backend:', payload);
  updateLoadingStatus('Sending your data to LangChain AI…');

  try {
    const response = await fetchWithTimeout(
      LANGCHAIN_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      API_TIMEOUT_MS
    );

    console.log('[SmartDoc] LangChain server HTTP status:', response.status);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`LangChain server returned HTTP ${response.status}: ${body}`);
    }

    updateLoadingStatus('Processing AI recommendations…');

    const data = await response.json();
    console.log('[SmartDoc] LangChain response:', data);

    if (!data.success || !data.doctors || data.doctors.length === 0) {
      console.warn('[SmartDoc] No doctors returned by LangChain — showing demo results.');
      return { doctors: null, success: true, error: null };
    }

    showToast('LangChain AI returned doctor recommendations! 🎉', 'success');
    return { doctors: data.doctors, success: true, error: null };

  } catch (err) {
    console.error('[SmartDoc] LangChain API error:', err.message);
    return { doctors: null, success: false, error: err.message };
  }
}

/**
 * Update the in-progress loading step text (optional UI hook).
 */
function updateLoadingStatus(message) {
  const activeStep = document.querySelector('.load-step.active');
  if (activeStep) {
    const icon = activeStep.querySelector('i');
    if (icon) activeStep.innerHTML = `${icon.outerHTML} ${message}`;
  }
}

// =====================================================================
// DEMO / FALLBACK DATA  — used when LangChain server is not reachable
// =====================================================================
function generateDemoDoctors(patientData) {
  const spec = patientData.specialization || 'General Physician';
  const location = patientData.location || 'Your City';

  return [
    {
      name: 'Dr. Priya Sharma',
      hospital: 'Apollo Hospitals',
      specialization: spec,
      experience: '14 years',
      rating: 4.9,
      education: 'MD, AIIMS Delhi',
      fee: '₹800',
      reason: `Top-rated ${spec} at Apollo with 14 years of excellence and stellar patient outcomes.`,
      emoji: '👩‍⚕️',
    },
    {
      name: 'Dr. Rajesh Verma',
      hospital: 'Fortis Healthcare',
      specialization: spec,
      experience: '11 years',
      rating: 4.7,
      education: 'MS, PGI Chandigarh',
      fee: '₹600',
      reason: `Highly experienced ${spec} near ${location} with advanced procedural skills.`,
      emoji: '👨‍⚕️',
    },
    {
      name: 'Dr. Ananya Reddy',
      hospital: 'Yashoda Hospital',
      specialization: spec,
      experience: '9 years',
      rating: 4.8,
      education: 'MD, Osmania Medical College',
      fee: '₹500',
      reason: `Compassionate ${spec} known for personalized care and affordable consultations.`,
      emoji: '👩‍⚕️',
    },
    {
      name: 'Dr. Kiran Patel',
      hospital: 'Max Super Speciality',
      specialization: spec,
      experience: '17 years',
      rating: 4.6,
      education: 'DM, NIMHANS',
      fee: '₹1200',
      reason: `Senior ${spec} with 17 years specializing in complex cases and advanced treatments.`,
      emoji: '👨‍⚕️',
    },
    {
      name: 'Dr. Meena Krishnan',
      hospital: 'Care Hospitals',
      specialization: spec,
      experience: '7 years',
      rating: 4.5,
      education: 'MBBS, Kasturba Medical',
      fee: '₹400',
      reason: `Affordable ${spec} in ${location} with excellent communication and follow-up care.`,
      emoji: '👩‍⚕️',
    },
    {
      name: 'Dr. Suresh Nair',
      hospital: 'Narayana Health',
      specialization: spec,
      experience: '20 years',
      rating: 4.9,
      education: 'FRCS, UK | MD India',
      fee: '₹1500',
      reason: `International-trained ${spec} with 20 years, specializing in precision diagnostics.`,
      emoji: '👨‍⚕️',
    },
  ];
}
