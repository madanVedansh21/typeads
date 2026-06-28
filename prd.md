TYPEADS

Product Requirements Document — MVP

Version 1.1 · Web Platform · Confidential

PlatformWeb (desktop-first)Target UsersCollege students + global typists / touch-typing enthusiastsDesign StyleBrutalism — raw, functional, high contrastDomaintypeads.fairgigs.appScopeMVP — core typing loop + reward redemption + admin panel

01 · Overview

TypeAds is a web-based typing platform where users earn real rewards — gift cards — by typing real ad copy submitted by brands. Unlike Monkeytype or Typeracer, every word typed on TypeAds is an actual advertisement. As the user types, the ad's creative image progressively reveals on screen, creating a deeply immersive and attentive ad experience unlike any existing ad format.

Advertisers pay TypeAds for guaranteed, eyes-on-copy human impressions. TypeAds keeps a margin and passes the remainder to typists as redeemable points. Typists request gift cards directly on the platform — no email, no manual steps — and the backend validates and fulfills the redemption.

02 · Problem & Opportunity

ProblemCurrent StateTypeAds SolutionBanner blindnessUsers ignore ads entirelyUser is forced to read every word to type itZero ad recallAvg display ad recall < 10%Muscle memory + visual reveal = high recallNo reward for attentionUsers get nothing for seeing adsUsers earn gift cards for every completionTyping practice is boringRandom words, no real purposeTyping real ads gives context and meaning

03 · User Personas

THE GRINDER

18–24 · College student, India/Global

Wants to earn gift cards (Amazon, Swiggy, Flipkart) in spare time. Already uses Monkeytype casually. Motivated by real monetary value, not just leaderboard rank.

THE TOUCH TYPIST

20–35 · Developer / writer / power user

Practices typing daily. Wants purposeful practice. Treats TypeAds as Monkeytype but with a bonus reward on top. Cares about WPM and accuracy stats.

THE ADVERTISER

SMB owner / D2C brand / marketing manager

Wants real humans to read their ad copy. Pays a flat fee per campaign. Wants a simple way to submit ad text + image and track completions.

04 · Core User Flows

4.1 Typist Flow

#StepDetail1Sign up / Log inEmail + password or Google OAuth. Account created with 0 points balance.2Browse ad queueDashboard shows available ads as cards — brand name, estimated WPM time, points reward per completion.3Start typing sessionClick an ad card → typing interface loads. Ad text shown at top. Image panel on the side starts blurred/hidden.4Type the adCharacter-by-character validation. Correct = green highlight. Wrong = red. Backspace allowed. No time limit for MVP.5Image revealAs typing progresses (0–100%), the ad's creative image progressively reveals — blur lifts as percentage increases.6CompletionOn finishing the full ad text: WPM, accuracy, and points earned shown on a results screen. Points added to wallet.7Redeem rewardsUser goes to Rewards page. Selects gift card type and denomination. Submits redemption request. Backend validates points balance and eligibility, then processes fulfillment.8Receive gift cardGift card code delivered on-platform (Rewards page) and via email notification. Status shown as Pending → Fulfilled.

4.2 Advertiser Onboarding Flow (MVP)

#StepDetail1Contact / inquiryAdvertiser fills a simple interest form on the site (name, brand, ad brief, budget range). No self-serve portal for MVP.2Offline agreementYou agree on campaign scope: number of completions, flat fee, timeline. Payment collected upfront (UPI / bank transfer).3Ad submissionAdvertiser sends ad text + image via a private upload link. You validate and add to queue via admin panel.4Campaign goes liveAdmin activates campaign. It appears in the typist queue with a completion cap.5ReportingAdvertiser gets a basic completion report (total completions, avg WPM, avg accuracy) at end of campaign.

05 · Feature Specifications

5.1 Authentication

FeatureScopeEmail + password signup/loginMVPGoogle OAuthMVPEmail verification on signupMVPForgot password / reset flowMVPJWT session managementMVP

5.2 Typing Engine

FeatureScopeCharacter-by-character real-time validationMVPGreen (correct) / Red (incorrect) highlight per characterMVPBackspace supportMVPLive WPM counter during sessionMVPLive accuracy % during sessionMVPAuto-submit on last character typed correctlyMVPPause / resume sessionPost-MVPMobile keyboard supportPost-MVP

5.3 Ad Image Reveal

FeatureScopeImage rendered as a colored tile grid (8×3) initially hiddenMVPTiles reveal left-to-right as typing % increases (0–100%)MVPEach tile transitions to white/transparent on reveal — smooth, no jarring jumpsMVPLive reveal % counter shown above tile gridMVPFull image shown with brand name on completion screenMVPBlur-based reveal (CSS blur filter alternative)Post-MVP

