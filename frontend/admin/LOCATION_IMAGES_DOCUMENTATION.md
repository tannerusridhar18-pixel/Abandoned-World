# 📍 Location Coordinates & Multiple Images - Feature Documentation

## ✨ New Features Added

### 1. **Location Coordinates (Latitude & Longitude)**
Admin can now add precise GPS coordinates for each place.

### 2. **Multiple Images Upload**
Admin can add multiple image URLs for each place instead of just one.

---

## 🎯 Features Overview

### **Add Place Form - New Fields:**

1. **Location (City, Country)** ✅ Required
   - Example: "Pripyat, Ukraine"
   - Text input for human-readable location

2. **Latitude** ✅ Required
   - Example: 51.389167
   - Accepts decimal numbers
   - Can be positive or negative

3. **Longitude** ✅ Required
   - Example: 30.099444
   - Accepts decimal numbers
   - Can be positive or negative

4. **Multiple Images** ✅ At least 1 required
   - Add multiple image URLs
   - First image = Main/Primary image
   - Add more images with "Add Another Image" button
   - Remove images with ✕ button (except first one)

---

## 📊 Data Structure

### **Backend Should Accept:**

```json
{
  "name": "Chernobyl Nuclear Power Plant",
  "category": "Abandoned Hospitals",
  "location": "Pripyat, Ukraine",
  "latitude": 51.389167,
  "longitude": 30.099444,
  "description": "The site of the worst nuclear disaster in history...",
  "info": "The site of the worst nuclear disaster in history...",
  "image": "https://example.com/image1.jpg",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ]
}
```

### **Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Place name |
| `category` | String | Yes | Category (dropdown) |
| `location` | String | Yes | City, Country format |
| `latitude` | Number | Yes | GPS latitude (-90 to 90) |
| `longitude` | Number | Yes | GPS longitude (-180 to 180) |
| `description` | String | Yes | Full description |
| `info` | String | Yes | Same as description (for compatibility) |
| `image` | String | Yes | Main image URL (first from images array) |
| `images` | Array | Yes | Array of all image URLs |

---

## 🗺️ How to Get Coordinates

### **Method 1: Google Maps**
1. Go to https://maps.google.com
2. Search for the place
3. Right-click on the exact location
4. Click the coordinates that appear
5. They'll be copied to clipboard
6. Format: `51.389167, 30.099444`

### **Method 2: OpenStreetMap**
1. Go to https://www.openstreetmap.org
2. Search for location
3. Right-click → "Show address"
4. Coordinates shown in URL or on page

### **Method 3: Coordinates API (Advanced)**
```javascript
// If you want to add auto-lookup feature later:
async function getCoordinates(location) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${location}&format=json`
    );
    const data = await response.json();
    return {
        latitude: data[0].lat,
        longitude: data[0].lon
    };
}
```

---

## 🖼️ Multiple Images Feature

### **How It Works:**

1. **Add Place:**
   - Form starts with 1 image input
   - Click "Add Another Image" to add more
   - Each image has a remove button (except first one)
   - Submit sends all images as array

2. **Edit Place:**
   - Shows all existing images
   - Can add more or remove existing ones
   - First image is always the main image

3. **Display:**
   - Table shows image count: "3 images"
   - Main image used for thumbnails
   - Full array available for gallery views

### **Frontend Display Example:**

```javascript
// In explore page or place detail page:
const place = {
  name: "Abandoned Hospital",
  images: [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg"
  ]
};

// Show main image
<img src="${place.images[0]}" alt="Main">

// Show gallery
place.images.forEach(img => {
  // Create gallery item
});
```

---

## 🗄️ Backend Database Schema

### **Update Your Place Model:**

```java
@Entity
@Table(name = "places")
public class Place {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String category;
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String info;
    
    // Main image (for backward compatibility)
    @Column(name = "image")
    private String image;
    
    // Multiple images stored as JSON array
    @Column(columnDefinition = "JSON")
    private String images;
    
