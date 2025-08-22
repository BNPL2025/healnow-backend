# HealNow Backend

A TypeScript-based backend project for HealNow application.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.example` to `.env` and fill in your configuration values.

### Development

Run the development server:
```bash
npm run dev
```

### Building for Production

Build the TypeScript code:
```bash
npm run build
```

Run the production server:
```bash
npm start
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Clean build directory

## Project Structure

```
src/
├── db/           # Database connection
├── middlewares/  # Express middlewares
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── app.ts        # Express app configuration
├── constants.ts  # Application constants
└── index.ts      # Application entry point
```