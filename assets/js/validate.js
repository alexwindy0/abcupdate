/**
 * /assets/js/validate.js
 * Purpose: Client-side validation and submission for:
 *  - #contact-form  (detailed contact form on contact.html)
 *  - #newsletter-form (email-only newsletter on index.html)
 *
 * Supports two submission strategies:
 *  1) EmailJS client-side (requires configuration below)
 *  2) Formspree (POST to endpoint) - use this for a lightweight serverless approach
 *
 * IMPORTANT: Update the EMAILJS_* constants below if you choose EmailJS.
 * If you prefer Formspree, set FORMSPREE_ENDPOINT to your Formspree endpoint (e.g., https://formspree.io/f/yourformid)
 *
 * This file provides accessible success/error UI and will not throw errors if
 * third-party libraries are missing. All DOM ops are guarded.
 */

/* ====== Configuration (replace with your values) ====== */
const EMAILJS_SERVICE_ID   = ""; // e.g., "service_xxx" (leave empty to disable)
const EMAILJS_TEMPLATE_ID  = ""; // e.g., "template_xxx"
const EMAILJS_PUBLIC_KEY   = ""; // e.g., "user_xxx" or public key
const FORMSPREE_ENDPOINT   = ""; // e.g., "https://formspree.io/f/yourid" (optional fallback)

/* ====== Utility helpers ====== */
const isEmailValid = (email) => {
  // Simple, reasonably permissive regex for typical emails.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

const toggleAlert = (id, show = true, message = '') => {
  const el = document.getElementById(id);
  if (!el) return;
  if (show) {
    el.classList.remove('d-none');
    if (message) el.querySelector('strong') && (el.querySelector('strong').nextSibling.textContent = ' ' + message);
    el.setAttribute('aria-hidden', 'false');
  } else {
    el.classList.add('d-none');
    el.setAttribute('aria-hidden', 'true');
  }
};

/* ====== Newsletter form handling ====== */
document.addEventListener('DOMContentLoaded', () => {
  const newsletter = document.getElementById('newsletter-form');
  if (newsletter) {
    newsletter.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const feedback = document.getElementById('newsletter-feedback');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      if (!isEmailValid(email)) {
        if (feedback) {
          feedback.classList.remove('visually-hidden');
          feedback.textContent = 'Please enter a valid email address.';
          feedback.setAttribute('role', 'alert');
        }
        emailInput.focus();
        return;
      }

      // Optimistic UI - fake success if no endpoint is configured
      if (!EMAILJS_SERVICE_ID && !FORMSPREE_ENDPOINT) {
        // show success message (mock)
        if (feedback) {
          feedback.classList.remove('visually-hidden');
          feedback.textContent = 'Subscribed — thanks! (Demo mode)';
        }
        newsletter.reset();
        return;
      }

      // If using Formspree endpoint
      if (FORMSPREE_ENDPOINT) {
        try {
          const resp = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (resp.ok) {
            if (feedback) {
              feedback.classList.remove('visually-hidden');
              feedback.textContent = 'Thanks — you are subscribed.';
            }
            newsletter.reset();
            return;
          } else {
            if (feedback) {
              feedback.classList.remove('visually-hidden');
              feedback.textContent = 'Subscription failed — please try again later.';
            }
            return;
          }
        } catch (err) {
          if (feedback) {
            feedback.classList.remove('visually-hidden');
            feedback.textContent = 'Network error — please try again later.';
          }
          return;
        }
      }

      // If EmailJS configured
      if (EMAILJS_SERVICE_ID && window.emailjs) {
        try {
          // emailjs send assumes a template with 'email' variable
          const templateParams = { email: email };
          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
          if (feedback) {
            feedback.classList.remove('visually-hidden');
            feedback.textContent = 'Thanks — you are subscribed.';
          }
          newsletter.reset();
        } catch (err) {
          if (feedback) {
            feedback.classList.remove('visually-hidden');
            feedback.textContent = 'Subscription failed — please try again.';
          }
        }
      }
    });
  }

  /* ====== Contact form handling ====== */
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('contact-submit');
  const submitText = document.getElementById('contact-submit-text');
  const submitSpinner = document.getElementById('contact-submit-spinner');

  const showSpinner = (show = true) => {
    if (submitSpinner) submitSpinner.classList.toggle('d-none', !show);
    if (submitBtn) submitBtn.disabled = show;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // hide previous alerts
    toggleAlert('contact-success', false);
    toggleAlert('contact-error', false);

    // Basic validation
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const subject = form.querySelector('#subject');
    const message = form.querySelector('#message');

    let valid = true;
    if (!name || !name.value.trim()) { name && name.classList.add('is-invalid'); valid = false; }
    else { name && name.classList.remove('is-invalid'); }

    if (!email || !isEmailValid(email.value.trim())) { email && email.classList.add('is-invalid'); valid = false; }
    else { email && email.classList.remove('is-invalid'); }

    if (!subject || !subject.value.trim()) { subject && subject.classList.add('is-invalid'); valid = false; }
    else { subject && subject.classList.remove('is-invalid'); }

    if (!message || !message.value.trim()) { message && message.classList.add('is-invalid'); valid = false; }
    else { message && message.classList.remove('is-invalid'); }

    if (!valid) {
      // announce to screen readers
      const contactError = document.getElementById('contact-error');
      if (contactError) {
        contactError.classList.remove('d-none');
        contactError.textContent = 'Please complete the required fields.';
      }
      return;
    }

    // Prepare payload common fields
    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: (form.querySelector('#phone') && form.querySelector('#phone').value.trim()) || '',
      company: (form.querySelector('#company') && form.querySelector('#company').value.trim()) || '',
      subject: subject.value.trim(),
      message: message.value.trim(),
      ref: (form.querySelector('#ref') && form.querySelector('#ref').value) || ''
    };

    showSpinner(true);

    // Submission strategies:
    // 1) EmailJS
    if (EMAILJS_SERVICE_ID && window.emailjs) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload, EMAILJS_PUBLIC_KEY);
        toggleAlert('contact-success', true);
        form.reset();
      } catch (err) {
        toggleAlert('contact-error', true, 'Please try again or email hello@asababusinesscommunity.com');
      } finally {
        showSpinner(false);
      }
      return;
    }

    // 2) Formspree fallback
    if (FORMSPREE_ENDPOINT) {
      try {
        const resp = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          toggleAlert('contact-success', true);
          form.reset();
        } else {
          toggleAlert('contact-error', true, 'Submission failed — please try again later.');
        }
      } catch (err) {
        toggleAlert('contact-error', true, 'Network error — try again later.');
      } finally {
        showSpinner(false);
      }
      return;
    }

    // If neither service is configured, perform a mock success (demo mode)
    setTimeout(() => {
      toggleAlert('contact-success', true);
      form.reset();
      showSpinner(false);
    }, 800);
  });
});
