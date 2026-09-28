// The original general-English banks (A1-B2). They are no longer used to build tests,
// but earlier results reference their question ids, so Insights still indexes them.
import { kidsInitial, kidsProgress } from "./kids.js";
import { teensInitial, teensProgress } from "./teens.js";
import { questions as adultsInitial, progressQuestionBank as adultsProgress } from "./questions.js";

export const LEGACY_BANKS = [
  { group: "Child", type: "initial", bank: kidsInitial }, { group: "Child", type: "progress", bank: kidsProgress },
  { group: "Teen", type: "initial", bank: teensInitial }, { group: "Teen", type: "progress", bank: teensProgress },
  { group: "Adult", type: "initial", bank: adultsInitial }, { group: "Adult", type: "progress", bank: adultsProgress }
];
