// ===== MAIN ORCHESTRATOR =====

// ---- STATE ----
let currentSession = null;
let recommendedDoctors = []; // Store current results for booking context
let activeBookingDoc = null; 
let selectedBookingSlot = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
});

// ---- SECTION NAVIGATION ----
const sections = {
    choice: document.getElementById('choiceSection'),
    chat: document.getElementById('chatSection'),
    form: document.getElementById('formSection'),
    loading: document.getElementById('loadingSection'),
    results: document.getElementById('resultsSection'),
};

function showSection(name) {
    Object.values(sections).forEach(s => s.classList.add('section-hidden'));
    if (sections[name]) {
        sections[name].classList.remove('section-hidden');
        setTimeout(() => {
            sections[name].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }
}

// ---- AUTH UI & GUARD ----
function initAuthUI() {
    currentSession = SmartDocDB.Auth.getSession();
    const pill = document.getElementById('navUserPill');
    
    if (currentSession && currentSession.role === 'patient') {
        pill.style.display = 'flex';
        const initials = currentSession.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        pill.className = 'nav-user-pill';
        pill.innerHTML = `<div class="avatar-circle">${initials}</div> <span>${currentSession.name.split(' ')[0]} (Logout)</span>`;
        pill.onclick = () => {
            if(confirm('Logout?')) {
                SmartDocDB.Auth.logout();
                window.location.reload();
            }
        };
    } else {
        pill.style.display = 'none';
    }
}

function checkAuthBefore(action) {
    if (currentSession && currentSession.role === 'patient') {
        action();
    } else {
        showAuthModal();
    }
}

// ---- HERO CTA ----
document.getElementById('findDoctorBtn').addEventListener('click', () => {
    checkAuthBefore(() => showSection('choice'));
});

// ---- CHOICE CARDS ----
document.getElementById('chatChoice').addEventListener('click', () => {
    showSection('chat');
    initChat();
});

document.getElementById('formChoice').addEventListener('click', () => {
    showSection('form');
});

// ---- SEARCH AGAIN ----
document.getElementById('searchAgainBtn').addEventListener('click', () => {
    showSection('choice');
});

// ---- THEME TOGGLE ----
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeIcon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') applyTheme(true);

// ---- NAVBAR SCROLL EFFECT ----
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 60) {
        navbar.style.background = 'rgba(15,23,42,0.95)';
    } else {
        navbar.style.background = 'rgba(15,23,42,0.85)';
    }
});

// ---- SUBMIT PATIENT DATA ----
async function submitPatientData(data) {
    showSection('loading');
    animateLoadingSteps();

    let webhookResult = { doctors: null, success: false, error: null };
    try {
        webhookResult = await sendToWebhook(data);
    } catch (err) {
        webhookResult = { doctors: null, success: false, error: err.message };
    }

    let doctors = webhookResult.doctors;
    const usedFallback = !doctors || doctors.length === 0;
    if (usedFallback) {
        doctors = generateDemoDoctors(data);
    }

    const normalized = normalizeDocData(doctors, data);
    recommendedDoctors = normalized; // Store globally for booking context
    
    showSection('results');
    renderDoctorCards(normalized, data);
    showWebhookStatusBanner(webhookResult.success, usedFallback, webhookResult.error);
}

function showWebhookStatusBanner(success, usedFallback, error) {
    document.getElementById('webhookBanner')?.remove();
    const banner = document.createElement('div');
    banner.id = 'webhookBanner';
    banner.className = 'status-banner';
    banner.style.cssText = `max-width:900px; margin:0 auto 24px; padding:14px 20px; border-radius:12px; font-size:.9rem; font-weight:600; display:flex; align-items:flex-start; gap:12px; line-height:1.5;`;

    if (success && !usedFallback) {
        banner.style.background = 'rgba(16,185,129,0.1)';
        banner.style.border = '1px solid rgba(16,185,129,0.35)';
        banner.style.color = '#059669';
        banner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>✅ <strong>LangChain AI connected!</strong> Recommendations generated by AI.</span>`;
    } else {
        banner.style.background = 'rgba(239,68,68,0.08)';
        banner.style.border = '1px solid rgba(239,68,68,0.3)';
        banner.style.color = '#dc2626';
        banner.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span><strong>Note:</strong> Showing demo results. Make sure backend is running for real AI matching.</span>`;
    }
    const toolbar = document.querySelector('.results-toolbar');
    if (toolbar) toolbar.after(banner);
}