    // Getters and setters...
}
```

### **Alternative: Separate Images Table**

```java
@Entity
public class PlaceImage {
    @Id
    @GeneratedValue
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "place_id")
    private Place place;
    
    private String imageUrl;
    private Integer orderIndex;
    private Boolean isMain;
}
```

---

## 📱 Updated Admin Table Display

### **New Columns:**

| ID | Name | Category | Location | Coordinates | Images | Actions |
|----|------|----------|----------|-------------|--------|---------|
| #1 | Pripyat | Haunted | Pripyat, UA | 51.3892, 30.0994 | 5 images | Edit Delete |
| #2 | Hospital | Medical | Berlin, DE | 52.5200, 13.4050 | 3 images | Edit Delete |

---

## ✅ Validation Rules

### **Frontend Validation:**
- ✅ Location: Required, min 3 characters
- ✅ Latitude: Required, number between -90 and 90
- ✅ Longitude: Required, number between -180 and 180
- ✅ Images: At least 1 required, must be valid URL

### **Backend Validation:**
```java
@NotNull
@Min(-90)
@Max(90)
private Double latitude;

@NotNull
@Min(-180)
@Max(180)
private Double longitude;

@NotEmpty
@Size(min = 1)
private List<String> images;
```

---

## 🎨 UI Features

### **Image Input Styling:**
- Each image input has a remove button (✕)
- First image cannot be removed
- "Add Another Image" button at bottom
- Clean, modern interface
- Smooth animations on add/remove

### **Coordinates Display:**
- Shown in monospace font in table
- Format: `51.3892, 30.0994`
- Easy to copy for use in maps

---

## 🚀 Future Enhancements (Optional)

### **1. Image Preview:**
```javascript
function previewImage(url, index) {
    const preview = document.createElement('img');
    preview.src = url;
    preview.style.width = '100px';
    preview.style.height = '100px';
    preview.style.objectFit = 'cover';
    // Add to container
}
```

### **2. Map Picker:**
```javascript
// Integrate Leaflet or Google Maps
function openMapPicker() {
    // Show map modal
    // User clicks on location
    // Auto-fill lat/lng inputs
}
```

### **3. Image Upload (S3/Cloudinary):**
```javascript
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    
    return await response.json(); // { url: "..." }
}
```

### **4. Drag & Drop Image Reorder:**
```javascript
// Allow admin to drag images to reorder
// Update orderIndex in database
```

---

## 🧪 Testing Checklist

### **Add Place:**
- [ ] Can add place with 1 image
- [ ] Can add place with multiple images (3+)
- [ ] Latitude validation works (-90 to 90)
- [ ] Longitude validation works (-180 to 180)
- [ ] Location is required
- [ ] First image cannot be removed
- [ ] Can remove additional images
- [ ] Form submits correctly
- [ ] Data saved to backend correctly

### **Edit Place:**
- [ ] Existing images load correctly
- [ ] Can add more images
- [ ] Can remove existing images (except first)
- [ ] Can update coordinates
- [ ] Changes save correctly

### **Display:**
- [ ] Table shows coordinates correctly
- [ ] Image count shows correctly
- [ ] Search works with new fields

---

## 📝 Sample Test Data

```javascript
// Test places with coordinates and multiple images:

const testPlaces = [
    {
        name: "Chernobyl Power Plant",
        category: "Abandoned Hospitals",
        location: "Pripyat, Ukraine",
        latitude: 51.389167,
        longitude: 30.099444,
        description: "Site of 1986 nuclear disaster",
        images: [
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
            "https://images.unsplash.com/photo-1565008576549-57569a49371d"
        ]
    },
    {
        name: "Beelitz-Heilstätten",
        category: "Abandoned Hospitals",
        location: "Beelitz, Germany",
        latitude: 52.2642,
        longitude: 12.9236,
        description: "Historic sanatorium complex",
        images: [
            "https://images.unsplash.com/photo-1557767667-3e99756cb1c3",
            "https://images.unsplash.com/photo-1571847269479-1f2c1ce6b6f4"
        ]
    }
];
```

---

## 🎯 Summary

**✅ Added:**
- Location coordinates (latitude/longitude)
- Multiple images per place
- Enhanced form validation
- Better table display
- Image count badge
- Add/Remove image functionality

**✅ Backend Requirements:**
- Accept `latitude` (Number, required)
- Accept `longitude` (Number, required)
- Accept `images` (Array of strings, required)
- Keep `image` field for backward compatibility

**✅ All Features Working:**
- Add place with coordinates + multiple images ✅
- Edit place with coordinates + multiple images ✅
- Display coordinates in table ✅
- Show image count ✅
- Search and filter work ✅

Your admin panel is now ready for location-based features and image galleries! 🚀
