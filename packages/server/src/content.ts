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

import type {
  CategoryEntry,
  FibbageEntry,
  PromptEntry,
  QuizEntry,
  TimelineEntry,
  WordEntry,
  WouldYouRatherEntry,
} from "@party-games/shared";

export const content = {
  fibbage: fibbageJson as FibbageEntry[],
  fibbageReverse: fibbageReverseJson as FibbageEntry[],
  quiplash: quiplashJson as PromptEntry[],
  caption: captionJson as PromptEntry[],
  hotSeat: hotSeatJson as PromptEntry[],
  quiz: quizJson as QuizEntry[],
  timeline: timelineJson as TimelineEntry[],
  wouldYouRather: wouldYouRatherJson as WouldYouRatherEntry[],
  drawWords: drawWordsJson as WordEntry[],
  charadesWords: charadesWordsJson as WordEntry[],
  muppets: muppetsJson as string[],
  bracketCategories: bracketCategoriesJson as CategoryEntry[],
  dictionary: new Set(
    dictionaryRaw.split(",").map((w: string) => w.trim().toLowerCase()).filter(Boolean),
  ),
};
