# SecurityWeb - AI Traffic Violation Monitoring System

A comprehensive web dashboard built for hackathon that helps authorities monitor and analyze traffic violations using artificial intelligence. The system processes violation reports, displays interactive analytics, and provides real-time monitoring capabilities.

## 🚀 Features

- **Real-time Dashboard**: Interactive charts showing violation trends over time
- **Violation Analysis**: AI-powered traffic violation detection and categorization
- **Geographic Mapping**: Heatmaps and pin maps showing violation locations
- **Report Management**: System to handle pending, analyzed, and verified violation reports
- **Interactive Charts**: Violation distribution by type and temporal analysis
- **Responsive UI**: Modern interface with collapsible sidebar navigation

## 🛠️ Tech Stack

- **Frontend**: Nuxt.js 3 + Vue 3 + TypeScript
- **UI Framework**: Element Plus
- **Charts**: ECharts (vue-echarts) + Chart.js
- **Maps**: Leaflet with heatmap support
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS (utility classes)
- **Geocoding**: OpenStreetMap Nominatim API

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- Yarn package manager (recommended) or npm
- Firebase project with Firestore database configured

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd SecurityWeb
```

### 2. Install dependencies
```bash
# Using Yarn (recommended)
yarn install

# Or using npm
npm install

# Or using pnpm
pnpm install
```

### 3. Firebase Configuration
The application is already configured to connect to a Firebase project. The configuration is located in `composables/useFirebase.ts`. 

**Note**: For production use, you should:
1. Create your own Firebase project
2. Set up Firestore database
3. Replace the Firebase configuration with your own credentials
4. Move sensitive configuration to environment variables

### 4. Database Structure
The application expects a Firestore collection called `Envios` with documents containing:
```typescript
{
  status: string,           // 'analisado', 'verificado', 'recusado', etc.
  timestamp: Timestamp,     // Firebase timestamp
  date: any,               // Alternative date field
  infracao: {              // Violation data
    law_references: array, // Legal references for violations
    location: object       // Geographic coordinates
  },
  infracao_escolhida: string, // Selected violation type
  location: {              // Geographic location
    latitude: number,
    longitude: number
  }
}
```

## 🚀 Running the Application

### Development Server
Start the development server on `http://localhost:3000`:

```bash
# Using Yarn
yarn dev

# Using npm
npm run dev

# Using pnpm
pnpm dev
```

The application will automatically redirect from the home page to `/dashboard`.

### Production Build
Build the application for production:

```bash
# Using Yarn
yarn build

# Using npm
npm run build

# Using pnpm
pnpm build
```

Preview the production build:

```bash
# Using Yarn
yarn preview

# Using npm
npm run preview

# Using pnpm
pnpm preview
```

## 📱 Application Structure

### Pages
- **Dashboard** (`/dashboard`): Main analytics dashboard with charts and maps
- **Recent Reports** (`/recent`): List of recent violation reports with status management
- **Heatmap** (`/heatmap`): Dedicated heatmap visualization (placeholder)
- **Settings** (`/settings`): Application settings

### Components
- **Sidebar**: Collapsible navigation sidebar
- **VChartClient**: ECharts wrapper component for data visualization
- **ChartInfracoes**: Chart component for violation data
- **LayoutWrapper**: Layout wrapper component

### Key Features Explained

#### Dashboard Analytics
- **Temporal Analysis**: Line chart showing violations over time
- **Violation Distribution**: Pie chart breaking down violation types
- **Geographic Visualization**: Interactive map with violation location pins

#### Report Management
- View pending reports requiring review
- Display analyzed and verified violations
- Interactive cards with detailed violation information

## 🔧 Configuration

### Environment Variables
While the current setup uses hardcoded Firebase config, for production you should use environment variables:

```env
NUXT_FIREBASE_API_KEY=your_api_key
NUXT_FIREBASE_AUTH_DOMAIN=your_auth_domain
NUXT_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### Customization
- **Map Tiles**: Currently uses CartoDB dark theme tiles
- **Charts**: Configured for violation data but can be adapted for other metrics
- **UI Theme**: Uses a dark theme with Element Plus components

## 🐛 Troubleshooting

### Common Issues

1. **Maps not loading**: Ensure Leaflet CSS is properly imported
2. **Charts not displaying**: Verify ECharts components are properly registered
3. **Firebase connection**: Check console for Firebase configuration errors
4. **Build errors**: Ensure all dependencies are installed correctly

### Dependencies Note
- The app uses `leaflet.heat` for heatmap functionality
- Chart.js and ECharts are both included for different visualization needs
- Firebase v11 is used for the latest Firestore features

## 📊 Data Flow

1. **Data Collection**: Violation reports are stored in Firebase Firestore
2. **Processing**: Application fetches and processes violation data
3. **Analysis**: AI analysis results are stored with status tracking
4. **Visualization**: Processed data is displayed in charts and maps
5. **Management**: Authorities can review and verify violations

## 🤝 Contributing

This project was created for a hackathon. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project was developed for educational and hackathon purposes.

## 🆘 Support

For issues or questions about running the application:
1. Check the console for error messages
2. Verify Firebase connectivity
3. Ensure all dependencies are properly installed
4. Check that your Node.js version is compatible (v16+)
