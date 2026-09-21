/**
 * Template-based spicy mature prompts (opinions / dares / labels — not factual trivia).
 */
import {
  isSpicyBracketName,
  isSpicyContent,
  isSpicyDrawWord,
  isSpicyWyrPair,
} from "../packages/shared/src/content-quality.ts";

const MIN_POOL = 150;

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const k = item.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item.trim());
  }
  return out;
}

function dedupeWyr(items: Array<{ a: string; b: string }>): Array<{ a: string; b: string }> {
  const seen = new Set<string>();
  const out: Array<{ a: string; b: string }> = [];
  for (const { a, b } of items) {
    const ka = a.trim();
    const kb = b.trim();
    if (ka.length < 6 || kb.length < 6 || ka.length > 90 || kb.length > 90) continue;
    if (!isSpicyWyrPair(ka, kb)) continue;
    const key = `${ka}|${kb}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ a: ka, b: kb });
  }
  return out;
}

const WYR_VERB_A = [
  "Confess",
  "Reveal",
  "Show",
  "Admit",
  "Share",
  "Read aloud",
  "Let the room see",
  "Expose",
  "Own up to",
  "Describe",
];
const WYR_NOUN_A = [
  "your messiest hookup story",
  "your worst sexting fail",
  "your deleted affair texts",
  "your horny group chat",
  "your OnlyFans search history",
  "your thirst trap folder",
  "your secret affair playlist",
  "your hookup reward chart",
  "your spiciest saved photo",
  "your affair contact names",
  "your workplace sexting incident",
  "your stripper story",
  "your walk of shame outfit",
  "your hookup at work",
  "your friends-with-benefits secret",
  "your horny browser history headline",
  "your secret hookup spot",
  "your affair calendar",
  "your dirtiest voice note",
  "your hookup hall of shame",
];
const WYR_VERB_B = [
  "Do",
  "Perform",
  "Try",
  "Attempt",
  "Survive",
  "Endure",
  "Accept",
  "Take",
];
const WYR_NOUN_B = [
  "a horny dare from the room",
  "dirty talk impressions for one minute",
  "a sexy accent for the group",
  "a stripper name for everyone here",
  "a risky text while everyone watches",
  "dirty talk as a movie trailer",
  "a lap dance charade",
  "a pole dance mime",
  "a spanking demonstration on a pillow",
  "a safeword negotiation roleplay",
  "a thirst trap pose review",
  "a hookup outfit runway walk",
  "a sexting voice note fake-out",
  "a sexy karaoke song",
  "a confession toast about your worst hookup",
  "an affair alibi improv scene",
  "a OnlyFans bio roast",
  "a kink tier list explanation",
  "a body shot reenactment with water",
  "a walk of shame runway",
];

export function generateMatureWyr(min = MIN_POOL): Array<{ a: string; b: string }> {
  const raw: Array<{ a: string; b: string }> = [];
  for (const va of WYR_VERB_A) {
    for (const na of WYR_NOUN_A) {
      const a = `${va} ${na}`;
      for (const vb of WYR_VERB_B) {
        for (const nb of WYR_NOUN_B) {
          raw.push({ a, b: `${vb} ${nb}` });
        }
      }
    }
  }
  const pairs = [
    { a: "Ghost after sex", b: "Send a breakfast text after a hookup" },
    { a: "Sext before the first date", b: "Wait until the third date" },
    { a: "Keep affair texts archived", b: "Delete every hookup chat" },
    { a: "Try a strip club with friends", b: "Try a board game night instead" },
    { a: "Share your OnlyFans link", b: "Share your LinkedIn profile" },
    { a: "Confess a crush on someone here", b: "Confess your worst porn search" },
    { a: "Do a horny truth round", b: "Do a mild icebreaker round" },
    { a: "Skinny dip on vacation", b: "Stay in the hot tub with a swimsuit" },
    { a: "Use a safeword during kink play", b: "Use a safe word during Mario Kart" },
    { a: "Post a thirst trap tonight", b: "Post a pet photo tonight" },
    { a: "Try an open relationship", b: "Stay strictly monogamous" },
    { a: "Send nudes to a trusted partner", b: "Send memes only forever" },
    { a: "Have sex on the first date", b: "Wait for a committed relationship" },
    { a: "Use handcuffs in the bedroom", b: "Use handcuffs only on luggage" },
    { a: "Watch porn with a partner", b: "Watch porn alone only" },
    { a: "Join a spicy party game", b: "Stick to charades and trivia" },
    { a: "Kiss a friend at a party", b: "Keep strict friend boundaries" },
    { a: "Try pegging once", b: "Never try pegging" },
    { a: "Subscribe to an OnlyFans creator", b: "Subscribe to a cooking newsletter" },
    { a: "Have a one night stand on vacation", b: "Only hook up with feelings involved" },
  ];
  const merged = dedupeWyr([...pairs, ...raw]);
  const byPrefix = new Map<string, Array<{ a: string; b: string }>>();
  for (const row of merged) {
    const key = row.a.split(" ").slice(0, 2).join(" ").toLowerCase();
    const bucket = byPrefix.get(key) ?? [];
    if (bucket.length < 12) bucket.push(row);
    byPrefix.set(key, bucket);
  }
  return [...byPrefix.values()].flat().slice(0, Math.max(min, MIN_POOL) + 80);
}

const BRACKET_ADJ = [
  "worst",
  "most awkward",
  "horniest",
  "cringiest",
  "messiest",
  "most unforgettable",
  "most regrettable",
  "boldest",
  "most scandalous",
  "most overrated",
];
const BRACKET_TOPIC = [
  "hookup excuse",
  "sexting fail",
  "affair close call",
  "thirst trap caption",
  "walk of shame outfit",
  "dirty talk line",
  "OnlyFans career move",
  "strip club disaster",
  "workplace hookup scandal",
  "morning after mystery",
  "hookup playlist song",
  "safeword mishap",
  "sex toy shopping fail",
  "revenge porn nightmare",
  "polyamory drama moment",
  "swinger party awkwardness",
  "pegging plot twist",
  "rimjob regret story",
  "affair text autocorrect",
  "hr meeting after sexting",
  "hotel key card evidence",
  "mysterious bedroom bruise",
  "screenshot war casualty",
  "cloud backup surprise",
  "smart speaker sex leak",
  "dating app bio horror",
  "catfish sex reveal",
  "condom failure panic",
  "pregnancy test plot twist",
  "brothel tourism tale",
  "lap dance boundary test",
  "pole class injury",
  "burlesque pastie malfunction",
  "merkin wardrobe malfunction",
  "fetish gear delivery",
  "handcuff key panic",
  "blindfold wrong person",
  "roleplay accent fail",
  "edging marathon regret",
  "mile high club attempt",
  "nude beach erection moment",
  "hot tub orgy rumor",
  "butt plug airport security story",
  "vibrator luggage buzz",
  "lingerie surprise reveal",
  "whipped cream bikini melt",
  "collar leash public walk",
  "threesome third wheel energy",
  "cuckold confession energy",
  "strap-on sizing debate",
];

export function generateMatureBrackets(min = MIN_POOL): string[] {
  const raw: string[] = [];
  for (const adj of BRACKET_ADJ) {
    for (const topic of BRACKET_TOPIC) {
      raw.push(`${adj} ${topic}`);
    }
  }
  const extras = [
    "sex positions bracket",
    "kink discovery stories",
    "porn genre hot takes",
    "first time horror stories",
    "body part nicknames",
    "fetish gear tier list",
    "hookup app red flags",
    "affair alibi bracket",
    "stripper name bracket",
    "safeword bracket",
    "sex toy brands",
    "dirty talk styles",
    "onlyfans niche ideas",
    "sugar daddy red flags",
    "cam girl technical disasters",
    "threesome negotiation fails",
    "open relationship rules",
    "bedroom roleplay ideas",
    "public sex fine stories",
    "walk of shame breakfast orders",
  ];
  return dedupeStrings([...extras, ...raw].filter(isSpicyBracketName)).slice(0, min + 40);
}

const DRAW_ADJ = [
  "giant",
  "tiny",
  "broken",
  "glowing",
  "inflatable",
  "golden",
  "cursed",
  "neon",
  "bedroom",
  "hotel",
  "wedding",
  "bachelor party",
];
const DRAW_NOUN = [
  "vibrator",
  "dildo",
  "butt plug",
  "cock ring",
  "ball gag",
  "nipple clamps",
  "stripper pole",
  "lingerie",
  "condom",
  "lube bottle",
  "safeword card",
  "thong",
  "merkin",
  "pasties",
  "handcuffs",
  "blindfold",
  "whip",
  "flogger",
  "strap-on",
  "fleshlight",
  "anal beads",
  "rabbit vibrator",
  "prostate massager",
  "lap dance",
  "pole dance",
  "striptease",
  "banana hammock",
  "edible underwear",
  "whipped cream bikini",
  "body shot",
  "onlyfans logo",
  "thirst trap",
  "hookup app",
  "sugar daddy",
  "cam girl",
  "dominatrix",
  "submissive",
  "orgy pile",
  "walk of shame",
  "one night stand",
  "skinny dipping",
  "three-breasted woman",
  "penis cake",
  "garter toss",
  "love hotel",
  "mile high club",
  "glory hole",
  "red light district",
  "strip club",
  "brothel sign",
];

export function generateMatureDrawWords(min = MIN_POOL): string[] {
  const raw: string[] = [];
  for (const adj of DRAW_ADJ) {
    for (const noun of DRAW_NOUN) {
      const phrase = `${adj} ${noun}`;
      if (phrase.length <= 28) raw.push(phrase);
    }
  }
  const verbs = [
    "fake orgasm",
    "send sext",
    "read thirst DM",
    "hide affair text",
    "pole spin",
    "lap grind",
    "spank paddle",
    "tie to bed",
    "safeword yell",
    "post nude",
    "delete hookup chat",
    "kiss stranger",
    "dirty talk whisper",
    "strip tease",
    "whipped cream lick",
    "condom wrapper",
    "morning wood",
    "wet dream",
    "blue balls",
    "cuckold joke",
    "pegging demo",
    "rimjob joke",
    "69 position",
    "doggy style",
    "cowgirl ride",
    "missionary boring",
    "shower sex",
    "car sex",
    "office affair",
    "affair scandal",
  ];
  return dedupeStrings([...verbs, ...DRAW_NOUN, ...raw].filter(isSpicyDrawWord)).slice(0, min + 50);
}

const ROLE_THE = [
  "The",
  "Captain",
  "Professor",
  "Agent",
  "Doctor",
  "Chaos",
  "Certified",
  "Professional",
  "Retired",
  "Undercover",
];
const ROLE_NOUN = [
  "hookup historian",
  "OnlyFans accountant",
  "sexting archivist",
  "affair alibi writer",
  "thirst trap consultant",
  "strip club navigator",
  "safeword negotiator",
  "kink charter member",
  "walk of shame stylist",
  "horny group chat admin",
  "revenge porn lawyer",
  "polyamory spreadsheet keeper",
  "swinger party diplomat",
  "pegging evangelist",
  "rimjob regret counselor",
  "dirty talk coach",
  "lap dance critic",
  "pole fitness dropout",
  "burlesque pastie engineer",
  "merkin stylist",
  "sugar daddy auditor",
  "cam girl tech support",
  "hookup app ghostwriter",
  "affair calendar manager",
  "condom wallet carrier",
  "lube sommelier",
  "vibrator librarian",
  "dildo wall curator",
  "ball gag collector",
  "nipple clamp enthusiast",
  "cock ring influencer",
  "fleshlight historian",
  "strap-on sizing expert",
  "orgy floor planner",
  "threesome mediator",
  "cuckold podcast host",
  "hotwife hype person",
  "mile high club recruiter",
  "nude beach lifeguard",
  "streaker bail payer",
  "sex shop loyalty member",
  "porn audition hype man",
  "intimacy coordinator stan",
  "garter toss sniper",
  "honeymoon suite inspector",
  "love hotel concierge",
  "red light tour guide",
  "brothel debate club president",
  "escort etiquette professor",
  "onlyfans tax preparer",
];

export function generateMatureFriendSortRoles(min = MIN_POOL): string[] {
  const raw: string[] = [];
  for (const prefix of ROLE_THE) {
    for (const noun of ROLE_NOUN) {
      const name = `${prefix} ${noun}`.replace(/\s+/g, " ").trim();
      if (name.length >= 8 && name.length <= 32) raw.push(name);
    }
  }
  return dedupeStrings(raw.filter((n) => isSpicyContent(n))).slice(0, min + 30);
}

const CROWD_STEMS = [
  "After a wild hookup night, what's in the group chat first?",
  "What ends a situationship fastest?",
  "Best excuse for owning a stripper pole?",
  "Worst place to get caught sexting?",
  "Most likely post-hookup breakfast order?",
  "What kills the mood during dirty talk?",
  "Best safeword energy?",
  "Most chaotic bachelorette party activity?",
  "What makes a thirst trap flop?",
  "Worst hookup soundtrack choice?",
  "Most likely affair discovery method?",
  "Best item to leave after a one night stand?",
  "What turns a flirt into an HR meeting?",
  "Most overrated sex position?",
  "Worst OnlyFans business decision?",
  "Most likely cam girl technical disaster?",
  "Best post-sex text?",
  "Worst sexting autocorrect outcome?",
  "Most likely polyamory spreadsheet column?",
  "Best kink shop impulse buy?",
];
const CROWD_CHOICE_BANKS: string[][] = [
  ["Screenshot leak", "Apology meme", "Venmo at 4am", "Deleted thread"],
  ["Read receipts", "New hookup post", "Affair text", "Silent morning"],
  ["Home gym upgrade", "Interior design", "Pole fitness class", "Circus audition"],
  ["Family group chat", "Work Slack", "Church newsletter", "Uber driver screen"],
  ["Greasy diner", "Green smoothie", "Black coffee only", "Skip breakfast"],
  ["Wrong name moan", "Pet interruption", "Autocorrect disaster", "Roommate walk-in"],
  ["Pineapple", "Red", "Banana", "Taxes"],
  ["Stripper surprise", "Dirty charades", "Lingerie relay", "Spa day"],
  ["Bad lighting", "Cringe caption", "Mom commented", "Accidental repost"],
  ["Christian rock", "Podcast ad", "Baby shark", "Silence"],
  ["Photo tag", "Shared Netflix", "Calendar color", "Smart speaker"],
  ["Single sock", "Hoodie theft", "Toothbrush", "Mystery bruise"],
  ["Boss CC'd", "Wrong number", "Voice note essay", "Meeting invite"],
  ["Missionary only", "Against the wall", "Shower sex", "Desk sex"],
  ["Free tier only", "Forgot taxes", "Family subscribed", "Wrong link"],
  ["Frozen webcam", "Cat on keyboard", "Wrong room", "Mic left on"],
  ["You up?", "Had fun", "Delete this", "So… breakfast?"],
  ["Duck instead of…", "Sent to mom", "Boss thread", "Prayer hands"],
  ["Jealousy score", "STI test date", "Nickname", "Alibi"],
  ["Beginner cuffs", "Extra lube", "Novelty gag", "Pole grip"],
];

export function generateMatureCrowdCall(
  min = MIN_POOL,
): Array<{ text: string; choices: string[] }> {
  const out: Array<{ text: string; choices: string[] }> = [];
  const seen = new Set<string>();
  const push = (text: string, choices: string[]) => {
    if (!isSpicyContent(`${text} ${choices.join(" ")}`)) return;
    const key = `${text}|${choices.join("|")}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ text, choices: [...choices] });
  };
  for (let i = 0; i < CROWD_STEMS.length; i++) {
    push(CROWD_STEMS[i], CROWD_CHOICE_BANKS[i % CROWD_CHOICE_BANKS.length]);
  }
  for (const text of CROWD_STEMS) {
    for (const choices of CROWD_CHOICE_BANKS) {
      push(text, choices);
      if (out.length >= min + 20) return out.slice(0, min + 20);
    }
  }
  const WHO_STEMS = [
    "Who would get kicked out of a strip club first?",
    "Who would send a thirst trap by accident?",
    "Who would forget a safeword?",
    "Who would start an affair group chat?",
    "Who would own the most sex toys?",
    "Who would ghost after sex?",
    "Who would read sexting aloud at brunch?",
    "Who would join OnlyFans ironically then stay?",
    "Who would get caught sexting at work?",
    "Who would suggest a threesome at game night?",
  ];
  const WHO_CHOICES = [
    ["The flirt", "The shy one", "The over-sharer", "The chaos agent"],
    ["The photographer", "The memelord", "The romantic", "The skeptic"],
    ["The planner", "The improviser", "The whisperer", "The loud one"],
    ["The matchmaker", "The ex-tracker", "The screenshot saver", "The denier"],
    ["The collector", "The minimalist", "The gift giver", "The borrower"],
    ["The slow fade", "The blocker", "The breakfast texter", "The avoider"],
    ["The storyteller", "The oversharer", "The regretful one", "The denier"],
    ["The ironic poster", "The sincere poster", "The lurker", "The commenter"],
    ["The multitasker", "The meeting starer", "The bathroom texter", "The bold one"],
    ["The hype person", "The referee", "The nervous one", "The instigator"],
  ];
  for (let i = 0; i < WHO_STEMS.length; i++) {
    push(WHO_STEMS[i], WHO_CHOICES[i % WHO_CHOICES.length]);
  }
  return out.slice(0, min + 20);
}