function normalizeDocData(doctors, patientData) {
    return doctors.map(d => ({
        name: d.name || d.doctor_name || d.doctorName || 'Dr. Expert',
        hospital: d.hospital || d.clinic || d.clinicName || 'Top Hospital',
        specialization: d.specialization || d.specialty || patientData.specialization || 'Specialist',
        experience: d.experience || d.years_of_experience || '10 years',
        rating: parseFloat(d.rating || d.score || 4.5).toFixed(1),
        education: d.education || d.qualification || 'MD',
        fee: d.fee || d.consultation_fee || d.consultationFee || '₹500',
        reason: d.reason || d.recommendation_reason || d.why || 'Highly recommended based on your profile.',
        emoji: d.emoji || (Math.random() > 0.5 ? '👨‍⚕️' : '👩‍⚕️'),
    }));
}

function renderDoctorCards(doctors, patientData) {
    const grid = document.getElementById('doctorsGrid');
    const subtitle = document.getElementById('resultsSubtitle');
    const count = document.getElementById('resultCount');

    subtitle.textContent = `Based on your preferences — ${doctors.length} match(es) found`;
    count.textContent = `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} found`;
    grid.innerHTML = '';

    doctors.forEach((doc, i) => {
        const stars = generateStars(parseFloat(doc.rating));
        const card = document.createElement('div');
        card.className = 'doctor-card';
        card.style.animationDelay = `${i * 0.1}s`;
        card.innerHTML = `
      <div class="card-top">
        <div class="doc-avatar">${doc.emoji}</div>
        <div class="doc-info-top">
          <h3>${escapeHtml(doc.name)}</h3>
          <p><i class="fa-solid fa-hospital-user"></i> ${escapeHtml(doc.hospital)}</p>
          <span class="doc-badge">${escapeHtml(doc.specialization)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="doc-rating"><span class="stars">${stars}</span><span class="rating-num">${doc.rating}</span></div>
        <div class="doc-meta">
          <div class="meta-item"><i class="fa-solid fa-briefcase-medical"></i><span>${escapeHtml(doc.experience)}</span></div>
          <div class="meta-item"><i class="fa-solid fa-indian-rupee-sign"></i><span>${escapeHtml(String(doc.fee))}</span></div>
        </div>
        <div class="doc-reason">💡 ${escapeHtml(doc.reason)}</div>
        <button class="btn-book" onclick="startIntegratedBooking(${i})">
          <i class="fa-solid fa-calendar-check"></i> Book Appointment
        </button>
      </div>`;
        grid.appendChild(card);
    });
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) stars += '★';
        else if (rating >= i - 0.5) stars += '½';
        else stars += '☆';
    }
    return stars;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATED AUTH LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function showAuthModal() {
    document.getElementById('loginModal').classList.remove('section-hidden');
    switchMainAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('loginModal').classList.add('section-hidden');
}

