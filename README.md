# LUME - AI-Powered Dermatology Platform

## Overview
LUME is a cutting-edge medical AI platform specializing in advanced dermatological diagnostics, integrating AI-powered analysis with expert human validation to ensure highest quality patient care.

### Key Features
- **AI-Powered Skin Analysis**: Advanced CNN models with GPT-4o enhanced medical analysis
- **Expert Validation System**: Comprehensive review workflow with real-time notifications
- **Patient Management**: Complete patient records and appointment scheduling
- **Medication Management**: Integrated pharmacy and prescription system
- **Mobile Support**: Hybrid mobile app using Capacitor
- **Secure Authentication**: Role-based access control (Patients, Doctors, Experts)

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Wouter for routing
- TanStack Query for state management
- Capacitor for mobile deployment

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- Passport.js authentication
- AI Analysis APIs (OpenAI GPT-4o, Anthropic Claude, Hugging Face)

### AI & Analysis
- Custom CNN model for skin condition detection
- Multi-model AI analysis (OpenAI, Anthropic, Hugging Face)
- Expert validation workflow
- Real-time analysis results

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- API keys for AI services

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd lume-dermatology

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys and database URL

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables
```
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

## User Roles

### Patients
- Upload skin images for analysis
- View expert-validated results
- Manage appointments and prescriptions
- Access medical history

### Doctors/Experts
- Review and validate AI analyses
- Provide expert comments and modifications
- Manage patient records
- Prescribe medications

## Features

### Skin Analysis Workflow
1. Patient uploads skin image
2. AI models analyze condition
3. Expert reviews and validates results
4. Patient receives validated diagnosis
5. Treatment recommendations provided

### Expert Validation
- Pending analyses queue
- Detailed review interface
- Approve/modify/reject options
- Expert comments system

### Patient Management
- Complete medical profiles
- Appointment scheduling
- Prescription management
- Analysis history tracking

## Deployment

### Web Deployment
```bash
npm run build
# Deploy to your preferred hosting platform
```

### Mobile Deployment
```bash
# iOS
npm run ios

# Android
npm run android
```

## API Documentation

### Authentication Endpoints
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout

### Analysis Endpoints
- `GET /api/skin-analyses` - List analyses
- `POST /api/skin-analyses` - Create analysis
- `PUT /api/skin-analyses/:id` - Update analysis

### Validation Endpoints
- `GET /api/analysis-validations/pending` - Pending validations
- `POST /api/analysis-validations` - Create validation
- `PUT /api/analysis-validations/:id` - Update validation

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use proper error handling
3. Maintain database schema consistency
4. Follow UI/UX design patterns
5. Test with multiple user roles

### Testing Credentials
- Patient: `patient_test` / `patient123`
- Expert: `expert` / `expert123`

## Security

- Secure authentication with session management
- Role-based access control
- API endpoint protection
- Medical data privacy compliance
- Encrypted communication

## License
Medical AI Platform - All Rights Reserved

## Support
For technical support or medical inquiries, contact the development team.

---

**LUME - Bringing Brightness to Dermatological Care**