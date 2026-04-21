/**
 * booking.js — Patient Portal Logic
 * Handles: auth UI, doctor listing, profile view, slot selection, booking, my-appointments
 */

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let currentSession  = null;
let selectedDoctor  = null;
let selectedDate    = null;
let selectedSlot    = null;
let pendingBooking  = null;   // { doctor, date, slot }

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    currentSession = SmartDocDB.Auth.getSession();

    if (currentSession && currentSession.role === 'patient') {
        showApp();
    }
    // else: auth section is already shown by default
});

function applySavedTheme() {
    const theme = localStorage.getItem('sdb_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
function switchAuthTab(tab) {
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    document.getElementById('loginForm').style.display   = tab === 'login'    ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authAlert').innerHTML = '';
}

async function doLogin() {
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) return showAuthAlert('Please fill in all fields.', 'error');

    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<span class="spinner"></span> Logging in…';
    btn.disabled = true;

    try {
        const session = await SmartDocDB.Auth.login({ email, password, role: 'patient' });
        currentSession = session;
        showApp();
    } catch (err) {
        showAuthAlert(err.message, 'error');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
        btn.disabled = false;
    }
}

async function doRegister() {
    const name     = document.getElementById('regName').value.trim();
    const phone    = document.getElementById('regPhone').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) return showAuthAlert('Name, email and password are required.', 'error');
    if (password.length < 6) return showAuthAlert('Password must be at least 6 characters.', 'error');

    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<span class="spinner"></span> Creating account…';
    btn.disabled = true;

    try {
        await SmartDocDB.Auth.register({ name, email, phone, password, role: 'patient' });
        showAuthAlert('Account created! Logging you in…', 'success');
        setTimeout(async () => {
            const session = await SmartDocDB.Auth.login({ email, password, role: 'patient' });
            currentSession = session;
            showApp();
        }, 800);
    } catch (err) {
        showAuthAlert(err.message, 'error');
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
        btn.disabled = false;
    }
}

