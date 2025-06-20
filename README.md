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
