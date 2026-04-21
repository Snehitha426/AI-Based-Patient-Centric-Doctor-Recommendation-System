/**
 * storage.js — SmartDoc Booking System Data Layer
 * All data is persisted in localStorage.
 * Handles: Users, Doctors, Patients, Schedules, Appointments
 */

// ─────────────────────────────────────────────────────────────────────────────
// KEYS
// ─────────────────────────────────────────────────────────────────────────────
const KEYS = {
    USERS:        'sdb_users',
    DOCTORS:      'sdb_doctors',
    PATIENTS:     'sdb_patients',
    SCHEDULES:    'sdb_schedules',
    APPOINTMENTS: 'sdb_appointments',
    SESSION:      'sdb_session',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const get  = key => JSON.parse(localStorage.getItem(key) || '[]');
const getObj = key => JSON.parse(localStorage.getItem(key) || 'null');
const set  = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now  = () => new Date().toISOString();

// Simple hash (not cryptographic — frontend only)
const hashPassword = async (pw) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
const Auth = {
    /** Register a new user. role: 'doctor' | 'patient' */
    async register({ name, email, phone = '', password, role, specialization = '', experience = '', fee = '' }) {
        const users = get(KEYS.USERS);
        if (users.find(u => u.email === email)) throw new Error('Email already registered');

        const hash = await hashPassword(password);
        const userId = uid();
        const newUser = { id: userId, name, email, phone, passwordHash: hash, role, createdAt: now() };
        users.push(newUser);
        set(KEYS.USERS, users);

        // Create role-specific profile
        if (role === 'doctor') {
            const doctors = get(KEYS.DOCTORS);
            doctors.push({
                id: uid(),
                userId,
                name,
                email,
                specialization: specialization || 'General Physician',
                experience: experience || '0',
                fee: fee || '500',
                rating: (4 + Math.random()).toFixed(1),
                bio: `Dr. ${name} is a dedicated healthcare professional.`,
                avatar: role === 'doctor' ? '👨‍⚕️' : '👩‍⚕️',
            });
            set(KEYS.DOCTORS, doctors);
        } else {
            const patients = get(KEYS.PATIENTS);
            patients.push({ id: uid(), userId, name, email, phone, createdAt: now() });
            set(KEYS.PATIENTS, patients);
        }

        return { success: true };
    },

    /** Login. Returns session object on success. */
    async login({ email, password, role }) {
        const users = get(KEYS.USERS);
        const user = users.find(u => u.email === email && u.role === role);
        if (!user) throw new Error('No account found with this email and role');

        const hash = await hashPassword(password);
        if (hash !== user.passwordHash) throw new Error('Incorrect password');

        const session = { userId: user.id, name: user.name, email: user.email, role: user.role, loginAt: now() };
        set(KEYS.SESSION, session);
        return session;
    },

    logout() {
        localStorage.removeItem(KEYS.SESSION);
    },

    getSession() {
        return getObj(KEYS.SESSION);
    },

    isLoggedIn(role = null) {
        const s = this.getSession();
        if (!s) return false;
        if (role && s.role !== role) return false;
        return true;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────────────────────────────────────
const Doctors = {
    getAll() { return get(KEYS.DOCTORS); },

    getById(id) { return this.getAll().find(d => d.id === id) || null; },

    getByUserId(userId) { return this.getAll().find(d => d.userId === userId) || null; },

    update(id, updates) {
        const doctors = this.getAll();
        const idx = doctors.findIndex(d => d.id === id);
        if (idx === -1) throw new Error('Doctor not found');
        doctors[idx] = { ...doctors[idx], ...updates };
        set(KEYS.DOCTORS, doctors);
        return doctors[idx];
    },

    /** Seed some demo doctors if none exist */
    seed() {
        if (this.getAll().length > 0) return;
        const demos = [
            { id: uid(), userId: 'demo1', name: 'Dr. Ananya Sharma', email: 'ananya@demo.com', specialization: 'Cardiologist', experience: '12', fee: '800', rating: '4.8', bio: 'Expert in heart conditions with 12 years at AIIMS Delhi.', avatar: '👩‍⚕️' },
            { id: uid(), userId: 'demo2', name: 'Dr. Rajesh Kumar', email: 'rajesh@demo.com', specialization: 'Neurologist', experience: '15', fee: '1200', rating: '4.9', bio: 'Renowned neurologist specializing in stroke and epilepsy.', avatar: '👨‍⚕️' },
            { id: uid(), userId: 'demo3', name: 'Dr. Priya Mehta', email: 'priya@demo.com', specialization: 'Dermatologist', experience: '8', fee: '600', rating: '4.7', bio: 'Skin specialist with expertise in cosmetic and medical dermatology.', avatar: '👩‍⚕️' },
            { id: uid(), userId: 'demo4', name: 'Dr. Suresh Patel', email: 'suresh@demo.com', specialization: 'Orthopedist', experience: '20', fee: '1000', rating: '4.9', bio: 'Leading orthopedic surgeon with expertise in joint replacement.', avatar: '👨‍⚕️' },
            { id: uid(), userId: 'demo5', name: 'Dr. Kavitha Nair', email: 'kavitha@demo.com', specialization: 'Pediatrician', experience: '10', fee: '500', rating: '4.8', bio: 'Child specialist dedicated to infant and adolescent care.', avatar: '👩‍⚕️' },
            { id: uid(), userId: 'demo6', name: 'Dr. Vikram Singh', email: 'vikram@demo.com', specialization: 'Psychiatrist', experience: '14', fee: '900', rating: '4.7', bio: 'Mental health expert specializing in anxiety and depression therapy.', avatar: '👨‍⚕️' },
        ];
        set(KEYS.DOCTORS, demos);
        // Seed schedules for demo doctors
        Schedules.seedForDemos(demos.map(d => d.id));
    },

    /** Ensure a doctor exists in the system (useful for AI recommendations) */
    ensureExists(docData) {
        const doctors = this.getAll();
        let doc = doctors.find(d => d.name === docData.name);
        if (doc) return doc;

        // Create new
        const newDoc = {
            id: uid(),
            userId: 'auto-' + uid(),
            name: docData.name,
            email: docData.email || `${docData.name.replace(/\s+/g, '.').toLowerCase()}@auto.com`,
            specialization: docData.specialization || 'General Physician',
            experience: docData.experience || '10',
            fee: parseFloat(String(docData.fee).replace(/[^0-9]/g, '') || '500'),
            rating: docData.rating || '4.5',
            bio: docData.reason || `Dr. ${docData.name} is a highly recommended specialist.`,
            avatar: docData.emoji || '👨‍⚕️',
        };
        doctors.push(newDoc);
        set(KEYS.DOCTORS, doctors);
        
        // Give them a default Mon-Fri schedule
        Schedules.seedForDemos([newDoc.id]);
        return newDoc;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULES
// ─────────────────────────────────────────────────────────────────────────────
const Schedules = {
    getAll() { return get(KEYS.SCHEDULES); },

    getByDoctor(doctorId) {
        return this.getAll().filter(s => s.doctorId === doctorId);
    },

    /** Upsert a full schedule array for a doctor (replaces all existing) */
    saveForDoctor(doctorId, slots) {
        const all = this.getAll().filter(s => s.doctorId !== doctorId);
        const newSlots = slots.map(s => ({ ...s, id: uid(), doctorId }));
        set(KEYS.SCHEDULES, [...all, ...newSlots]);
    },

    seedForDemos(doctorIds) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const schedules = [];
        doctorIds.forEach(docId => {
            days.forEach(day => {
                schedules.push({
                    id: uid(),
                    doctorId: docId,
                    dayOfWeek: day,
                    startTime: '09:00',
                    endTime: '17:00',
                    slotDuration: 30,
                    breakStart: '13:00',
                    breakEnd: '14:00',
                });
            });
        });
        // Saturday half-day
        doctorIds.forEach(docId => {
            schedules.push({
                id: uid(), doctorId: docId,
                dayOfWeek: 'Saturday',
                startTime: '09:00', endTime: '13:00',
                slotDuration: 30, breakStart: '', breakEnd: '',
            });
        });
        set(KEYS.SCHEDULES, schedules);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SLOT GENERATION ENGINE 🧩
// ─────────────────────────────────────────────────────────────────────────────
const SlotEngine = {
    /**
     * Generate available slots for a doctor on a given date.
     * @param {string} doctorId
     * @param {string} date — 'YYYY-MM-DD'
     * @returns {string[]} array of 'HH:MM' available time strings
     */
    getAvailableSlots(doctorId, date) {
        const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = Schedules.getByDoctor(doctorId).find(s => s.dayOfWeek === dayName);
        if (!schedule) return []; // Doctor not available this day

        // Generate all possible slots
        const allSlots = this._generateSlots(schedule.startTime, schedule.endTime, schedule.slotDuration);

        // Remove break slots
        const breakSlots = schedule.breakStart && schedule.breakEnd
            ? this._generateSlots(schedule.breakStart, schedule.breakEnd, schedule.slotDuration)
            : [];

        // Remove already booked slots for this doctor+date
        const booked = Appointments.getByDoctorAndDate(doctorId, date)
            .filter(a => a.status !== 'cancelled')
            .map(a => a.time);

        // Remove past slots if date is today
        const today = new Date().toISOString().slice(0, 10);
        const currentTime = new Date().toTimeString().slice(0, 5);

        return allSlots.filter(slot => {
            if (breakSlots.includes(slot)) return false;
            if (booked.includes(slot)) return false;
            if (date === today && slot <= currentTime) return false;
            return true;
        });
    },

    /** Generate HH:MM time slots from start to end with given duration in minutes */
    _generateSlots(start, end, durationMins) {
        const slots = [];
        let [h, m] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const endMins = eh * 60 + em;

        while (true) {
            const totalMins = h * 60 + m;
            if (totalMins + durationMins > endMins) break;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            m += durationMins;
            if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
        }
        return slots;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────
const Appointments = {
    getAll() { return get(KEYS.APPOINTMENTS); },

    getById(id) { return this.getAll().find(a => a.id === id) || null; },

    getByPatient(patientUserId) {
        return this.getAll().filter(a => a.patientUserId === patientUserId);
    },

    getByDoctor(doctorId) {
        return this.getAll().filter(a => a.doctorId === doctorId);
    },

    getByDoctorAndDate(doctorId, date) {
        return this.getAll().filter(a => a.doctorId === doctorId && a.date === date);
    },

    /**
     * Book an appointment. Uses a UNIQUE check on (doctorId, date, time).
     * Returns { success, appointment } or throws Error.
     */
    book({ doctorId, patientUserId, patientName, date, time, doctorName }) {
        const all = this.getAll();

        // 🔒 Anti-double-booking: check uniqueness
        const conflict = all.find(
            a => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'cancelled'
        );
        if (conflict) throw new Error('This slot was just booked by someone else. Please choose another slot.');

        // Validate: no past bookings
        const slotDateTime = new Date(`${date}T${time}:00`);
        if (slotDateTime <= new Date()) throw new Error('Cannot book a past time slot.');

        const appointment = {
            id: uid(),
            doctorId,
            patientUserId,
            patientName,
            doctorName,
            date,
            time,
            status: 'booked', // booked | cancelled | completed
            createdAt: now(),
        };

        all.push(appointment);
        set(KEYS.APPOINTMENTS, all);
        return { success: true, appointment };
    },

    /** Update status: 'cancelled' | 'completed' */
    updateStatus(id, status) {
        const all = this.getAll();
        const idx = all.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Appointment not found');
        all[idx].status = status;
        all[idx].updatedAt = now();
        set(KEYS.APPOINTMENTS, all);
        return all[idx];
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT — seed demo data on first load
// ─────────────────────────────────────────────────────────────────────────────
Doctors.seed();

// Export as global object
window.SmartDocDB = { Auth, Doctors, Patients: { getAll: () => get(KEYS.PATIENTS) }, Schedules, SlotEngine, Appointments };