const SPECTRUM_LEFT = [
  "Never sext",
  "One night stand",
  "Delete hookup chats",
  "Ghost after sex",
  "Horny DM",
  "Stripper night out",
  "Share thirst trap",
  "Dirty talk rookie",
  "Strict monogamy",
  "Hookup app bio",
  "Never cheat",
  "Keep it private",
  "Kiss a friend",
  "Mild icebreakers",
  "Missionary only",
  "Lights on",
  "Vanilla only",
  "Never use toys",
  "Wait for marriage",
  "Clothes stay on",
];
const SPECTRUM_RIGHT = [
  "Sext before first date",
  "Wait for feelings",
  "Archive for stories",
  "Breakfast text",
  "Slow burn flirt",
  "Board game night",
  "Stay mysterious",
  "Dirty talk expert",
  "Open relationship",
  "Meet in person",
  "Affair fantasy",
  "OnlyFans curious",
  "Keep boundaries",
  "Spicy party game",
  "Try every position",
  "Lights off kink",
  "BDSM curious",
  "Toy collector",
  "First date hookup",
  "Skinny dipping",
];

export function generateMatureSpectrum(min = MIN_POOL): Array<{ left: string; right: string }> {
  const out: Array<{ left: string; right: string }> = [];
  const seen = new Set<string>();
  for (let i = 0; i < SPECTRUM_LEFT.length; i++) {
    const left = SPECTRUM_LEFT[i];
    const right = SPECTRUM_RIGHT[i % SPECTRUM_RIGHT.length];
    if (!isSpicyContent(`${left} ${right}`)) continue;
    const key = `${left}|${right}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ left, right });
  }
  for (const left of SPECTRUM_LEFT) {
    for (const right of SPECTRUM_RIGHT) {
      if (left.length > 28 || right.length > 28) continue;
      if (!isSpicyContent(`${left} ${right}`)) continue;
      const key = `${left}|${right}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ left, right });
      if (out.length >= min + 20) break;
    }
    if (out.length >= min + 20) break;
  }
  return out.slice(0, min + 20);
}

