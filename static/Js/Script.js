// Initialize Lucide icons
lucide.createIcons();

// Mobile menu functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const menuIcon = document.querySelector('.menu-icon');
const closeIcon = document.querySelector('.close-icon');

mobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
});

const organData = {
  brain: {
    title: 'Neural Analysis',
    description: 'Advanced brain mapping using LLMs and RAG for precise neural activity monitoring, mental health assessment, and cognitive function analysis with AI-powered insights'
  },
  heart: {
    title: 'Cardiac Assessment',
    description: 'Real-time heart monitoring with intelligent ECG interpretation, arrhythmia detection, and personalized cardiovascular health recommendations'
  },
  stomach: {
    title: 'Digestive Health',
    description: 'Comprehensive digestive system analysis through OCR-enabled medical report processing, symptom tracking, and AI-driven dietary recommendations'
  },
  lungs: {
    title: 'Respiratory Care',
    description: 'Advanced respiratory function monitoring using computer vision and deep learning for early detection of abnormalities and personalized treatment tracking'
  },
  system: {
    title: 'Holistic Health',
    description: 'Health monitoring combining OCR, LLMs, and technology for comprehensive medical data analysis, timeline visualization, and personalized healthcare insights'
  }
 };

 const organButtons = document.querySelectorAll('.organ-btn');
 const organTitle = document.querySelector('.organ-title');
 const organDescription = document.querySelector('.organ-description');
 const heroVideos = document.querySelectorAll('.hero-video');  // Changed from heroImages
 
 organButtons.forEach(button => {
   button.addEventListener('click', () => {
     const organ = button.dataset.organ;
     const data = organData[organ];
     
     // Update buttons
     organButtons.forEach(btn => btn.classList.remove('active'));
     button.classList.add('active');
     
     // Update videos with fade effect
     heroVideos.forEach(video => {  // Changed from img
       video.classList.remove('active');
       if (video.dataset.organ === organ) {
         video.classList.add('active');
         video.play();  // Add play() for videos
       } else {
         video.pause();  // Pause other videos
       }
     });
     
     // Update organ information
     organTitle.textContent = data.title;
     organDescription.textContent = data.description;
     
     const infoPanel = document.querySelector('.organ-info');
     infoPanel.style.animation = 'none';
     infoPanel.offsetHeight;
     infoPanel.style.animation = 'slideUp 0.3s ease-out forwards';
   });
 });

    // Logo scroll functionality
const duplicateLogos = () => {
  const logosSlide = document.querySelector('.logos-slide');
  const logoImages = logosSlide.querySelectorAll('img');
  logoImages.forEach(img => {
    const clone = img.cloneNode(true);
    logosSlide.appendChild(clone);
  });
};

// Call duplicate on load
duplicateLogos();

// Contact form handling
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Collect form data
  const formData = new FormData(contactForm);
  const data = Object.fromEntries(formData);
  
  // Add loading state
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Sending...';
  
  // Simulate form submission (replace with actual API call)
  setTimeout(() => {
    submitBtn.innerHTML = '<i data-lucide="check"></i> Sent Successfully';
    contactForm.reset();
    
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
    }, 2000);
  }, 1500);
});

// Form input animations
const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');

formInputs.forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.classList.add('focused');
  });
  
  input.addEventListener('blur', () => {
    if (!input.value) {
      input.parentElement.classList.remove('focused');
    }
  });
});  