function showAuthAlert(msg, type) {
    document.getElementById('authAlert').innerHTML =
        `<div class="alert alert-${type}"><i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-check'}"></i> ${msg}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
function showApp() {
    document.getElementById('authSection').classList.remove('active');
    document.getElementById('appSection').classList.add('active');

    // Update navbar
    const initials = currentSession.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('navRight').innerHTML = `
        <div class="nav-user-pill">
            <div class="avatar-circle">${initials}</div>
            <span>${currentSession.name.split(' ')[0]}</span>
        </div>
        <button class="btn-logout" onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
    `;

    renderDoctorList();
    showTab('browse');
}

function doLogout() {
    SmartDocDB.Auth.logout();
    window.location.reload();
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function showTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.portal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Hide all panels
    document.getElementById('browsePanel').style.display      = 'none';
    document.getElementById('profilePanel').style.display     = 'none';
    document.getElementById('appointmentsPanel').style.display = 'none';

    if (tab === 'browse') {
        document.getElementById('browsePanel').style.display = 'block';
    } else if (tab === 'appointments') {
        document.getElementById('appointmentsPanel').style.display = 'block';
        renderAppointments();
    }
}

function showBrowse() {
    document.getElementById('browsePanel').style.display      = 'block';
    document.getElementById('profilePanel').style.display     = 'none';
    document.getElementById('appointmentsPanel').style.display = 'none';
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR LISTING
// ─────────────────────────────────────────────────────────────────────────────
function renderDoctorList() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const spec   = document.getElementById('specFilter').value;
    const sort   = document.getElementById('sortFilter').value;

    let doctors = SmartDocDB.Doctors.getAll();

    // Filter
    if (search) doctors = doctors.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.specialization.toLowerCase().includes(search)
    );
    if (spec) doctors = doctors.filter(d => d.specialization === spec);

    // Sort
    if (sort === 'rating')     doctors.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    if (sort === 'experience') doctors.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
    if (sort === 'fee_asc')    doctors.sort((a, b) => parseInt(a.fee) - parseInt(b.fee));
    if (sort === 'fee_desc')   doctors.sort((a, b) => parseInt(b.fee) - parseInt(a.fee));

    const grid = document.getElementById('doctorsListGrid');

    if (!doctors.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <i class="fa-solid fa-user-doctor"></i>
                <h3>No doctors found</h3>
                <p>Try adjusting your search or filters</p>
            </div>`;
        return;
    }

    grid.innerHTML = doctors.map(doc => {
        const stars = '★'.repeat(Math.floor(parseFloat(doc.rating))) + '☆'.repeat(5 - Math.floor(parseFloat(doc.rating)));
        return `
        <div class="doctor-listing-card" onclick="openDoctorProfile('${doc.id}')">
            <div class="doc-card-header">
                <div class="doc-emoji-avatar">${doc.avatar || '👨‍⚕️'}</div>
                <div class="doc-card-info">
                    <h3>${doc.name}</h3>
                    <span class="doc-specialization-badge">
                        <i class="fa-solid fa-briefcase-medical"></i> ${doc.specialization}
                    </span>
                </div>
            </div>
            <div class="doc-card-stats">
                <div class="doc-stat">
                    <span class="stat-val">⭐ ${doc.rating}</span>
                    <span class="stat-lbl">Rating</span>
                </div>
                <div class="doc-stat">
                    <span class="stat-val">${doc.experience}y</span>
                    <span class="stat-lbl">Experience</span>
                </div>
                <div class="doc-stat">
                    <span class="stat-val">₹${doc.fee}</span>
                    <span class="stat-lbl">Fee</span>
                </div>
            </div>
            <button class="btn-book-now" onclick="event.stopPropagation(); openDoctorProfile('${doc.id}')">
                <i class="fa-solid fa-calendar-plus"></i> Book Appointment
            </button>
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR PROFILE + SLOT PICKER
// ─────────────────────────────────────────────────────────────────────────────
function openDoctorProfile(doctorId) {
    selectedDoctor = SmartDocDB.Doctors.getById(doctorId);
    if (!selectedDoctor) return;

    selectedDate = null;
    selectedSlot = null;

    // Hide browse, show profile
    document.getElementById('browsePanel').style.display  = 'none';
    document.getElementById('profilePanel').style.display = 'block';

    const minDate = new Date().toISOString().slice(0, 10);
    // Max date = 30 days out
    const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const schedule = SmartDocDB.Schedules.getByDoctor(doctorId);
    const availableDays = schedule.map(s => s.dayOfWeek);
    const daysText = availableDays.length
        ? availableDays.join(', ')
        : 'No schedule set';

    document.getElementById('profileLayout').innerHTML = `
        <!-- Sidebar -->
        <div class="profile-sidebar">
            <div class="profile-avatar-lg">${selectedDoctor.avatar || '👨‍⚕️'}</div>
            <div class="profile-name">${selectedDoctor.name}</div>
            <div class="profile-spec">${selectedDoctor.specialization}</div>
            <ul class="profile-meta-list">
                <li><i class="fa-solid fa-briefcase-medical"></i> ${selectedDoctor.experience} years experience</li>
                <li><i class="fa-solid fa-star" style="color:var(--warning)"></i> ${selectedDoctor.rating} / 5.0 rating</li>
                <li><i class="fa-solid fa-indian-rupee-sign"></i> ₹${selectedDoctor.fee} consultation fee</li>
                <li><i class="fa-solid fa-calendar-days"></i> ${daysText}</li>
            </ul>
            <p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted);line-height:1.6">${selectedDoctor.bio || ''}</p>
        </div>

        <!-- Booking Panel -->
        <div class="booking-panel">
            <h3><i class="fa-solid fa-calendar-plus" style="color:var(--primary)"></i> Book an Appointment</h3>

            <div class="date-picker-row">
                <input type="date" id="datePicker" min="${minDate}" max="${maxDate}" onchange="onDateChange(this.value)" />
                <button class="btn-secondary" onclick="fetchSlots()"><i class="fa-solid fa-rotate"></i> Refresh</button>
            </div>

            <div class="slots-heading">Available Time Slots</div>
            <div class="slots-grid" id="slotsGrid">
                <div class="no-slots-msg"><i class="fa-regular fa-calendar"></i> Select a date to see available slots</div>
            </div>

            <div id="bookingAction" style="display:none">
                <div class="booking-summary">
                    <div class="booking-summary-row">
                        <span>Doctor</span><span>${selectedDoctor.name}</span>
                    </div>
                    <div class="booking-summary-row">
                        <span>Date</span><span id="sumDate">—</span>
                    </div>
                    <div class="booking-summary-row">
                        <span>Time</span><span id="sumTime">—</span>
                    </div>
                    <div class="booking-summary-row">
                        <span>Fee</span><span>₹${selectedDoctor.fee}</span>
                    </div>
                </div>
                <button class="btn-primary" onclick="openBookingModal()">
                    <i class="fa-solid fa-calendar-check"></i> Confirm Appointment
                </button>
            </div>
        </div>
    `;
}

function onDateChange(date) {
    selectedDate = date;
    selectedSlot = null;
    document.getElementById('bookingAction').style.display = 'none';
    fetchSlots();
}

function fetchSlots() {
    if (!selectedDate) {
        selectedDate = document.getElementById('datePicker')?.value;
    }
    if (!selectedDate || !selectedDoctor) return;

    const slots = SmartDocDB.SlotEngine.getAvailableSlots(selectedDoctor.id, selectedDate);
    renderSlots(slots);
}

function renderSlots(slots) {
    const grid = document.getElementById('slotsGrid');
    if (!slots.length) {
        grid.innerHTML = `<div class="no-slots-msg"><i class="fa-solid fa-ban"></i> No available slots for this day</div>`;
        return;
    }
    grid.innerHTML = slots.map(slot => `
        <button class="slot-btn" onclick="selectSlot('${slot}')">${slot}</button>
    `).join('');
}

function selectSlot(slot) {
    selectedSlot = slot;

    // Update slot button styles
    document.querySelectorAll('.slot-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === slot);
    });

    // Show booking action area
    const action = document.getElementById('bookingAction');
    action.style.display = 'block';

    const dateObj = new Date(selectedDate + 'T12:00:00');
    const formatted = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('sumDate').textContent = formatted;
    document.getElementById('sumTime').textContent = formatTime(slot);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING MODAL
// ─────────────────────────────────────────────────────────────────────────────
function openBookingModal() {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
        showToast('Please select a date and time slot.', 'error');
        return;
    }

    const dateObj = new Date(selectedDate + 'T12:00:00');
    const formatted = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('bookingSummary').innerHTML = `
        <div class="booking-summary-row"><span>Doctor</span><span>${selectedDoctor.name}</span></div>
        <div class="booking-summary-row"><span>Specialization</span><span>${selectedDoctor.specialization}</span></div>
        <div class="booking-summary-row"><span>Date</span><span>${formatted}</span></div>
        <div class="booking-summary-row"><span>Time</span><span>${formatTime(selectedSlot)}</span></div>
        <div class="booking-summary-row"><span>Consultation Fee</span><span style="color:var(--primary);font-size:1.1rem">₹${selectedDoctor.fee}</span></div>
    `;

    pendingBooking = { doctor: selectedDoctor, date: selectedDate, slot: selectedSlot };
    document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    pendingBooking = null;
}

function confirmBooking() {
    if (!pendingBooking || !currentSession) return;

    const btn = document.getElementById('confirmBookBtn');
    btn.innerHTML = '<span class="spinner"></span> Booking…';
    btn.disabled = true;

    try {
        SmartDocDB.Appointments.book({
            doctorId: pendingBooking.doctor.id,
            patientUserId: currentSession.userId,
            patientName: currentSession.name,
            doctorName: pendingBooking.doctor.name,
            date: pendingBooking.date,
            time: pendingBooking.slot,
        });

        closeModal();
        showToast('🎉 Appointment booked successfully!', 'success');

        // Refresh slots so the booked slot disappears
        fetchSlots();
        selectedSlot = null;
        document.getElementById('bookingAction').style.display = 'none';
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));

    } catch (err) {
        closeModal();
        showToast(err.message, 'error');
        // Re-fetch slots to show updated availability
        fetchSlots();
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirm Booking';
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MY APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
function renderAppointments() {
    if (!currentSession) return;

    const appts = SmartDocDB.Appointments.getByPatient(currentSession.userId);
    const container = document.getElementById('apptListContainer');

    if (!appts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h3>No appointments yet</h3>
                <p>Browse doctors and book your first appointment!</p>
            </div>`;
        return;
    }

    // Sort newest first
    const sorted = [...appts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const doctor = (id) => SmartDocDB.Doctors.getById(id) || { avatar: '👨‍⚕️', name: 'Unknown Doctor' };

    container.innerHTML = `<div class="appt-list">` + sorted.map(appt => {
        const doc  = doctor(appt.doctorId);
        const dateObj = new Date(appt.date + 'T12:00:00');
        const dateStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const canCancel = appt.status === 'booked' && new Date(`${appt.date}T${appt.time}`) > new Date();

        return `
        <div class="appt-card" id="appt-${appt.id}">
            <div class="appt-info">
                <div class="appt-avatar">${doc.avatar}</div>
                <div class="appt-details">
                    <h4>${appt.doctorName}</h4>
                    <p><i class="fa-solid fa-stethoscope"></i> ${doc.specialization || ''}</p>
                    <p><i class="fa-solid fa-calendar"></i> ${dateStr} &nbsp;|&nbsp; <i class="fa-solid fa-clock"></i> ${formatTime(appt.time)}</p>
                </div>
            </div>
            <div class="appt-actions">
                <span class="status-badge status-${appt.status}">
                    ${statusIcon(appt.status)} ${capitalize(appt.status)}
                </span>
                ${canCancel ? `<button class="btn-danger" onclick="cancelAppt('${appt.id}')"><i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}
            </div>
        </div>`;
    }).join('') + `</div>`;
}

function cancelAppt(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
        SmartDocDB.Appointments.updateStatus(id, 'cancelled');
        showToast('Appointment cancelled.', 'info');
        renderAppointments();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = ((h - 1 + 12) % 12) + 1;
    return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function statusIcon(status) {
    const icons = { booked: '📅', completed: '✅', cancelled: '❌' };
    return icons[status] || '•';
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const id = 'toast_' + Date.now();
    const icons = { success: 'circle-check', error: 'circle-exclamation', info: 'circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;
    toast.innerHTML = `<i class="fa-solid fa-${icons[type] || 'circle-info'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = '0.4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}
