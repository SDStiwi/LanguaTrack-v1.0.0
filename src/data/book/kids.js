// Placement pool for "My English Adventure" (Book 1). Six original items per unit,
// written from each unit's language focus and word bank. Correct option first.
import { kidsCurriculum } from "../curriculum/kids.js";
import { buildPool } from "../../lib/buildPool.js";

const rows = {
  "k-u01": [
    ["G", "___ name is Lina.", "My", "I", "Am", "Is"],
    ["G", "I ___ Amine.", "am", "is", "are", "be"],
    ["V", "Which word means the same as “hello”?", "hi", "bye-bye", "red", "ball"],
    ["V", "Someone is leaving. You say “___”.", "Bye-bye", "Hello", "Hi", "Yummy"],
    ["R", "Hi! My name is Lina. What is the girl’s name?", "Lina", "Amine", "Sam", "Mia"],
    ["E", "A new friend says, “Hi!” What do you say?", "Hi! My name is Sam.", "Bye-bye, my name.", "Name I am hi.", "Sam is hello."]
  ],
  "k-u02": [
    ["G", "This is Lina. ___ is my sister.", "She", "He", "I", "We"],
    ["G", "Amine is my brother. ___ is eight.", "He", "She", "We", "They"],
    ["V", "Your mother’s daughter is your ___.", "sister", "brother", "father", "friend"],
    ["V", "Which word is a man in the family?", "father", "mother", "sister", "teacher"],
    ["R", "This is my family. My father is Omar. My mother is Sara. Who is Sara?", "My mother", "My father", "My brother", "My teacher"],
    ["E", "You show a photo of your mother. What do you say?", "This is my mother.", "This is me mother.", "Is this my mother.", "Mother this my is."]
  ],
  "k-u03": [
    ["G", "There ___ a bed in my room.", "is", "are", "am", "be"],
    ["G", "There ___ two windows.", "are", "is", "am", "a"],
    ["V", "You open the ___ to go into a room.", "door", "bed", "ball", "cake"],
    ["V", "A family lives in a ___.", "house", "door", "window", "bed"],
    ["R", "The ball is under the bed. Where is the ball?", "Under the bed", "On the bed", "In the house", "Under the door"],
    ["E", "A friend asks, “Where is the cat?” The cat is on the bed. You say:", "It is on the bed.", "It on bed is.", "Is it the cat?", "There are bed."]
  ],
  "k-u04": [
    ["G", "I ___ a red ball.", "have", "has", "am", "are"],
    ["G", "I ___ ride my bike.", "can", "am", "is", "has"],
    ["V", "You ride a ___.", "bike", "ball", "bag", "teddy"],
    ["V", "You put your books in a ___.", "bag", "ball", "teddy", "bike"],
    ["R", "Sam has a bike and a ball. He can ride the bike. What can Sam ride?", "A bike", "A ball", "A bag", "A teddy"],
    ["E", "You want to play. Your friend has a ball. You say:", "Can I play with the ball, please?", "Ball give me.", "I ball play you.", "Please ball is."]
  ],
  "k-u05": [
    ["G", "I ___ apples. They are yummy!", "like", "likes", "liking", "am"],
    ["G", "I ___ like milk. It is not yummy.", "don’t", "doesn’t", "not", "no"],
    ["V", "Which one is a fruit?", "banana", "bread", "milk", "water"],
    ["V", "You drink ___.", "milk", "bread", "an apple", "a banana"],
    ["R", "Mia likes bread. She does not like milk. What does Mia like?", "Bread", "Milk", "Apples", "Bananas"],
    ["E", "Someone gives you a banana, but you don’t like it. What is polite?", "No, thank you.", "Yuck! Go away.", "Give me apple.", "I hate you."]
  ],
  "k-u06": [
    ["G", "I ___ up at seven o’clock.", "get", "gets", "getting", "got"],
    ["G", "She ___ to school by bus.", "goes", "go", "going", "gone"],
    ["V", "You eat ___ in the morning.", "breakfast", "sleep", "school", "night"],
    ["V", "At night, you ___.", "sleep", "get up", "go to school", "eat breakfast"],
    ["R", "Ben gets up at seven. He eats breakfast at half past seven. He goes to school at eight. What does Ben do first?", "He gets up.", "He goes to school.", "He eats breakfast.", "He sleeps."],
    ["E", "Your teacher asks, “What time do you get up?” You say:", "I get up at seven.", "I up get seven.", "I am get up.", "Seven I is."]
  ],
  "k-u07": [
    ["G", "Go straight, then ___ left.", "turn", "turns", "turning", "turned"],
    ["G", "___ straight for two minutes.", "Go", "Goes", "Going", "Went"],
    ["V", "You buy a toy in a ___.", "shop", "park", "school", "bus"],
    ["V", "You ride the ___ to school.", "bus", "park", "shop", "door"],
    ["R", "Go straight. The park is in front of you. The shop is on the left. Where is the shop?", "On the left", "On the right", "In the park", "Behind the bus"],
    ["E", "A visitor asks, “Where is the park?” It is straight ahead. You say:", "Go straight.", "Turn back the park.", "I am the park.", "Park go you."]
  ],
  "k-u08": [
    ["G", "It ___ sunny today.", "is", "are", "am", "be"],
    ["G", "I ___ wearing a red T-shirt.", "am", "is", "are", "be"],
    ["V", "You wear ___ on your feet.", "shoes", "jeans", "a T-shirt", "a jacket"],
    ["V", "It is very cold. You wear a warm ___.", "jacket", "T-shirt", "ice cream", "sunglasses"],
    ["R", "It is sunny and hot. Amine is wearing a T-shirt and shorts. What is the weather?", "It is sunny and hot.", "It is cold.", "It is snowy.", "It is rainy."],
    ["E", "Your friend asks, “What is the weather like?” It is rainy. You say:", "It is rainy.", "It rainy is.", "I am rainy.", "Rainy have."]
  ],
  "k-u09": [
    ["G", "Yesterday I ___ football with my friends.", "played", "play", "plays", "playing"],
    ["G", "Yesterday we ___ a cartoon.", "watched", "watch", "watches", "watching"],
    ["V", "Which word means you went to see a place?", "visited", "played", "ate", "watched"],
    ["V", "Which word tells about the past?", "yesterday", "tomorrow", "today", "now"],
    ["R", "Yesterday Lina visited her grandmother. They ate cake and watched TV. What did they eat?", "Cake", "Pizza", "Bread", "Apples"],
    ["E", "Your teacher asks, “What did you do yesterday?” You say:", "I played with my friends.", "I play with friends yesterday.", "I am played.", "Yesterday play I."]
  ],
  "k-u10": [
    ["G", "Last summer we ___ to the beach.", "went", "go", "goes", "going"],
    ["G", "We went there ___ plane.", "by", "in", "at", "of"],
    ["V", "You put your clothes in a ___ for a trip.", "suitcase", "hotel", "train", "plane"],
    ["V", "You stay in a ___ when you visit a new city.", "hotel", "suitcase", "ticket", "bag"],
    ["R", "Sam went to Turkey by plane. The hotel was big and the weather was hot. How did Sam go to Turkey?", "By plane", "By train", "By bus", "By bike"],
    ["E", "A friend asks, “How was your trip?” It was great. You say:", "It was fantastic, thank you!", "It were fantastic.", "It fantastic was.", "I are fantastic."]
  ],
  "k-u11": [
    ["G", "Next Saturday I am ___ to have a party.", "going", "go", "goes", "went"],
    ["G", "Would you like ___ come to my party?", "to", "for", "at", "of"],
    ["V", "You blow up a ___ for a party.", "balloon", "cake", "present", "hotel"],
    ["V", "A ___ is a gift you give on a birthday.", "present", "balloon", "suitcase", "bus"],
    ["R", "Lina is going to have a party on Sunday. She is going to make a cake. Who is going to make the cake?", "Lina", "Amine", "Mia", "The teacher"],
    ["E", "A friend says, “Would you like to come to my party?” You want to go. You say:", "Yes, please! Thank you.", "No! Go away.", "Party you come.", "I not come."]
  ],
  "k-u12": [
    ["G", "Tomorrow I am going ___ read a book.", "to", "for", "at", "in"],
    ["G", "Yesterday I ___ happy.", "was", "am", "is", "be"],
    ["V", "A ___ is a person who plays with you.", "friend", "book", "school", "happy"],
    ["V", "You read a ___.", "book", "friend", "sleep", "happy"],
    ["R", "Amine can read in English. Yesterday he read a book. Tomorrow he is going to write a story. What is he going to do tomorrow?", "Write a story", "Read a book", "Play football", "Visit school"],
    ["E", "Your teacher asks, “Can you speak English?” You can. You say:", "Yes, I can.", "Yes, I am.", "Yes, I do.", "Yes, I have."]
  ]
};

export const kidsPool = buildPool(kidsCurriculum, rows);
