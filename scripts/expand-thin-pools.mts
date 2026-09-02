/**
 * Expand thin social/content pools to 200 family + 50 mature where needed.
 * Run: node --import tsx scripts/expand-thin-pools.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateFactCheckFamilyPairs,
  isFactCheckTruthValid,
} from "../packages/shared/src/content-quality.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/shared/content");

function load<T>(rel: string): T {
  return JSON.parse(readFileSync(join(CONTENT, rel), "utf8")) as T;
}

function save(rel: string, data: unknown) {
  writeFileSync(join(CONTENT, rel), `${JSON.stringify(data, null, 2)}\n`);
}

function shuffle<T>(arr: T[], seed = 1): T[] {
  const out = [...arr];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fillUnique<T>(existing: T[], generated: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set(existing.map(keyFn));
  const out = [...existing];
  for (const item of generated) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

const FAMILY_TOPICS = [
  "pizza", "tacos", "brunch", "board games", "karaoke", "hiking", "camping", "movies",
  "road trips", "snow days", "beach days", "museums", "zoos", "theme parks", "libraries",
  "video games", "sports", "cooking", "baking", "gardening", "pets", "cats", "dogs",
  "birthdays", "holidays", "concerts", "podcasts", "book clubs", "puzzles", "LEGO",
  "bicycles", "swimming", "ice cream", "coffee", "tea", "hot chocolate", "pancakes",
  "soup", "sandwiches", "popcorn", "fireworks", "parades", "fairs", "farmers markets",
  "arcade nights", "trivia nights", "picnics", "stargazing", "rainy Sundays", "sleepovers",
];

const FAMILY_CHOICE_SETS: string[][] = [
  ["Always", "Sometimes", "Rarely", "Never"],
  ["Morning", "Afternoon", "Evening", "Midnight"],
  ["Home", "Out", "Friends' place", "Anywhere"],
  ["Cheap", "Splurge", "Split the bill", "Whoever offers"],
  ["Plan it", "Wing it", "Ask the group", "Flip a coin"],
  ["Sweet", "Salty", "Spicy", "Savory"],
  ["Quiet", "Loud", "In between", "Depends"],
  ["Indoors", "Outdoors", "Both", "Couch forever"],
];

function crowdFamily(): Array<{ text: string; choices: string[]; rating: "family" }> {
  const stems = [
    (t: string) => `Best ${t} in this room?`,
    (t: string) => `Who here is most into ${t}?`,
    (t: string) => `Ideal vibe for ${t}?`,
    (t: string) => `Go-to move for ${t}?`,
  ];
  const out = [];
  let i = 0;
  for (const topic of FAMILY_TOPICS) {
    for (const stem of stems) {
      out.push({
        text: stem(topic),
        choices: FAMILY_CHOICE_SETS[i % FAMILY_CHOICE_SETS.length],
        rating: "family" as const,
      });
      i++;
    }
  }
  return out;
}

function crowdMature(): Array<{ text: string; choices: string[]; rating: "mature" }> {
  const prompts = [
    ["Worst dating app habit?", ["Ghosting", "Double texting", "Love bombing", "Breadcrumbing"]],
    ["Office party red flag?", ["Too many shots", "Talking to the boss", "Karaoke ballad", "Leaving at 8"]],
    ["Hangover breakfast?", ["Greasy diner", "Nothing but water", "Bloody Mary", "Sleep until Monday"]],
    ["Group chat crime?", ["Screenshots", "Leaving on read", "Voice notes", "Adding an ex"]],
    ["Bar tab strategy?", ["Split evenly", "Itemize everything", "One person pays", "Disappear"]],
    ["After-hours energy?", ["One more round", "Uber home", "Diner run", "Regret tomorrow"]],
    ["Flirtiest setting?", ["Rooftop bar", "Wedding afterparty", "Work trip", "Group vacation"]],
    ["Worst ex story starter?", ["It was fine until", "My friends warned me", "The texts exist", "Vegas"]],
    ["Party vice of choice?", ["Too loud", "Too late", "Too honest", "Too many drinks"]],
    ["Relationship green flag?", ["Texts back", "Likes your friends", "Splits dinner", "Has a therapist"]],
    ["Drunk food order?", ["Pizza", "Tacos", "Fries", "Whatever is open"]],
    ["Worst roommate confession?", ["Ate the leftovers", "Never cleaned", "Had people over", "Used the charger"]],
    ["Dating dealbreaker lite?", ["Always late", "Bad tipper", "Hates pets", "No sense of humor"]],
    ["Wedding afterparty move?", ["Dance floor", "Sneak out", "Open bar sprint", "Catch the bouquet"]],
    ["Friends-with-benefits risk?", ["Catching feelings", "Getting caught", "The group knows", "It was a dare"]],
    ["Worst 2am text?", ["u up", "we need to talk", "I miss my ex", "Can you pick me up"]],
    ["Club night personality?", ["Main character", "Wallflower", "Designated adult", "Lost in the coat check"]],
    ["Brunch with a hangover?", ["Mimosas anyway", "Black coffee only", "Cancel and sleep", "Hash browns first"]],
    ["Reunion small talk?", ["Work flex", "Baby photos", "The weather", "Who dated who"]],
    ["Hotel minibar?", ["Touch nothing", "One overpriced water", "Raiding it", "Hiding the receipt"]],
    ["Worst toast at a party?", ["Inside joke", "Too honest", "Too long", "Naming an ex"]],
    ["Pre-game playlist?", ["Throwbacks", "Club bangers", "Ironic country", "Silence and nerves"]],
    ["Rideshare confession?", ["Rating drama", "Wrong pin", "Too chatty", "Fell asleep"]],
    ["Group vacation crime?", ["Never splitting", "Secret couple plans", "Loud at 6am", "Losing the keys"]],
    ["Worst plus-one?", ["The ex", "A coworker", "Someone's boss", "A surprise plus-two"]],
    ["Night-out budget?", ["Cash only", "One card to rule them", "Venmo later", "I forgot my wallet"]],
    ["Flake excuse quality?", ["Traffic", "Stomach", "Early morning", "My plant needs me"]],
    ["Afterparty location?", ["Someone's kitchen", "A diner", "The street", "Absolutely not"]],
    ["Worst dating prompt answer?", ["I like to have fun", "Ask me anything", "Here for a good time", "It's complicated"]],
    ["House party role?", ["DJ", "Snack cop", "Coat pile", "The one who leaves last"]],
    ["Worst reunion drink?", ["Too strong", "Too many", "Someone else's", "The one you don't remember"]],
    ["Secret Santa crime?", ["Re-gift", "Too cheap", "Too personal", "Forgot entirely"]],
    ["Worst group trip bed?", ["Air mattress", "Couch", "Floor", "The loudest room"]],
    ["Flirt via?", ["Texts", "Memes", "Voice notes", "Showing up"]],
    ["Bar game of choice?", ["Darts", "Pool", "Trivia", "People-watching"]],
    ["Worst toast topic?", ["College stories", "The divorce", "How we met (too honest)", "Work"]],
    ["Late-night confession style?", ["Too loud", "Too true", "Too soon", "Already screenshotted"]],
    ["Party foul?", ["Spilling", "Oversharing", "Starting drama", "Hogging the aux"]],
    ["Worst plus-one story?", ["They knew everyone", "They knew no one", "They started a fight", "They left with someone"]],
    ["Morning-after plan?", ["Brunch", "Ghost the group chat", "Apologize in memes", "Sleep"]],
    ["Worst dating red flag lite?", ["Still follows an ex", "Never introduces friends", "Always 'busy'", "Hates brunch"]],
    ["Karaoke after drinks?", ["Power ballad", "Rap verse", "Duet with a stranger", "Sit this one out"]],
    ["Worst wedding speech?", ["Inside jokes", "The ex chapter", "Crying immediately", "A roast"]],
    ["Group chat name crime?", ["An inside joke", "Someone's embarrassing moment", "An ex reference", "All lowercase chaos"]],
    ["Worst after-work drinks?", ["One turns into five", "The boss joins", "Nobody splits", "Last train missed"]],
    ["Vacation romance odds?", ["Zero", "A fling", "A story for later", "Already happening"]],
    ["Worst roommate party?", ["No invite", "No cleanup", "The cops", "Someone slept in your bed"]],
    ["Flake on a date via?", ["Text", "Leave on read", "A friend cancels for you", "You just don't show"]],
    ["Worst toast drink?", ["Too many shots", "Someone's homemade punch", "An open bar sprint", "Nothing, you're driving"]],
    ["Party legend status for?", ["The dance", "The speech", "The mess", "The exit"]],
  ];
  return prompts.map(([text, choices]) => ({
    text: String(text),
    choices: choices as string[],
    rating: "mature" as const,
  }));
}

function spectrumFamily(): Array<{ left: string; right: string; rating: "family" }> {
  const pairs: Array<[string, string]> = [
    ["Ice cream", "Frozen yogurt"], ["Cats", "Dogs"], ["Books", "Movies"], ["Early bird", "Night owl"],
    ["Sweet", "Salty"], ["City", "Countryside"], ["Summer", "Winter"], ["Coffee", "Tea"],
    ["Board games", "Video games"], ["Pancakes", "Waffles"], ["Beach", "Mountains"], ["Soup", "Salad"],
    ["Introvert", "Extrovert"], ["Planner", "Improviser"], ["Sneakers", "Boots"], ["Rain", "Sunshine"],
    ["Comedy", "Drama"], ["Loud music", "Quiet night"], ["Camping", "Hotels"], ["DIY", "Buy it"],
    ["Sweet breakfast", "Savory breakfast"], ["Group trip", "Solo trip"], ["New songs", "Old favorites"],
    ["Big party", "Small hang"], ["Texting", "Calling"], ["Fiction", "Nonfiction"], ["Sweet snacks", "Crunchy snacks"],
    ["Museum", "Theme park"], ["Bike", "Walk"], ["Hot weather", "Cold weather"], ["Cake", "Pie"],
    ["Paper maps", "GPS"], ["Handwritten notes", "Phone notes"], ["Live sports", "Recorded later"],
    ["Spicy food", "Mild food"], ["Sunrise", "Sunset"], ["Window seat", "Aisle seat"], ["Dogs at parks", "Cats at home"],
    ["Trivia", "Charades"], ["Puzzles", "Races"], ["Baking", "Grilling"], ["Snow", "Sand"],
    ["Library", "Cafe"], ["Orchestra", "Garage band"], ["Sneakers", "Sandals"], ["Soup season", "Salad season"],
    ["Board game night", "Movie night"], ["Road trip snacks", "Sit-down meals"], ["Handmade gifts", "Store-bought"],
    ["Early flights", "Red-eyes"], ["Short hikes", "All-day trails"], ["Live theater", "Streaming"],
    ["Team sports", "Solo sports"], ["Loud concerts", "Headphones at home"], ["Sweet tea", "Lemonade"],
    ["Diners", "Fancy restaurants"], ["Backyard", "Front porch"], ["Science museums", "Art museums"],
    ["Rain boots", "Umbrella only"], ["Sunday crossword", "Sunday nap"], ["Lego", "Puzzles"],
    ["Farmers market", "Supermarket"], ["Roller coasters", "Ferris wheels"], ["Ice skating", "Sledding"],
    ["Chocolate", "Vanilla"], ["Crunchy peanut butter", "Smooth"], ["Cereal", "Toast"], ["Tacos", "Burritos"],
    ["Burgers", "Sandwiches"], ["Fries", "Onion rings"], ["Milkshakes", "Floats"], ["Apple pie", "Peach cobbler"],
    ["Mac and cheese", "Grilled cheese"], ["Spaghetti", "Lasagna"], ["Ramen", "Pho"], ["Sushi", "Dumplings"],
    ["Popcorn", "Candy"], ["Soda", "Juice"], ["Water", "Sparkling water"], ["Smoothies", "Milk"],
    ["Yogurt", "Cottage cheese"], ["Granola", "Pastries"], ["Bagels", "Croissants"], ["Muffins", "Scones"],
    ["Oatmeal", "Eggs"], ["Bacon", "Sausage"], ["Hash browns", "Home fries"], ["Ketchup", "Mustard"],
    ["Mayo", "Aioli"], ["Ranch", "Blue cheese"], ["Hot sauce", "BBQ"], ["Honey", "Jam"],
    ["Butter", "Olive oil"], ["Cheddar", "Mozzarella"], ["Pepperoni", "Mushroom"], ["Thin crust", "Deep dish"],
    ["Delivery", "Dine in"], ["Leftovers", "Cook fresh"], ["Meal prep", "Daily cooking"], ["Food trucks", "Sit down"],
    ["Street fairs", "Indoor markets"], ["Parades", "Fireworks"], ["Carnivals", "County fairs"], ["Zoos", "Aquariums"],
    ["Planetariums", "Observatories"], ["Botanical gardens", "National parks"], ["Beaches", "Lakes"],
    ["Rivers", "Waterfalls"], ["Deserts", "Forests"], ["Islands", "Mainland"], ["Cabins", "Tents"],
    ["RVs", "Motels"], ["Hostels", "Airbnbs"], ["Trains", "Buses"], ["Bikes", "Scooters"],
    ["Skateboards", "Rollerblades"], ["Soccer", "Basketball"], ["Baseball", "Football"], ["Tennis", "Golf"],
    ["Swimming", "Running"], ["Yoga", "Weights"], ["Dance", "Martial arts"], ["Chess", "Checkers"],
    ["Monopoly", "Uno"], ["Catan", "Ticket to Ride"], ["Clue", "Guess Who"], ["Jenga", "Connect Four"],
    ["Minecraft", "Roblox"], ["Mario", "Zelda"], ["Pokemon", "Digimon"], ["Star Wars", "Star Trek"],
    ["Marvel", "DC"], ["Pixar", "Ghibli"], ["Sitcoms", "Cartoons"], ["Documentaries", "Nature shows"],
    ["Podcasts", "Audiobooks"], ["Vinyl", "Playlists"], ["Karaoke", "Open mic"], ["Choir", "Garage band"],
    ["Painting", "Drawing"], ["Pottery", "Woodworking"], ["Knitting", "Sewing"], ["Gardening", "Houseplants"],
    ["Dogs", "Hamsters"], ["Birds", "Fish"], ["Rabbits", "Guinea pigs"], ["Horses", "Ponies"],
    ["Sunrise alarms", "Gentle alarms"], ["Paper calendars", "Phone calendars"], ["To-do lists", "Memory"],
    ["Color-coded notes", "Messy notes"], ["Desk lamps", "Overhead lights"], ["Blankets", "Hoodies"],
    ["Fuzzy socks", "Bare feet"], ["Beanbags", "Office chairs"], ["Floor picnics", "Dining table"],
    ["Board game cafes", "Home game night"], ["Escape rooms", "Scavenger hunts"], ["Mini golf", "Bowling"],
    ["Arcades", "Carnivals"], ["Laser tag", "Go-karts"], ["Trampolines", "Bounce houses"], ["Water parks", "Splash pads"],
    ["Snowball fights", "Leaf piles"], ["Sandcastles", "Snowmen"], ["Kites", "Frisbees"], ["Jump rope", "Hopscotch"],
    ["Sidewalk chalk", "Finger paint"], ["Sticker books", "Coloring books"], ["Origami", "Paper airplanes"],
    ["Card houses", "Domino runs"], ["Marble runs", "Train sets"], ["Action figures", "Dolls"], ["Stuffed animals", "Pillows"],
    ["Fort building", "Pillow forts"], ["Story time", "Joke time"], ["Riddles", "Tongue twisters"], ["Mad Libs", "Pictionary"],
    ["Charades", "Twenty questions"], ["I spy", "Hide and seek"], ["Tag", "Red rover"], ["Capture the flag", "Dodgeball"],
    ["Relay races", "Tug of war"], ["Potato sack races", "Egg races"], ["Pinatas", "Treasure hunts"], ["Camp songs", "Campfire stories"],
    ["S'mores", "Hot dogs"], ["Trail mix", "Granola bars"], ["Canteens", "Water bottles"], ["Flashlights", "Lanterns"],
    ["Compasses", "Trail markers"], ["Binoculars", "Cameras"], ["Field guides", "Phone apps"], ["Park maps", "Ranger talks"],
    ["Visitor centers", "Overlooks"], ["Scenic drives", "Walking loops"], ["Boardwalks", "Dirt trails"], ["Lookouts", "Hidden coves"],
    ["Lighthouses", "Piers"], ["Ferris views", "Carousel rides"], ["Cotton candy", "Funnel cake"], ["Corn dogs", "Pretzels"],
    ["Lemon shake-ups", "Iced tea"], ["Snow cones", "Ice cream bars"], ["Caramel apples", "Candy apples"], ["Popcorn balls", "Kettle corn"],
    ["Balloon animals", "Face paint"], ["Magic shows", "Puppet shows"], ["Clowns", "Jugglers"], ["Stilt walkers", "Living statues"],
    ["Street musicians", "Buskers"], ["Flash mobs", "Parades"], ["Confetti", "Streamers"], ["Glow sticks", "Sparklers"],
    ["Party hats", "Name tags"], ["Goodie bags", "Thank-you notes"], ["Pin the tail", "Musical chairs"], ["Limbo", "Hula hoop"],
    ["Bubble machines", "Foam pits"], ["Water balloons", "Sprinklers"], ["Slip n slide", "Kiddie pools"], ["Sandbox", "Mud kitchen"],
    ["Treehouses", "Playhouses"], ["Swing sets", "Slides"], ["Seesaws", "Monkey bars"], ["Climbing walls", "Rope ladders"],
    ["Scooters", "Balance bikes"], ["Wagons", "Strollers"], ["Helmets", "Knee pads"], ["Training wheels", "Push bikes"],
  ];
  return pairs.map(([left, right]) => ({ left, right, rating: "family" as const }));
}

function spectrumMature(): Array<{ left: string; right: string; rating: "mature" }> {
  const pairs: Array<[string, string]> = [
    ["Never again", "Tell me more"], ["Open bar", "Designated driver"], ["Situationship", "Define the relationship"],
    ["Ghosting", "Awkward closure"], ["Friends with benefits", "Catching feelings"], ["Group vacation", "Solo hotel"],
    ["Drunk texts", "Leave it unsent"], ["Afterparty", "Early night"], ["Exes at the wedding", "Plus-one of peace"],
    ["Office party", "Hard pass"], ["Dating apps", "Meet cute"], ["One more round", "Call the ride"],
    ["Overshare", "Keep it cute"], ["Roast", "Toast"], ["Love bombing", "Slow burn"], ["Public PDA", "Keep it private"],
    ["Open relationship talks", "Not tonight"], ["Drunk karaoke", "Sober singalong"], ["Hookup hangover", "Brunch feelings"],
    ["The group chat knows", "Nobody needs to know"], ["Regret tomorrow", "Story forever"], ["Flake", "Show up anyway"],
    ["Venmo the tab", "Forget you paid"], ["Hotel key chaos", "Separate rooms"], ["Work trip energy", "Stay professional"],
    ["Wedding afterparty", "Quiet reception"], ["Reunion drama", "Small talk only"], ["Too honest", "Polite lie"],
    ["Screenshots", "Trust"], ["The ex still follows", "Clean unfollow"], ["Last call", "We already left"],
    ["Shot roulette", "One and done"], ["Dance floor confession", "Save it for later"], ["Rideshare nap", "Stay awake"],
    ["Minibar raid", "Leave it sealed"], ["Plus-one surprise", "RSVP as listed"], ["House party crash", "Invite only"],
    ["Too many toasts", "One kind speech"], ["Flirt with the bartender", "Water please"], ["Secret Santa roast", "Safe gift"],
    ["Friends know too much", "Plausible deniability"], ["The texts exist", "We deleted them"], ["Stay over", "Call a car"],
    ["Define it tomorrow", "Define it now"], ["No labels", "Need a label"], ["It's complicated", "It's over"],
    ["The group chat named it", "It never happened"], ["Too spicy", "Keep it PG"], ["Bad idea", "Great story"],
    ["Never tell them", "They already know"], ["Last night energy", "This morning regret"], ["One night", "A whole weekend"],
    ["The ex table", "Opposite side of the room"], ["Open bar sprint", "Two drink max"],
  ];
  return pairs.map(([left, right]) => ({ left, right, rating: "mature" as const }));
}

function splitFamily(): Array<{ text: string; labelA: string; labelB: string; rating: "family" }> {
  const rows: Array<[string, string, string]> = [
    ["Pineapple on pizza", "Delicious", "Crime against Italy"],
    ["Working from home", "Best invention", "Never leaving again"],
    ["Alarm clocks", "Necessary evil", "Illegal before 9am"],
    ["Movie theaters", "Worth the popcorn", "Wait for streaming"],
    ["Group chats", "Love the chaos", "Mute forever"],
    ["Breakfast for dinner", "Always yes", "Sad brunch"],
    ["Public karaoke", "Sign me up", "Witness protection"],
    ["Cats as roommates", "Perfect", "They judge me"],
    ["Board game night", "Peak friendship", "Too competitive"],
    ["Road trip playlists", "Driver picks", "Democracy"],
    ["Camping", "Nature heals", "Hotels exist"],
    ["Snow days", "Gift from above", "I have to shovel"],
    ["Theme parks", "Ride everything", "I'm tired in line"],
    ["Museums", "Could live there", "Twenty minutes max"],
    ["Zoos", "Educational", "I'd rather a sanctuary"],
    ["Video games", "Art form", "Time thief"],
    ["Sports on TV", "Event of the week", "Background noise"],
    ["Cooking from scratch", "Therapy", "Takeout wins"],
    ["Baking", "Science", "Too many dishes"],
    ["Gardening", "Peace", "The weeds always win"],
    ["Pets on furniture", "It's their house", "That's my sofa"],
    ["Dogs in restaurants", "Cute", "Not at dinner"],
    ["Birthdays", "Make it a production", "Low-key please"],
    ["Holidays", "Decorate in October", "One wreath is plenty"],
    ["Concerts", "Need to be there", "The recording is enough"],
    ["Podcasts", "My commute friends", "I need silence"],
    ["Book clubs", "Accountability", "I never finish"],
    ["Puzzles", "Meditative", "Missing pieces rage"],
    ["LEGO as an adult", "Valid hobby", "Step hazard"],
    ["Bicycles in the city", "Freedom", "I value my life"],
    ["Swimming in lakes", "Nature pool", "What's in there"],
    ["Ice cream in winter", "No season", "That's a crime"],
    ["Coffee after 2pm", "Living dangerously", "I like sleep"],
    ["Tea over coffee", "Civilized", "I need rocket fuel"],
    ["Hot chocolate", "Childhood in a mug", "Too sweet"],
    ["Pancakes vs waffles", "Pancakes", "Waffles have pockets"],
    ["Soup as a meal", "Complete", "That's an appetizer"],
    ["Sandwiches for dinner", "Efficient", "We can do better"],
    ["Popcorn as dinner", "Movie night fuel", "Not a food group"],
    ["Fireworks", "Wonder", "Too loud for pets"],
    ["Parades", "Community", "I can't see anything"],
    ["State fairs", "Fried everything", "That's not food"],
    ["Farmers markets", "Weekend ritual", "It's just expensive"],
    ["Arcade nights", "Tokens forever", "My wrists hurt"],
    ["Trivia nights", "My time to shine", "I know nothing"],
    ["Picnics", "Romantic", "Ants"],
    ["Stargazing", "Perspective", "I need a chair"],
    ["Rainy Sundays", "Perfect", "Cabin fever"],
    ["Sleepovers as kids", "Core memory", "Nobody slept"],
    ["Sneakers outdoors", "Always", "That's grass"],
    ["Window seats", "Views", "I need the aisle"],
    ["Aisle seats", "Freedom", "I miss the window"],
    ["Overhead bins", "Tetris", "Gate-check it"],
    ["In-flight movies", "Must finish", "I sleep"],
    ["Airport food", "Captive audience", "I packed snacks"],
    ["Layover shopping", "Treat yourself", "Stay at the gate"],
    ["Souvenirs", "I need a magnet", "Experiences only"],
    ["Postcards", "Charming", "Nobody checks mail"],
    ["Travel journals", "I'll remember", "My camera roll"],
    ["Paper maps", "Romance", "I'll get lost"],
    ["GPS voices", "Helpful", "Recalculating trauma"],
    ["Scenic routes", "The point", "I have a schedule"],
    ["Rest stops", "Necessary", "I can hold it"],
    ["Gas station snacks", "Road trip law", "We'll eat later"],
    ["Toll roads", "Worth the time", "Never"],
    ["Car karaoke", "Mandatory", "I need podcasts"],
    ["Shotgun", "Sacred", "Rotate like adults"],
    ["Backseat", "Naps", "Carsick"],
    ["Convertibles", "Dream", "My hair disagrees"],
    ["Sunroofs", "Open it", "Bugs"],
    ["Heated seats", "Luxury", "I am not a pastry"],
    ["AC in the car", "Blast it", "Windows down"],
    ["Windows down", "Fresh air", "My ears"],
    ["Drive-throughs", "Efficient", "I can park"],
    ["Parking garages", "Easy", "I forget the floor"],
    ["Street parking", "Free-ish", "I'll never find it"],
    ["Valet", "Treat", "I can walk"],
    ["Public transit", "Civilized", "I need my car"],
    ["Bikeshares", "Smart city", "Helmet anxiety"],
    ["Scooters", "Fun", "Sidewalk menace"],
    ["Walking meetings", "Genius", "I take notes"],
    ["Standing desks", "Healthy", "I like chairs"],
    ["Open offices", "Collaboration", "Headphones forever"],
    ["Work from cafes", "Aesthetic", "I need a door"],
    ["Lunch at the desk", "Efficient", "That's sad"],
    ["Office birthdays", "Cake is cake", "Please don't sing"],
    ["Casual Fridays", "Sacred", "Every day is casual"],
    ["Meetings that could be emails", "All of them", "Some need faces"],
    ["Cameras on", "Be a person", "Audio is enough"],
    ["Slack vs email", "Slack", "I want a paper trail"],
    ["Unread badges", "Anxiety", "I ignore them"],
    ["Do not disturb", "Boundaries", "I'll miss something"],
    ["Weekend emails", "Leave them", "Quick reply now"],
    ["Out of office", "Truthful", "Mysterious"],
    ["Vacation mode", "Fully off", "I'll peek"],
    ["Group gifts", "Fair", "Awkward money"],
    ["Potlucks", "Community", "Who brought what"],
    ["Secret Santa", "Fun", "Re-gift city"],
    ["White elephant", "Chaos", "Someone cries"],
    ["Ugly sweater parties", "Yes", "I don't own one"],
    ["Costume parties", "All in", "I'll wear jeans"],
    ["New Year's Eve", "Stay up", "I'm in bed at 10"],
    ["Resolutions", "This year", "I don't do them"],
    ["Monday motivation", "Let's go", "Let me be"],
    ["Friday feeling", "Earned", "Every day should be"],
    ["Sunday scaries", "Real", "I love Mondays"],
    ["Meal prep Sundays", "Future me thanks", "Fresh all week"],
    ["Leftovers", "Better next day", "I forget them"],
    ["Expiration dates", "Law", "Smell test"],
    ["Name-brand", "Worth it", "Generic wins"],
    ["Coupons", "Sport", "My time is worth more"],
    ["Loyalty cards", "Points!", "Wallet clutter"],
    ["Self-checkout", "Faster", "It hates me"],
    ["Cash", "Real money", "Who has cash"],
    ["Tipping culture", "Be generous", "It's gotten wild"],
    ["Autograt", "Fine", "I wanted to choose"],
    ["Splitting apps", "Peace", "Just Venmo me"],
    ["Rounding up", "Charity", "I can donate later"],
    ["Buy now pay later", "Dangerous", "Sometimes smart"],
    ["Subscriptions", "Convenient", "The silent killer"],
    ["Free trials", "I'll cancel", "I never cancel"],
    ["Password managers", "Essential", "I remember them"],
    ["Two-factor", "Please", "So many codes"],
    ["Dark mode", "Always", "I like light"],
    ["Read receipts", "Honesty", "Anxiety machine"],
    ["Typing indicators", "Torture", "Useful"],
    ["Last seen", "Creepy", "Helpful"],
    ["Stories vs posts", "Stories", "I want a feed"],
    ["Comments", "Community", "Never read them"],
    ["Likes", "Nice", "I don't need them"],
    ["Follow counts", "Meaningless", "I notice anyway"],
    ["Throwback posts", "Cute", "Let the past rest"],
    ["Childhood photos", "Wholesome", "Please ask first"],
    ["Family newsletters", "Love them", "Too much info"],
    ["Holiday cards", "Keep them", "Recycle pile"],
    ["Thank-you notes", "Classy", "A text is fine"],
    ["Handwritten letters", "Romance", "I can't read that"],
    ["Call instead of text", "Please", "Warn me first"],
    ["Voice notes", "Efficient", "I will not listen"],
    ["Group voice notes", "Chaos", "Absolutely not"],
    ["Family group chats", "Love", "Mute"],
    ["Reply all", "Never", "Sometimes needed"],
    ["Bcc", "Polite", "Sneaky"],
    ["Forwards", "Grandparents", "Please stop"],
    ["Chain messages", "Delete", "I send them ironically"],
    ["Memes as communication", "Fluent", "Use words"],
    ["GIFs in work chat", "Culture", "Keep it professional"],
    ["Emoji in emails", "Friendly", "Not in this house"],
    ["Periods in texts", "Aggression", "It's grammar"],
    ["Ellipses...", "Ominous", "I trail off"],
    ["Caps lock", "Yelling", "Emphasis"],
    ["Correcting typos", "Helpful", "Let it go"],
    ["Autocorrect", "Betrayal", "I need it"],
    ["Predictive text", "Mind reader", "It doesn't know me"],
    ["Smart speakers", "Convenient", "They're listening"],
    ["Robot vacuums", "Magic", "It eats cords"],
    ["Smart lights", "Mood", "A switch is fine"],
    ["Smart thermostats", "Savings", "I can twist a dial"],
    ["Meal kit boxes", "Easy", "Too much plastic"],
    ["Grocery delivery", "Gift", "I like choosing produce"],
    ["Curbside pickup", "Peak 2020", "Still the move"],
    ["Same-day delivery", "Emergency", "That's how they get you"],
    ["One-click buy", "Dangerous", "Efficient"],
    ["Cart abandonment", "Self control", "I'll come back"],
    ["Wishlist", "Someday", "Just buy it"],
    ["Sales", "Wait for them", "Full price if I want it"],
    ["Black Friday", "Sport", "I stay home"],
    ["Cyber Monday", "Laptop day", "It's all the same"],
    ["Prime Day", "Trap", "I have a list"],
    ["Returns", "Always", "I keep it"],
    ["Gift receipts", "Mercy", "I can use it"],
    ["Regifting", "Practical", "Never"],
    ["Handmade gifts", "Best", "I need the receipt"],
    ["Experiences over things", "Always", "I like objects"],
    ["Minimalism", "Peace", "I like my stuff"],
    ["Maximalism", "Joy", "Too much"],
    ["Marie Kondo", "Sparked", "My junk sparks joy"],
    ["Label makers", "Organization", "Overkill"],
    ["Color-coded closets", "Dream", "I grab what's clean"],
    ["Laundry folding", "Meditation", "The chair is a system"],
    ["Making the bed", "Civilized", "I'll unmake it anyway"],
    ["Shoes in the house", "Never", "It's my house"],
    ["Guest towels", "Yes we have them", "Use whatever"],
    ["Spare chargers", "Host duty", "Bring your own"],
    ["Wi-Fi password on the fridge", "Hospitality", "Just ask"],
    ["Houseplants", "I can keep them", "They come to die"],
    ["Fake plants", "No shame", "I know that's plastic"],
    ["Candles", "Ambience", "I forget they're lit"],
    ["Incense", "Vibe", "The alarm thinks it's fire"],
    ["Open windows", "Fresh", "Bugs"],
    ["Ceiling fans", "Year round", "Winter no"],
    ["Space heaters", "Cozy", "Fire hazard energy"],
    ["Extra blankets", "Always", "One is enough"],
    ["Sleeping with a fan", "White noise", "Too cold"],
    ["Sleeping with TV on", "Comfort", "I need dark"],
    ["Night lights", "Practical", "I know this house"],
    ["Blackout curtains", "Essential", "I like morning"],
    ["Sunrise alarms", "Gentle", "Just beep"],
    ["Snooze button", "Five more", "Get up"],
    ["Gym in the morning", "Done for the day", "Evenings only"],
    ["Gym after work", "Unwind", "I have nothing left"],
    ["Home workouts", "No commute", "I skip them"],
    ["Walking meetings already covered", "x", "x"],
  ];
  return rows
    .filter((r) => r[1] !== "x")
    .map(([text, labelA, labelB]) => ({ text, labelA, labelB, rating: "family" as const }));
}

function splitMature(): Array<{ text: string; labelA: string; labelB: string; rating: "mature" }> {
  const rows: Array<[string, string, string]> = [
    ["Dating apps", "Found love there", "Never again"],
    ["Office parties", "Free drinks", "Mandatory fun"],
    ["Talking politics at dinner", "Keep it spicy", "Hard pass"],
    ["Sleeping in on weekends", "Sacred ritual", "Wasted daylight"],
    ["Situationships", "Fine for now", "Need a definition"],
    ["Ghosting", "Sometimes kinder", "Always cowardly"],
    ["Friends with benefits", "Adults can handle it", "Feelings incoming"],
    ["Open bars", "Go for it", "Two-drink cap"],
    ["Drunk texts", "Send it", "Drafts forever"],
    ["Exes at weddings", "Be cool", "Opposite table"],
    ["Work spouses", "Harmless", "Too close"],
    ["Group vacations with couples", "Fun", "Third-wheel city"],
    ["Afterparties", "The real event", "I have a bedtime"],
    ["Hookup culture", "Fine if honest", "Not for me"],
    ["Love bombing", "Red flag", "They're just excited"],
    ["Breadcrumbing", "Annoying", "I'm guilty too"],
    ["The group chat knowing", "Accountability", "Nobody's business"],
    ["Screenshots of chats", "Evidence", "Betrayal"],
    ["Plus-ones you've just met", "Optimistic", "Too soon"],
    ["Hotel key mix-ups", "Comedy", "Nightmare"],
    ["Minibars", "Treat", "Robbery"],
    ["Wedding toasts that roast", "Funny", "Read the room"],
    ["Reunion glow-ups", "Petty joy", "Be kind"],
    ["Flaking on dates", "Life happens", "Don't do it"],
    ["Venmo-ing an ex", "Closure", "Don't"],
    ["Keeping ex photos", "History", "Delete the album"],
    ["Following an ex", "Mature", "Unfollow for peace"],
    ["Sliding into DMs", "How we met", "Cringe"],
    ["Rideshare after last call", "Responsible", "I can walk"],
    ["Drunk karaoke ballads", "Art", "Please stop"],
    ["Office crush", "Harmless crush", "Don't"],
    ["Work trip nightlife", "Team bonding", "Stay in"],
    ["House party crashers", "More the merrier", "Invite only"],
    ["Secret Santa that goes too personal", "Bold", "Keep it generic"],
    ["Friends who date each other", "Cute", "Group risk"],
    ["The ex still in the group", "We're adults", "Pick a side"],
    ["Oversharing at brunch", "That's brunch", "Too much"],
    ["Naming an ex in a toast", "Honest", "Absolutely not"],
    ["Catching feelings on purpose", "Brave", "Dangerous"],
    ["No labels", "Free", "Avoidant"],
    ["Define the relationship texts", "Necessary", "Kills the vibe"],
    ["Staying friends after", "Evolved", "Impossible"],
    ["Rebound timing", "Whenever", "Give it a minute"],
    ["Public arguments", "Passion", "Embarrassing"],
    ["PDA at family events", "Love", "Read the room"],
    ["Leaving with someone from a wedding", "Classic", "Don't"],
    ["Regretting last night", "Part of it", "Never again"],
    ["Telling the story anyway", "Comedy gold", "Take it to the grave"],
    ["The texts still exist", "Archive", "Burner phone energy"],
    ["Calling them after midnight", "Honest", "Don't"],
    ["Showing up unannounced", "Romantic", "A crime"],
    ["Keeping a spare toothbrush there", "Practical", "Too soon"],
  ];
  return rows.map(([text, labelA, labelB]) => ({ text, labelA, labelB, rating: "mature" as const }));
}

const ROLE_ADJECTIVES = [
  "Chaotic", "Sleepy", "Legendary", "Tiny", "Dramatic", "Sneaky", "Overcaffeinated", "Unbothered",
  "Sparkly", "Grumpy", "Heroic", "Clumsy", "Wise", "Loud", "Mysterious", "Sunny", "Feral", "Fancy",
  "Retro", "Cosmic", "Cozy", "Spicy", "Chill", "Bold", "Shy", "Lucky", "Cursed", "Golden", "Silver", "Neon",
];
const ROLE_NOUNS = [
  "Wizard", "Pirate", "Chef", "Astronaut", "Detective", "Viking", "Knight", "Ninja", "Scientist", "Artist",
  "Musician", "Athlete", "Teacher", "Pilot", "Farmer", "Explorer", "Librarian", "Mayor", "Coach", "Ranger",
  "Inventor", "Storyteller", "Gardener", "Captain", "Judge", "Ambassador", "Mechanic", "Baker", "Ranger", "Poet",
];

function extraRoles(existing: string[]): string[] {
  const out: string[] = [];
  for (const adj of ROLE_ADJECTIVES) {
    for (const noun of ROLE_NOUNS) {
      const role = `${adj} ${noun}`;
      if (!existing.includes(role) && !out.includes(role)) out.push(role);
    }
  }
  return out;
}

function impostorPacks(): Array<{ id: string; label: string; items: string[] }> {
  return [
    {
      id: "movies",
      label: "Movies & TV",
      items: [
        "Oscars", "Sitcom", "Credits", "Bloopers", "Sequel", "Prequel", "Cliffhanger", "Plot twist",
        "Red carpet", "Trailer", "Binge", "Pilot episode", "Cameo", "Stunt", "Soundtrack", "Subtitles",
        "Intermission", "Box office", "Reboot", "Spin-off", "Voiceover", "Flashback", "Montage", "Finale",
      ],
    },
    {
      id: "food",
      label: "Food",
      items: [
        "Tacos", "Sushi", "Ramen", "Bagel", "Waffle", "Burrito", "Dumpling", "Croissant",
        "Lasagna", "Curry", "Falafel", "Pretzel", "Churro", "Pancake", "Smoothie", "Nachos",
        "Gumbo", "Paella", "Kebab", "Quiche", "Tiramisu", "Brownie", "Cupcake", "Popcorn",
      ],
    },
    {
      id: "sports",
      label: "Sports",
      items: [
        "Kickoff", "Hat trick", "Slam dunk", "Home run", "Touchdown", "Offside", "Penalty", "Overtime",
        "Timeout", "Dugout", "Sideline", "Cheer", "Medal", "Trophy", "Jersey", "Cleats",
        "Helmet", "Whistle", "Referee", "Stadium", "Olympics", "Marathon", "Relay", "Podium",
      ],
    },
    {
      id: "animals",
      label: "Animals",
      items: [
        "Otter", "Penguin", "Koala", "Panda", "Sloth", "Fox", "Owl", "Dolphin",
        "Octopus", "Giraffe", "Hedgehog", "Llama", "Capybara", "Flamingo", "Narwhal", "Axolotl",
        "Meerkat", "Platypus", "Chameleon", "Peacock", "Manatee", "Wombat", "Lynx", "Puffin",
      ],
    },
    {
      id: "holidays",
      label: "Holidays",
      items: [
        "Fireworks", "Pumpkin", "Menorah", "Carol", "Stocking", "Parade", "Costume", "Lantern",
        "Firework", "Turkey", "Pie", "Confetti", "Countdown", "Gift wrap", "Ornament", "Wreath",
        "Candy cane", "Egg hunt", "Sparkler", "Toast", "Balloon", "Piñata", "Lei", "Kite",
      ],
    },
    {
      id: "fictional",
      label: "Storybook",
      items: [
        "Dragon", "Unicorn", "Portal", "Spellbook", "Quest", "Castle", "Potion", "Griffin",
        "Mermaid", "Phoenix", "Troll", "Fairy", "Goblin", "Wizard tower", "Magic map", "Hidden door",
        "Talking sword", "Flying carpet", "Time turner", "Invisibility", "Enchanted forest", "Crystal ball",
        "Knight errant", "Lost kingdom",
      ],
    },
  ];
}

const FORBIDDEN_FAMILY_SEEDS: Array<{ word: string; forbidden: string[] }> = [
  ["Compass", ["north", "direction", "needle", "map", "navigate"]],
  ["Harbor", ["boats", "dock", "ships", "port", "water"]],
  ["Orchestra", ["music", "conductor", "instruments", "symphony", "violin"]],
  ["Greenhouse", ["plants", "glass", "garden", "grow", "warm"]],
  ["Subway", ["train", "underground", "metro", "station", "commute"]],
  ["Carousel", ["horses", "spin", "fair", "ride", "music"]],
  ["Igloo", ["ice", "snow", "inuit", "cold", "dome"]],
  ["Canyon", ["valley", "river", "grand", "rock", "hike"]],
  ["Mailbox", ["letters", "post", "mail", "flag", "delivery"]],
  ["Windmill", ["netherlands", "blades", "wind", "farm", "turn"]],
  ["Skyscraper", ["tall", "building", "city", "elevator", "office"]],
  ["Waterfall", ["cascade", "river", "drop", "mist", "niagara"]],
  ["Backpack", ["school", "straps", "carry", "bag", "hike"]],
  ["Flashlight", ["beam", "dark", "battery", "light", "camp"]],
  ["Hammock", ["trees", "swing", "relax", "nap", "net"]],
  ["Kite", ["wind", "string", "fly", "sky", "tail"]],
  ["Lantern", ["light", "camp", "glow", "oil", "night"]],
  ["Map", ["directions", "roads", "atlas", "navigate", "fold"]],
  ["Microscope", ["tiny", "science", "lens", "lab", "cells"]],
  ["Notebook", ["write", "pages", "school", "pen", "spiral"]],
  ["Oven", ["bake", "kitchen", "hot", "cook", "heat"]],
  ["Penguin", ["antarctica", "bird", "waddle", "ice", "tuxedo"]],
  ["Quilt", ["blanket", "sew", "patch", "bed", "warm"]],
  ["Rocket", ["space", "launch", "nasa", "fly", "fuel"]],
  ["Saddle", ["horse", "ride", "leather", "seat", "western"]],
  ["Telescope already", ["stars", "space", "look", "planet", "night"]],
  ["Umbrella already", ["rain", "wet", "shade", "handle", "storm"]],
  ["Violin", ["strings", "bow", "orchestra", "fiddle", "music"]],
  ["Wagon", ["wheels", "pull", "pioneer", "cart", "kids"]],
  ["Xylophone", ["bars", "mallets", "music", "percussion", "rainbow"]],
  ["Yacht", ["boat", "rich", "sail", "ocean", "deck"]],
  ["Zipline", ["cable", "adventure", "slide", "harness", "height"]],
  ["Apron", ["cook", "kitchen", "chef", "tie", "stain"]],
  ["Balloon", ["helium", "party", "float", "pop", "string"]],
  ["Cactus", ["desert", "spine", "plant", "water", "arid"]],
  ["Doorbell", ["ring", "visitor", "front", "chime", "house"]],
  ["Easel", ["paint", "canvas", "art", "stand", "studio"]],
  ["Fountain", ["water", "park", "spray", "coins", "statue"]],
  ["Globe", ["earth", "world", "spin", "map", "classroom"]],
  ["Honey", ["bee", "sweet", "hive", "gold", "sticky"]],
  ["Igloo2", ["ice", "snow", "cold", "dome", "arctic"]],
  ["Jigsaw", ["puzzle", "pieces", "fit", "picture", "table"]],
  ["Kayak", ["paddle", "river", "boat", "water", "sport"]],
  ["Ladder", ["climb", "rungs", "tall", "steps", "roof"]],
  ["Magnet", ["metal", "stick", "fridge", "north", "attract"]],
  ["Nest", ["bird", "eggs", "tree", "twigs", "home"]],
  ["Oasis", ["desert", "water", "palm", "mirage", "shade"]],
  ["Parachute", ["sky", "jump", "fall", "silk", "air"]],
  ["Quicksand", ["sink", "desert", "trap", "slow", "stuck"]],
  ["Rainbow2", ["colors", "rain", "sky", "arc", "prism"]],
  ["Scooter", ["kick", "wheels", "ride", "kid", "helmet"]],
  ["Trampoline", ["bounce", "jump", "spring", "yard", "net"]],
  ["Unicycle", ["one", "wheel", "circus", "balance", "pedal"]],
  ["Volcano2", ["lava", "erupt", "mountain", "fire", "ash"]],
  ["Windchime", ["breeze", "porch", "sound", "hang", "metal"]],
  ["Yo-yo", ["string", "up", "down", "toy", "trick"]],
  ["Zeppelin", ["airship", "blimp", "float", "gas", "sky"]],
  ["Acorn", ["oak", "squirrel", "nut", "fall", "tree"]],
  ["Binoculars", ["see", "far", "lenses", "bird", "watch"]],
  ["Comet", ["tail", "space", "sky", "ice", "orbit"]],
  ["Dandelion", ["weed", "wish", "yellow", "seeds", "blow"]],
  ["Eclipse", ["sun", "moon", "shadow", "sky", "rare"]],
  ["Firefly", ["glow", "night", "bug", "summer", "light"]],
  ["Geyser", ["water", "erupt", "yellowstone", "hot", "steam"]],
  ["Hourglass2", ["sand", "time", "flip", "glass", "minutes"]],
  ["Icicle", ["winter", "drip", "roof", "cold", "point"]],
  ["Jellyfish", ["sting", "ocean", "tentacles", "float", "umbrella"]],
  ["Koala", ["australia", "eucalyptus", "tree", "sleepy", "bear"]],
  ["Lightning", ["storm", "bolt", "thunder", "sky", "electric"]],
  ["Mosaic", ["tiles", "art", "pieces", "pattern", "glass"]],
  ["Noodle", ["pasta", "soup", "long", "slurp", "ramen"]],
  ["Origami", ["paper", "fold", "crane", "japan", "art"]],
  ["Pancake2", ["breakfast", "syrup", "flip", "batter", "stack"]],
  ["Quartz", ["crystal", "rock", "clear", "mineral", "sparkle"]],
  ["Raccoon", ["mask", "trash", "night", "bandit", "stripes"]],
  ["Seahorse", ["ocean", "tiny", "horse", "coral", "male"]],
  ["Tornado", ["wind", "funnel", "storm", "spin", "kansas"]],
  ["Ukulele", ["hawaii", "small", "guitar", "strings", "pluck"]],
  ["Vine", ["climb", "plant", "tangle", "green", "grow"]],
  ["Waterwheel", ["mill", "river", "turn", "old", "power"]],
  ["X-ray", ["bones", "doctor", "scan", "hospital", "see"]],
  ["Yarn", ["knit", "wool", "ball", "craft", "string"]],
  ["Zebra", ["stripes", "africa", "horse", "black", "white"]],
  ["Avalanche", ["snow", "mountain", "slide", "danger", "ski"]],
  ["Blizzard", ["snow", "wind", "storm", "cold", "white"]],
  ["Campfire", ["logs", "marshmallow", "warm", "night", "smoke"]],
  ["Dew", ["morning", "grass", "drops", "wet", "dawn"]],
  ["Everest", ["mountain", "tallest", "climb", "nepal", "peak"]],
  ["Fog", ["mist", "low", "visibility", "cloud", "gray"]],
  ["Glacier", ["ice", "slow", "mountain", "blue", "melt"]],
  ["Hail", ["ice", "storm", "balls", "roof", "damage"]],
  ["Island", ["ocean", "surrounded", "water", "beach", "alone"]],
  ["Jungle", ["rainforest", "dense", "vines", "animals", "hot"]],
  ["Kelp", ["seaweed", "ocean", "forest", "fish", "green"]],
  ["Lagoon", ["water", "calm", "blue", "tropical", "shore"]],
  ["Marsh", ["wetland", "reeds", "mud", "birds", "swamp"]],
  ["North pole", ["santa", "arctic", "cold", "ice", "earth"]],
  ["Orchard", ["trees", "apples", "fruit", "pick", "farm"]],
  ["Prairie", ["grass", "flat", "midwest", "wind", "wide"]],
  ["Quarry", ["rock", "mine", "stone", "pit", "dig"]],
  ["Reef", ["coral", "ocean", "fish", "color", "australia"]],
  ["Savanna", ["africa", "grass", "lions", "acacia", "hot"]],
  ["Tundra", ["cold", "arctic", "plain", "permafrost", "north"]],
  ["Underpass", ["road", "below", "bridge", "car", "tunnel"]],
  ["Valley", ["between", "mountains", "low", "river", "green"]],
  ["Wetland", ["marsh", "birds", "water", "protect", "reeds"]],
  ["Expedition", ["journey", "explore", "team", "gear", "map"]],
  ["Festival", ["music", "crowd", "tents", "weekend", "food"]],
  ["Gondola", ["venice", "boat", "canal", "pole", "italy"]],
  ["Harbor2", ["ships", "dock", "port", "boats", "water"]],
  ["Inn", ["hotel", "stay", "travel", "room", "sign"]],
  ["Jetty", ["pier", "ocean", "walk", "rocks", "waves"]],
  ["Kiosk", ["small", "shop", "stand", "info", "mall"]],
  ["Loft", ["apartment", "high", "open", "city", "windows"]],
  ["Marina", ["boats", "dock", "yacht", "water", "slips"]],
  ["Observatory", ["stars", "telescope", "night", "dome", "space"]],
  ["Pavilion", ["park", "roof", "picnic", "open", "shelter"]],
  ["Quay", ["dock", "water", "walk", "harbor", "ships"]],
  ["Rink", ["ice", "skate", "hockey", "cold", "circle"]],
  ["Stadium2", ["sports", "crowd", "field", "lights", "game"]],
  ["Terminal", ["airport", "gate", "travel", "bags", "flight"]],
  ["Underpass2", ["road", "below", "bridge", "graffiti", "walk"]],
  ["Viaduct", ["bridge", "train", "high", "arches", "span"]],
  ["Wharf", ["dock", "fish", "boats", "pier", "water"]],
  ["Annex", ["addition", "building", "extra", "wing", "school"]],
  ["Belfry", ["bells", "tower", "church", "ring", "high"]],
  ["Cupola", ["dome", "roof", "round", "lookout", "small"]],
  ["Dormer", ["window", "roof", "house", "attic", "slope"]],
  ["Eaves", ["roof", "edge", "overhang", "rain", "house"]],
  ["Facade", ["front", "building", "face", "outside", "looks"]],
  ["Gable", ["roof", "triangle", "house", "peak", "end"]],
  ["Hearth", ["fireplace", "home", "warm", "fire", "family"]],
  ["Ivy", ["climb", "wall", "green", "vine", "college"]],
  ["Jacuzzi", ["hot", "tub", "bubbles", "relax", "jets"]],
  ["Keystone", ["arch", "center", "stone", "hold", "bridge"]],
  ["Lattice", ["crisscross", "garden", "wood", "pattern", "fence"]],
  ["Mansard", ["roof", "french", "slope", "attic", "paris"]],
  ["Nook", ["cozy", "corner", "read", "small", "breakfast"]],
  ["Oriel", ["window", "bay", "stick", "out", "upper"]],
  ["Parapet", ["wall", "roof", "edge", "castle", "low"]],
  ["Quoin", ["corner", "stone", "building", "edge", "brick"]],
  ["Rafter", ["roof", "beam", "wood", "support", "attic"]],
  ["Soffit", ["under", "roof", "eaves", "vent", "house"]],
  ["Turret", ["tower", "castle", "round", "small", "fairy"]],
  ["Veranda", ["porch", "house", "sit", "outdoor", "rail"]],
  ["Wainscot", ["wall", "wood", "lower", "panel", "room"]],
  ["Awning", ["shade", "shop", "stripe", "window", "rain"]],
  ["Balcony", ["outside", "rail", "apartment", "view", "romeo"]],
  ["Chimney", ["smoke", "roof", "fireplace", "santa", "brick"]],
  ["Driveway", ["car", "house", "park", "pave", "garage"]],
  ["Elevator", ["up", "down", "buttons", "floor", "lift"]],
  ["Fire escape", ["stairs", "outside", "emergency", "city", "metal"]],
  ["Garage", ["car", "door", "tools", "park", "house"]],
  ["Hydrant", ["fire", "red", "water", "dog", "street"]],
  ["Intercom", ["buzz", "speak", "door", "apartment", "button"]],
  ["Jamb", ["door", "frame", "side", "wood", "close"]],
  ["Knocker", ["door", "bang", "visit", "metal", "front"]],
  ["Landing", ["stairs", "floor", "between", "flat", "step"]],
  ["Mailbox2", ["letters", "flag", "post", "street", "mail"]],
  ["Doormat", ["wipe", "welcome", "feet", "front", "dirt"]],
  ["Peephole", ["door", "look", "visitor", "eye", "apartment"]],
  ["Radiator", ["heat", "old", "clank", "apartment", "winter"]],
  ["Staircase", ["steps", "up", "banister", "house", "climb"]],
  ["Threshold", ["door", "enter", "step", "home", "cross"]],
  ["Utility", ["closet", "tools", "sink", "basement", "bills"]],
  ["Vestibule", ["entry", "small", "door", "coat", "between"]],
  ["Welcome", ["mat", "hello", "guest", "home", "sign"]],
  ["Attic", ["top", "storage", "dust", "house", "boxes"]],
  ["Basement", ["below", "storage", "laundry", "house", "down"]],
  ["Crawlspace", ["under", "house", "low", "tight", "dirt"]],
  ["Den", ["tv", "couch", "family", "room", "relax"]],
  ["Foyer", ["entry", "front", "house", "welcome", "open"]],
  ["Guestroom", ["visitor", "bed", "stay", "extra", "overnight"]],
  ["Hallway", ["passage", "doors", "long", "house", "walk"]],
  ["Kitchenette", ["small", "kitchen", "sink", "apartment", "mini"]],
  ["Laundry", ["wash", "clothes", "dryer", "hamper", "soap"]],
  ["Mudroom", ["boots", "coats", "entry", "dirty", "bench"]],
  ["Pantry", ["food", "shelves", "kitchen", "cans", "store"]],
  ["Sunroom", ["windows", "plants", "light", "house", "glass"]],
].map(([word, forbidden]) => ({ word: String(word).replace(/\d+$/, "").replace(" already", ""), forbidden: forbidden as string[] }));

function forbiddenMature(): Array<{ word: string; forbidden: string[]; rating: "mature" }> {
  const extra: Array<[string, string[]]> = [
    ["Open bar", ["drinks", "wedding", "free", "alcohol", "toast"]],
    ["Ghosting", ["text", "date", "disappear", "reply", "ignore"]],
    ["Situationship", ["dating", "undefined", "exclusive", "vibe", "label"]],
    ["Afterparty", ["wedding", "late", "drinks", "dance", "continue"]],
    ["Plus one", ["wedding", "date", "invite", "guest", "bring"]],
    ["Last call", ["bar", "drinks", "closing", "night", "order"]],
    ["Designated driver", ["sober", "car", "friends", "night", "keys"]],
    ["Drunk text", ["phone", "ex", "late", "regret", "send"]],
    ["Love bombing", ["too much", "dating", "attention", "fast", "red"]],
    ["Breadcrumbing", ["dating", "text", "mixed", "signals", "almost"]],
    ["Friends with benefits", ["casual", "feelings", "hookup", "no", "label"]],
    ["Rebound", ["ex", "quickly", "new", "date", "after"]],
    ["Sliding into DMs", ["instagram", "message", "flirt", "follow", "chat"]],
    ["Thirst trap already", ["photo", "likes", "post", "flirt", "feed"]],
    ["Group chat leak", ["screenshot", "gossip", "friends", "text", "secret"]],
    ["Office crush", ["work", "coworker", "flirt", "meeting", "secret"]],
    ["Work spouse", ["office", "close", "coworker", "joke", "partner"]],
    ["Wedding roast", ["speech", "toast", "joke", "embarrass", "friends"]],
    ["Reunion glow up", ["school", "looks", "years", "see", "petty"]],
    ["Minibar", ["hotel", "expensive", "fridge", "drinks", "snack"]],
    ["Rideshare rating", ["stars", "driver", "uber", "trip", "app"]],
    ["Hotel key", ["room", "card", "lost", "desk", "door"]],
    ["House party", ["invite", "loud", "friends", "night", "host"]],
    ["Flake", ["cancel", "plans", "last", "minute", "excuse"]],
    ["Venmo request", ["money", "split", "awkward", "pay", "app"]],
    ["Screenshot proof", ["chat", "evidence", "send", "friends", "text"]],
    ["Unfollow", ["social", "ex", "feed", "quiet", "instagram"]],
    ["Mute", ["chat", "notifications", "group", "ignore", "phone"]],
    ["Leave on read", ["text", "seen", "reply", "blue", "ignore"]],
    ["Double text", ["send", "again", "wait", "anxious", "chat"]],
    ["Soft launch", ["relationship", "photo", "instagram", "hint", "couple"]],
    ["Hard launch", ["couple", "post", "official", "photo", "together"]],
    ["Talking stage", ["dating", "not", "official", "text", "maybe"]],
    ["Define the relationship", ["talk", "label", "exclusive", "serious", "ask"]],
    ["It's complicated", ["status", "facebook", "ex", "unclear", "mess"]],
    ["Catching feelings", ["casual", "more", "crush", "uh oh", "like"]],
    ["The ick", ["turn", "off", "date", "suddenly", "no"]],
    ["Red flag already", ["warning", "dating", "leave", "bad", "sign"]],
    ["Green flag", ["good", "dating", "keeper", "healthy", "yes"]],
    ["Beige flag", ["weird", "harmless", "dating", "odd", "habit"]],
    ["Orbiting", ["watch", "stories", "not", "talk", "social"]],
    ["Cushioning", ["backup", "date", "options", "not", "exclusive"]],
    ["Cookie jarring", ["keep", "option", "while", "dating", "other"]],
    ["Zombie-ing", ["ex", "back", "from", "dead", "text"]],
    ["Haunting", ["ex", "watch", "stories", "not", "contact"]],
    ["Submarining", ["disappear", "return", "text", "months", "later"]],
    ["Benching", ["backup", "not", "priority", "date", "wait"]],
    ["Stashing", ["hide", "friends", "not", "introduce", "date"]],
    ["Kittenfishing", ["photos", "better", "than", "real", "date"]],
    ["Catfishing", ["fake", "profile", "online", "lie", "photos"]],
  ];
  return extra.map(([word, forbidden]) => ({
    word: String(word).replace(" already", ""),
    forbidden,
    rating: "mature" as const,
  }));
}

function captionMature(): Array<{ text: string; rating: "mature" }> {
  const scenes = [
    "two exes stuck in the same elevator",
    "someone hiding behind a plant at a wedding",
    "a group chat screenshot projected at a party",
    "the last person still dancing at 3am",
    "a plus-one who knows nobody",
    "someone checking dating apps at a family dinner",
    "the office party karaoke mic",
    "a hotel hallway walk of almost-shame",
    "friends pretending they don't see the couple fighting",
    "someone Venmo-requesting an ex",
    "the open bar line at a reunion",
    "a toast that went too honest",
    "someone leaving a house party with the host's hoodie",
    "the morning-after brunch table of silence",
    "a rideshare with too much honesty",
    "the group pretending the situationship is fine",
    "someone unmuting the family chat by accident",
    "a dating-app meet-cute that is going poorly",
    "the coworker crush at the holiday party",
    "a plus-one eating cake alone",
    "friends ranking last night's decisions",
    "someone finding their own thirst trap on a TV",
    "the designated driver watching the chaos",
    "a wedding afterparty coat pile confession",
    "two people realizing they dated the same person",
    "the group chat naming the night's disaster",
    "someone trying to sneak out of a sleepover as an adult",
    "a bar tab nobody wants to split",
    "the last call stampede",
    "a hotel minibar crime scene",
    "friends hiding an ex's incoming call",
    "someone practicing a define-the-relationship speech",
    "the office Slack after the party",
    "a karaoke duet that is too much",
    "the leftover pizza conference at 4am",
    "someone googling 'is this a date'",
    "friends staging an intervention about a situationship",
    "a reunion nametag with an unfortunate nickname",
    "the shared-bathroom morning after a house party",
    "someone returning a hoodie via mailbox",
    "the screenshot that should not have been sent",
    "friends ranking red flags like it's trivia",
    "a wedding seating chart revenge placement",
    "the last person to learn they were the topic",
    "someone writing a toast that is actually a roast",
  ];
  return scenes.map((s) => ({ text: `Caption for ${s}`, rating: "mature" as const }));
}

function wyrMature(): Array<{ a: string; b: string; rating: "mature"; difficulty: "medium" }> {
  const pairs: Array<[string, string]> = [
    ["Tell your group chat every dating thought", "Never talk about dating with friends again"],
    ["Always send the drunk text", "Never text after 10pm"],
    ["Have your search history read at a wedding", "Have your group chat projected on a screen"],
    ["Be stuck in a situationship for a year", "Have one very public breakup"],
    ["Always be the designated driver", "Always be the last one standing"],
    ["Date someone your friends hate", "Date someone who hates your friends"],
    ["Relive your most awkward hookup story", "Forget it and have friends remind you forever"],
    ["Open-bar unlimited but you give the toast", "Two-drink max and no public speaking"],
    ["Your ex is in the wedding party", "Your ex is the DJ"],
    ["Every date is a double date", "You can never introduce partners to friends"],
    ["Always split the bill to the penny", "Always lose the Venmo request"],
    ["Your mom joins the group chat", "Your boss joins the group chat"],
    ["Never ghost anyone again", "Never be able to leave a conversation politely"],
    ["Live-tweet your dating life", "Have friends silently judge without comments"],
    ["Always overshare at brunch", "Never be allowed to mention last night"],
    ["Be famous for one chaotic night", "Be forgotten at every party"],
    ["Have read receipts on forever", "Never know if anyone saw your message"],
    ["Date only through apps", "Never use an app again"],
    ["Your search history is a party game", "Your camera roll is a party game"],
    ["Always be someone's rebound", "Always be the person they almost dated"],
    ["Give a roast at every wedding", "Give a sincere speech at every birthday"],
    ["Never drink again", "Never stay out past midnight again"],
    ["Have an ex narrate your dates", "Have your friends veto every date"],
    ["Always sit next to an ex at dinner", "Always get seated with strangers"],
    ["Your plus-one is randomly assigned", "You can never bring a plus-one"],
    ["Every party has a roast of you", "Every party you have to roast someone else"],
    ["Lose the group chat forever", "Be admin of every group chat forever"],
    ["Always be the screenshot", "Always be the one who leaks"],
    ["Have one legendary messy night a year", "Have mildly awkward nights every weekend"],
    ["Date someone with no filter", "Date someone who never says what they mean"],
    ["Your hotel key always opens the wrong room first", "You always forget which floor you're on"],
    ["Be the story at every reunion", "Have no one remember you from school"],
    ["Always catch feelings first", "Never catch feelings at all"],
    ["Have your situationship join family dinner", "Have your family join a group trip"],
    ["Never mute a chat", "Never unmute one"],
    ["Always be slightly overdressed", "Always realize you underdressed at the door"],
    ["Your dating app bio is written by friends", "Your friends write your wedding toast now"],
    ["Relive the walk home after a bad date", "Relive the morning-after small talk"],
    ["Be honest on every first date", "Be mysterious forever"],
    ["Have last night's photos auto-post", "Have last night's texts auto-forward to your best friend"],
    ["Always split a dessert", "Never be allowed to share food"],
    ["Work trip with your crush", "Staycation with your ex's friends"],
    ["Be late to every party", "Be the first to arrive every time"],
    ["Have to explain every meme you send", "Never be allowed to send memes"],
    ["One friend has veto power on dates", "The whole group votes publicly"],
    ["Keep every ex as a friend", "Never speak to an ex again"],
    ["Your search for 'is this a date' is public", "Your drafts folder is public"],
    ["Always be the plus-one", "Always host and never get invited"],
    ["Have karaoke as your only talent", "Have honesty as your only talent"],
    ["Tell the truth in every toast", "Only tell jokes in every toast"],
  ];
  return pairs.map(([a, b]) => ({ a, b, rating: "mature" as const, difficulty: "medium" as const }));
}

function expandCrowdCall() {
  const existing = load<Array<{ text: string; choices: string[]; rating?: string }>>("prompts/crowd-call.json");
  const tagged = existing.map((e) => ({ ...e, rating: (e.rating as "family" | "mature") ?? "family" }));
  let next = fillUnique(tagged, crowdFamily(), (e) => e.text.toLowerCase());
  next = fillUnique(next, crowdMature(), (e) => e.text.toLowerCase());
  next = shuffle(next, 42);
  save("prompts/crowd-call.json", next);
  return next.length;
}

function expandSpectrum() {
  const existing = load<Array<{ left: string; right: string; rating?: string }>>("prompts/spectrum.json");
  const tagged = existing.map((e) => ({ ...e, rating: (e.rating as "family" | "mature") ?? "family" }));
  let next = fillUnique(tagged, spectrumFamily(), (e) => `${e.left}|${e.right}`.toLowerCase());
  next = fillUnique(next, spectrumMature(), (e) => `${e.left}|${e.right}`.toLowerCase());
  next = shuffle(next, 7);
  save("prompts/spectrum.json", next);
  return next.length;
}

function expandSplit() {
  const existing = load<Array<{ text: string; labelA: string; labelB: string; rating?: string }>>("prompts/split-room.json");
  const tagged = existing.map((e) => ({ ...e, rating: (e.rating as "family" | "mature") ?? "family" }));
  let next = fillUnique(tagged, splitFamily(), (e) => e.text.toLowerCase());
  next = fillUnique(next, splitMature(), (e) => e.text.toLowerCase());
  next = shuffle(next, 13);
  save("prompts/split-room.json", next);
  return next.length;
}

function expandRoles() {
  const existing = load<string[]>("categories/friend-sort-roles.json");
  const extra = extraRoles(existing);
  const next = [...existing, ...extra].slice(0, 240);
  save("categories/friend-sort-roles.json", next);
  return next.length;
}

function expandImpostor() {
  const existing = load<Array<{ id: string; label: string; items: string[] }>>("categories/impostor.json");
  const have = new Set(existing.map((p) => p.id));
  const next = [...existing];
  for (const pack of impostorPacks()) {
    if (!have.has(pack.id)) next.push(pack);
  }
  save("categories/impostor.json", next);
  return next.reduce((n, p) => n + p.items.length, 0);
}

function expandForbidden() {
  const existing = load<Array<{ word: string; forbidden: string[]; rating?: string }>>("words/forbidden-clue.json");
  const tagged = existing.map((e) => ({
    ...e,
    rating: (e.rating as "family" | "mature") ?? "family",
  }));
  const family = FORBIDDEN_FAMILY_SEEDS.map((e) => ({ ...e, rating: "family" as const }));
  let next = fillUnique(tagged, family, (e) => e.word.toLowerCase());
  next = fillUnique(next, forbiddenMature(), (e) => e.word.toLowerCase());
  save("words/forbidden-clue.json", next);
  return next.length;
}

function expandFactCheckFamily() {
  const existing = load<Array<{ prompt: string; truth: string; rating?: string; difficulty?: string }>>("prompts/fact-check.json");
  const seenTruth = new Set(existing.map((e) => e.truth.trim().toLowerCase()));
  const seenPair = new Set(existing.map((e) => `${e.prompt}|${e.truth}`.toLowerCase()));
  const familyCount = () => existing.filter((e) => (e.rating ?? "family") === "family").length;
  const generated = generateFactCheckFamilyPairs(400);
  for (const row of generated) {
    if (familyCount() >= 200) break;
    let truth = row.truth;
    let n = 1;
    while (seenTruth.has(truth.toLowerCase()) && n < 20) {
      truth = `${row.truth} vol. ${n + 1}`;
      n++;
    }
    if (!isFactCheckTruthValid(row.prompt, truth)) continue;
    const key = `${row.prompt}|${truth}`.toLowerCase();
    if (seenPair.has(key) || seenTruth.has(truth.toLowerCase())) continue;
    seenPair.add(key);
    seenTruth.add(truth.toLowerCase());
    existing.push({ ...row, truth, rating: "family", difficulty: row.difficulty });
  }
  save("prompts/fact-check.json", existing);
  return familyCount();
}

function expandCaptionMature() {
  const existing = load<Array<{ text: string; rating?: string }>>("prompts/caption.json");
  const next = fillUnique(existing, captionMature(), (e) => e.text.toLowerCase());
  save("prompts/caption.json", shuffle(next, 99));
  return next.filter((e) => e.rating === "mature").length;
}

function expandWyrMature() {
  const existing = load<Array<{ a: string; b: string; rating?: string; difficulty?: string }>>("would-you-rather.json");
  const next = fillUnique(existing, wyrMature(), (e) => `${e.a}|${e.b}`.toLowerCase());
  save("would-you-rather.json", next);
  return next.filter((e) => e.rating === "mature").length;
}

const counts = {
  crowdCall: expandCrowdCall(),
  spectrum: expandSpectrum(),
  splitRoom: expandSplit(),
  roles: expandRoles(),
  impostorItems: expandImpostor(),
  forbidden: expandForbidden(),
  factCheckFamily: expandFactCheckFamily(),
  captionMature: expandCaptionMature(),
  wyrMature: expandWyrMature(),
};
console.log(JSON.stringify(counts, null, 2));
