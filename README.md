# Solana NFT Collection Generator (Direct Image Mode)

A full-stack web application for creating metadata and organizing asset files for Solana NFT collections using pre-made art. This tool generates Metaplex-compliant JSON metadata files and prepares collections for upload to IPFS/Arweave and use with Metaplex Candy Machine.

## Features

- **Collection Configuration**: Define collection-wide metadata including name, symbol, description, royalties, and creator information
- **Rarity Management**: Create multiple rarity tiers (1/1, limited, common) with configurable edition counts
- **Batch Processing**: Upload multiple images per tier and automatically generate numbered NFT metadata
- **Advanced Options**: 
  - Randomize output order
  - Calculate color palette extraction
  - Generate SHA256 hashes
- **Export Ready**: Generates downloadable ZIP with `/images` and `/json` folders ready for IPFS upload

## Project Structure

```
NFTCreator/
├── frontend/          # React.js frontend application
├── backend/           # Node.js Express API server
└── README.md         # This file
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Technology Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **File Processing**: Multer for uploads, JSZip for archives
- **Image Processing**: Sharp for manipulation, get-image-colors for palette extraction

## Workflow

1. **Configure Collection**: Fill out collection details form
2. **Define Rarity & Upload Art**: Set up rarity tiers and upload corresponding images
3. **Generate & Download**: Process everything and download the ready-to-use collection files

## Metaplex Compliance

Generated metadata follows the Metaplex NFT standard with proper structure for:
- Collection information
- Creator royalties
- Attribute arrays
- File references
- IPFS placeholder URIs