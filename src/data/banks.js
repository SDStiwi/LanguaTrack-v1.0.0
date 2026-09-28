import { kidsPool } from "./book/kids.js";
import { teenAdultPool } from "./book/teen-adult.js";

// Keyed by the student's age_group value stored in the database. Teens and adults study
// the same book, so they share one pool. Tests are sampled from the pool by lib/testBuilder.js.
const POOLS = { Child: kidsPool, Teen: teenAdultPool, Adult: teenAdultPool };

export const getPool = ageGroup => POOLS[ageGroup] || POOLS.Adult;
export const ALL_POOLS = { kids: kidsPool, teenAdult: teenAdultPool };
