# AV Player - Project Rules

## Language
- Telugu lo matladali (user preference)

## Code Quality
- Prati code change tarvata `npx tsc --noEmit` AND `npx eslint src/` run cheyali
- No inline styles - separate style files lo pettali (e.g. `src/styles/components/...`)
- Poppins font everywhere - use `fontFamily` not `fontWeight`
- Tests ni user adigithe tappa add cheyakuda

## Git & Source Control
- **DO NOT revert/overwrite local code with GitHub version.**
- Manam local ga work chesthunnam. User testing complete chesi tane GitHub ki push chesthadu.
- Git pull, reset --hard, checkout from remote vanti operations user explicit ga adigithe tappa cheyakudadu.
- Local files ne source of truth ga treat cheyali.

## Tech Stack (already in place - do NOT redo)
- React Native 0.85, TypeScript, Zustand, MMKV
- react-native-track-player, react-native-video
- Android focus (offline music & video player)

## Response Style
- Concise ga undali
- Long explanations ki badulu, direct action teesko
