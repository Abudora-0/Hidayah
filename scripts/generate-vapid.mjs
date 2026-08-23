import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("");
console.log("VAPID keys generated. Add these to .env.local and to your Vercel project:");
console.log("");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("");
console.log("Keep the private key secret. Never commit it.");
console.log("");
