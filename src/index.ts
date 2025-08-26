import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();

// Validate required environment variables
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'OPENROUTER_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set the missing environment variables and restart the application.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present');
}

// Validate environment variables before starting the application
validateEnvironmentVariables();

connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("Connection failed", err);
  });