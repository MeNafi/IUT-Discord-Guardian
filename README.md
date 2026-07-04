<div align="center">

# **🤖 Elie**

### AI-Powered Discord-Based Smart Office Energy Management System

Monitor and control office lights and fans through **Discord**, visualize live IoT data on a **React Dashboard**, and simulate real hardware using **ESP32 (Wokwi)**.

---

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Backend-Express-000000?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?style=for-the-badge&logo=discord)
![ESP32](https://img.shields.io/badge/Hardware-ESP32-E7352C?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?style=for-the-badge&logo=socketdotio)

</div>

---

# 📖 Overview

PowerCord is an AI-powered smart office energy management system built for the **IUT Hackathon**.

The system continuously monitors office lights and fans, provides a live dashboard, and allows users to interact with the office through a Discord bot.

Unlike traditional IoT dashboards, PowerCord makes Discord the primary control interface, allowing employees to monitor office energy usage without opening a separate application.

---


# ESP32 Hardware Simulation

#### PowerCord includes an ESP32 hardware simulation using Wokwi.

### Live Simulation : https://wokwi.com/projects/468550580082556929

---

## 🏗 High-Level System Diagram

#### 📄 View the Draw.io System Architecture : https://shorturl.at/cAkUq

---

# ✨ Features

- ⚡ Live Office Energy Monitoring
- 🤖 Discord Bot Integration
- 📊 Real-time React Dashboard
- 🔌 ESP32 Hardware Simulation (Wokwi)
- 📡 Socket.IO Live Updates
- 🗄 PostgreSQL Database
- 🚨 Automatic Alert Notifications
- 🧠 AI-ready Architecture
- 📱 Responsive Web Dashboard

---

# 🏗 System Architecture

```
                   +----------------------+
                   |   ESP32 (Wokwi)      |
                   +----------+-----------+
                              |
                              |
                    HTTP POST Sensor Data
                              |
                              ▼
                +---------------------------+
                | Express + PostgreSQL API  |
                |      (Single Source)      |
                +-----------+---------------+
                            |
              +-------------+-------------+
              |                           |
              ▼                           ▼
      React Dashboard            Discord Bot
       (Socket.IO)                 (REST API)
              |                           |
              +-------------+-------------+
                            |
                            ▼
                      Office Employees
```

The backend acts as the **single source of truth**, ensuring that both the dashboard and Discord bot always display the same real-time data.

---

# 📂 Project Structure

```
PowerCord/

│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── hardware/
│   ├── diagram.json
│   └── sketch.ino
│
├── bot/
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── README.md
├── LICENSE
└── .gitignore
```


# 🚀 Getting Started

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Discord Bot Token
- ngrok (optional)

---

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/powercord.git

cd powercord
```

---

# Backend Setup

```bash
cd backend

npm install

cp .env.example .env

npx prisma migrate dev

npm run prisma:seed

npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

# Frontend Setup

Open a new terminal.

```bash
cd frontend

npm install

cp .env.example .env

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Discord Bot Setup

Open another terminal.

```bash
cd bot

npm install

cp .env.example .env
```

Edit your `.env`

```env
DISCORD_TOKEN=

BACKEND_API_URL=http://localhost:5000

COMMAND_PREFIX=!

ALERT_CHANNEL_ID=
```

Run

```bash
npm run dev
```
---

# 🤖 Using Elie (Discord Bot)

**Elie** is your AI-powered Discord assistant for monitoring and managing your smart office in real time. Once the bot is invited to your Discord server, use the following commands:

| Command | Description |
|---------|-------------|
| `!status` | Displays the overall office status, including active devices and current power consumption. |
| `!usage` | Shows the estimated power usage and energy consumption of the office. |
| `!room drawing` | Displays the live status of all devices in the **Drawing Room**. |
| `!room work1` | Displays the live status of all devices in **Work Room 1**. |
| `!room work2` | Displays the live status of all devices in **Work Room 2**. |
| `!help` | Lists all available commands and their descriptions. |

### Example

```text
!status
!usage
!room drawing
!room work1
!room work2
!help
```


# Discord Server

PowerCord Bot Demo Server

**Server ID**

```
1522861282020163648
```

Invite the bot and use the available commands to monitor the office in real time.

---

# Live Data Flow

```
                         ┌─────────────────────┐
                         │    ESP32 (Wokwi)    │
                         │  Hardware Simulator │
                         └──────────┬──────────┘
                                    │
                           HTTP Sensor Data
                                    │
                                    ▼
                 ┌────────────────────────────────┐
                 │      Express.js Backend        │
                 │  REST API + Business Logic     │
                 └──────────────┬─────────────────┘
                                │
                         Prisma ORM
                                │
                                ▼
                 ┌────────────────────────────────┐
                 │      PostgreSQL Database       │
                 │     Single Source of Truth     │
                 └──────────────┬─────────────────┘
                                │
                     Socket.IO + REST API
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│ React Dashboard          │         │ Discord Bot (Elie)       │
│ • Office Layout          │         │ • !status                │
│ • Live Devices           │         │ • !room                  │
│ • Energy Usage           │         │ • !usage                 │
│ • Real-time Alerts       │         │ • Auto Notifications     │
└──────────────────────────┘         └──────────────────────────┘
```

---

# Environment Variables

## Backend

```env
DATABASE_URL=

PORT=5000
```

## Frontend

```env
VITE_API_URL=http://localhost:5000
```

## Bot

```env
DISCORD_TOKEN=

BACKEND_API_URL=http://localhost:5000

COMMAND_PREFIX=!

ALERT_CHANNEL_ID=
```

---

<!-- Dashboard -->

---

# Future Improvements

- AI Energy Prediction
- Voice Commands
- MQTT Support
- Power Consumption Analytics
- Mobile App
- Multiple Office Support

---

# Contributors

**Nafi Sarker**

IUT Hackathon 2026

---

# License

This project is licensed under the MIT License.

---

<div align="center">

Made with for the IUT Hackathon

Elie • AI-Powered Discord-Based Smart Office Energy Management

</div>
