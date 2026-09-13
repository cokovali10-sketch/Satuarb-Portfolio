document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // LOADING SCREEN
  // ============================================================
  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'loading-screen';
  loadingScreen.innerHTML = `
    <div class="loader-ring">
      <div class="loader-ring-inner"></div>
    </div>
    <div class="loader-text">Loading...</div>
  `;
  Object.assign(loadingScreen.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9999',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    transition: 'opacity 0.5s ease, visibility 0.5s ease'
  });

  const loaderRing = loadingScreen.querySelector('.loader-ring');
  Object.assign(loaderRing.style, {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(255,255,255,0.08)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  });

  const loaderRingInner = loadingScreen.querySelector('.loader-ring-inner');
  Object.assign(loaderRingInner.style, {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.04)',
    borderTopColor: '#00ff88',
    borderRadius: '50%',
    animation: 'spin 1.2s linear infinite reverse',
    margin: '8px auto 0'
  });

  const loaderText = loadingScreen.querySelector('.loader-text');
  Object.assign(loaderText.style, {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.75rem',
    color: '#a1a1aa',
    letterSpacing: '0.1em'
  });

  const spinKeyframes = document.createElement('style');
  spinKeyframes.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(spinKeyframes);
  document.body.appendChild(loadingScreen);

  function hideLoader() {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    setTimeout(() => loadingScreen.remove(), 500);
  }

  window.addEventListener('load', () => setTimeout(hideLoader, 600));
  setTimeout(hideLoader, 4000);

  // ============================================================
  // THREE.JS 3D SCENE
  // ============================================================
  const loadThreeJS = () => {
    return new Promise((resolve) => {
      if (window.THREE) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = resolve;
      script.onerror = () => {
        console.warn('Three.js failed to load');
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  loadThreeJS().then(() => {
    if (!window.THREE) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'three-canvas-container';
    Object.assign(canvasContainer.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '0',
      pointerEvents: 'none',
      overflow: 'hidden'
    });
    heroSection.prepend(canvasContainer);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(renderer.domElement);

    // Icosahedron wireframe
    const icoGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    scene.add(icosahedron);

    // Glow inner shape
    const glowGeometry = new THREE.IcosahedronGeometry(1.25, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.06,
      wireframe: false
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Outer wireframe
    const outerGeometry = new THREE.IcosahedronGeometry(1.8, 1);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const outerWireframe = new THREE.Mesh(outerGeometry, outerMaterial);
    scene.add(outerWireframe);

    // Particle system
    const particleCount = 300;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const r = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.015,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    document.addEventListener('mousemove', (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Animation loop
    const clock = new THREE.Clock();
    let animFrameId;

    function animate() {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      icosahedron.rotation.x = elapsed * 0.15 + mouse.y * 0.3;
      icosahedron.rotation.y = elapsed * 0.2 + mouse.x * 0.3;

      glowMesh.rotation.x = elapsed * 0.15 + mouse.y * 0.3;
      glowMesh.rotation.y = elapsed * 0.2 + mouse.x * 0.3;

      outerWireframe.rotation.x = -elapsed * 0.08 + mouse.y * 0.15;
      outerWireframe.rotation.y = elapsed * 0.1 + mouse.x * 0.15;

      const posArr = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;

        const dist = Math.sqrt(
          posArr[i * 3] ** 2 + posArr[i * 3 + 1] ** 2 + posArr[i * 3 + 2] ** 2
        );
        if (dist > 5 || dist < 1.5) {
          const r = 2 + Math.random() * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          posArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          posArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          posArr[i * 3 + 2] = r * Math.cos(phi);
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  });

  // ============================================================
  // NAVIGATION — scroll hide/show, blur, active highlighting
  // ============================================================
  const nav = document.querySelector('.nav');
  let lastScrollY = 0;
  let ticking = false;

  function onScroll() {
    const currentScrollY = window.scrollY;

    // Background blur intensifies
    nav.classList.toggle('scrolled', currentScrollY > 50);

    // Hide/show nav on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      nav.style.transform = 'translateY(-100%)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    nav.style.transition = 'transform 0.3s ease, background 0.3s ease';
    lastScrollY = currentScrollY;

    // Active section highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    let currentSection = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (currentScrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // ============================================================
  // SMOOTH SCROLL for anchor links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        const offset = 70;
        const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============================================================
  // MOBILE HAMBURGER TOGGLE
  // ============================================================
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const navLinksContainer = document.querySelector('.nav-links');

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinksContainer.classList.toggle('open');
      mobileToggle.innerHTML = isOpen ? '&#10005;' : '&#9776;';
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinksContainer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
        mobileToggle.innerHTML = '&#9776;';
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ============================================================
  // SCROLL REVEAL — IntersectionObserver for fade-in elements
  // ============================================================
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

  // ============================================================
  // SKILL BAR FILL ANIMATION
  // ============================================================
  const skillBarObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.skill-bar-fill');
          if (fill && fill.dataset.width) {
            setTimeout(() => {
              fill.style.width = fill.dataset.width;
            }, 200);
          }
          skillBarObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.skill-card').forEach((card) => skillBarObserver.observe(card));

  // ============================================================
  // STAT COUNTER ANIMATION — animate numbers from 0 to target
  // ============================================================
  function animateCounter(el, target, duration) {
    const startTime = performance.now();
    const startVal = 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          if (!isNaN(target)) {
            animateCounter(el, target, 1800);
          }
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.hero-stat-number[data-count]').forEach((el) => counterObserver.observe(el));

  // ============================================================
  // TYPING EFFECT for hero tagline
  // ============================================================
  const typingTarget = document.querySelector('.hero-tagline');
  if (typingTarget) {
    const fullHTML = typingTarget.innerHTML;
    typingTarget.innerHTML = '';
    typingTarget.style.opacity = '1';

    let charIndex = 0;
    let cursorEl = document.createElement('span');
    cursorEl.textContent = '|';
    cursorEl.style.animation = 'blink 0.7s step-end infinite';
    cursorEl.style.color = '#00d4ff';
    cursorEl.style.fontWeight = '300';

    const blinkStyle = document.createElement('style');
    blinkStyle.textContent = `@keyframes blink { 50% { opacity: 0; } }`;
    document.head.appendChild(blinkStyle);

    typingTarget.appendChild(cursorEl);

    function typeNext() {
      if (charIndex >= fullHTML.length) {
        setTimeout(() => cursorEl.remove(), 1200);
        return;
      }

      if (fullHTML[charIndex] === '<') {
        const closeIndex = fullHTML.indexOf('>', charIndex);
        if (closeIndex !== -1) {
          const tag = fullHTML.substring(charIndex, closeIndex + 1);
          const textNode = document.createTextNode('');
          typingTarget.insertBefore(textNode, cursorEl);
          textNode.outerHTML = tag;
          charIndex = closeIndex + 1;
        } else {
          const textNode = document.createTextNode(fullHTML[charIndex]);
          typingTarget.insertBefore(textNode, cursorEl);
          charIndex++;
        }
        typeNext();
      } else if (fullHTML[charIndex] === '&') {
        const semiIndex = fullHTML.indexOf(';', charIndex);
        if (semiIndex !== -1 && semiIndex - charIndex < 8) {
          const entity = fullHTML.substring(charIndex, semiIndex + 1);
          const span = document.createElement('span');
          span.textContent = entity;
          typingTarget.insertBefore(span, cursorEl);
          charIndex = semiIndex + 1;
        } else {
          const textNode = document.createTextNode(fullHTML[charIndex]);
          typingTarget.insertBefore(textNode, cursorEl);
          charIndex++;
        }
        setTimeout(typeNext, 10 + Math.random() * 15);
      } else {
        const textNode = document.createTextNode(fullHTML[charIndex]);
        typingTarget.insertBefore(textNode, cursorEl);
        charIndex++;
        const delay = fullHTML[charIndex - 1] === ' ' ? 5 : (10 + Math.random() * 20);
        setTimeout(typeNext, delay);
      }
    }

    setTimeout(typeNext, 900);
  }

  // ============================================================
  // PROJECT FILTERING
  // ============================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      projectCards.forEach((card, index) => {
        const matches = filter === 'all' || card.dataset.lang === filter;

        if (matches) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px) scale(0.97)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, index * 30);
        } else {
          card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px) scale(0.97)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // ============================================================
  // PROJECT CARD — tilt effect + click to open GitHub
  // ============================================================
  projectCards.forEach((card) => {
    card.style.transition = 'transform 0.15s ease, box-shadow 0.3s ease';
    card.style.willChange = 'transform';
    card.style.cursor = 'pointer';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px) scale(1.01)`;
      card.style.boxShadow = `
        ${(x - centerX) / centerX * -8}px ${(y - centerY) / centerY * -8}px 30px rgba(0,0,0,0.4),
        0 0 0 1px rgba(255,255,255,0.08)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
      card.style.boxShadow = '';
    });

    card.addEventListener('click', (e) => {
      const link = card.querySelector('a[href]');
      if (link && link.href && e.target !== link && !link.contains(e.target)) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // ============================================================
  // PARALLAX SCROLLING for hero section
  // ============================================================
  const heroContent = document.querySelector('.hero-content');
  const heroAscii = document.querySelector('.hero-ascii');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      if (heroContent) {
        heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
        heroContent.style.opacity = 1 - scrollY / (window.innerHeight * 0.8);
      }
      if (heroAscii) {
        heroAscii.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    }
  });

  // ============================================================
  // GLOW PULSE on hero shape when mouse is near center
  // ============================================================
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const distFromCenter = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2));

      if (distFromCenter < 0.3) {
        const intensity = 1 - distFromCenter / 0.3;
        heroSection.style.setProperty('--glow-intensity', intensity);
      }
    });
  }

  // ============================================================
  // KEYBOARD NAVIGATION — escape closes mobile menu
  // ============================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinksContainer && navLinksContainer.classList.contains('open')) {
      navLinksContainer.classList.remove('open');
      if (mobileToggle) {
        mobileToggle.innerHTML = '&#9776;';
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ============================================================
  // LAZY REVEAL of sections on scroll
  // ============================================================
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.05 }
  );

  document.querySelectorAll('.section').forEach((section) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    sectionObserver.observe(section);
  });

  // ============================================================
  // CONTACT LINKS hover ripple
  // ============================================================
  document.querySelectorAll('.contact-link').forEach((link) => {
    link.addEventListener('mouseenter', function () {
      this.style.transition = 'all 0.2s ease';
    });
  });

  // ============================================================
  // PERFORMANCE — pause animations when tab not visible
  // ============================================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.style.animationPlayState = 'paused';
    } else {
      document.body.style.animationPlayState = 'running';
    }
  });
});