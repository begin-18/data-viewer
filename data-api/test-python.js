const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 1. Path Configuration
const isWin = process.platform === "win32";
const pythonBin = isWin 
    ? path.join(__dirname, 'venv', 'Scripts', 'python.exe') 
    : path.join(__dirname, 'venv', 'bin', 'python');

console.log("--- DEBUG START ---");
console.log("Checking Python at:", pythonBin);
console.log("Python Path Exists:", fs.existsSync(pythonBin));

// 2. Try to run a simple command first
console.log("\nTesting Python connection...");
const testPy = spawnSync(pythonBin, ['-c', 'print("Python connection successful!")']);

if (testPy.error) {
    console.error("❌ EXECUTION ERROR:", testPy.error.message);
} else {
    console.log("✅ STDOUT:", testPy.stdout?.toString().trim());
    console.log("⚠️  STDERR:", testPy.stderr?.toString().trim());
}

// 3. Try to import Scipy
console.log("\nTesting Scipy library...");
const testScipy = spawnSync(pythonBin, ['-c', 'import scipy; print("Scipy is installed!")']);
console.log(testScipy.stdout?.toString().trim() || "Failed to import Scipy.");

console.log("\n--- DEBUG END ---");