export function generateMatureSplitRoom(
  min = MIN_POOL,
): Array<{ text: string; labelA: string; labelB: string }> {
  return generateMatureWyr(min).map(({ a, b }) => ({
    text: "Would you rather",
    labelA: a.length > 40 ? a.slice(0, 40) : a,
    labelB: b.length > 40 ? b.slice(0, 40) : b,
  }));
}

const IMPOSTOR_EXTRA_ITEMS = [
  "Doggy style", "Reverse cowgirl", "Spooning sex", "Standing sex", "Shower sex", "Car sex",
  "Oral sex", "Anal sex", "Foreplay", "Dirty talk", "Sexting", "Strip tease", "Lap dance",
  "Pole dance", "Massage oil", "Safe word", "Aftercare", "Quickie", "Morning sex", "Lazy sex",
  "Clitoris", "Penis", "Vagina", "Nipples", "Breasts", "Buttocks", "Anus", "Prostate",
  "Labia", "Scrotum", "Testicles", "Foreskin", "G-spot", "Perineum", "Inner thigh", "Pubic hair",
  "BDSM", "Bondage", "Spanking", "Handcuffs", "Blindfold", "Ball gag", "Nipple clamps",
  "Cock ring", "Butt plug", "Strap-on", "Pegging", "Foot fetish", "Voyeurism", "Exhibitionism",
  "Dominatrix", "Submissive", "Safeword", "Wax play", "Sensory play", "Impact play", "Edging",
  "Orgasm denial", "Cuckold fantasy", "Threesome fantasy", "Strip club", "Burlesque", "OnlyFans",
  "Cam girl", "Porn set", "Peep show", "Brothel", "Escort service", "Sugar daddy", "Sugar baby",
  "Thirst trap", "Custom video", "Tip menu", "Fluffer", "Money shot", "Hardcore scene",
  "Walk of shame", "One night stand", "Wrong name moan", "Lost underwear", "Hotel key card",
  "Spare toothbrush", "Mysterious bruise", "4am Venmo", "Screenshot leak", "Affair text",
  "Autocorrect disaster", "HR meeting", "Caught by roommate", "Thin walls", "Uber rating fight",
  "Vibrator", "Dildo", "Lube", "Condom", "Dental dam", "Lingerie", "Thong", "Fishnets",
  "Pasties", "G-string", "Cock sleeve", "Penis pump", "Kegel balls", "Rabbit vibrator",
  "Wand massager", "Anal beads", "Fleshlight", "Ball gag", "Riding crop", "Paddle",
  "Collar and leash", "Spreader bar", "Sensory deprivation", "Roleplay nurse", "Roleplay cop",
  "Roleplay teacher", "Roleplay stranger", "Mile high club", "Hot tub nude", "Nude beach",
  "Streaker", "Skinny dip", "Happy ending joke", "Body shot", "Edible underwear", "Whipped cream",
  "Chocolate body paint", "Tantric massage", "Prostate massage", "Nipple play", "Dirty dancing",
];

