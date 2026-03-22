// ================= AUTH CHECK =================

// Wait a moment for localStorage to be fully loaded
setTimeout(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("jwtToken");

    // Debug: Log auth status
    console.log('Auth Check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        role: role,
        localStorage: {
            jwtToken: localStorage.getItem("jwtToken") ? 'exists' : 'missing',
            userRole: localStorage.getItem("userRole") ? 'exists' : 'missing',
            userEmail: localStorage.getItem("userEmail") ? 'exists' : 'missing'
        }
    });

    if (!token) {
        console.error('No JWT token found - redirecting to login');
        alert('Please login first');
        window.location.href = "../html/login.html";
        return;
    }

    if (!role) {
        console.error('No user role found - redirecting to login');
        alert('No user role found. Please login again.');
        window.location.href = "../html/login.html";
        return;
    }

    // Check if role includes ADMIN (handles both "ADMIN" and "ROLE_ADMIN")
    const isAdmin = role.includes("ADMIN");
    
    if (!isAdmin) {
        console.error('User is not admin - redirecting to login');
        alert('Access denied. Admin privileges required.');
        window.location.href = "../html/login.html";
        return;
    }

    console.log('✅ Authentication successful - User is admin');
}, 100);

// ================= API CONFIGURATION =================

const API_BASE_URL = "http://localhost:8081/api";

const API_ENDPOINTS = {
    places: `${API_BASE_URL}/places`,
    categories: `${API_BASE_URL}/categories`,
    users: `${API_BASE_URL}/users`,
    submissions: `${API_BASE_URL}/submissions`,
    analytics: `${API_BASE_URL}/admin/analytics`
};

// ================= AUTH HEADER HELPER =================

function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    
    if (!token) {
        console.error('❌ No token available for API call');
        return {
            "Content-Type": "application/json"
        };
    }
    
    // Debug: Log the token being used (first 30 chars only for security)
    console.log('Using token:', token.substring(0, 30) + '...');
    
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ================= HANDLE 403 ERRORS =================

function handle403Error() {
    console.error('❌ 403 Forbidden - Token invalid or expired');
    
    // Don't immediately redirect - show message first
    const shouldRelogin = confirm('Your session has expired. Would you like to login again?');
    
    if (shouldRelogin) {
        localStorage.clear();
        window.location.href = '../html/login.html';
    }
}

// ================= STATE MANAGEMENT =================

let state = {
    places: [],
    categories: [],
    users: [],
    submissions: [],
    analytics: {},
    currentSection: 'dashboard'
};

// ================= DOM ELEMENTS =================

const contentArea = document.getElementById("contentArea");
const sectionTitle = document.getElementById("sectionTitle");
const breadcrumb = document.getElementById("breadcrumb");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const confirmDialog = document.getElementById("confirmDialog");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmBtn = document.getElementById("confirmBtn");
const toastContainer = document.getElementById("toastContainer");
const loadingOverlay = document.getElementById("loadingOverlay");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const refreshBtn = document.getElementById("refreshBtn");
const placesCountBadge = document.getElementById("placesCount");

// ================= INITIALIZATION =================

document.addEventListener("DOMContentLoaded", async function() {

    const token = localStorage.getItem("jwtToken");

    if (!token) {
        window.location.href = "../html/login.html";
        return;
    }

    setupEventListeners();

    await loadInitialData();

    loadSection('dashboard');
});

// ================= EVENT LISTENERS =================

function setupEventListeners() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.classList.contains('logout-btn')) {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) {
                    loadSection(section);
                }
            });
        }
    });

    // Logout button
    document.querySelector('.logout-btn')?.addEventListener('click', handleLogout);

    // Sidebar toggle
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Refresh button
    refreshBtn?.addEventListener('click', () => {
        loadSection(state.currentSection);
        showToast('Data refreshed successfully', 'success');
    });

    // Click outside sidebar to close on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// ================= LOAD INITIAL DATA =================

