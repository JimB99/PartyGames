/**
 * Fill remaining large pools to 50+ mature entries (P2 audit).
 * Run: node --import tsx scripts/expand-mature-p2.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/shared/content");
const TARGET = 50;

function load<T>(rel: string): T {
  return JSON.parse(readFileSync(join(CONTENT, rel), "utf8")) as T;
}

function save(rel: string, data: unknown) {
  writeFileSync(join(CONTENT, rel), `${JSON.stringify(data, null, 2)}\n`);
}

function fill<T>(existing: T[], extras: T[], key: (item: T) => string): T[] {
  const seen = new Set(existing.map(key));
  const out = [...existing];
  const matureCount = () => out.filter((e) => (e as { rating?: string }).rating === "mature").length;
  for (const item of extras) {
    if (matureCount() >= TARGET) break;
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

const BRACKET: Array<{ name: string; rating: "mature"; difficulty: "medium" }> = [
  "worst first dates",
  "hangover cures",
  "bar drinks",
  "college party themes",
  "dating app red flags",
  "wedding reception songs",
  "things said after midnight",
  "reasons to call in sick",
  "breakup movies",
  "karaoke anthems",
  "cheap date ideas",
  "expensive date ideas",
  "things you regret texting",
  "best dive bars",
  "worst roommates",
  "office party disasters",
  "ex nicknames",
  "flirting strategies",
  "bachelor party ideas",
  "bachelorette party ideas",
  "things better after 10pm",
  "drunk food orders",
  "reasons to leave a party",
  "awkward toast topics",
  "relationship dealbreakers",
  "best happy hour snacks",
  "worst pickup lines",
  "best pickup lines",
  "things hidden from parents",
  "weekend recovery plans",
  "club dress codes",
  "after-party locations",
  "things you only admit after two drinks",
  "group chat chaos",
  "dating show villains",
  "honeymoon destinations",
  "things not to search at work",
  "reasons the group chat exploded",
  "best designated-driver snacks",
  "worst plus-ones",
  "reunion outfits",
  "things said in an Uber",
  "party fouls",
  "best mocktails",
  "worst hangovers in fiction",
  "late-night diner orders",
  "things you swear you would never do again",
  "best house-party snacks",
  "awkward elevator conversations",
  "reasons the wedding was delayed",
  "things overheard at last call",
  "best late-night pizza toppings",
  "worst karaoke duets",
  "secret office party snacks",
].map((name) => ({ name, rating: "mature" as const, difficulty: "medium" as const }));

const REVERSE: Array<{ fact: string; truth: string; rating: "mature"; difficulty: "medium" }> = [
  { fact: "21", truth: "What is the legal drinking age in the United States?" },
  { fact: "1920", truth: "In what year did US Prohibition of alcohol begin?" },
  { fact: "1933", truth: "In what year did the US repeal Prohibition?" },
  { fact: "Nevada", truth: "Which US state is famous for Las Vegas casinos?" },
  { fact: "Mardi Gras", truth: "Which New Orleans festival is known for beads and parades?" },
  { fact: "Oktoberfest", truth: "Which German festival is famous for beer tents?" },
  { fact: "Bacchus", truth: "Who was the Roman god of wine?" },
  { fact: "Dionysus", truth: "Who was the Greek god of wine and revelry?" },
  { fact: "Speakeasy", truth: "What secret bar type hid drinks during Prohibition?" },
  { fact: "Designated driver", truth: "What party role stays sober so others can drink?" },
  { fact: "Hangover", truth: "What word describes feeling ill the morning after drinking?" },
  { fact: "Tequila", truth: "Which spirit is traditionally made from blue agave?" },
  { fact: "Champagne", truth: "Which sparkling wine must come from a region in France?" },
  { fact: "Bourbon", truth: "Which American whiskey must be made mostly from corn?" },
  { fact: "Hops", truth: "What flower cone gives beer its bitter flavor?" },
  { fact: "Malt", truth: "What germinated grain is a core beer ingredient?" },
  { fact: "Proof", truth: "What number is twice a drink’s alcohol percentage?" },
  { fact: "Last call", truth: "What phrase means a bar will stop serving soon?" },
  { fact: "Open bar", truth: "What wedding perk means drinks are already paid for?" },
  { fact: "Bouncer", truth: "What door staff checks IDs at a nightclub?" },
  { fact: "Cover charge", truth: "What fee do some clubs collect at the door?" },
  { fact: "Happy hour", truth: "What bar promotion offers cheaper drinks after work?" },
  { fact: "Shot", truth: "What is a small, quickly downed serving of liquor called?" },
  { fact: "Mocktail", truth: "What is a cocktail made without alcohol called?" },
  { fact: "Corkage", truth: "What restaurant fee covers bringing your own bottle?" },
  { fact: "Sommelier", truth: "What trained restaurant staff member recommends wine?" },
  { fact: "IPA", truth: "What beer style name stands for India Pale Ale?" },
  { fact: "Stout", truth: "What dark beer style includes Guinness?" },
  { fact: "Moonshine", truth: "What illicit homemade spirit was common during Prohibition?" },
  { fact: "Tab", truth: "What do you close when you finish a night at the bar?" },
  { fact: "Last orders", truth: "What British pub phrase means drinks will stop soon?" },
  { fact: "BYOB", truth: "What four letters mean bring your own bottle?" },
  { fact: "Pub crawl", truth: "What outing visits several bars in one night?" },
  { fact: "Karaoke", truth: "What nightlife hobby has people sing over backing tracks?" },
  { fact: "Last dance", truth: "What wedding-reception song traditionally ends the night?" },
  { fact: "Best man", truth: "Which groomsman usually gives a toast at the reception?" },
  { fact: "Maid of honor", truth: "Which bridesmaid usually gives a toast at the reception?" },
  { fact: "Honeymoon", truth: "What trip do newlyweds take after the wedding?" },
  { fact: "Bachelor party", truth: "What pre-wedding celebration is thrown for the groom?" },
  { fact: "Bachelorette", truth: "What pre-wedding celebration is thrown for the bride?" },
  { fact: "Plus-one", truth: "What wedding invite term lets a guest bring a date?" },
  { fact: "RSVP", truth: "What four letters ask guests to confirm they will attend?" },
  { fact: "Toasting", truth: "What ceremony moment raises glasses to the couple?" },
  { fact: "Garter", truth: "What wedding accessory is sometimes tossed to groomsmen?" },
  { fact: "Bouquet toss", truth: "What reception game has unmarried guests catch flowers?" },
  { fact: "Vegas", truth: "Which city is nicknamed Sin City?" },
  { fact: "21+", truth: "What age-gate appears on many nightlife venues?" },
  { fact: "ID check", truth: "What door step verifies you are old enough to enter a bar?" },
  { fact: "Nightcap", truth: "What do you call a final drink before heading home?" },
  { fact: "Afterparty", truth: "What unofficial gathering continues once the main event ends?" },
].map((row) => ({ ...row, rating: "mature" as const, difficulty: "medium" as const }));

const TIMELINE: Array<{ event: string; year: number; rating: "mature"; difficulty: "medium" }> = [
  { event: "US Prohibition began", year: 1920 },
  { event: "US Prohibition ended", year: 1933 },
  { event: "Playboy magazine first published", year: 1953 },
  { event: "Woodstock music festival", year: 1969 },
  { event: "First Super Bowl", year: 1967 },
  { event: "Saturday Night Live premiered", year: 1975 },
  { event: "Studio 54 opened in New York", year: 1977 },
  { event: "MTV launched", year: 1981 },
  { event: "The first episode of Friends aired", year: 1994 },
  { event: "The first episode of The Sopranos aired", year: 1999 },
  { event: "The Hangover was released", year: 2009 },
  { event: "Las Vegas Strip welcomed the Bellagio", year: 1998 },
  { event: "The first James Bond film Dr. No was released", year: 1962 },
  { event: "Mad Men premiered", year: 2007 },
  { event: "The first season of The Bachelor aired", year: 2002 },
  { event: "The Real Housewives of Orange County premiered", year: 2006 },
  { event: "Jersey Shore premiered", year: 2009 },
  { event: "Love Island UK first aired", year: 2015 },
  { event: "The first episode of Cheers aired", year: 1982 },
  { event: "The Cosmopolitan cocktail surged in Sex and the City", year: 1998 },
  { event: "Burning Man first held on a beach", year: 1986 },
  { event: "Coachella festival first held", year: 1999 },
  { event: "The first legal same-sex marriages in Massachusetts", year: 2004 },
  { event: "US Supreme Court decision Obergefell v. Hodges", year: 2015 },
  { event: "The 21st Amendment was ratified", year: 1933 },
  { event: "The 18th Amendment was ratified", year: 1919 },
  { event: "First Casino Royale novel published", year: 1953 },
  { event: "Moulin Rouge opened in Paris", year: 1889 },
  { event: "The Cotton Club opened in Harlem", year: 1923 },
  { event: "The first Playboy Club opened", year: 1960 },
  { event: "The first episode of Sex and the City aired", year: 1998 },
  { event: "The Wolf of Wall Street was released", year: 2013 },
  { event: "The Great Gatsby novel published", year: 1925 },
  { event: "The first episode of Entourage aired", year: 2004 },
  { event: "The first season of Succession aired", year: 2018 },
  { event: "The first season of Euphoria aired", year: 2019 },
  { event: "The first episode of Breaking Bad aired", year: 2008 },
  { event: "The Godfather was released", year: 1972 },
  { event: "Goodfellas was released", year: 1990 },
  { event: "Pulp Fiction was released", year: 1994 },
  { event: "The first episode of True Detective aired", year: 2014 },
  { event: "The first episode of Game of Thrones aired", year: 2011 },
  { event: "The first episode of The Office (US) aired", year: 2005 },
  { event: "The first episode of Parks and Recreation aired", year: 2009 },
  { event: "The first legal sports betting in New Jersey after PASPA", year: 2018 },
  { event: "The first Powerball drawing", year: 1992 },
  { event: "The first Mega Millions drawing under that name", year: 2002 },
  { event: "The first episode of Drunk History aired on Comedy Central", year: 2013 },
  { event: "The first season of The White Lotus aired", year: 2021 },
  { event: "Barbie the movie was released", year: 2023 },
].map((row) => ({ ...row, rating: "mature" as const, difficulty: "medium" as const }));

const DRAW_WORDS = [
  "hangover",
  "nightclub",
  "bouncer",
  "cocktail",
  "wine glass",
  "beer pong",
  "karaoke",
  "limousine",
  "casino chips",
  "slot machine",
  "wedding cake",
  "best man",
  "bridesmaid",
  "plus one",
  "open bar",
  "last call",
  "taxi home",
  "dance floor",
  "DJ booth",
  "neon sign",
  "martini",
  "champagne toast",
  "photo booth",
  "red carpet",
  "vip rope",
  "hotel key",
  "room service",
  "pool party",
  "rooftop bar",
  "dive bar",
  "juke box",
  "dartboard",
  "poker table",
  "roulette wheel",
  "lucky dice",
  "confetti cannon",
  "glow stick",
  "disco ball",
  "smoke machine",
  "stage dive",
  "crowd surf",
  "afterparty",
  "designated driver",
  "mocktail",
  "bottle service",
  "coat check",
  "velvet rope",
  "birthday shot",
  "group selfie",
  "sunrise commute",
  "whiskey sour",
  "glow-in-the-dark bracelets",
  "party bus",
].map((word) => ({ word, rating: "mature" as const, difficulty: "medium" as const }));

const CHARADES_WORDS = [
  "ordering another round",
  "sneaking into a party",
  "hailing a cab at 2am",
  "giving a drunk toast",
  "losing your hotel key",
  "dancing like nobody is watching",
  "trying to look sober",
  "fighting over the aux cord",
  "taking a group selfie",
  "waiting in the coat-check line",
  "getting carded at the door",
  "splitting the dinner bill",
  "proposing a toast",
  "doing the electric slide",
  "catching the bouquet",
  "walking in high heels",
  "playing beer pong",
  "spinning a prize wheel",
  "shuffling a deck of cards",
  "singing karaoke off-key",
  "flagging down a bartender",
  "closing the bar tab",
  "posing on a red carpet",
  "sneaking leftover cake",
  "calling a designated driver",
].map((word) => ({ word, rating: "mature" as const, difficulty: "medium" as const }));

function main() {
  const bracket = load<Array<{ name: string; rating?: string }>>("categories/bracket.json");
  const nextBracket = fill(bracket, BRACKET, (e) => e.name.toLowerCase());
  save("categories/bracket.json", nextBracket);
  console.log("bracket mature", nextBracket.filter((e) => e.rating === "mature").length);

  const reverse = load<Array<{ fact: string; truth: string; rating?: string }>>("prompts/reverse-fact.json");
  const nextReverse = fill(reverse, REVERSE, (e) => `${e.fact.toLowerCase()}|${e.truth.toLowerCase()}`);
  save("prompts/reverse-fact.json", nextReverse);
  console.log("reverse-fact mature", nextReverse.filter((e) => e.rating === "mature").length);

  const timeline = load<Array<{ event: string; rating?: string }>>("trivia/timeline.json");
  const nextTimeline = fill(timeline, TIMELINE, (e) => e.event.toLowerCase());
  save("trivia/timeline.json", nextTimeline);
  console.log("timeline mature", nextTimeline.filter((e) => e.rating === "mature").length);

  const draw = load<Array<{ word: string; rating?: string }>>("words/draw.json");
  const nextDraw = fill(draw, DRAW_WORDS, (e) => e.word.toLowerCase());
  save("words/draw.json", nextDraw);
  console.log("draw mature", nextDraw.filter((e) => e.rating === "mature").length);

  const charades = load<Array<{ word: string; rating?: string }>>("words/charades.json");
  const nextCharades = fill(charades, CHARADES_WORDS, (e) => e.word.toLowerCase());
  save("words/charades.json", nextCharades);
  console.log("charades mature", nextCharades.filter((e) => e.rating === "mature").length);

  const rolesRaw = load<Array<string | { name: string; rating?: string }>>("categories/friend-sort-roles.json");
  const roles = rolesRaw.map((r) =>
    typeof r === "string" ? { name: r, rating: "family" as const } : { name: r.name, rating: (r.rating as "family" | "mature") ?? "family" },
  );
  const ROLE_MATURE = [
    "The last one dancing",
    "The tab closer",
    "The lightweight",
    "The designated driver",
    "The group-chat instigator",
    "The karaoke hog",
    "The plus-one magnet",
    "The afterparty planner",
    "The messy texter",
    "The wedding crasher",
    "The bartender's favorite",
    "The coat-check lost cause",
    "The over-sharer",
    "The wingman",
    "The wingwoman",
    "The hopeless romantic",
    "The serial dater",
    "The commitment-phobe",
    "The ex-file keeper",
    "The revenge-era glow-up",
    "The brunch hungover",
    "The fake-ID legend",
    "The shot-or-nothing friend",
    "The dance-floor closer",
    "The Uber-splitting accountant",
    "The hotel-key loser",
    "The rooftop regular",
    "The dive-bar poet",
    "The club-queue diplomat",
    "The last-call philosopher",
    "The group selfie director",
    "The playlist tyrant",
    "The 'one more round' captain",
    "The hangover chef",
    "The brunch-mimosas chair",
    "The red-flag detector",
    "The green-flag hoarder",
    "The situationship specialist",
    "The slow-burn texter",
    "The double-text champion",
    "The leave-on-read artist",
    "The wedding-toast risk",
    "The bachelor-party treasurer",
    "The bachelorette itinerary",
    "The honeymoon researcher",
    "The plus-one negotiator",
    "The open-bar strategist",
    "The mocktail convert",
    "The nightbus navigator",
    "The sunrise-commute survivor",
  ].map((name) => ({ name, rating: "mature" as const }));
  const nextRoles = fill(roles, ROLE_MATURE, (e) => e.name.toLowerCase());
  save("categories/friend-sort-roles.json", nextRoles);
  console.log("friend-sort mature", nextRoles.filter((e) => e.rating === "mature").length);

  const impostor = load<Array<{ id: string; label: string; items: string[]; rating?: string }>>("categories/impostor.json");
  const tagged = impostor.map((p) => ({ ...p, rating: p.rating ?? "family" }));
  const NIGHTLIFE_ITEMS = [
    "Nightclub", "Speakeasy", "Rooftop bar", "Casino floor", "Karaoke lounge",
    "Dive bar", "Wine cellar", "Brewery taproom", "Cocktail lab", "Jazz club",
    "Dance floor", "VIP booth", "Coat check", "Hotel lobby bar", "Afterparty loft",
    "Pool cabana", "Wedding reception", "Bachelor cabin", "Bachelorette bus", "Open-bar tent",
    "Late-night diner", "Cab queue", "Photo booth", "DJ booth",
  ];
  const AFTER_HOURS = [
    "Last call", "Neon sign", "Velvet rope", "Bottle service", "Shot flight",
    "Mocktail menu", "Happy hour", "Pub crawl", "Poker night", "Roulette table",
    "Slot row", "Limousine", "Party bus", "Hotel key", "Room service",
    "Sunrise taxi", "Designated driver", "Cover charge", "Bouncer", "Guest list",
    "Glow sticks", "Disco ball", "Smoke machine", "Dance-off", "Champagne tower",
    "Confetti cannon",
  ];
  const extraPacks = [
    { id: "nightlife", label: "Nightlife", rating: "mature" as const, items: NIGHTLIFE_ITEMS },
    { id: "after-hours", label: "After hours", rating: "mature" as const, items: AFTER_HOURS },
  ];
  const packIds = new Set(tagged.map((p) => p.id));
  for (const pack of extraPacks) {
    if (!packIds.has(pack.id)) tagged.push(pack);
  }
  save("categories/impostor.json", tagged);
  const impostorMature = tagged.filter((p) => p.rating === "mature").flatMap((p) => p.items).length;
  console.log("impostor mature items", impostorMature);
}

main();
