# 💼 DevTinder Backend

**DevTinder** is a full-stack developer collaboration platform — a backend project built using **Node.js**, **Express**, and **MongoDB**. This backend supports user authentication, profile management, developer discovery (feed), and connection requests, similar to a developer-focused Tinder app.

---

## 🚀 Features

- 🔐 **Authentication**

  - Sign Up, Login, Logout (JWT + Cookies)
  - Password hashing via `bcrypt`
  - Secure token handling with HTTP-only cookies

- 🧾 **Profile Management**

  - View and edit profile
  - Change password securely (with old password validation)
  - Input validation using custom validators

- 🔎 **User Feed**

  - Paginated feed of discoverable users
  - Filters out already connected/requested users
  - Customizable using query params

- 💌 **Connection Requests**

  - Send request (interested/ignored)
  - Review request (accept/reject)
  - Prevent duplicate or self-requests

- 📬 **Request Management**
  - View received connection requests
  - View accepted connections

---

## 🗂️ Project Structure

DevTinderBackend/
│
├── src/
│ ├── config/ # DB connection config
│ │ └── database.js
│ │
│ ├── middleware/ # JWT auth middleware
│ │ └── auth.js
│ │
│ ├── model/ # Mongoose schemas
│ │ ├── connectionRequest.js
│ │ └── user.js
│ │
│ ├── routers/ # Express route modules
│ │ ├── authRouter.js
│ │ ├── findRouter.js
│ │ ├── profilRouter.js
│ │ ├── requestRouter.js
│ │ └── userRouter.js
│ │
│ └── utils/ # Validation utilities
│ ├── validations.js
│ └── api.md # API documentation
│
├── app.js # Main entry point
├── package.json
├── package-lock.json
└── .gitignore

---

## 🧪 APIs Overview

| Route Group  | Method | Endpoint                             | Description                   |
| ------------ | ------ | ------------------------------------ | ----------------------------- |
| **auth**     | POST   | `/signup`                            | Create a new user             |
|              | POST   | `/login`                             | Log in and receive JWT token  |
|              | GET    | `/logout`                            | Clear auth cookie             |
| **profile**  | GET    | `/profile/view`                      | View logged-in user's profile |
|              | PATCH  | `/profile/update`                    | Edit user details             |
|              | PATCH  | `/profile/password`                  | Change password               |
| **requests** | POST   | `/request/send/:status/:userId`      | Send connection request       |
|              | POST   | `/request/review/:status/:requestId` | Accept/Reject request         |
| **user**     | GET    | `/user/requests/received`            | View incoming requests        |
|              | GET    | `/user/connections`                  | View accepted connections     |
|              | GET    | `/feed?page=x&limit=y`               | Paginated user discovery feed |

---

## 🛠️ Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js                          |
| Framework        | Express.js                       |
| Database         | MongoDB (with Mongoose ODM)      |
| Authentication   | JWT + Cookies                    |
| Security         | bcrypt password hashing          |
| Validation       | validator.js                     |
| Pagination       | MongoDB `.skip()` and `.limit()` |
| Deployment Ready | Yes (Can be Dockerized)          |

---

## 🔒 Security Practices

- Passwords hashed using `bcrypt`
- JWT stored in `httpOnly` cookies to prevent XSS
- Route-level authentication middleware using `adminAuth`
- Input validation using custom utilities
- Self-request prevention in `connectionRequestSchema`

---

## 📦 Installation

```bash
# Clone repo
git clone https://github.com/arpon7/DevTinderBackend.git
cd DevTinderBackend

# Install dependencies
npm install

# Set environment (if applicable)
# e.g., MONGODB_URL, JWT_SECRET

# Run server
node app.js


Author
Arpon Roy
GitHub
```