5.4 Points & Wallet

FeatureScopePoints credited on successful ad completionMVPPoints wallet visible on dashboard and navMVPPoints history / transaction logMVPMinimum redemption threshold (e.g. 500 points = ₹50 gift card)MVPPoints expiry policy (e.g. 6 months)Post-MVP

5.5 Reward Redemption

FeatureScopeRewards page listing available gift card options (Amazon, Flipkart, Swiggy etc.)MVPUser selects gift card type and denominationMVPBackend validates: points balance >= redemption costMVPBackend validates: account age and completion count minimumMVPRedemption request logged with status: PendingMVPAdmin manually fulfills and uploads gift card codeMVPStatus updates to Fulfilled, code shown on Rewards pageMVPEmail notification on fulfillmentMVPAutomated gift card API (Qwikcilver / Xoxoday)Post-MVP

5.6 Ad Queue / Dashboard

FeatureScopeGrid of available ad cardsMVPEach card shows: brand name, points reward, estimated completion timeMVPCompleted ads marked / hidden from queueMVPDaily ad limit per user (anti-abuse)MVPFilters (by reward value, time)Post-MVP

5.7 Results Screen

FeatureScopeWPM achievedMVPFinal accuracy %MVPPoints earned this sessionMVPUpdated total wallet balanceMVPPost-session accuracy graph — line chart of accuracy % plotted over the course of the session (x = characters typed, y = accuracy %). Sampled every 5 keystrokes during the session and rendered on the results screen after completion. Shows where the user started making errors.MVPPost-session WPM graph — WPM over time plotted alongside accuracyPost-MVPShare result (Twitter / copy link)Post-MVPPersonal best comparisonPost-MVP

5.8 Admin Panel

FeatureScopeAdd new ad campaign (text + image + completion cap + points per completion)MVPActivate / deactivate campaignsMVPView all redemption requests with statusMVPMark redemption as fulfilled + paste gift card codeMVPView user list and completion statsMVPFlag / ban suspicious accountsMVPCampaign completion report export (CSV)MVP

06 · Anti-Fraud & Validation

Fraud is the #1 existential risk for TypeAds. Bots or bad actors typing ads to farm gift cards would drain the business. The following measures apply at MVP.

RiskMitigationBot auto-typingKeystroke timing analysis — human typing has natural variance. Suspiciously uniform inter-key timings flagged automatically.Same user, multiple accountsEmail verification required. Device fingerprinting (browser/OS/IP) logged per session. Admin can cross-reference.Copy-paste attackPaste event blocked on the typing input. All input must be keystroke-by-keystroke.Abnormally high WPMSessions with WPM > 200 flagged for admin review before points are credited.Redemption abuseMinimum account age (7 days) + minimum 10 completed ads before first redemption is allowed.Daily farmingDaily completion cap per user (e.g. max 20 ad completions / day).

07 · Business Model

ElementDetailAdvertiser revenueFlat fee per campaign. E.g. ₹3,000 for 500 completions of one ad.Typist payoutPoints per completion. E.g. 100 points = ₹10 gift card value. 500 pts min redemption.TypeAds marginDifference between what advertiser pays and total typist payouts for that campaign.Cash flow ruleAdvertiser pays upfront. Gift card fulfillment only happens after payment is cleared. Never run negative float.MVP pricing exampleAdvertiser: ₹3,000 / 500 completions. Typist: ₹4 per completion = ₹2,000 total payout. Margin: ₹1,000 (33%).

08 · Recommended Tech Stack

LayerTechnologyReasonFrontendNext.js (React)SSR for SEO, fast dev, easy routingStylingTailwind CSSUtility-first, brutalist UI easy to buildBackendNode.js + Express or Next.js API routesFast, JavaScript end-to-endDatabasePostgreSQLRelational — users, sessions, points, redemptionsAuthNextAuth.jsEasy OAuth + email auth out of the boxFile storageCloudinary or S3Ad images storage and CDN deliveryHostingVercel (frontend) + Railway/Render (DB)Fast MVP deployment, free tiers availableEmailResend or NodemailerTransactional emails — verification, fulfillment

10 · Design System — Brutalism

TypeAds uses strict brutalism — not neo-brutalism, not softened brutalism. Raw, functional, high contrast. Every design decision prioritizes the typing experience over decoration.

10.1 Core Principles

