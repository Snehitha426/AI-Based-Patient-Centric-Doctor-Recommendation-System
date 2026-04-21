// ===== EMAIL MODULE (EmailJS) =====

// Initialize EmailJS with your public key
// Replace with your actual EmailJS public key
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

document.addEventListener('DOMContentLoaded', () => {
    // Init EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('contactSubmitBtn');
            const feedback = document.getElementById('contactFeedback');

            const name = document.getElementById('c_name').value.trim();
            const email = document.getElementById('c_email').value.trim();
            const message = document.getElementById('c_message').value.trim();

            if (!name || !email || !message) {
                feedback.textContent = '⚠️ Please fill in all required fields.';
                feedback.className = 'form-feedback error';
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
            feedback.textContent = '';

            try {
                if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        from_name: name,
                        from_email: email,
                        message: message,
                    });
                } else {
                    // Demo mode: simulate success
                    await new Promise(r => setTimeout(r, 1500));
                }

                feedback.textContent = '✅ Message sent successfully! We'll get back to you soon.';
                feedback.className = 'form-feedback success';
                contactForm.reset();
                showToast('Message sent successfully!', 'success');
            } catch (err) {
                console.error('EmailJS error:', err);
                feedback.textContent = '❌ Failed to send. Please try again or email us directly.';
                feedback.className = 'form-feedback error';
                showToast('Failed to send message. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
            }
        });
    }
});
