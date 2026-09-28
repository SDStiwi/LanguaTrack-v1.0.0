// Placement pool for "English A1+/A2 Bridge" (shared by teens and adults). Six original
// items per unit, written from each unit's grammar workshop and wordlist. Correct option first.
import { teenAdultCurriculum } from "../curriculum/teen-adult.js";
import { buildPool } from "../../lib/buildPool.js";

const rows = {
  "ta-0A": [
    ["G", "Hello, ___ Samir.", "I am", "My am", "Me am", "I is"],
    ["G", "Hello! ___ name is Lina.", "My", "I", "Am", "Me"],
    ["V", "You say “___” when someone gives you a book.", "Thank you", "Goodbye", "Hello", "No"],
    ["V", "A ___ teaches the class.", "teacher", "student", "pen", "book"],
    ["R", "Hello! My name is Lina. I am a student. This is my teacher. His name is Mr Adam. Who is Lina?", "A student", "A teacher", "A doctor", "A friend"],
    ["E", "You don’t understand the teacher. What can you say?", "Can you repeat, please?", "Goodbye, teacher.", "Yes, I am a student.", "My name is book."]
  ],
  "ta-0B": [
    ["G", "___ old are you?", "How", "What", "Who", "Where"],
    ["G", "What ___ your phone number?", "is", "are", "am", "be"],
    ["V", "Which number comes after fifteen?", "sixteen", "fourteen", "seventeen", "twelve"],
    ["V", "On a form, “surname” means your ___ name.", "last", "first", "phone", "email"],
    ["R", "Name: Karim Benali. Age: 19. City: Oran. Phone: 0555 12 34 56. What is Karim’s surname?", "Benali", "Karim", "Oran", "19"],
    ["E", "You want to know someone’s age. What can you ask?", "How old are you?", "What is your old?", "How many you are?", "Where old are you?"]
  ],
  "ta-1": [
    ["G", "She ___ from Spain.", "is", "are", "am", "be"],
    ["G", "“Are you a student?” “Yes, I ___.”", "am", "are", "is", "do"],
    ["V", "You say “Good ___” at 8 a.m.", "morning", "afternoon", "evening", "night"],
    ["V", "Your ___ name is your family name.", "last", "first", "new", "small"],
    ["R", "Hi, I’m Nora. I’m a student. This is my classmate, Omar. He is from Morocco. Where is Omar from?", "Morocco", "Spain", "Turkey", "Italy"],
    ["E", "You meet a new classmate. What can you say?", "Nice to meet you.", "See you yesterday.", "I meet you.", "Good night, I am."]
  ],
  "ta-2": [
    ["G", "Where ___ you from?", "are", "is", "am", "do"],
    ["G", "This is Sara. ___ brother is a doctor.", "Her", "She", "Him", "Hers"],
    ["V", "Arabic, French and English are ___.", "languages", "countries", "cities", "families"],
    ["V", "Oran is a ___.", "city", "country", "language", "nationality"],
    ["R", "My name is Yasmine. I am not from Paris. I am from Oran. I speak Arabic and French. Where is Yasmine from?", "Oran", "Paris", "Cairo", "Rome"],
    ["E", "Someone asks, “What’s your first language?” You speak Arabic at home. You say:", "My first language is Arabic.", "I first language Arabic.", "Arabic is my country.", "I am Arabic city."]
  ],
  "ta-3": [
    ["G", "There ___ two chairs in the kitchen.", "are", "is", "am", "be"],
    ["G", "The lamp is ___ the sofa and the window.", "between", "under", "in", "at"],
    ["V", "You cook in the ___.", "kitchen", "bathroom", "bedroom", "hall"],
    ["V", "The ___ is the room where you sleep.", "bedroom", "kitchen", "bathroom", "garden"],
    ["R", "My apartment is small. There is a kitchen and a living room. There are two bedrooms. There is no garden. How many bedrooms are there?", "Two", "One", "Three", "None"],
    ["E", "A visitor asks, “Where is the bathroom?” It is next to the kitchen. You say:", "It’s next to the kitchen.", "It next kitchen.", "There is kitchen bathroom.", "Yes, it is bathroom."]
  ],
  "ta-4": [
    ["G", "My brother ___ a new phone.", "has", "have", "is", "can"],
    ["G", "I like ___ football at the weekend.", "playing", "play", "plays", "to playing"],
    ["V", "A ___ is something you do in your free time, like reading or drawing.", "hobby", "wallet", "weekend", "camera"],
    ["V", "You keep cards and money in a small ___.", "wallet", "watch", "jacket", "camera"],
    ["R", "Karim has a camera and a guitar. He can play the guitar but he cannot sing. What can Karim do?", "Play the guitar", "Sing", "Cook", "Swim"],
    ["E", "You want to borrow a friend’s pen. What can you say?", "Can I borrow your pen, please?", "Give me pen.", "I borrow you pen.", "Please pen you."]
  ],
  "ta-5": [
    ["G", "There isn’t ___ bread.", "any", "some", "a", "an"],
    ["G", "I ___ like a sandwich, please.", "would", "am", "do", "must"],
    ["V", "In a café, you ask for the ___ to see the food and prices.", "menu", "bill", "table", "receipt"],
    ["V", "After you eat, you ask for the ___ to pay.", "bill", "menu", "salad", "juice"],
    ["R", "At the café, Sara orders a chicken sandwich and juice. Her friend orders soup and water. What does Sara drink?", "Juice", "Water", "Tea", "Coffee"],
    ["E", "The waiter asks, “Are you ready to order?” You are ready. What can you say?", "Yes, I’d like a sandwich, please.", "Yes, I am a sandwich.", "No, sandwich menu.", "Order the bill, please."]
  ],
  "ta-6": [
    ["G", "My sister ___ to work at 8 o’clock.", "goes", "go", "going", "is go"],
    ["G", "I ___ drink coffee in the evening. I only drink tea.", "never", "always", "usually", "often"],
    ["V", "“Early” is the opposite of ___.", "late", "morning", "night", "before"],
    ["V", "A ___ is a plan that shows times for work or classes.", "schedule", "lunch", "evening", "morning"],
    ["R", "Nadia gets up at 6:30. She leaves home at 7:15 and arrives at work at 8:00. She usually has lunch at 1:00. When does Nadia arrive at work?", "At 8:00", "At 6:30", "At 7:15", "At 1:00"],
    ["E", "Someone asks, “What time do you finish work?” You finish at five. You say:", "I finish at five o’clock.", "I am finish five.", "At five I are.", "I finished five."]
  ],
  "ta-7": [
    ["G", "___ left at the bank.", "Turn", "Turns", "Turning", "To turn"],
    ["G", "___ you tell me the way to the station, please?", "Could", "Are", "Do", "Is"],
    ["V", "You buy medicine at a ___.", "pharmacy", "museum", "market", "station"],
    ["V", "A ___ is a place where you wait for a train.", "station", "bank", "museum", "pharmacy"],
    ["R", "Go straight for two streets. The bank is on your right, opposite the pharmacy. Where is the bank?", "On the right, opposite the pharmacy", "On the left, next to the market", "Behind the station", "Straight ahead, in the park"],
    ["E", "You are lost. What can you ask?", "Excuse me, where is the station?", "Excuse me, I am the station.", "Where the station you?", "Station is you where."]
  ],
  "ta-8": [
    ["G", "Look! It ___ now.", "is raining", "rains", "rained", "rain"],
    ["G", "This jacket is ___ than that one.", "cheaper", "cheap", "cheapest", "more cheap"],
    ["V", "“How much is it?” asks about the ___.", "price", "size", "weather", "colour"],
    ["V", "You try on clothes in the changing ___.", "room", "desk", "sale", "size"],
    ["R", "The blue shirt is $20. The white shirt is $35. Sara buys the cheaper shirt. Which shirt does Sara buy?", "The blue shirt", "The white shirt", "Both shirts", "Neither shirt"],
    ["E", "In a shop you want a smaller size. What can you say?", "Do you have this in a smaller size?", "This size is small me.", "Give smaller.", "I am smaller size."]
  ],
  "ta-9": [
    ["G", "Yesterday I ___ my grandmother.", "visited", "visit", "visiting", "visits"],
    ["G", "___ you watch the match last night?", "Did", "Do", "Are", "Have"],
    ["V", "Which verb is the past of “go”?", "went", "goed", "goes", "going"],
    ["V", "“Finally” means ___.", "at the end", "at the start", "sometimes", "never"],
    ["R", "Last weekend Omar cleaned his flat in the morning. Then he cooked lunch. Finally, he visited friends in the evening. What did Omar do after he cooked lunch?", "He visited friends", "He cleaned his flat", "He went to work", "He watched a film"],
    ["E", "A friend asks, “How was your weekend?” It was busy. You say:", "It was busy, but nice.", "It is busied.", "I was weekend.", "Busy it were."]
  ],
  "ta-10": [
    ["G", "I have ___ been to Italy.", "never", "ever", "yesterday", "ago"],
    ["G", "Last year I ___ to Istanbul, and it was great.", "went", "have been", "go", "have gone"],
    ["V", "A ___ is a document with your photo that you need to travel between countries.", "passport", "luggage", "hotel", "reservation"],
    ["V", "If a train is “delayed”, it is ___.", "late", "early", "cheap", "empty"],
    ["R", "Lina has visited France and Spain, but she hasn’t been to Italy yet. She has already booked a hotel in Rome for next month. Which country has Lina visited?", "Spain", "Italy", "Germany", "Greece"],
    ["E", "Your flight is cancelled. At the information desk you say:", "Excuse me, my flight is cancelled. What can I do?", "My flight is cancel. What I do?", "I am flight. Help cancel.", "Cancelled me, please."]
  ],
  "ta-11": [
    ["G", "I ___ visit my aunt next weekend.", "am going to", "going to", "go to", "am go to"],
    ["G", "If it rains tomorrow, we ___ at home.", "will stay", "stayed", "would have stayed", "staying"],
    ["V", "“How about Friday?” is a way to make a ___.", "suggestion", "complaint", "mistake", "goodbye"],
    ["V", "If you are “available”, you are ___.", "free to do something", "very tired", "hungry", "angry"],
    ["R", "Hi Sam, I’m having a party on Saturday at 7 p.m. at my flat. Would you like to come? Let me know. Nora. What is the message about?", "An invitation to a party", "A shopping list", "A weather forecast", "A train timetable"],
    ["E", "A friend invites you to the cinema on Friday, but you are busy. What is polite?", "Thanks for the invitation, but I’m busy on Friday. How about Saturday?", "No, I don’t like you.", "Friday busy. Bye.", "I not go, ask others."]
  ],
  "ta-12": [
    ["G", "I ___ English for two years now.", "have studied", "am studied", "studying", "did studied"],
    ["G", "If I practise every day, my English ___ better.", "will get", "got", "getting", "would getting"],
    ["V", "When you “improve”, you get ___.", "better", "worse", "older", "tired"],
    ["V", "A “goal” is something you want to ___.", "achieve", "forget", "lose", "borrow"],
    ["R", "My goal is to speak English with confidence. I practise for 15 minutes every day. I record my voice and listen to my mistakes. Last month I was nervous, but now I feel more comfortable. How does the writer improve?", "By practising and recording their voice", "By only reading", "By avoiding mistakes", "By stopping practice"],
    ["E", "You don’t know a word in English. What can you say?", "How do you say this in English?", "What say English how?", "I no know English.", "Say word me."]
  ]
};

export const teenAdultPool = buildPool(teenAdultCurriculum, rows);
