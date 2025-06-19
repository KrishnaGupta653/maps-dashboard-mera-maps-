# 📍 Mera Maps: Warehouse Location 

An interactive geospatial dashboard for visualizing warehouse locations, service areas, and order data to support logistics planning and expansion decisions.

## 🧭 Overview

Mera Maps is a web-based dashboard built for Merapasu360 to address the challenge of visualizing and analyzing warehouse locations, their service areas, and order distribution. The platform transforms raw location data into an interactive map-based interface, enabling data-driven decisions for warehouse placement and logistics optimization.

### ⚙️ Key Features

- **Warehouse Visualization**: Display existing warehouses with detailed metadata, addresses, and service coverage areas
- **Pincode Mapping**: Highlight pincodes served by each warehouse with color-coded boundaries
- **Order Heatmaps**: Visualize order density based on customer count, sales orders, order value, or volume
- **New Warehouse Simulation**: Add and reposition hypothetical warehouse locations with real-time service area visualization
- **Interactive Controls**: Toggle layers and filter data dynamically
- **Service Zone Analysis**: Display 30km and 40km service radius circles for each warehouse

<img width="954" alt="4" src="https://github.com/user-attachments/assets/8906dab5-083a-41ab-982c-8c017f7a55ef" />
<img width="950" alt="3" src="https://github.com/user-attachments/assets/f73bd99a-f074-460b-8010-516980b1c549" />
<img width="950" alt="2" src="https://github.com/user-attachments/assets/48cbf4e7-d29a-4260-8042-759440d80984" />
<img width="955" alt="1" src="https://github.com/user-attachments/assets/a7349d7c-f6bc-4a16-ab0d-b39d548290d9" />


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
- `page.tsx`: Main dashboard component with state management and UI controls
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

### Implementation Details

┌────────────────────────┐     User Input     ┌────────────────────┐    Data Fetch     ┌────────────────────────┐
│        Browser         │  (Toggles, Dates,  │     Next.js App     │◄─────────────────►│     Actions Layer       │
│    (React + Tailwind)  │   Metrics, Map)    │  (page.tsx, hooks)  │   useEffect/API   │  (bazaar.ts, order.ts)  │
└────────────┬───────────┘                   └────────────┬────────┘                    └────────────┬───────────┘
             │                                             │                                         │
             ▼                                             ▼                                         ▼
   ┌────────────────────┐                     ┌────────────────────────────┐          ┌────────────────────────────┐
   │    UI Controls     │                     │     GoogleMap.tsx          │          │   External APIs / DB        │
   │  (Heatmap toggle,  │ ───── triggers ───▶ │     Map Initialization     │ ───────▶ │ (Warehouse, Pincode, Order) │
   │   warehouse view)  │                     │     Marker & Layer Logic   │          │  JSON response via fetch    │
   └────────────────────┘                     └────────────────────────────┘          └────────────────────────────┘
                                                          │
                                                          ▼
                                            ┌────────────────────────────┐
                                            │ Google Maps JS API         │
                                            │ (Maps, Markers, Heatmaps)  │
                                            └────────────────────────────┘
                                                          │
                                              Rendered onto <div ref={map}>



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
BAZAAR_BASE_URL=https://bazaar.merapasu360.com
DHRUV_TARA_URL=https://dhruvtara.merapasu360.com
SUCHNAVALI_BASE_URL=https://suchnavali.merapasu360.com
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