async function loadInitialData() {
    showLoading(true);
    try {
        await Promise.all([
            fetchPlaces(),
            fetchAnalytics()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data', 'error');
    } finally {
        showLoading(false);
    }
}

// ================= API CALLS =================

async function fetchPlaces() {
    try {
        console.log('Fetching places from:', API_ENDPOINTS.places);
        
        const response = await fetch(API_ENDPOINTS.places, {
            headers: getAuthHeaders()
        });
        
        console.log('Places response status:', response.status);
        
        if (response.status === 403) {
            handle403Error();
            return [];
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch places: ${response.status} ${response.statusText}`);
        }
        
        state.places = await response.json();
        console.log('Places loaded:', state.places.length);
        updatePlacesCount();
        return state.places;
    } catch (error) {
        console.error('Error fetching places:', error);
        state.places = [];
        return [];
    }
}

async function fetchAnalytics() {
    try {
        const response = await fetch(API_ENDPOINTS.analytics, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 403) {
            handle403Error();
            return calculateAnalyticsFromPlaces();
        }
        
        if (!response.ok) {
            // If analytics endpoint doesn't exist, calculate from places
            state.analytics = calculateAnalyticsFromPlaces();
            return state.analytics;
        }
        state.analytics = await response.json();
        return state.analytics;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        state.analytics = calculateAnalyticsFromPlaces();
        return state.analytics;
    }
}

function calculateAnalyticsFromPlaces() {
    const totalPlaces = state.places.length;
    const categories = [...new Set(state.places.map(p => p.category).filter(Boolean))];
    const locations = [...new Set(state.places.map(p => p.location).filter(Boolean))];
    
    return {
        totalPlaces,
        totalCategories: categories.length,
        totalUsers: 120, // Default value
        pendingSubmissions: 5, // Default value
        recentActivity: totalPlaces,
        popularCategories: categories.slice(0, 5)
    };
}

async function createPlace(placeData) {
    try {
        const response = await fetch(API_ENDPOINTS.places, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(placeData)
        });
        
        if (response.status === 403) {
            handle403Error();
            throw new Error('Authentication failed');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create place error:', errorText);
            throw new Error(`Failed to create place: ${response.status}`);
        }
        
        const newPlace = await response.json();
        state.places.push(newPlace);
        updatePlacesCount();
        return newPlace;
    } catch (error) {
        console.error('Error creating place:', error);
        throw error;
    }
}

async function updatePlace(id, placeData) {
    try {
        const response = await fetch(`${API_ENDPOINTS.places}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(placeData)
        });
        
        if (response.status === 403) {
            handle403Error();
            throw new Error('Authentication failed');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to update place: ${response.status}`);
        }
        
        const updatedPlace = await response.json();
        
        const index = state.places.findIndex(p => p.id == id || p._id == id);
        if (index !== -1) {
            state.places[index] = updatedPlace;
        }
        
        return updatedPlace;
    } catch (error) {
        console.error('Error updating place:', error);
        throw error;
    }
}

async function deletePlace(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.places}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.status === 403) {
            handle403Error();
            throw new Error('Authentication failed');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to delete place: ${response.status}`);
        }
        
        state.places = state.places.filter(p => p.id != id && p._id != id);
        updatePlacesCount();
        
        return true;
    } catch (error) {
        console.error('Error deleting place:', error);
        throw error;
    }
}

// ================= SECTION LOADING =================

function loadSection(section) {
    state.currentSection = section;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    // Update page title and breadcrumb
    const sectionNames = {
        dashboard: 'Dashboard',
        places: 'Manage Places',
        categories: 'Categories',
        users: 'Users',
        submissions: 'Submissions',
        analytics: 'Analytics',
        settings: 'Settings'
    };

    sectionTitle.textContent = sectionNames[section] || section;
    breadcrumb.innerHTML = `
        <span>Home</span>
        <span class="separator">/</span>
        <span class="current">${sectionNames[section]}</span>
    `;

    // Load section content
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'places':
            loadPlaces();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'users':
            loadUsers();
            break;
        case 'submissions':
            loadSubmissions();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
        default:
            loadDashboard();
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
    }
}

// ================= DASHBOARD =================

