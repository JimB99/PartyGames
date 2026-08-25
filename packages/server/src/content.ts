import fibbageJson from "../../shared/content/prompts/fibbage.json";
import fibbageReverseJson from "../../shared/content/prompts/fibbage-reverse.json";
import quiplashJson from "../../shared/content/prompts/quiplash.json";
import captionJson from "../../shared/content/prompts/caption.json";
import hotSeatJson from "../../shared/content/prompts/hot-seat.json";
import quizJson from "../../shared/content/trivia/quiz.json";
import timelineJson from "../../shared/content/trivia/timeline.json";
import wouldYouRatherJson from "../../shared/content/would-you-rather.json";
import drawWordsJson from "../../shared/content/words/draw.json";
import charadesWordsJson from "../../shared/content/words/charades.json";
import muppetsJson from "../../shared/content/categories/muppets.json";
import bracketCategoriesJson from "../../shared/content/categories/bracket.json";
import dictionaryRaw from "../../shared/content/words/dictionary.txt?raw";

export const content = {
  fibbage: fibbageJson as Array<{ prompt: string; truth: string }>,
  fibbageReverse: fibbageReverseJson as Array<{ fact: string; truth: string }>,
  quiplash: quiplashJson as string[],
  caption: captionJson as string[],
  hotSeat: hotSeatJson as string[],
  quiz: quizJson as Array<{ question: string; choices: string[]; correct: number }>,
  timeline: timelineJson as Array<{ event: string; year: number }>,
  wouldYouRather: wouldYouRatherJson as Array<{ a: string; b: string }>,
  drawWords: drawWordsJson as string[],
  charadesWords: charadesWordsJson as string[],
  muppets: muppetsJson as string[],
  bracketCategories: bracketCategoriesJson as string[],
  dictionary: new Set(
    dictionaryRaw.split(",").map((w: string) => w.trim().toLowerCase()).filter(Boolean),
  ),
};
