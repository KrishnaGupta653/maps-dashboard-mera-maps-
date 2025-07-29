# 📍 Mera Maps: Warehouse Location Map Visualization

An interactive geospatial map visualization for visualizing warehouse locations, service areas, and order data like customer count, sales order count , volume or order value to support logistics planning and expansion decisions.

## 🧭 Overview

Mera Maps is a web-based map visualization built for Merapasu360 to address the challenge of visualizing and analyzing warehouse locations, their service areas, and order distribution. The platform transforms raw location data into an interactive map-based interface, enabling data-driven decisions for warehouse placement and logistics optimization.

### ⚙️ Key Features

- **Warehouse Visualization**: Display existing warehouses with detailed metadata, addresses, and service coverage areas
- **Pincode Mapping**: Highlight pincodes served by each warehouse with color-coded boundaries
- **Heatmaps**: Visualize order density based on customer count, sales orders, order value, or volume
- **New Warehouse Simulation**: Add and reposition hypothetical warehouse locations with real-time service area visualization
- **Interactive Controls**: Toggle layers and filter data dynamically
- **Service Zone Analysis**: Display 30km and 40km service radius circles for each warehouse


https://github.com/user-attachments/assets/774f79d0-7570-43c8-afe8-c256d05994fa




## 🏗️ Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: React Hooks (useState, useEffect, useCallback)

### Map Integration
- **Google Maps JavaScript API** with geometry, places, and visualization libraries
- **Google Maps Feature Layers** for pincode styling
- **Custom marker creation** with SVG paths

### Backend
- **Next.js Server Actions** for API integration
- **Google Auth Library** for secure API access
- **Data Sources**: 
  - Bazaar API (warehouse data)
  - Dhruvtara API (pincode data)
  - Suchnavali API (order data)

## 🛠️ Architecture

### Components
- `page.tsx`: Main map visualization component with state management and UI controls
- `GoogleMap.tsx`: Map initialization, marker creation, and layer rendering
- `layout.tsx`: Root layout with metadata and global styles

### Server Actions
- `bazaar.ts`: Warehouse data fetching and transformation
- `pincode.ts`: Pincode data retrieval and warehouse mapping
- `order.ts`: Order location data with pagination support
- `gauth.ts`: Google authentication and place ID management

### Data Flow
1. User interactions trigger state changes in the React components
2. Server actions fetch data from internal APIs
3. Data is transformed into standardized formats
4. Google Maps API renders updated visualizations
5. React state management ensures seamless UI updates


## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Google Cloud Project with Maps JavaScript API enabled
- API access to Bazaar, Dhruvtara, and Suchnavali services
- Google Service Account credentials

### Environment Variables
Create a `.env.local` file with:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAP_ID=your_google_map_id
BAZAAR_BASE_URL=
DHRUV_TARA_URL=
SUCHNAVALI_BASE_URL=
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Installation

```bash
# Clone the repository
git clone https://github.com/merapasu360/mera-maps.git
cd mera-maps

# Install dependencies
npm install

# Run development server
npm run dev
```


## 🚀 Usage

### Layer Controls
- **Warehouses**: Toggle warehouse markers and info cards
- **Pincodes**: Show/hide pincode boundaries (requires warehouses to be enabled)
- **Service Circles**: Display 30km and 40km service radius circles
- **Heatmaps**: Visualize order density based on selected metrics
- **New Warehouses**: Add and manipulate hypothetical warehouse locations

### Generating Heatmaps
1. Select a metric (Customer Count, Sales Order Count, Order Value, or Volume)
2. Set date range using DD/MM/YYYY format
3. Click "Generate Heatmap" to visualize order density

### Adding New Warehouses
1. Enable "New Warehouses" layer
2. Click the "+" button to add markers
3. Drag markers to reposition
4. View service areas and adjust coordinates manually if needed

### Viewing Details
- Click warehouse markers for detailed information
- Click pincode areas to see assignment details
- Use the legend panel for explanations of map elements


## License
This project is proprietary to Merapasu360 and intended for internal use only.
