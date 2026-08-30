# Content credits

Party Games bundles question and prompt data from these sources:

| Source | License | Used for |
|--------|---------|----------|
| [Open Trivia Database](https://opentdb.com/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Quick Quiz trivia (API supplement) |
| [party-game-sentences](https://github.com/itsbrunodev/party-game-sentences) | MIT | Trivia, WYR, NHIE, truth/dare prompts |
| [party-game-word-lists](https://github.com/ylwl1997/party-game-word-lists) | Open dataset | Charades, draw words, bracket categories |
| [pq-words](https://github.com/pandaqi/pq-words) | Project license | Draw / charades word pools |
| [mattbierner/all-of-human-history](https://github.com/mattbierner/all-of-human-history) | MIT | Timeline game events |
| [Truth or Dare Bot API](https://truthordarebot.xyz/) | API terms | 18+ prompts (build-time harvest) |
| [nhie.io](https://nhie.io/) | API terms | Never-have-I-ever style prompts |
| Original prompts in this repo | Project license | All games (baseline content) |

## Implementation inspiration

Design and algorithm references (no code copied):

| Project | License | Used for |
|--------|---------|----------|
| [doot-games](https://github.com/virgilvox/doot-games) | MIT | Party-game platform patterns; future game ideas (Spectrum, Split the Room, Chain Sketch) |
| [blockris](https://github.com/moinsen-dev/blockris) | MIT | Trademark-safe falling-block visual approach (Block Stack) |
| [scribble-rs/scribble.rs](https://github.com/scribble-rs/scribble.rs) | BSD-3-Clause | Draw-and-guess UX reference |
| [ngehlert/kurve](https://github.com/ngehlert/kurve) | MIT | Trail-arena game reference (Trail Dash) |
| [kenrick95/c4](https://github.com/kenrick95/c4) | MIT | Four-in-a-row logic reference |
| Codenames-style word game rules | — | Agent Grid team/key mechanics |
| Taboo-style party game rules | — | Forbidden Clue verbal clue flow |
| Spyfall-style social deduction rules | — | Out of Place stranger/category flow |
| Classic hangman word game rules | — | Hangman Race letter/solve scoring |
| Pong / air-hockey arcade rules | — | Paddle Clash ball physics |
| Grid bomber battle game rules (Wikipedia / community writeups) | — | Grid Blast bombs, chains, power-ups |

When redistributing modified trivia from OpenTDB or OpenTriviaQA, comply with CC BY-SA 4.0 (attribution + share-alike).

Regenerate bundled content: `pnpm import-content`
