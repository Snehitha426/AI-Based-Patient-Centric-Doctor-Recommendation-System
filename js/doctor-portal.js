/**
 * doctor-portal.js — Doctor Portal Logic
 * Handles: auth UI, dashboard, schedule management, appointments, profile editing
 */

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

let currentSession = null;
let currentDoctor  = null;   // doctor profile object from DB

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    currentSession = SmartDocDB.Auth.getSession();

    if (currentSession && currentSession.role === 'doctor') {
        currentDoctor = SmartDocDB.Doctors.getByUserId(currentSession.userId);
        showApp();
    }
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
    document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
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
        const session = await SmartDocDB.Auth.login({ email, password, role: 'doctor' });
        currentSession = session;
        currentDoctor  = SmartDocDB.Doctors.getByUserId(session.userId);
        showApp();
    } catch (err) {
        showAuthAlert(err.message, 'error');
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
        btn.disabled = false;
    }
}

async function doRegister() {
    const name     = document.getElementById('regName').value.trim();
    const spec     = document.getElementById('regSpec').value;
    const exp      = document.getElementById('regExp').value;
    const fee      = document.getElementById('regFee').value;
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) return showAuthAlert('Name, email and password are required.', 'error');
    if (password.length < 6) return showAuthAlert('Password must be at least 6 characters.', 'error');

    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<span class="spinner"></span> Creating account…';
    btn.disabled = true;

    try {
        await SmartDocDB.Auth.register({ name, email, password, role: 'doctor', specialization: spec, experience: exp, fee });
        showAuthAlert('Account created! Logging you in…', 'success');
        setTimeout(async () => {
            const session = await SmartDocDB.Auth.login({ email, password, role: 'doctor' });
            currentSession = session;
            currentDoctor  = SmartDocDB.Doctors.getByUserId(session.userId);
            showApp();
        }, 800);
    } catch (err) {
        showAuthAlert(err.message, 'error');
        btn.innerHTML = '<i class="fa-solid fa-user-doctor"></i> Create Doctor Account';
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

    const initials = currentSession.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('navRight').innerHTML = `
        <div class="nav-user-pill">
            <div class="avatar-circle">${initials}</div>
            <span>${currentSession.name.split(' ').slice(0, 2).join(' ')}</span>
        </div>
        <button class="btn-logout" onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
    `;

    showTab('dashboard');
}

