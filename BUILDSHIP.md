# Build & ship the Android app (Shipaton eligibility)

The app is build-ready. The only thing it needs from you is an Expo account
(free, no card) so the AAB can be compiled in EAS cloud — your machine has no
Android SDK/JDK, and EAS provides them server-side.

## One-time (you)
1. Make a free Expo account: https://expo.dev/signup
2. `npx eas login`   (browser opens, approve)

## Build the AAB (me, or you)
```bash
cd agentcover
npx eas build -p android --profile preview
```
This uploads the project to EAS, compiles a signed App Bundle in the cloud,
and gives you a download link. `eas.json` is already configured for
`preview` (internal track, AAB) and `production`.

## Publish to Google Play (you — the $25 gate)
1. Pay $25 at https://play.google.com/console → create app "AgentCover"
   (package `com.agentcover.app`, already set in app.json).
2. Upload the AAB from the EAS build to the **internal sharing** track
   (or use `eas submit -p android` with a service-account key).
3. First public release must be **Aug 1 – Sep 30, 2026** to be eligible.

## Local alternative (no Expo account, but needs Android SDK + JDK 21)
```bash
npx expo prebuild --platform android   # generates ./android
cd android && ./gradlew assembleRelease # needs ANDROID_HOME + JAVA_HOME
```

## Verify the backend + app locally
```bash
./start.sh            # backend (:8731) + Expo dev server
# Expo Go (Android) scans the QR; or `npx expo start --web`
```

## Honest status
- [x] Code pushed to github.com/TheDub-lab/agentcover
- [x] Native Android project generates (expo prebuild OK)
- [x] eas-cli installed; eas.json configured for preview/production AAB
- [ ] Expo login (you)
- [ ] EAS build run -> AAB
- [ ] Google Play $25 account + first release Aug 1-Sep 30
- [ ] RevenueCat keys in app.json -> extra.revenueCat (optional for submission)
