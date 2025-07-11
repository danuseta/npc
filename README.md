# 🛒 NPC E-Commerce Platform

A full-stack e-commerce platform built with modern web technologies, featuring real-time package tracking, integrated payment gateway, and comprehensive order management system.

## 🚀 Features

- **E-Commerce Core**: Product catalog, shopping cart, order management
- **Real-time Tracking**: Binderbyte API integration for package tracking
- **Payment Gateway**: Midtrans integration for secure payments  
- **Shipping Calculator**: Biteship API for shipping rates
- **Admin Panel**: Complete order and product management
- **Image Management**: Cloudinary integration for media storage
- **Mobile First**: Responsive design optimized for all devices
- **Review System**: Customer feedback and rating system

## 🛠️ Tech Stack

### Frontend
- **React.js** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Tailwind CSS components
- **Axios** - HTTP client for API requests
- **React Router** - Client-side routing
- **SweetAlert2** - Beautiful alert dialogs

### Backend
- **Express.js** - Node.js web framework
- **MySQL** - Relational database
- **Sequelize** - ORM for MySQL
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing

### External APIs
- **Binderbyte** - Package tracking API
- **Biteship** - Shipping rate calculator
- **Cloudinary** - Image storage and optimization
- **Midtrans** - Payment gateway

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone Repository
```bash
git clone [repository-url]
cd npc
```

### 2. Database Setup
1. Create MySQL database named `npc`
2. Import the provided SQL file:
```bash
mysql -u [username] -p npc < npc.sql
```

### 3. Server Setup
```bash
cd server
npm install
```

Create `.env` file in server directory (see `.env.example`):
```bash
cp .env.example .env
```

Start development server:
```bash
npm run dev
```
Server will run on: `http://localhost:5000`

### 4. Client Setup
```bash
cd client
npm install
```

Create `.env` file in client directory (see `.env.example`):
```bash
cp .env.example .env
```

Start development server:
```bash
npm start
```
Client will run on: `http://localhost:3000`

## 👥 Demo Users

### Buyer Account
- **Email**: `geveve9340@buides.com`
- **Password**: `Test1234`
- **Access**: Customer features, order tracking, reviews

### Admin Account  
- **Email**: `admin@npc.com`
- **Password**: `admin123`
- **Access**: Order management, product management

### Super Admin Account
- **Email**: `admin@npcnusantara.com`
- **Password**: `admin123`
- **Access**: Full system administration


## 🚀 Quick Start

1. **Setup Database**: Import `npc.sql` to MySQL
2. **Configure Environment**: Copy and fill `.env.example` files
3. **Start Server**: `cd server && npm run dev`
4. **Start Client**: `cd client && npm start`
5. **Access Application**: Open `http://localhost:3000`

## 📱 Key Features

### 🛍️ E-Commerce Features
- Product browsing and search
- Shopping cart management
- Secure checkout process
- Order history and tracking
- Product reviews and ratings

### 📦 Package Tracking
- **Real-time Tracking**: Binderbyte API integration
- **Auto-update**: Order status updates when delivered
- **Fallback System**: Alternative tracking when primary fails
- **Supported Couriers**: JNE, J&T, SiCepat, POS, TIKI, AnterAja, Wahana, Ninja Express, Lion Parcel

### 💳 Payment Integration
- Midtrans payment gateway
- Multiple payment methods
- Secure transaction processing
- Real-time payment status updates

### 🚛 Shipping Calculator
- Biteship integration for accurate shipping rates
- Multiple courier options
- Real-time price calculation
- Weight and dimension-based pricing

### 👨‍💼 Admin Features
- Order management dashboard
- Product inventory management
- Customer management
- Sales analytics
- Shipping management


## 📄 Documentation

- [Binderbyte API Documentation](https://docs.binderbyte.com/)
- [Biteship API Documentation](https://biteship.com/docs)
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



