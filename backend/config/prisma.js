import { PrismaClient } from "@prisma/client"; // <--- Standard import
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/driver_platform";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); 

export default prisma;