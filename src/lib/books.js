export const KIDS_BOOK_FILE = "books/my-english-adventure-kids.html";
export const ADULT_BOOK_FILE = "books/english-a1-a2-bridge.html";

export const kidsBookLink = (base = "/", unitNumber) =>
  `${base}${KIDS_BOOK_FILE}${unitNumber ? `#unit-${unitNumber}` : ""}`;

export const adultBookLink = (base = "/", page) =>
  `${base}${ADULT_BOOK_FILE}${page ? `#page-${page}` : ""}`;

export const hasInteractiveBook = ageGroup => ageGroup === "Child";
