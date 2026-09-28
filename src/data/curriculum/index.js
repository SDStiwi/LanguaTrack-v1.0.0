import { kidsCurriculum } from "./kids.js";
import { teenAdultCurriculum } from "./teen-adult.js";

// Keyed by the student's age_group value, like data/banks.js.
// Teens and adults share one book, so they share one curriculum.
const CURRICULA = {
  Child: { book: "My English Adventure (Book 1)", units: kidsCurriculum },
  Teen: { book: "English A1+/A2 Bridge", units: teenAdultCurriculum },
  Adult: { book: "English A1+/A2 Bridge", units: teenAdultCurriculum }
};

export const getCurriculum = ageGroup => (CURRICULA[ageGroup] || CURRICULA.Adult).units;
export const getBookName = ageGroup => (CURRICULA[ageGroup] || CURRICULA.Adult).book;
export const ALL_CURRICULA = { kids: kidsCurriculum, teenAdult: teenAdultCurriculum };
