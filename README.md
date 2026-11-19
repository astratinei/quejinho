# Queijinho

A cute Brazilian Portuguese app for everyday life. It installs on your phone and works offline.

- 129 everyday phrases in 10 topics, with audio and pronunciation tips
- Flashcards, quizzes and a build-the-sentence game
- Traduzir: translate a word or phrase and save it to your notebook (Meu caderno), then practice it
- Streak, XP and a daily mission

## Put it on your phone

1. Create a public GitHub repository and upload every file in this folder.
2. In the repository go to Settings, then Pages. Under Build and deployment, set Source to **GitHub Actions**. Then open the Actions tab and run "Publish Queijinho" (it also runs on every push). It downloads the translation models, so the first run takes a few minutes.
3. After a minute your app is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.
4. Open that link on your phone.
   - Android (Chrome): menu, then Install app.
   - iPhone (Safari): Share, then Add to Home Screen.

After the first visit it works without internet.

## Notes

- Progress and your notebook are saved on the phone itself. Clearing browser data removes them.
- Translation works fully offline. Whole phrases and sentences use a small translation model that runs on the phone (about 35 MB, saved the first time you open the app with internet). The first translation in a session takes a few seconds to wake it up. It can lean toward European Portuguese, so check it against the phrasebook.
- If the models are missing, the app falls back to the built-in phrasebook, a small word list and, when online, the free MyMemory service.
- Credits: the translation models and the in-browser engine come from Mozilla's Firefox Translations project and the Bergamot project (see their repositories for licenses).
- If you change any file, bump `V` in `sw.js` so phones pick up the new version.
