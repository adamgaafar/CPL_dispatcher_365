// Standard import - no paths, no .js extensions needed for packages
import { PrismaClient } from "@prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg"; // You'll likely need the base pg package to

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/driver_platform";



const adapter = new PrismaPg({
  connectionString,
});

// Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter }); 

export default prisma;