export function expandImpostorItems(
  packs: Array<{ id: string; label: string; rating: string; items: string[] }>,
): Array<{ id: string; label: string; rating: string; items: string[] }> {
  const globalSeen = new Set<string>();
  for (const pack of packs) {
    for (const item of pack.items) globalSeen.add(item.toLowerCase());
  }
  const extrasByPack: Record<string, string[]> = {
    "bedroom-basics": IMPOSTOR_EXTRA_ITEMS.filter((i) =>
      /sex|oral|anal|foreplay|dirty|sext|massage|quickie|morning|cowgirl|doggy|missionary|spooning|shower|standing/i.test(
        i,
      ) && !/strip club|lap dance|pole dance|strip tease|butt plug|nipple clamp|vibrator|dildo|bdsm|bondage/i.test(i),
    ),
    "body-parts": IMPOSTOR_EXTRA_ITEMS.filter((i) =>
      /clitoris|penis|vagina|nipple|breast|butt|anus|prostate|labia|scrotum|testicle|foreskin|g-spot|perineum|thigh|pubic/i.test(
        i,
      ),
    ),
    "kinks-fetishes": IMPOSTOR_EXTRA_ITEMS.filter((i) =>
      /bdsm|bondage|spank|handcuff|blindfold|ball gag|nipple clamp|cock ring|butt plug|strap|pegging|foot|voyeur|exhibition|dominatrix|submissive|safeword|wax|sensory|impact|edging|orgasm|cuckold|threesome|collar|leash|crop|paddle|roleplay/i.test(
        i,
      ),
    ),
    "adult-industry": IMPOSTOR_EXTRA_ITEMS.filter((i) =>
      /strip|burlesque|onlyfans|cam|porn|peep|brothel|escort|sugar|thirst|fluffer|money shot|hardcore|softcore|tip menu|custom video/i.test(
        i,
      ),
    ),
    "hookup-mishaps": IMPOSTOR_EXTRA_ITEMS.filter((i) =>
      /walk of shame|one night|underwear|hotel|toothbrush|bruise|venmo|screenshot|affair|autocorrect|hr|roommate|walls|uber|ghost|breakfast|hangover|pizza|alibi|voicemail/i.test(
        i,
      ),
    ),
  };
  return packs.map((pack) => {
    const extra = extrasByPack[pack.id] ?? [];
    const seen = new Set(pack.items.map((i) => i.toLowerCase()));
    const items = [...pack.items];
    for (const item of extra) {
      const k = item.toLowerCase();
      if (seen.has(k) || globalSeen.has(k)) continue;
      seen.add(k);
      globalSeen.add(k);
      items.push(item);
    }
    return { ...pack, items: items.slice(0, 50) };
  });
}

export function generateCreativePools() {
  return {
    wyr: generateMatureWyr(),
    bracket: generateMatureBrackets(),
    draw: generateMatureDrawWords(),
    friendSortRoles: generateMatureFriendSortRoles(),
    crowdCall: generateMatureCrowdCall(),
    spectrum: generateMatureSpectrum(),
    splitRoom: generateMatureSplitRoom(),
  };
}
