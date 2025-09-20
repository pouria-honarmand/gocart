import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async (userId) => {
  try {
    if (!userId) return false;

    const client = await clerkClient();

    const user = await client.users.getUser(userId);
    const adminEmails = process.env.ADMIN_EMAIL
  .replace(/"/g, "")
  .split(",")
  .map(e => e.trim());

console.log(adminEmails);
const userEmail = user.emailAddresses[0]?.emailAddress;
console.log("Logged-in user email:", userEmail);

    return process.env.ADMIN_EMAIL.split(",").includes(
      user.emailAddresses[0].emailAddress
    );
    
  } catch (error) {
    console.error(error)
    return false 
  }
};
export default authAdmin