function doLogout() {
    SmartDocDB.Auth.logout();
    window.location.reload();
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function showTab(tab) {
    document.querySelectorAll('.portal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');

    ['dashboard', 'schedule', 'appointments', 'profile'].forEach(t => {
        const el = document.getElementById(`${t}Panel`);
        if (el) el.style.display = t === tab ? 'block' : 'none';
    });

    if (tab === 'dashboard')    renderDashboard();
    if (tab === 'schedule')     renderScheduleEditor();
    if (tab === 'appointments') renderAppointments();
    if (tab === 'profile')      loadProfileForm();
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function renderDashboard() {
    if (!currentDoctor) return;

    document.getElementById('dashboardGreeting').textContent =
        `Welcome back, ${currentDoctor.name}!`;

    const all       = SmartDocDB.Appointments.getByDoctor(currentDoctor.id);
    const today     = new Date().toISOString().slice(0, 10);
    const todayAppts = all.filter(a => a.date === today && a.status === 'booked');
    const upcoming  = all.filter(a => a.date >= today && a.status === 'booked');
    const completed = all.filter(a => a.status === 'completed');
    const total     = all.length;

    document.getElementById('dashboardStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon purple"><i class="fa-solid fa-calendar-day"></i></div>
            <div class="stat-number">${todayAppts.length}</div>
            <div class="stat-label">Today's Appointments</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon teal"><i class="fa-solid fa-clock"></i></div>
            <div class="stat-number">${upcoming.length}</div>
            <div class="stat-label">Upcoming</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-number">${completed.length}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon pink"><i class="fa-solid fa-users"></i></div>
            <div class="stat-number">${total}</div>
            <div class="stat-label">Total Appointments</div>
        </div>
    `;

    // Today's list
    const todayEl = document.getElementById('todayAppts');
    if (!todayAppts.length) {
        todayEl.innerHTML = `
            <h3 style="font-family:'Nunito',sans-serif;font-size:1.1rem;font-weight:800;margin-bottom:1rem">📅 Today's Schedule</h3>
            <div class="empty-state" style="padding:2rem">
                <i class="fa-solid fa-mug-hot"></i>
                <h3>All clear today!</h3>
                <p>No appointments scheduled for today</p>
            </div>`;
        return;
    }

    const sorted = [...todayAppts].sort((a, b) => a.time.localeCompare(b.time));
    todayEl.innerHTML = `
        <h3 style="font-family:'Nunito',sans-serif;font-size:1.1rem;font-weight:800;margin-bottom:1rem">📅 Today's Schedule</h3>
        <div class="appt-list">
            ${sorted.map(appt => apptCardHtml(appt, true)).join('')}
        </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function renderScheduleEditor() {
    if (!currentDoctor) return;

    const existing = SmartDocDB.Schedules.getByDoctor(currentDoctor.id);
    const existingMap = {};
    existing.forEach(s => { existingMap[s.dayOfWeek] = s; });

    document.getElementById('scheduleDaysGrid').innerHTML = DAYS.map(day => {
        const s = existingMap[day];
        const enabled = !!s;
        return `
        <div class="schedule-day-card ${enabled ? 'enabled' : ''}" id="daycard-${day}">
            <div class="schedule-day-header">
                <h4>${day}</h4>
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle-${day}" ${enabled ? 'checked' : ''} onchange="toggleDay('${day}', this.checked)" />
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="day-time-inputs" id="dayinputs-${day}" style="${enabled ? '' : 'opacity:0.4;pointer-events:none'}">
                <div>
                    <label>Start Time</label>
                    <input type="time" id="start-${day}" value="${s?.startTime || '09:00'}" ${!enabled ? 'disabled' : ''} />
                </div>
                <div>
                    <label>End Time</label>
                    <input type="time" id="end-${day}" value="${s?.endTime || '17:00'}" ${!enabled ? 'disabled' : ''} />
                </div>
                <div>
                    <label>Slot Duration</label>
                    <select id="dur-${day}" ${!enabled ? 'disabled' : ''}>
                        ${[15,20,30,45,60].map(d => `<option value="${d}" ${(!s && d===30)||s?.slotDuration===d ? 'selected' : ''}>${d} min</option>`).join('')}
                    </select>
                </div>
                <div></div>
                <div>
                    <label>Break Start</label>
                    <input type="time" id="bstart-${day}" value="${s?.breakStart || '13:00'}" ${!enabled ? 'disabled' : ''} />
                </div>
                <div>
                    <label>Break End</label>
                    <input type="time" id="bend-${day}" value="${s?.breakEnd || '14:00'}" ${!enabled ? 'disabled' : ''} />
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleDay(day, enabled) {
    const card    = document.getElementById(`daycard-${day}`);
    const inputs  = document.getElementById(`dayinputs-${day}`);
    card.classList.toggle('enabled', enabled);
    inputs.style.opacity       = enabled ? '1' : '0.4';
    inputs.style.pointerEvents = enabled ? 'auto' : 'none';
    inputs.querySelectorAll('input, select').forEach(el => el.disabled = !enabled);
}

function saveSchedule() {
    if (!currentDoctor) return;

    const slots = [];
    DAYS.forEach(day => {
        const toggle = document.getElementById(`toggle-${day}`);
        if (!toggle?.checked) return;

        slots.push({
            dayOfWeek:    day,
            startTime:    document.getElementById(`start-${day}`)?.value  || '09:00',
            endTime:      document.getElementById(`end-${day}`)?.value    || '17:00',
            slotDuration: parseInt(document.getElementById(`dur-${day}`)?.value || '30'),
            breakStart:   document.getElementById(`bstart-${day}`)?.value || '',
            breakEnd:     document.getElementById(`bend-${day}`)?.value   || '',
        });
    });

    SmartDocDB.Schedules.saveForDoctor(currentDoctor.id, slots);
    showToast('✅ Schedule saved successfully!', 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
function renderAppointments() {
    if (!currentDoctor) return;

    const statusFilter = document.getElementById('apptStatusFilter')?.value || '';
    const dateFilter   = document.getElementById('apptDateFilter')?.value   || '';

    let appts = SmartDocDB.Appointments.getByDoctor(currentDoctor.id);

    if (statusFilter) appts = appts.filter(a => a.status === statusFilter);
    if (dateFilter)   appts = appts.filter(a => a.date === dateFilter);

    appts.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time.localeCompare(b.time);
    });

    const container = document.getElementById('apptListContainer');

    if (!appts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h3>No appointments found</h3>
                <p>Adjust your filters or wait for patients to book</p>
            </div>`;
        return;
    }

    container.innerHTML = `<div class="appt-list">${appts.map(a => apptCardHtml(a, false)).join('')}</div>`;
}

/** Generate the HTML for a single appointment card */
function apptCardHtml(appt, compact = false) {
    const dateObj  = new Date(appt.date + 'T12:00:00');
    const dateStr  = dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const isUpcoming = new Date(`${appt.date}T${appt.time}`) > new Date();
    const canComplete = appt.status === 'booked';
    const canCancel   = appt.status === 'booked';

    const statusIcons = { booked: '📅', completed: '✅', cancelled: '❌' };

    return `
    <div class="appt-card" id="doc-appt-${appt.id}">
        <div class="appt-info">
            <div class="appt-avatar">🧑</div>
            <div class="appt-details">
                <h4>${appt.patientName}</h4>
                <p><i class="fa-solid fa-calendar"></i> ${dateStr} &nbsp;|&nbsp; <i class="fa-solid fa-clock"></i> ${formatTime(appt.time)}</p>
            </div>
        </div>
        <div class="appt-actions">
            <span class="status-badge status-${appt.status}">
                ${statusIcons[appt.status]} ${capitalize(appt.status)}
            </span>
            ${canComplete ? `<button class="btn-success" onclick="updateApptStatus('${appt.id}','completed')"><i class="fa-solid fa-circle-check"></i> Done</button>` : ''}
            ${canCancel   ? `<button class="btn-danger"  onclick="updateApptStatus('${appt.id}','cancelled')"><i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}
        </div>
    </div>`;
}

function updateApptStatus(id, status) {
    const labels = { completed: 'mark as completed', cancelled: 'cancel' };
    if (!confirm(`Are you sure you want to ${labels[status] || status} this appointment?`)) return;
    try {
        SmartDocDB.Appointments.updateStatus(id, status);
        showToast(status === 'completed' ? '✅ Marked as completed!' : '❌ Appointment cancelled.', status === 'completed' ? 'success' : 'info');
        renderAppointments();
        renderDashboard(); // refresh stats
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function loadProfileForm() {
    if (!currentDoctor) return;
    document.getElementById('p_name').value   = currentDoctor.name || '';
    document.getElementById('p_spec').value   = currentDoctor.specialization || 'General Physician';
    document.getElementById('p_exp').value    = currentDoctor.experience || '';
    document.getElementById('p_fee').value    = currentDoctor.fee || '';
    document.getElementById('p_avatar').value = currentDoctor.avatar || '👨‍⚕️';
    document.getElementById('p_bio').value    = currentDoctor.bio || '';
}

function saveProfile() {
    if (!currentDoctor) return;
    const updates = {
        name:           document.getElementById('p_name').value.trim(),
        specialization: document.getElementById('p_spec').value,
        experience:     document.getElementById('p_exp').value,
        fee:            document.getElementById('p_fee').value,
        avatar:         document.getElementById('p_avatar').value,
        bio:            document.getElementById('p_bio').value.trim(),
    };
    if (!updates.name) {
        document.getElementById('profileAlert').innerHTML =
            `<div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i> Name is required.</div>`;
        return;
    }
    currentDoctor = SmartDocDB.Doctors.update(currentDoctor.id, updates);
    document.getElementById('profileAlert').innerHTML =
        `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> Profile updated successfully!</div>`;
    showToast('Profile saved!', 'success');
    setTimeout(() => { document.getElementById('profileAlert').innerHTML = ''; }, 3000);
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

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const id = 'toast_' + Date.now();
    const icons = { success: 'circle-check', error: 'circle-exclamation', info: 'circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;
    toast.innerHTML = `<i class="fa-solid fa-${icons[type] || 'circle-info'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
