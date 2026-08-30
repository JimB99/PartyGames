import factCheckJson from "../../shared/content/prompts/fact-check.json";
import splitRoomJson from "../../shared/content/prompts/split-room.json";
import spectrumJson from "../../shared/content/prompts/spectrum.json";
import crowdCallJson from "../../shared/content/prompts/crowd-call.json";
import reverseFactJson from "../../shared/content/prompts/reverse-fact.json";
import witShowdownJson from "../../shared/content/prompts/wit-showdown.json";
import captionJson from "../../shared/content/prompts/caption.json";
import hotSeatJson from "../../shared/content/prompts/hot-seat.json";
import quizJson from "../../shared/content/trivia/quiz.json";
import timelineJson from "../../shared/content/trivia/timeline.json";
import wouldYouRatherJson from "../../shared/content/would-you-rather.json";
import drawWordsJson from "../../shared/content/words/draw.json";
import charadesWordsJson from "../../shared/content/words/charades.json";
import outOfPlaceJson from "../../shared/content/categories/out-of-place.json";
import forbiddenClueJson from "../../shared/content/words/forbidden-clue.json";
import friendSortRolesJson from "../../shared/content/categories/friend-sort-roles.json";
import bracketCategoriesJson from "../../shared/content/categories/bracket.json";
import { dictionary } from "./dictionary.js";

import type {
  CategoryEntry,
  FactCheckEntry,
  ForbiddenClueCard,
  OutOfPlaceCategory,
  PromptEntry,
  QuizEntry,
  TimelineEntry,
  WordEntry,
  WouldYouRatherEntry,
} from "@party-games/shared";

export const content = {
  factCheck: factCheckJson as FactCheckEntry[],
  reverseFact: reverseFactJson as FactCheckEntry[],
  witShowdown: witShowdownJson as PromptEntry[],
  caption: captionJson as PromptEntry[],
  hotSeat: hotSeatJson as PromptEntry[],
  quiz: quizJson as QuizEntry[],
  timeline: timelineJson as TimelineEntry[],
  wouldYouRather: wouldYouRatherJson as WouldYouRatherEntry[],
  drawWords: drawWordsJson as WordEntry[],
  charadesWords: charadesWordsJson as WordEntry[],
  friendSortRoles: friendSortRolesJson as string[],
  bracketCategories: bracketCategoriesJson as CategoryEntry[],
  splitRoom: splitRoomJson as Array<{ text: string; labelA: string; labelB: string }>,
  spectrum: spectrumJson as Array<{ left: string; right: string }>,
  crowdCall: crowdCallJson as Array<{ text: string; choices: string[] }>,
  outOfPlace: outOfPlaceJson as OutOfPlaceCategory[],
  forbiddenClue: forbiddenClueJson as ForbiddenClueCard[],
  dictionary,
};
