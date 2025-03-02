# Hyperliquid Grid

A modern, internationalized web application built with Next.js, featuring authentication, password reset functionality, and a responsive dashboard.

## Features

- **Authentication**: Secure sign-in and sign-up functionality
- **Internationalization**: Support for multiple languages (English, French, Spanish, German, Italian)
- **Password Management**: Forgot password and reset password flows
- **Responsive Dashboard**: User-friendly interface that works on all devices
- **Testing**: Comprehensive unit tests

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js
- **Database**: Prisma with SQLite (development) / PostgreSQL (production)
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Testing**: Jest (unit tests)
- **Email**: Nodemailer with Mailjet support

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dalidossodautais/hyperliquid_grid.git
   cd hyperliquid_grid
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. Set up the database:

   ```bash
   pnpm prisma migrate dev
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run unit tests with watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reusable components
│   ├── lib/                 # Utility functions and libraries
│   ├── locales/             # Internationalization files
│   └── types/               # TypeScript type definitions
├── tests/
│   └── unit/                # Unit tests with Jest
├── prisma/                  # Database schema and migrations
└── public/                  # Static assets
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for the deployment platform
- All open-source contributors whose libraries made this project possible
