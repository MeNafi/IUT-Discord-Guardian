# Office IoT Backend (Express + Prisma + PostgreSQL + Socket.io)

এই backend-ই পুরো সিস্টেমের single source of truth — web dashboard আর Discord bot দুটোই এখান থেকে data নেয়।

## আর্কিটেকচার

```
[Wokwi ESP32 (Work Room 1)] --POST /api/rooms/update--\
[Device Simulator (Drawing Room, Work Room 2, + fallback)] --------> [Express API + Prisma/PostgreSQL]
                                                                              |
                                                                    Socket.io broadcast
                                                                        /            \
                                                            [React Dashboard]   [Discord Bot backend calls REST API]
```

- **Simulator** (`src/services/deviceSimulator.ts`) প্রতি ৮ সেকেন্ডে (env দিয়ে পরিবর্তনযোগ্য) randomly কিছু device on/off করে, যাতে dashboard-এ সবসময় live data দেখা যায় — এটাই "Simulated Device Data" requirement পূরণ করে।
- **ESP32 (Wokwi)** যদি সত্যিকারের POST পাঠায় Work Room 1-এর জন্য (`/api/rooms/update`), তাহলে simulator ৩০ সেকেন্ডের জন্য সেই room-কে touch করে না — real হার্ডওয়্যার ডেটাকে override করে না।
- **Alert Engine** প্রতি simulator tick-এ চেক করে: (১) office hours (9AM–5PM)-এর বাইরে কোনো device ON আছে কিনা, (২) কোনো room-এ সব device ২ ঘণ্টার বেশি continuous ON আছে কিনা।
- **Socket.io** সব change লাইভ broadcast করে (`devices:update`, `alert:new`) — তাই dashboard page-refresh ছাড়াই আপডেট হয়।

## Setup

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL ঠিক করে দিন

npx prisma migrate dev --name init
npm run prisma:seed     # 3 room x 5 device = 15 device সিড করবে

npm run dev              # http://localhost:5000
```

## API Endpoints

| Method | Endpoint | কী করে |
|---|---|---|
| GET | `/api/rooms` | সব room + device-এর full snapshot |
| GET | `/api/rooms/:name` | নির্দিষ্ট room-এর status (e.g. `WorkRoom1`) |
| POST | `/api/rooms/update` | **ESP32 এখানে POST করে** (body: `{room, devices:[{name,type,state}], ...}`) |
| POST | `/api/rooms/devices/:id/toggle` | Dashboard থেকে manual toggle |
| GET | `/api/usage` | এখনকার মোট ওয়াট + আজকের আনুমানিক kWh |
| GET | `/api/alerts?resolved=false` | Active alert list |
| POST | `/api/alerts/:id/resolve` | Alert dismiss করা |

Socket.io events (frontend `socket.on(...)`): `devices:update`, `alert:new`.

## ESP32 (Wokwi) থেকে কানেক্ট করা

Wokwi সিমুলেটর `localhost`-এ পৌঁছাতে পারে না — public internet-এই যেতে পারে। তাই দুইটা অপশন:

1. **ngrok**: লোকাল ব্যাকএন্ড চালু রেখে `ngrok http 5000` চালান, যে HTTPS URL পাবেন সেটা `sketch.ino`-র এই লাইনে বসান:
   ```cpp
   const char* BACKEND_URL = "https://xxxx-xx-xx.ngrok-free.app/api/rooms/update";
   ```
2. **Render/Railway free tier**-এ deploy করে স্থায়ী URL ব্যবহার করা (demo video-র জন্য বেশি নির্ভরযোগ্য, ngrok URL বারবার পরিবর্তন হয়)।

## পরের ধাপ (এই ডেলিভারিতে নেই)

- React + TS dashboard যেটা `/api/rooms`, `/api/usage`, `/api/alerts` fetch করবে এবং Socket.io শুনবে।
- Discord bot (discord.js) যেটা `!status`, `!room <name>`, `!usage` কমান্ডে এই একই REST API কল করবে।

বললে পরের মেসেজে এই দুইটাও পুরো কোডসহ বানিয়ে দিতে পারি।
