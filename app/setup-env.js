#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 CareCall Environment Setup');
console.log('=============================\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('Current content:');
  console.log('----------------');
  console.log(fs.readFileSync(envPath, 'utf8'));
  console.log('----------------\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('Setup cancelled.');
    }
    rl.close();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('📝 Creating .env.local file...\n');
  
  const template = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
# Get these from your Supabase dashboard: Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Example (replace with your actual values):
# NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ5NjAwMCwiZXhwIjoxOTUzMDcyMDAwfQ.example
`;

  try {
    fs.writeFileSync(envPath, template);
    console.log('✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Open the .env.local file');
    console.log('2. Replace the placeholder values with your actual Supabase credentials');
    console.log('3. Save the file');
    console.log('4. Restart your development server: npm run dev');
    console.log('\n📖 For detailed setup instructions, see SUPABASE_SETUP.md');
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  }
} 