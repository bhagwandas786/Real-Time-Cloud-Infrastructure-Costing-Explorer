🌐 MultiCloud Real-Time Pricing Explorer

The MultiCloud Real-Time Pricing Explorer is a full-stack application designed to help developers, businesses, and DevOps teams explore, compare, and analyze instance pricing across the three major cloud providers: AWS, Microsoft Azure, and Google Cloud Platform (GCP).

- Unlike static pricing tables, this project leverages cloud APIs to provide dynamic and real-time data:
- Regions are fetched directly from the cloud providers → no hardcoding.
- Instance types are populated dynamically depending on the selected region and provider.
- Pricing is pulled in real time from the APIs, ensuring accuracy and freshness.
- This makes the tool a reliable companion for cloud cost optimization, learning, and multi-cloud planning.

🚀 Key Features

✅ Multi-Cloud Support – Compare pricing across AWS, Azure, and GCP

✅ Dynamic Region Selection – Region list fetched directly from cloud APIs

✅ Dynamic Instance Types – Instance types depend on the chosen region + provider

✅ Real-Time Pricing – Always up-to-date costs without manual updates

✅ Interactive Frontend – Simple, user-friendly UI built with React + Vite

✅ Extensible API Layer – Backend powered by Node.js/Express, easy to extend

✅ Use Cases – Cost analysis, learning cloud services, comparing providers

🛠️ Tech Stack

Frontend:
React (with Vite for fast build & dev environment)
Material UI (for styling and dropdowns)

Backend:
Node.js + Express
REST APIs for fetching regions, instances, and prices

Cloud APIs Used:
AWS Pricing & EC2 APIs
Azure Retail Prices API
GCP Cloud Pricing Catalog API

⚙️ How It Works
Select a Cloud Provider
Choose between AWS, GCP, or Azure.
Dynamic Region Loading
The app fetches the list of available regions via APIs.
- Example: For AWS → us-east-1, eu-west-1, etc.

Dynamic Instance Types

Based on the selected provider + region, available instance types are shown.
Example: t2.micro, t3.large, Basic_A0, etc.
Real-Time Pricing
Once the region and instance type are selected, the backend queries the pricing API.
Result: Live, up-to-date cost per hour/month is displayed.

📂 Project Structure

<img width="1710" height="487" alt="image" src="https://github.com/user-attachments/assets/f8457cf3-bb04-41dd-9091-d01e27753283" />





📸UI
<img width="1919" height="1079" alt="Screenshot 2025-08-19 051840" src="https://github.com/user-attachments/assets/a2735f36-fbdc-426f-90bc-e0e7c5bfb3c5" />



Select Provider → Select Region → Select Instance Type → View Pricing

🔧 Setup Instructions
1️⃣ Clone the Repository
git clone https://github.com/your-username/multicloud-pricing-explorer.git
cd multicloud-pricing-explorer

2️⃣ Install Backend Dependencies
cd Backend
npm install
npm start

3️⃣ Install Frontend Dependencies
cd ../Frontend
npm install
npm run dev

4️⃣ Temprarory Local Host Deployment Access the App
Frontend runs at: https://player-wp-patterns-harry.trycloudflare.com
Backend API runs at: https://utc-borders-acm-interested.trycloudflare.com


🔮 Future Improvements

📊 Add graphs & cost comparison charts (e.g., AWS vs Azure vs GCP)

💾 Enable saving/exporting comparison results

🌍 Support more providers (Oracle, DigitalOcean, Alibaba Cloud)

🧮 Add advanced filters (CPU, RAM, GPU, storage optimized)

🔐 OAuth for secure user access

🤝 Contributing
Contributions are welcome! If you’d like to improve this project:
Fork the repo
Create a new branch (feature/my-feature)
Commit your changes
Open a Pull Request