function switchMainAuthTab(tab) {
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    document.getElementById('mainLoginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('mainRegisterForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function doMainLogin() {
    const email = document.getElementById('mainLoginEmail').value.trim();
    const pass = document.getElementById('mainLoginPassword').value;
    const alert = document.getElementById('mainAuthAlert');
    try {
        const session = await SmartDocDB.Auth.login({ email, password: pass, role: 'patient' });
        currentSession = session;
        initAuthUI();
        closeAuthModal();
        showToast('Welcome back!', 'success');
        // Resume whatever they were doing
        showSection('choice');
    } catch (err) {
        alert.innerHTML = `<div class="alert error">${err.message}</div>`;
    }
}

async function doMainRegister() {
    const name = document.getElementById('mainRegName').value.trim();
    const email = document.getElementById('mainRegEmail').value.trim();
    const pass = document.getElementById('mainRegPassword').value;
    const alert = document.getElementById('mainAuthAlert');
    try {
        await SmartDocDB.Auth.register({ name, email, password: pass, role: 'patient' });
        const session = await SmartDocDB.Auth.login({ email, password: pass, role: 'patient' });
        currentSession = session;
        initAuthUI();
        closeAuthModal();
        showToast('Account created!', 'success');
        showSection('choice');
    } catch (err) {
        alert.innerHTML = `<div class="alert error">${err.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATED BOOKING LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function startIntegratedBooking(docIdx) {
    checkAuthBefore(() => {
        const docData = recommendedDoctors[docIdx];
        if (!docData) return;

        // Ensure doctor exists in our DB to get a proper UUID
        const dbDoc = SmartDocDB.Doctors.ensureExists(docData);
        activeBookingDoc = dbDoc;
        selectedBookingSlot = null;

        // UI Prep
        document.getElementById('pickerDocName').textContent = dbDoc.name;
        document.getElementById('pickerDocSpec').textContent = dbDoc.specialization;
        document.getElementById('pickerDocAvatar').textContent = dbDoc.avatar || '👨‍⚕️';
        document.getElementById('bookingDatePicker').value = '';
        document.getElementById('mainSlotsGrid').innerHTML = '<div class="no-slots-msg">Select a date to see available slots</div>';
        document.getElementById('pickerFooter').style.display = 'none';
        
        // Show Modal
        document.getElementById('bookingPickerModal').classList.remove('section-hidden');
    });
}

function closeBookingPicker() {
    document.getElementById('bookingPickerModal').classList.add('section-hidden');
}

function onBookingDateChange() {
    const date = document.getElementById('bookingDatePicker').value;
    if (!date || !activeBookingDoc) return;

    const slots = SmartDocDB.SlotEngine.getAvailableSlots(activeBookingDoc.id, date);
    const grid = document.getElementById('mainSlotsGrid');
    
    if (slots.length === 0) {
        grid.innerHTML = '<div class="no-slots-msg" style="grid-column:1/-1">No availability on this date</div>';
        document.getElementById('pickerFooter').style.display = 'none';
        return;
    }

    grid.innerHTML = slots.map(slot => `
        <button class="slot-btn" onclick="selectIntegratedSlot('${slot}')">${slot}</button>
    `).join('');
    document.getElementById('pickerFooter').style.display = 'none';
}

function selectIntegratedSlot(slot) {
    selectedBookingSlot = slot;
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('selected', b.textContent === slot));
    
    document.getElementById('pickerFooter').style.display = 'block';
    const date = document.getElementById('bookingDatePicker').value;
    document.getElementById('sumSelectedDate').textContent = new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('sumSelectedTime').textContent = formatFriendlyTime(slot);
}

function formatFriendlyTime(t) {
    const [h, m] = t.split(':').map(Number);
    return `${((h - 1 + 12) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

async function confirmMainBooking() {
    if (!activeBookingDoc || !selectedBookingSlot || !currentSession) return;
    const date = document.getElementById('bookingDatePicker').value;

    try {
        const { appointment } = SmartDocDB.Appointments.book({
            doctorId: activeBookingDoc.id,
            patientUserId: currentSession.userId,
            patientName: currentSession.name,
            doctorName: activeBookingDoc.name,
            date: date,
            time: selectedBookingSlot
        });

        closeBookingPicker();
        showBookingSuccess(appointment);
    } catch (err) {
        alert(err.message);
    }
}

function showBookingSuccess(appt) {
    const modal = document.getElementById('bookingSuccessModal');
    const details = document.getElementById('successDetails');
    details.innerHTML = `
        <p><strong>Doctor:</strong> <span>${appt.doctorName}</span></p>
        <p><strong>Date:</strong> <span>${appt.date}</span></p>
        <p><strong>Time:</strong> <span>${formatFriendlyTime(appt.time)}</span></p>
        <p><strong>Status:</strong> <span style="color:var(--secondary)">Confirmed</span></p>
    `;
    modal.classList.remove('section-hidden');
}

function closeSuccessModal() {
    document.getElementById('bookingSuccessModal').classList.add('section-hidden');
}

// ---- LOADING ANIMATION ----
function animateLoadingSteps() {
    const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
    steps.forEach(id => {
        const el = document.getElementById(id);
        el.className = 'load-step';
        el.querySelector('i').className = 'fa-regular fa-circle';
    });
    document.getElementById('ls1').classList.add('active');
    document.getElementById('ls1').querySelector('i').className = 'fa-solid fa-check-circle';

    let idx = 1;
    const interval = setInterval(() => {
        if (idx >= steps.length) { clearInterval(interval); return; }
        document.getElementById(steps[idx - 1]).classList.remove('active');
        document.getElementById(steps[idx - 1]).classList.add('done');
        document.getElementById(steps[idx - 1]).querySelector('i').className = 'fa-solid fa-check-circle';
        const cur = document.getElementById(steps[idx]);
        cur.classList.add('active');
        cur.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
        idx++;
    }, 1200);
}

// ---- TOAST ----
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ---- Global escapeHtml ----
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