Function over form. If an element doesn't serve the user's typing task or reward tracking, it doesn't exist.
Exposed structure. Borders, grids, and layout lines are visible and intentional — not hidden behind shadows or blur.
No decoration. No gradients, no drop shadows, no rounded corners, no icons as decoration, no illustrations.
Typography does the work. Weight, size, and case carry all hierarchy.

10.2 Color Palette

TokenValueUsage--black#000000Primary text, borders, backgrounds (inverted sections)--white#ffffffPage background, inverted text--grey-light#eeeeeeProgress bar track, secondary backgrounds--grey-mid#888888Labels, secondary text, muted values--grey-dark#333333Inactive borders, reset button border--red-error#ff4444Wrong character highlight text--red-bg#2a0000Wrong character highlight background--correct#bbbbbbCorrectly typed character color

No other colors. No accent colors. No brand colors beyond black and white.

10.3 Typography

RoleFontSizeWeightCaseLogo / BrandArial Black18px900UPPERCASEStat numbersArial Black22px900—Section labelsArial Black9px900UPPERCASE + letter-spacing 0.15emAd text (typing)Courier New (monospace)15px400As-isInput fieldCourier New (monospace)14px700As-isBody / sub labelsArial10–11px700UPPERCASE

Two fonts only: Arial Black for UI chrome, Courier New for typing canvas. Nothing else.

10.4 Borders & Layout

All borders: 3px solid #000 — thick, unambiguous, no hairlines on structural elements
Internal dividers: 2px solid #000
Inactive / secondary borders: 2px solid #333
Border radius: 0 everywhere. No rounded corners. Ever.
Layout system: CSS Grid. All sections are explicit grid cells. No floats, no absolute positioning for layout.
Spacing: Tight. Padding inside sections: 10–16px. No large empty gaps.

10.5 Component Specs

Topbar

Background: #000
Text: #fff
Border-bottom: 3px solid #000
Logo: uppercase, 18px, weight 900

Stats Bar

4-column grid, each cell separated by 3px solid #000 border
White background
Stat label: 9px, grey-mid, uppercase, letter-spacing 0.15em
Stat number: 22px, weight 900, black

Progress Bar

Height: 6px
Track: #eee
Fill: #000
No border radius

Ad Text Display

Font: Courier New, 15px, line-height 1.9
Correct chars: #bbb
Wrong chars: white text on #000 background
Pending chars: #000
Cursor: 3px solid #000 underline on current character, blinking

Input Field

Border: 3px solid #000 on focus, 3px solid #333 default
No border radius
Font: Courier New, 14px, weight 700
Background: white
Paste blocked — onPaste preventDefault

Tile Grid (Ad Reveal)

8 columns × 3 rows = 24 tiles
Tiles start as colored blocks (brand-adjacent palette)
Tiles transition to #fff left-to-right as typing % increases
Transition: background 0.35s ease
No border radius on tiles

Brand Tag

Background: #000, text: #fff
Font: 10px, weight 900, uppercase, letter-spacing 0.12em
Padding: 3px 10px
No border radius

Points Tag

Border: 2px solid #000
Background: white, text: black
Font: 11px, weight 900

Buttons

Border: 3px solid #000
Background: white, text: black (default)
Hover: background #000, text #fff
Transition: all 0.1s
No border radius
Font: Arial Black, 11px, uppercase, letter-spacing 0.12em

Completion Overlay

Full screen, background #000
Points number: 56px, weight 900, white
Sub text: 12px, weight 700, #555
Reset button: 3px solid #fff, white text, hover inverts

10.6 States Reference

StateVisualTyping — correct charCharacter turns #bbbTyping — wrong charWhite text on black backgroundCursor position3px black underline, blinks 1sProgress 0%All tiles colored, progress bar emptyProgress 50%12 of 24 tiles white, bar half filledProgress 100%All tiles white, completion overlay fades inButton defaultWhite bg, black borderButton hoverBlack bg, white textInput focusedBorder turns 3px solid #000

11 · MVP Success Metrics

MetricTarget (30 days post-launch)Registered typists200+ usersAd completions1,000+ total completionsAvg session completion rate> 70% (started vs finished)Reward redemptions20+ successful fulfillmentsAdvertiser campaigns3+ paid campaignsFraud rate< 5% flagged sessionsAvg typist WPMTrack baseline — no target yet

12 · Out of Scope for MVP
(DONT MAKE THIS AT ) NO MOBILE ADS AND ALL

Mobile app (iOS / Android)
Advertiser self-serve portal with payment gateway
Automated gift card API integration
Leaderboards and public profiles
Referral / affiliate system
Multi-language ad support
Video ads
Real-time multiplayer typing races
TDS / GST compliance automation
Advanced fraud ML model
