# n8n-nodes-trendswell

Custom **n8n community nodes** for [Trendswell](https://app.trendswell.ai).
This package provides:

- **Credentials** for authenticating with the Trendswell API
- **Trigger node** for receiving real-time events
- **Action node** for interacting with Trendswell endpoints

---

## ✨ Features

- 🔑 API Key authentication (`auth-token` header)
- 📡 **Trigger Node**: Reacts to Trendswell events via webhooks
- ⚙️ **Action Node**: Perform operations with the Trendswell API

---

## 📦 Installation

### From npm (recommended)

```bash
npm install n8n-nodes-trendswell
```

### From source

Clone this repository into your n8n custom nodes directory:

```bash
git clone https://github.com/<your-username>/n8n-nodes-trendswell.git
cd n8n-nodes-trendswell
npm install
npm run build
```

Then add the built package to your n8n instance (using `dist`).

---

## 🔑 Credentials

You’ll need your **Trendswell API token**.
When creating credentials in n8n, enter your API key, which will be injected as an `auth-token` header in every request.

---

## 🚀 Usage

1. Add **Trendswell Trigger** node to your workflow.

   - This will register a webhook URL with your Trendswell backend.
   - When an event occurs, n8n will receive the payload.

2. Add **Trendswell Action** node to perform API operations.

---

## 🖼️ Icons

Icons are included and will display in the n8n editor UI.

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue before submitting major changes.

---

## 📄 License

[MIT](LICENSE) © 2025 Marchese company