function loadDashboard() {
    const analytics = state.analytics;
    const recentPlaces = state.places.slice(-5).reverse();
    
    contentArea.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Places</span>
                    <div class="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${state.places.length}</div>
                <div class="stat-trend positive">
                    <span>↑ 12%</span>
                    <span>from last month</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Categories</span>
                    <div class="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"></path>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${analytics.totalCategories || 5}</div>
                <div class="stat-trend positive">
                    <span>↑ 2</span>
                    <span>new this month</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Total Users</span>
                    <div class="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${analytics.totalUsers || 120}</div>
                <div class="stat-trend positive">
                    <span>↑ 8%</span>
                    <span>from last month</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-label">Pending</span>
                    <div class="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="stat-value">${analytics.pendingSubmissions || 5}</div>
                <div class="stat-trend">
                    <span>Awaiting review</span>
                </div>
            </div>
        </div>

        <div class="section-header">
            <h2 class="section-title">Recent Places</h2>
            <button class="btn btn-ghost" onclick="loadSection('places')">View All</button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentPlaces.length > 0 ? recentPlaces.map(place => `
                        <tr>
                            <td><strong>${place.name}</strong></td>
                            <td>${place.category || 'Uncategorized'}</td>
                            <td>${place.location || 'Unknown'}</td>
                            <td><span class="badge">Active</span></td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                No places found. Add your first place to get started.
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

// ================= MANAGE PLACES =================

function loadPlaces() {
    const places = state.places;
    
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">All Places (${places.length})</h2>
            <button class="btn btn-primary" onclick="openAddPlace()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add New Place
            </button>
        </div>

        <div class="table-container">
            <div class="table-header">
                <div class="table-search">
                    <input type="text" 
                           class="search-input" 
                           id="placeSearch" 
                           placeholder="Search places..."
                           onkeyup="filterPlaces(this.value)">
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Coordinates</th>
                        <th>Images</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="placesTableBody">
                    ${renderPlacesTable(places)}
                </tbody>
            </table>
        </div>
    `;
}

function renderPlacesTable(places) {
    if (places.length === 0) {
        return `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No places found. Click "Add New Place" to create one.
                </td>
            </tr>
        `;
    }

    return places.map((place, index) => {
        const id = place.id || place._id || index + 1;
        const imageCount = place.images ? place.images.length : (place.image ? 1 : 0);
        const coordinates = place.latitude && place.longitude 
            ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
            : 'Not set';
        
        return `
            <tr>
                <td>#${id}</td>
                <td><strong>${place.name}</strong></td>
                <td>${place.category || 'Uncategorized'}</td>
                <td>${place.location || 'Unknown'}</td>
                <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">
                    ${coordinates}
                </td>
                <td>
                    <span class="badge">${imageCount} ${imageCount === 1 ? 'image' : 'images'}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="openEditPlace('${id}')">Edit</button>
                        <button class="action-btn delete" onclick="confirmDeletePlace('${id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterPlaces(searchTerm) {
    const filtered = state.places.filter(place => 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (place.category && place.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (place.location && place.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    document.getElementById('placesTableBody').innerHTML = renderPlacesTable(filtered);
}

// ================= ADD PLACE =================

function openAddPlace() {
    modalTitle.textContent = "Add New Place";
    modalBody.innerHTML = `
        <form id="addPlaceForm" onsubmit="handleAddPlace(event)">
            <div class="form-group">
                <label class="form-label">Place Name *</label>
                <input type="text" 
                       class="form-input" 
                       id="placeName" 
                       placeholder="Enter place name"
                       required>
            </div>

            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-select" id="placeCategory" required>
                    <option value="">Select category</option>
                    <option value="Haunted Places">👻 Haunted Places</option>
                    <option value="Abandoned Places">🏥 Abandoned Places</option>
                    <option value="Historical Sites">🚇 Historical sites</option>
                    <option value="Lost cities">⚔️ Lost Cities</option>
                    <option value="Mysterious Places">🏝️ Mysterious Places</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Location (City, Country) *</label>
                <input type="text" 
                       class="form-input" 
                       id="placeLocation" 
                       placeholder="e.g., Pripyat, Ukraine"
                       required>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Latitude *</label>
                    <input type="number" 
                           class="form-input" 
                           id="placeLatitude" 
                           placeholder="e.g., 51.389167"
                           step="any"
                           required>
                    <small style="color: var(--text-tertiary); font-size: 12px; margin-top: 4px; display: block;">
                        Use Google Maps to find coordinates
                    </small>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Longitude *</label>
                    <input type="number" 
                           class="form-input" 
                           id="placeLongitude" 
                           placeholder="e.g., 30.099444"
                           step="any"
                           required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Description *</label>
                <textarea class="form-textarea" 
                          id="placeDescription" 
                          placeholder="Describe this place..."
                          required></textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Images *</label>
                <div class="image-upload-container">
                    <div id="imageUrlsContainer">
                        <div class="image-url-input">
                            <input type="url" 
                                   class="form-input" 
                                   placeholder="https://example.com/image1.jpg"
                                   data-image-index="0"
                                   required>
                            <button type="button" class="btn-icon-remove" onclick="removeImageUrl(0)" style="display: none;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-ghost" onclick="addImageUrl()" style="width: 100%; margin-top: 10px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Another Image
                    </button>
                </div>
                <small style="color: var(--text-tertiary); font-size: 12px; margin-top: 8px; display: block;">
                    Add multiple image URLs. First image will be the main image.
                </small>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Place</button>
            </div>
        </form>
    `;
    
    openModal();
}

// Global counter for image inputs
let imageInputCounter = 1;

function addImageUrl() {
    const container = document.getElementById('imageUrlsContainer');
    const newInput = document.createElement('div');
    newInput.className = 'image-url-input';
    newInput.innerHTML = `
        <input type="url" 
               class="form-input" 
               placeholder="https://example.com/image${imageInputCounter + 1}.jpg"
               data-image-index="${imageInputCounter}">
        <button type="button" class="btn-icon-remove" onclick="removeImageUrl(${imageInputCounter})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    container.appendChild(newInput);
    imageInputCounter++;
}

function removeImageUrl(index) {
    const inputs = document.querySelectorAll('.image-url-input');
    if (inputs.length > 1) {
        const inputToRemove = document.querySelector(`[data-image-index="${index}"]`).closest('.image-url-input');
        inputToRemove.remove();
    } else {
        showToast('At least one image is required', 'warning');
    }
}

async function handleAddPlace(event) {
    event.preventDefault();
    
    // Collect all image URLs
    const imageInputs = document.querySelectorAll('#imageUrlsContainer input[type="url"]');
    const images = Array.from(imageInputs)
        .map(input => input.value.trim())
        .filter(url => url !== '');
    
    if (images.length === 0) {
        showToast('At least one image is required', 'error');
        return;
    }
    
    const placeData = {
        name: document.getElementById('placeName').value,
        category: document.getElementById('placeCategory').value,
        location: document.getElementById('placeLocation').value,
        latitude: parseFloat(document.getElementById('placeLatitude').value),
        longitude: parseFloat(document.getElementById('placeLongitude').value),
        description: document.getElementById('placeDescription').value,
        info: document.getElementById('placeDescription').value,
        image: images[0], // Main image (backward compatibility)
        images: images    // All images array
    };

    showLoading(true);
    try {

    const newPlace = await createPlace(placeData);

    // Save additional images
    if(images.length > 1){

        for(let i = 1; i < images.length; i++){

            await fetch("http://localhost:8081/api/place-images",{
                method:"POST",
                headers:getAuthHeaders(),
                body:JSON.stringify({
                    placeId:newPlace.id,
                    imageUrl:images[i]
                })
            });

        }

    }

    closeModal();
    showToast('Place added successfully!', 'success');
    loadPlaces();
    imageInputCounter = 1;

}catch (error) {
        showToast('Failed to add place. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// ================= EDIT PLACE =================

function openEditPlace(id) {
    const place = state.places.find(p => p.id === id || p._id === id || p.id == id);
    
    if (!place) {
        showToast('Place not found', 'error');
        return;
    }

    // Get existing images
    const existingImages = place.images || (place.image ? [place.image] : []);
    
    // Generate image inputs HTML
    let imageInputsHtml = '';
    if (existingImages.length > 0) {
        existingImages.forEach((img, idx) => {
            imageInputsHtml += `
                <div class="image-url-input">
                    <input type="url" 
                           class="form-input" 
                           value="${img}"
                           placeholder="https://example.com/image${idx + 1}.jpg"
                           data-image-index="${idx}">
                    <button type="button" class="btn-icon-remove" onclick="removeImageUrl(${idx})" ${idx === 0 ? 'style="display: none;"' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        });
        imageInputCounter = existingImages.length;
    } else {
        imageInputsHtml = `
            <div class="image-url-input">
                <input type="url" 
                       class="form-input" 
                       placeholder="https://example.com/image1.jpg"
                       data-image-index="0"
                       required>
                <button type="button" class="btn-icon-remove" onclick="removeImageUrl(0)" style="display: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        imageInputCounter = 1;
    }

    modalTitle.textContent = "Edit Place";
    modalBody.innerHTML = `
        <form id="editPlaceForm" onsubmit="handleEditPlace(event, '${id}')">
            <div class="form-group">
                <label class="form-label">Place Name *</label>
                <input type="text" 
                       class="form-input" 
                       id="placeName" 
                       value="${place.name}"
                       required>
            </div>

            <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-select" id="placeCategory" required>
                    <option value="">Select category</option>
                    <option value="Haunted Places" ${place.category === 'Haunted Places' ? 'selected' : ''}>👻 Haunted Places</option>
                    <option value="Abandoned Places" ${place.category === 'Abandoned Places' ? 'selected' : ''}>🏥 Abandoned Places</option>
                    <option value="Historical Places" ${place.category === 'Historical Places' ? 'selected' : ''}>🚇 Historical Places</option>
                    <option value="Lost cities" ${place.category === 'Lost cities' ? 'selected' : ''}>⚔️ Lost cities</option>
                    <option value="Mysterious Places" ${place.category === 'Mysterious Places' ? 'selected' : ''}>🏝️ Mysterious Places</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Location (City, Country) *</label>
                <input type="text" 
                       class="form-input" 
                       id="placeLocation" 
                       value="${place.location || ''}"
                       required>
            </div>

            <div class="form-row">
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Latitude *</label>
                    <input type="number" 
                           class="form-input" 
                           id="placeLatitude" 
                           value="${place.latitude || ''}"
                           step="any"
                           required>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="form-label">Longitude *</label>
                    <input type="number" 
                           class="form-input" 
                           id="placeLongitude" 
                           value="${place.longitude || ''}"
                           step="any"
                           required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Description *</label>
                <textarea class="form-textarea" 
                          id="placeDescription"
                          required>${place.description || place.info || ''}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">Images *</label>
                <div class="image-upload-container">
                    <div id="imageUrlsContainer">
                        ${imageInputsHtml}
                    </div>
                    <button type="button" class="btn btn-ghost" onclick="addImageUrl()" style="width: 100%; margin-top: 10px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Another Image
                    </button>
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Place</button>
            </div>
        </form>
    `;
    
    openModal();
}

async function handleEditPlace(event, id) {
    event.preventDefault();
    
    // Collect all image URLs
    const imageInputs = document.querySelectorAll('#imageUrlsContainer input[type="url"]');
    const images = Array.from(imageInputs)
        .map(input => input.value.trim())
        .filter(url => url !== '');
    
    if (images.length === 0) {
        showToast('At least one image is required', 'error');
        return;
    }
    
    const placeData = {
        name: document.getElementById('placeName').value,
        category: document.getElementById('placeCategory').value,
        location: document.getElementById('placeLocation').value,
        latitude: parseFloat(document.getElementById('placeLatitude').value),
        longitude: parseFloat(document.getElementById('placeLongitude').value),
        description: document.getElementById('placeDescription').value,
        info: document.getElementById('placeDescription').value,
        image: images[0], // Main image (backward compatibility)
        images: images    // All images array
    };

    showLoading(true);
    try {
        await updatePlace(id, placeData);
        closeModal();
        showToast('Place updated successfully!', 'success');
        loadPlaces();
        imageInputCounter = 1; // Reset counter
    } catch (error) {
        showToast('Failed to update place. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// ================= DELETE PLACE =================

function confirmDeletePlace(id) {
    const place = state.places.find(p => p.id === id || p._id === id || p.id == id);
    
    if (!place) {
        showToast('Place not found', 'error');
        return;
    }

    confirmTitle.textContent = "Delete Place?";
    confirmMessage.textContent = `Are you sure you want to delete "${place.name}"? This action cannot be undone.`;
    
    confirmBtn.onclick = async () => {
        closeConfirmDialog();
        showLoading(true);
        try {
            await deletePlace(id);
            showToast('Place deleted successfully!', 'success');
            loadPlaces();
        } catch (error) {
            showToast('Failed to delete place. Please try again.', 'error');
        } finally {
            showLoading(false);
        }
    };
    
    openConfirmDialog();
}

// ================= OTHER SECTIONS =================

function loadCategories() {
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Categories Management</h2>
            <button class="btn btn-primary">Add Category</button>
        </div>
        <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.5;">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"></path>
            </svg>
            <h3 style="font-size: 20px; margin-bottom: 10px;">Categories Module</h3>
            <p>Category management features coming soon...</p>
        </div>
    `;
}

function loadUsers() {
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">User Management</h2>
            <button class="btn btn-primary">Add User</button>
        </div>
        <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.5;">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            </svg>
            <h3 style="font-size: 20px; margin-bottom: 10px;">User Management</h3>
            <p>User management features coming soon...</p>
        </div>
    `;
}

function loadSubmissions() {
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Pending Submissions</h2>
        </div>
        <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.5;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <h3 style="font-size: 20px; margin-bottom: 10px;">Submissions Module</h3>
            <p>Submission approval features coming soon...</p>
        </div>
    `;
}

function loadAnalytics() {
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Analytics & Insights</h2>
        </div>
        <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.5;">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
            <h3 style="font-size: 20px; margin-bottom: 10px;">Analytics Dashboard</h3>
            <p>Advanced analytics features coming soon...</p>
        </div>
    `;
}

function loadSettings() {
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">System Settings</h2>
        </div>
        <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.5;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6"></path>
            </svg>
            <h3 style="font-size: 20px; margin-bottom: 10px;">Settings Panel</h3>
            <p>System settings features coming soon...</p>
        </div>
    `;
}

// ================= MODAL FUNCTIONS =================

function openModal() {
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

function openConfirmDialog() {
    confirmDialog.classList.add('active');
}

function closeConfirmDialog() {
    confirmDialog.classList.remove('active');
}

// ================= TOAST NOTIFICATIONS =================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= LOADING OVERLAY =================

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// ================= UTILITY FUNCTIONS =================

function updatePlacesCount() {
    if (placesCountBadge) {
        placesCountBadge.textContent = state.places.length;
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");

        showToast('Logging out...', 'success');

        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 1000);
    }
}
function addExtraImage(){

 const placeId = document.getElementById("placeId").value;
 const imageUrl = document.getElementById("extraImageUrl").value;

 if(!placeId || !imageUrl){
   alert("Place ID and Image URL required");
   return;
 }

 fetch("http://localhost:8081/api/place-images",{
   method:"POST",
   headers:{
     "Content-Type":"application/json",
     "Authorization":"Bearer " + localStorage.getItem("jwtToken")
   },
   body: JSON.stringify({
     placeId: parseInt(placeId),
     imageUrl: imageUrl
   })
 })
 .then(res=>res.json())
 .then(data=>{
   console.log("Image added:",data);
   alert("Image added successfully!");
 });

}
// ================= CONSOLE MESSAGE =================

console.log('%c🏚️ ABANDONED WORLD ADMIN', 'font-size: 20px; font-weight: bold; color: #00ff9d;');
console.log('%cAdmin Panel Loaded Successfully', 'font-size: 14px; color: #00d4ff;');
console.log(`%cAPI Base URL: ${API_BASE_URL}`, 'font-size: 12px; color: #666;');
