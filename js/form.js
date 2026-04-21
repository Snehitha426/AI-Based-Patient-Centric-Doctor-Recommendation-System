// ===== FORM MODULE =====

let currentFormStep = 1;

function nextStep(n) {
    // Validate current step before moving
    if (!validateFormStep(currentFormStep)) return;

    document.getElementById(`step${currentFormStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentFormStep}"]`).classList.add('done');

    const lines = document.querySelectorAll('.progress-line');
    if (currentFormStep - 1 < lines.length) {
        lines[currentFormStep - 1].classList.add('done');
    }

    currentFormStep = n;
    document.getElementById(`step${n}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${n}"]`).classList.add('active');
    window.scrollTo({ top: document.getElementById('formSection').offsetTop - 80, behavior: 'smooth' });
}

function prevStep(n) {
    document.getElementById(`step${currentFormStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentFormStep}"]`).classList.remove('active');

    currentFormStep = n;
    document.getElementById(`step${n}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${currentFormStep}"]`).classList.remove('done');

    const lines = document.querySelectorAll('.progress-line');
    if (n - 1 < lines.length) {
        lines[n - 1].classList.remove('done');
    }
}

function validateFormStep(step) {
    if (step === 1) {
        const loc = document.getElementById('f_location');
        const spec = document.getElementById('f_specialization');
        let valid = true;

        if (!loc.value.trim()) {
            loc.classList.add('error');
            showToast('Please enter your city / location', 'error');
            valid = false;
        } else { loc.classList.remove('error'); }

        if (!spec.value) {
            spec.classList.add('error');
            if (valid) showToast('Please select a specialization', 'error');
            valid = false;
        } else { spec.classList.remove('error'); }

        return valid;
    }

    if (step === 3) {
        const name = document.getElementById('f_name');
        const email = document.getElementById('f_email');
        let valid = true;

        if (!name.value.trim()) {
            name.classList.add('error');
            showToast('Please enter your name', 'error');
            valid = false;
        } else { name.classList.remove('error'); }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
            email.classList.add('error');
            if (valid) showToast('Please enter a valid email', 'error');
            valid = false;
        } else { email.classList.remove('error'); }

        return valid;
    }

    return true;
}

function getFormData() {
    const budget = document.querySelector('input[name="budget"]:checked');
    const apptType = document.querySelector('input[name="apptType"]:checked');
    return {
        location: document.getElementById('f_location').value.trim(),
        specialization: document.getElementById('f_specialization').value,
        appointmentType: apptType ? apptType.value : 'Offline',
        experience: document.getElementById('f_experience').value,
        rating: document.getElementById('f_rating').value,
        education: document.getElementById('f_education').value,
        budget: budget ? budget.value : 'Any',
        name: document.getElementById('f_name').value.trim(),
        email: document.getElementById('f_email').value.trim(),
    };
}

// Rating slider display in form
document.addEventListener('DOMContentLoaded', () => {
    const fRating = document.getElementById('f_rating');
    if (fRating) {
        fRating.addEventListener('input', () => {
            document.getElementById('f_ratingVal').textContent = fRating.value;
            const pct = ((fRating.value - 1) / 4) * 100;
            fRating.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--border) ${pct}%)`;
        });
        // Init
        const initPct = ((fRating.value - 1) / 4) * 100;
        fRating.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${initPct}%, var(--border) ${initPct}%)`;
    }

    // Form submit
    const submitBtn = document.getElementById('formSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!validateFormStep(3)) return;
            const data = getFormData();
            submitPatientData(data);
        });
    }
});
