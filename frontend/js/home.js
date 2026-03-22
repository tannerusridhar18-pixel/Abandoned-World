// ================= DOM ELEMENTS =================

const container = document.getElementById("placesContainer");
const searchInput = document.getElementById("searchInput");
const scrollToTopBtn = document.getElementById("scrollToTop");
const pageLoader = document.getElementById("pageLoader");
const navbar = document.querySelector("header.navbar");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const navMenu = document.querySelector(".nav-menu");
// ================= USER INFO =================

const userId = localStorage.getItem("userId");

// ================= API CONFIGURATION =================

const API_URL = "http://localhost:8081/api/places/recommended";

// ================= STATE MANAGEMENT =================

let userFavorites = [];
let allPlaces = [];
let currentFilter = 'all';
let isLoading = false;

// ================= INITIALIZATION =================

window.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

async function initializeApp() {
    createParticles();
    animateStats();
    setupEventListeners();
    setupIntersectionObserver();
    await loadFavorites();
    await loadPlaces();

    setTimeout(() => {
        pageLoader.classList.add('hidden');
    }, 500);
}

// ================= EVENT LISTENERS =================

function setupEventListeners() {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchPlaces();
    });

    searchInput.addEventListener('input', debounce(searchPlaces, 500));

    window.addEventListener('scroll', handleScroll);
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterPlaces();
        });
    });

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    const exploreBtn = document.querySelector('.explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.querySelector('.interest-section').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// ================= SCROLL HANDLING =================

function handleScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }

    const hero = document.querySelector('.hero-image');
    if (hero) {
        hero.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
}

// ================= LOAD PLACES =================

async function loadPlaces() {
    if (isLoading) return;

    try {
        isLoading = true;
        showLoading();

        const response = await fetch(API_URL, {
            headers:{
                "Authorization":"Bearer " + localStorage.getItem("jwtToken")
            }
        });

        if (!response.ok) throw new Error("Failed to fetch places");

        allPlaces = await response.json();
        displayPlaces(allPlaces);

    } catch (error) {
        showError("Unable to load places. Please try again.");
        console.error(error);
    } finally {
        isLoading = false;
    }
}

// ================= SEARCH PLACES =================

function searchPlaces() {
    const keyword = searchInput.value.toLowerCase().trim();

    if (keyword === "") {
        displayPlaces(allPlaces);
        return;
    }

    const filtered = allPlaces.filter(place =>
        place.name.toLowerCase().includes(keyword) ||
        (place.description && place.description.toLowerCase().includes(keyword)) ||
        (place.category && place.category.toLowerCase().includes(keyword)) ||
        (place.location && place.location.toLowerCase().includes(keyword))
    );

    displayPlaces(filtered);
}

// ================= FILTER PLACES =================

function filterPlaces() {
    let filteredPlaces = [...allPlaces];

    switch (currentFilter) {
        case 'recent':
            filteredPlaces = filteredPlaces.reverse();
            break;
        case 'popular':
            filteredPlaces = filteredPlaces.sort(() => Math.random() - 0.5);
            break;
        case 'all':
        default:
            break;
    }

    displayPlaces(filteredPlaces);
}

// ================= LOAD FAVORITES =================

async function loadFavorites() {
    try {
        const res = await fetch("http://localhost:8081/api/favorites", {
            headers: { "Authorization": "Bearer " + localStorage.getItem("jwtToken") }
        });

        const data = await res.json();
        userFavorites = data.map(f => f.placeId);
    } catch (err) {
        console.log("Favorite load error", err);
    }
}

// ================= DISPLAY PLACES =================

function displayPlaces(places) {
    container.innerHTML = "";

    if (places.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p style="margin-top: 20px;">No places found. Try a different search.</p>
            </div>
        `;
        return;
    }

    places.forEach((place, index) => {
        const card = document.createElement("div");
        card.classList.add("place-card");
        card.style.animationDelay = `${index * 0.1}s`;

        const isFav = userFavorites.includes(place.id);

        card.innerHTML = `
<img src="${place.image}" alt="${place.name}" loading="lazy">

<div class="place-title-row">
    <h3>${place.name}</h3>
    <span class="favorite-icon">${isFav ? '❤️' : '♡'}</span>
</div>

<p>${place.description || ''}</p>
`;

        const heart = card.querySelector(".favorite-icon");

        heart.addEventListener("click", function (e) {
            e.stopPropagation();

            fetch("http://localhost:8081/api/favorites", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("jwtToken")
                },
                body: JSON.stringify({ placeId: place.id })
            })
            .then(res => res.text())
            .then(data => {
                if (data.includes("Added")) {
                    heart.textContent = "❤️";
                    userFavorites.push(place.id);
                } else {
                    heart.textContent = "♡";
                    userFavorites = userFavorites.filter(id => id !== place.id);
                }
            })
            .catch(err => console.log(err));
        });

        card.addEventListener('click', () => handleCardClick(place));

        container.appendChild(card);
    });

    observeCards();
}

// ================= CARD CLICK HANDLER =================

function handleCardClick(place) {
    window.location.href = `place.html?id=${place.id}`;
}

// ================= LOADING STATE =================

function showLoading() {
    container.innerHTML = `
        <div class="loading" style="grid-column: 1/-1;">
            <p>Discovering mysterious places...</p>
        </div>
    `;
}

// ================= ERROR STATE =================

function showError(message) {
    container.innerHTML = `
        <div class="error" style="grid-column: 1/-1;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="margin-top: 20px;">${message}</p>
        </div>
    `;
}

// ================= INTERSECTION OBSERVER =================

let observer;

function setupIntersectionObserver() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
}

function observeCards() {
    const cards = document.querySelectorAll('.place-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// ================= UTILITY FUNCTIONS =================

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ================= ANIMATED STATS COUNTER =================

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateValue = (element, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                animateValue(target, 0, parseInt(target.dataset.count), 2000);
                statsObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => statsObserver.observe(stat));
}

// ================= PARTICLE ANIMATION =================

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particlesContainer.appendChild(particle);
    }
}

// ================= KEYBOARD NAVIGATION =================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

// ================= CONSOLE WELCOME MESSAGE =================

console.log('%c🏚️ ABANDONED WORLD', 'font-size: 24px; font-weight: bold; color: #f5d742;');
console.log('%cWelcome to the forgotten places...', 'font-size: 14px; color: #00bcd4;');
