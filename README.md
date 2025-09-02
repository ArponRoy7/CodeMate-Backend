## SkillMate Backend

A production-ready backend for a developer networking and collaboration platform — built with **Node.js**, **Express**, and **MongoDB**.  
It powers authentication, profile management, discovery feed, connection requests, **real-time chat**, **subscriptions & premium plans**, **payments**, and **admin** controls.

**Deployed here :**[**theskillmate.shop**](http://thecodemate.shop)
## 🗂️ Project Structure

```
src/
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── rateLimiter.js
├── model/
│   ├── chat.js
│   ├── connectionRequest.js
│   ├── PlanConfig.js
│   ├── user.js
│   └── UserSubscription.js
├── routers/
│   ├── admin.js
│   ├── authRouter.js
│   ├── chat.js
│   ├── findRouter.js
│   ├── membership.js
│   ├── payments.js
│   ├── premium.js
│   ├── profilRouter.js
│   ├── requestRouter.js
│   └── userRouter.js
├── utils/
│   ├── constants.js
│   ├── socket.js
│   └── validations.js
├── app.js
└── api.md
```

---

## ⚙️ Installation

```bash
git clone <repo-url>
cd Skillmate-Backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run development server
npm run dev    # if nodemon configured
# or
node app.js
```

### Environment Variables

```
PORT=8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
COOKIE_NAME=skillmate_token



# Payments (example: Stripe)
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
```

---

## 🚀 Features

- 🔐 **Authentication & Security**
  - Sign Up, Login, Logout (JWT in httpOnly cookies)
  - Password hashing with `bcrypt`
  - Change password flow
  - Authentication middleware (`auth.js`)

- 👤 **User Profiles**
  - View and edit profile (skills, bio, socials)
  - Public profile routes
  - User validation (`validations.js`)

- 🔎 **Discovery Feed**
  - Paginated user feed
  - Search developers by query/skills/location
  - Excludes already connected/requested users

- 💌 **Connection Requests**
  - Send requests (interested/ignore)
  - Accept/reject incoming requests
  - Prevent duplicates & self-requests

- 💬 **Chat (Real-time)**
  - Built with **Socket.IO** (`utils/socket.js`)
  - Persistent messages (`model/chat.js`)
  - One-to-one conversations

- ⭐ **Premium & Membership**
  - Plans defined in `PlanConfig.js`
  - User subscriptions tracked in `UserSubscription.js`
  - Premium-only feature checks
  - Cancel or upgrade subscription

- 💳 **Payments**
  - Checkout session creation
  - Webhook integration (e.g. Stripe)
  - Payment history tracking

- 🛡️ **Rate Limiting**
  - `rateLimiter.js` middleware
  - Protects from brute-force & abuse

- ⚙️ **Admin**
  - Manage users (block/unblock)
  - Manage available plans
  - Audit endpoints

---

## 📚 API Overview

### Auth (`authRouter.js`)
| Method | Endpoint              | Description                               |
|-------:|-----------------------|-------------------------------------------|
| POST   | `/auth/signup`        | Register new user                         |
| POST   | `/auth/login`         | Login & set JWT cookie                    |
| GET    | `/auth/logout`        | Logout & clear cookie                     |
| PATCH  | `/auth/password`      | Change password                           |

### Users & Profile (`userRouter.js`, `profilRouter.js`)
| Method | Endpoint             | Description                  |
|-------:|----------------------|------------------------------|
| GET    | `/user/me`           | Get logged-in user           |
| PATCH  | `/user/me`           | Update profile fields        |
| GET    | `/profile/:userId`   | Get public profile by ID     |

### Discovery (`findRouter.js`)
| Method | Endpoint                       | Description                  |
|-------:|--------------------------------|------------------------------|
| GET    | `/find`                        | Paginated discovery feed     |
| GET    | `/find/search?q=js&skills=js`  | Search by skills/keywords    |

### Connection Requests (`requestRouter.js`)
| Method | Endpoint                                       | Description                  |
|-------:|------------------------------------------------|------------------------------|
| POST   | `/request/send/:status/:userId`                | Send connection request      |
| POST   | `/request/review/:status/:requestId`           | Accept/Reject a request      |
| GET    | `/request/incoming`                            | View incoming requests       |
| GET    | `/request/connections`                         | View accepted connections    |

### Chat (`chat.js`)
| Method | Endpoint               | Description                  |
|-------:|------------------------|------------------------------|
| GET    | `/chat/threads`        | List chat threads            |
| GET    | `/chat/:targetUserId`  | Fetch messages               |
| POST   | `/chat/:targetUserId`  | Send a message               |
| WS     | `Socket.IO /ws`        | Real-time messaging channel  |

### Plans & Premium (`premium.js`, `membership.js`)
| Method | Endpoint                 | Description                       |
|-------:|--------------------------|-----------------------------------|
| GET    | `/plans`                 | List all plans                    |
| GET    | `/subscription`          | Get current subscription          |
| POST   | `/subscription/cancel`   | Cancel subscription               |
| POST   | `/premium/feature-check` | Check premium feature entitlement |

### Payments (`payments.js`)
| Method | Endpoint                | Description                        |
|-------:|-------------------------|------------------------------------|
| POST   | `/payments/checkout`    | Create checkout session            |
| POST   | `/payments/webhook`     | Handle payment provider webhook    |
| GET    | `/payments/history`     | Get payment history                |

### Admin (`admin.js`)
| Method | Endpoint                | Description                        |
|-------:|-------------------------|------------------------------------|
| GET    | `/admin/users`          | List/search all users              |
| PATCH  | `/admin/users/:id/block`| Block or unblock user              |
| POST   | `/admin/plans`          | Create or update subscription plan |

---

## 🔒 Security Practices

- Passwords hashed with **bcrypt**
- JWT stored in **httpOnly cookies**
- Middleware-based auth & rate limiting
- Input validation in `utils/validations.js`
- Prevents duplicate/self-connections

---

## ▶️ Scripts

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js",
  "lint": "eslint .",
  "test": "node --test"
}
```

---

## 📄 License

MIT 

---

## 👤 Author

**Arpon Roy** 
