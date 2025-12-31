// ===========================
// Navigation & Mobile Menu
// ===========================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll effect for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// ===========================
// Smooth Scroll with Offset
// ===========================
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===========================
// Scroll Animations
// ===========================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for animation
const sections = document.querySelectorAll('section');
sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(section);
});

// ===========================
// Contact Form Validation & Submission
// ===========================
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

// Form field elements
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');

// Error elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const subjectError = document.getElementById('subjectError');
const messageError = document.getElementById('messageError');

// Validation functions
function validateName() {
    const name = nameInput.value.trim();
    if (name.length === 0) {
        nameError.textContent = 'Name is required';
        return false;
    }
    if (name.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters';
        return false;
    }
    nameError.textContent = '';
    return true;
}

function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email.length === 0) {
        emailError.textContent = 'Email is required';
        return false;
    }
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        return false;
    }
    emailError.textContent = '';
    return true;
}

function validateSubject() {
    const subject = subjectInput.value.trim();
    if (subject.length === 0) {
        subjectError.textContent = 'Subject is required';
        return false;
    }
    if (subject.length < 3) {
        subjectError.textContent = 'Subject must be at least 3 characters';
        return false;
    }
    subjectError.textContent = '';
    return true;
}

function validateMessage() {
    const message = messageInput.value.trim();
    if (message.length === 0) {
        messageError.textContent = 'Message is required';
        return false;
    }
    if (message.length < 10) {
        messageError.textContent = 'Message must be at least 10 characters';
        return false;
    }
    messageError.textContent = '';
    return true;
}

// Real-time validation
nameInput.addEventListener('blur', validateName);
emailInput.addEventListener('blur', validateEmail);
subjectInput.addEventListener('blur', validateSubject);
messageInput.addEventListener('blur', validateMessage);

// Clear errors on input
nameInput.addEventListener('input', () => nameError.textContent = '');
emailInput.addEventListener('input', () => emailError.textContent = '');
subjectInput.addEventListener('input', () => subjectError.textContent = '');
messageInput.addEventListener('input', () => messageError.textContent = '');

// Form submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isSubjectValid = validateSubject();
    const isMessageValid = validateMessage();
    
    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
        return;
    }
    
    // Prepare form data
    const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        subject: subjectInput.value.trim(),
        message: messageInput.value.trim()
    };
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    formMessage.style.display = 'none';
    formMessage.classList.remove('success', 'error');
    
    try {
        // Send to backend API
        // Automatically detect if running locally or in production
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : 'https://sushant-portfolio-xlm8.vercel.app'; // ✅ YOUR BACKEND URL
        
        const response = await fetch(`${API_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            formMessage.textContent = data.message || 'Thank you! Your message has been sent successfully.';
            formMessage.classList.add('success');
            formMessage.style.display = 'block';
            
            // Reset form
            contactForm.reset();
        } else {
            // Error from server
            formMessage.textContent = data.message || 'Something went wrong. Please try again.';
            formMessage.classList.add('error');
            formMessage.style.display = 'block';
        }
    } catch (error) {
        // Network or other error
        console.error('Error sending message:', error);
        formMessage.textContent = 'Unable to send message. Please check your connection and try again.';
        formMessage.classList.add('error');
        formMessage.style.display = 'block';
    } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// ===========================
// Active Navigation Link
// ===========================
function setActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) navLink.classList.add('active');
        }
    });
}

window.addEventListener('scroll', setActiveNavLink);

// ===========================
// Lazy Loading Images (if needed)
// ===========================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===========================
// Performance: Debounce Scroll
// ===========================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedScroll = debounce(() => {
    setActiveNavLink();
}, 100);

window.addEventListener('scroll', debouncedScroll);

// ===========================
// Console Welcome Message
// ===========================
console.log(
    '%c👋 Welcome to Sushant Rout\'s Portfolio!',
    'color: #FF6B35; font-size: 20px; font-weight: bold;'
);
console.log(
    '%cInterested in the code? Check out the GitHub repo!',
    'color: #004E89; font-size: 14px;'
);

// ===========================
// Initialize on Load
// ===========================
window.addEventListener('load', () => {
    // Remove any preload class if you add one
    document.body.classList.remove('preload');
    
    // Set initial active nav link
    setActiveNavLink();
});
