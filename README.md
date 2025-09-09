# 🎨 Solana NFT Collection Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Una aplicación web full-stack para crear metadatos y organizar archivos de activos para colecciones NFT de Solana usando arte pre-hecho. Esta herramienta genera archivos de metadatos JSON compatibles con Metaplex y prepara colecciones para subir a IPFS/Arweave y usar con Metaplex Candy Machine.

## ✨ Características

- **🔧 Configuración de Colección**: Define metadatos de toda la colección incluyendo nombre, símbolo, descripción, regalías e información del creador
- **🎯 Gestión de Rareza**: Crea múltiples niveles de rareza (1/1, limitado, común) con conteos de edición configurables
- **📦 Procesamiento por Lotes**: Sube múltiples imágenes por nivel y genera automáticamente metadatos NFT numerados
- **⚙️ Opciones Avanzadas**: 
  - Aleatorizar orden de salida
  - Extracción de paleta de colores
  - Generar hashes SHA256
- **📤 Listo para Exportar**: Genera ZIP descargable con carpetas `/images` y `/json` listas para subir a IPFS

## 📁 Estructura del Proyecto

```
NFTCreator/
├── frontend/                 # Aplicación frontend React.js
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── App.js          # Componente principal
│   │   └── index.js        # Punto de entrada
│   ├── public/
│   └── package.json
├── backend/                 # Servidor API Node.js Express
│   ├── server.js           # Servidor principal
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Configuración del Backend
```bash
cd backend
npm install
npm start
```
El servidor estará disponible en `http://localhost:5000`

### Configuración del Frontend
```bash
cd frontend
npm install
npm start
```
La aplicación estará disponible en `http://localhost:3000`

## 🛠️ Stack Tecnológico

- **Frontend**: React.js con Material-UI
- **Backend**: Node.js con Express.js
- **Procesamiento de Archivos**: Multer para uploads, JSZip para archivos
- **Procesamiento de Imágenes**: Sharp para manipulación, get-image-colors para extracción de paleta
- **Compatibilidad**: Metaplex Standard para Solana NFTs

## 📋 Flujo de Trabajo

1. **🔧 Configurar Colección**: Completa el formulario de detalles de la colección
2. **🎨 Definir Rareza y Subir Arte**: Configura niveles de rareza y sube las imágenes correspondientes
3. **⚡ Generar y Descargar**: Procesa todo y descarga los archivos de colección listos para usar

## 📝 Ejemplo de Uso

### Configuración de Colección
```json
{
  "name": "Mi Colección NFT",
  "symbol": "MCN",
  "description": "Una colección única de arte digital",
  "seller_fee_basis_points": 500,
  "external_url": "https://mi-sitio.com",
  "creators": [
    {
      "address": "Tu_Wallet_Address_Aqui",
      "share": 100
    }
  ]
}
```

### Estructura de Salida
```
collection-export.zip
├── images/
│   ├── 0.png
│   ├── 1.png
│   └── ...
└── json/
    ├── 0.json
    ├── 1.json
    └── ...
```

## 🔌 API Endpoints

### POST `/api/generate`
Genera la colección NFT con metadatos y archivos

**Parámetros:**
- `collectionData`: Datos de configuración de la colección
- `rarityPlans`: Array de planes de rareza
- `files`: Archivos de imagen subidos
- `options`: Opciones avanzadas (randomize, extractColors, generateHashes)

**Respuesta:**
- Archivo ZIP con imágenes y metadatos JSON

### GET `/api/health`
Verifica el estado del servidor

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Reconocimientos

- [Metaplex](https://www.metaplex.com/) por el estándar de metadatos
- [Solana](https://solana.com/) por la blockchain
- Comunidad de desarrolladores de Solana NFT

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un [Issue](https://github.com/diegogalmarini/solana-nft-collection-generator/issues)
- Contacta al desarrollador: [@diegogalmarini](https://github.com/diegogalmarini)

---

**¡Hecho con ❤️ para la comunidad de Solana NFT!**

## Metaplex Compliance

Generated metadata follows the Metaplex NFT standard with proper structure for:
- Collection information
- Creator royalties
- Attribute arrays
- File references
- IPFS placeholder URIs