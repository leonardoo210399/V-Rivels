const dateString = "2026-02-14T09:30:00.000Z"; // 3:00 PM IST
const date = new Date(dateString);

console.log("Original Date (UTC):", dateString);

// Simulate current implementation
const currentOutputTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});
console.log("Current Output Time (No TZ):", `${currentOutputTime} IST`);

const currentOutputDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});
console.log("Current Output Date (No TZ):", currentOutputDate);


// Proposed Fix
const fixedOutputTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
});
console.log("Fixed Output Time (Asia/Kolkata):", `${fixedOutputTime} IST`);

const fixedOutputDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
});
console.log("Fixed Output Date (Asia/Kolkata):", fixedOutputDate);
