# AI-Powered Solana NFT Studio for Mintonaire.io

A comprehensive web application for creating, managing, and generating NFT collections using AI-powered tools. This studio provides an end-to-end solution for NFT creators, from ideation to final package generation.

## 🚀 Features

### 🎨 AI Ideation Module
- **Smart Prompt Generation**: Generate creative art prompts using advanced LLM APIs
- **Metadata Generation**: Automatically create collection metadata with AI assistance
- **Style Presets**: Choose from various art styles and themes
- **Prompt Enhancement**: Refine and improve existing prompts

### 📝 Collection Management
- **Collection Configuration**: Set up collections with custom parameters
- **Batch Processing**: Process NFTs in configurable batch sizes
- **Progress Tracking**: Real-time monitoring of generation progress
- **Collection Statistics**: Detailed analytics and insights

### 🔄 Job Queue System
- **Resilient Processing**: SQLite-based job queue with retry mechanisms
- **Batch Management**: Handle initial and continued batch processing
- **Status Tracking**: Monitor job states (pending, processing, completed, failed)
- **Auto-retry**: Automatic retry for failed jobs

### 🖼️ Image Generation
- **AI Image Creation**: Integration with Stability AI and other image generation APIs
- **High-Quality Output**: Generate 1200x1200px images optimized for NFTs
- **Style Consistency**: Maintain consistent art style across collections
- **Preview & Approval**: Review and approve generated images before finalization

### ✅ Review & Approval System
- **Image Preview**: High-quality preview of generated images
- **Approve/Regenerate**: Easy approval or regeneration of individual NFTs
- **Batch Operations**: Bulk approve or regenerate multiple images
- **Quality Control**: Ensure only approved content makes it to final package

### 📦 Package Generation
- **Metaplex Compatible**: Generate metadata compatible with Solana's Metaplex standard
- **ZIP Packaging**: Create downloadable packages with images and metadata
- **Rarity Calculation**: Automatic rarity scoring based on attributes
- **README Generation**: Include detailed documentation with each package

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for data persistence
- **AI APIs**: OpenAI GPT-4, Google Gemini, Stability AI
- **File Processing**: Archiver for ZIP generation
- **Error Handling**: Comprehensive error management and logging

### Frontend
- **React** with modern hooks and functional components
- **Material-UI (MUI)** for consistent and beautiful UI
- **Axios** for API communication
- **Real-time Updates**: Polling-based status updates
- **Responsive Design**: Mobile-friendly interface

### Database Schema
- **Collections**: Store collection metadata and configuration
- **Jobs**: Track individual NFT generation jobs
- **Relationships**: Proper foreign key relationships and indexing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- API keys for AI services:
  - OpenAI API key (for text generation)
  - Stability AI API key (for image generation)
  - Google Gemini API key (optional, alternative LLM)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-nft-studio
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env file with your API keys and configuration
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env file with your configuration
```

### 4. Database Setup
```bash
cd ../backend
# Database will be automatically created on first run
# Ensure the database directory exists
mkdir -p ../database
```

## ⚙️ Configuration

### Backend Environment Variables

Edit `backend/.env` with your configuration:

```env
# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
STABILITY_AI_API_KEY=your_stability_ai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_PATH=../database/ai-nft-studio.db

# Server
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables

Edit `frontend/.env` with your configuration:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd backend
npm start
```
The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**:
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the Frontend**:
```bash
cd frontend
npm run build
```

2. **Start the Backend**:
```bash
cd backend
NODE_ENV=production npm start
```

## 📖 Usage Guide

### 1. AI Ideation
1. Navigate to the "AI Ideation" tab
2. Enter keywords or themes for your NFT collection
3. Click "Generate Prompts" to create AI-powered art prompts
4. Review and select your favorite prompts
5. Generate collection metadata using the selected prompts

### 2. Collection Setup
1. Go to the "Collection Form" tab
2. Fill in collection details (name, symbol, description, etc.)
3. Set the collection size and batch processing parameters
4. Configure royalties and creator information
5. Save the collection configuration

### 3. Job Management
1. Select a collection from the "Collections" tab
2. Click "Manage Jobs" to open the Job Manager
3. Start initial batch processing
4. Monitor progress in real-time
5. Review generated images and approve/regenerate as needed
6. Continue with additional batches until collection is complete

### 4. Package Generation
1. Once all images are approved, click "Generate Package"
2. Wait for the system to create metadata and package files
3. Download the ZIP package containing:
   - High-quality images (1200x1200px)
   - Metaplex-compatible JSON metadata files
   - Collection metadata
   - README with collection details

## 🔧 API Endpoints

### Collections
- `GET /api/collections` - List all collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/:id` - Get collection details
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection
- `POST /api/collections/:id/batch/initial` - Start initial batch
- `POST /api/collections/:id/batch/continue` - Continue batch processing
- `POST /api/collections/:id/package` - Generate package
- `GET /api/collections/:id/download` - Download package

### Jobs
- `GET /api/jobs` - List jobs with filtering
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `POST /api/jobs/:id/approve` - Approve job
- `POST /api/jobs/:id/regenerate` - Regenerate job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/stats` - Get job statistics

### AI Services
- `POST /api/ai/generate-prompt` - Generate art prompts
- `POST /api/ai/generate-metadata` - Generate collection metadata
- `POST /api/ai/generate-image` - Generate single image
- `POST /api/ai/test-connection` - Test AI API connections
- `POST /api/ai/validate-key` - Validate API keys

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure the database directory exists
   - Check file permissions
   - Verify DATABASE_PATH in .env file

2. **API Key Issues**
   - Verify all required API keys are set in .env
   - Test API connections using the built-in test endpoints
   - Check API key permissions and quotas

3. **Image Generation Failures**
   - Check Stability AI API key and quota
   - Verify image generation parameters
   - Review error logs for specific issues

4. **Frontend Connection Issues**
   - Ensure backend is running on correct port
   - Check CORS configuration
   - Verify API URLs in frontend .env

### Logs and Debugging

- Backend logs are available in the console and log files
- Enable debug mode by setting `LOG_LEVEL=debug` in backend .env
- Frontend errors are logged to browser console
- Use browser developer tools for network debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Stability AI for image generation
- Google for Gemini API
- Solana and Metaplex for NFT standards
- Material-UI team for the excellent component library

## 📞 Support

For support and questions:
- Email: support@mintonaire.io
- Discord: [Join our community](https://discord.gg/mintonaire)
- Twitter: [@mintonaire](https://twitter.com/mintonaire)

---

**Built with ❤️ for the NFT community by Mintonaire.io**