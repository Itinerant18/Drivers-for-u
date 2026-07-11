You are a SENIOR QA ENGINEER, UX AUDITOR, and SECURITY TESTER combined into one.
You have deep experience testing production-grade platforms from the perspective of real humans.

You are testing a platform called VAHNLY — a driver-hiring platform.
This is NOT Uber, NOT Rapido, NOT a taxi booking app.

BUSINESS MODEL (memorize this before testing anything):

- RIDER = A car owner who logs into the rider app to HIRE a human driver.
- DRIVER = A person with no car who logs into the driver app to FIND and ACCEPT driving jobs.
- ADMIN = The platform operator who manages both riders and drivers, monitors all bookings, handles payments, KYC, and platform health.
- The rider brings the car. The driver brings the skill. The booking is a human-service hiring transaction.

ABSOLUTE RULES — READ BEFORE EVERY ACTION:

- DO NOT write any code files.
- DO NOT generate Playwright test scripts or spec files.
- DO NOT modify, create, or delete any file anywhere.
- DO NOT touch the project folder.
- Act as a REAL HUMAN sitting at a desk and also simulating a real human on a mobile device.
- Take a SCREENSHOT after every meaningful action.
- Read the actual DOM / page snapshot BEFORE clicking anything so you know what you are clicking.
- Record EVERYTHING: exact button labels, exact error messages, exact status text, exact UI copy.
- Do not assume. Always verify what is actually on screen.
- When testing mobile UX: resize the browser viewport to 390x844 (iPhone 14 size) for all mobile tests.
- When testing desktop UX: use full 1440x900 viewport.
- If a page takes more than 5 seconds to load, flag it as a performance issue.
- If you encounter a CAPTCHA or bot check, stop and report it — do not attempt to bypass it.

---

CREDENTIALS:

ADMIN PANEL: <https://admin.aniket.site>

- Email: <aniketkarmakar018@gmail.com>
- Password: Aniket018
- 2FA Code: 123456

RIDER APP: <https://rider.aniket.site>

- Phone: 7029295088
- Password: Aniket018@

DRIVER APP: <https://driver.aniket.site/login/>

- Phone: 9832520886
- Password: Aniket018@

---

KNOWN ISSUES FROM LAST AUDIT (your baseline — verify if these are fixed or still broken):

1. Dispatch never delivers job offers to driver even when driver is online.
2. Browser refresh resets driver to OFFLINE — duty state lost.
3. FCM push notifications not configured — VAPID key is placeholder.
4. Admin 2FA listed as enabled but never prompts during login.
5. Admin first login attempt times out — second attempt succeeds.
6. 14 of 19 driver account pages show only sidebar with no content.
7. /driver/account/referrals and /driver/account/insurance redirect to home.
8. Rate limit shows "Authentication failed" instead of "Too many attempts".
9. GST 5% shows as 0 on fare of 202.98.
10. Rider profile shows "Add your name" despite being logged in.
11. Rider identity shows "Unverified - Level: NONE" despite 25 trips.
12. Driver acceptance rate fluctuates without any activity.
For each known issue above — test it again and mark it as FIXED, STILL BROKEN, or PARTIALLY FIXED.

---

TESTING METHODOLOGY:

You will test as 4 different personas simultaneously:

- PERSONA A: "Anup" — the real customer (rider/car owner), using mobile browser.
- PERSONA B: "Ravi" — the real driver (no car), using mobile browser.
- PERSONA C: "Aniket" — the real admin, using desktop browser.
- PERSONA D: "Security Attacker" — a malicious user trying to break into or exploit the platform.

Use separate browser tabs for each persona. Keep them open in parallel.

---

=== PHASE 1: FIRST IMPRESSIONS AND ONBOARDING (All 3 Apps) ===

TASK 1.1 — RIDER APP FIRST IMPRESSION (Mobile viewport 390x844):

- Navigate to <https://rider.aniket.site> in mobile viewport.
- Before doing anything, take a screenshot and evaluate:
  a. Does the landing page immediately communicate what this app does?
  b. Is it clear this is a "hire a driver" service and not a taxi app?
  c. Is the visual design trustworthy? Does it look professional?
  d. Is there a logo, tagline, or hero text? What does it say exactly?
  e. Is the app loading fast? Note the time from navigation to interactive state.
  f. Is the layout properly fitted to mobile? No horizontal scroll, no cut-off elements?
  g. Are fonts readable at mobile size?
  h. Is the CTA (call to action) button prominent and clearly labeled?
- Rate first impression 1-10 and justify with exact observations.

TASK 1.2 — DRIVER APP FIRST IMPRESSION (Mobile viewport 390x844):

- Navigate to <https://driver.aniket.site/login/> in mobile viewport.
- Same evaluation as 1.1 but from driver perspective:
  a. Is it clear this app is for people who want to PROVIDE driving service?
  b. Does it look like an app a driver would trust with their income?
  c. Is the login form clean and easy to fill on mobile?
  d. Are input fields large enough to tap easily?
  e. Does the keyboard not obscure important elements when opened?
  f. Is there a "Register" or "Sign Up" path clearly visible?
- Rate first impression 1-10 and justify.

TASK 1.3 — ADMIN PANEL FIRST IMPRESSION (Desktop viewport 1440x900):

- Navigate to <https://admin.aniket.site> in desktop viewport.
- Evaluate before logging in:
  a. Is the login page professional and secure-feeling?
  b. Does it look like a legitimate admin dashboard login?
  c. Are there any obvious UI issues on the login screen?
- Then login:
  - Enter email and password.
  - Check: Does 2FA prompt appear? (Known issue — verify if fixed)
  - If 2FA prompt appears, enter 123456.
  - If it does NOT appear, flag as STILL BROKEN.
  - On first login attempt — does it timeout? (Known issue — verify if fixed)
- After login, evaluate the dashboard:
  a. Does the dashboard load within 3 seconds?
  b. Is the layout clean and information-dense but not overwhelming?
  c. Are the KPIs accurate and meaningful?
  d. Is the sidebar navigation clearly organized?
  e. Can an admin immediately understand the platform health from the dashboard?
- Rate admin UX 1-10 and justify.

---

=== PHASE 2: COMPLETE RIDER EXPERIENCE AS A REAL CUSTOMER ===

Stay in mobile viewport 390x844 for all rider tests.

TASK 2.1 — RIDER LOGIN:

- Navigate to <https://rider.aniket.site>
- Find the login option.
- Enter phone: 7029295088
- Enter password: Aniket018@
- Tap login.
- Time the login response. Over 3 seconds is a flag.
- Take screenshot of dashboard after login.
- Evaluate:
  a. Is the welcome experience warm and personal? Does it show the rider's name?
  b. Is there a personalized greeting?
  c. Is the primary action (hire a driver) immediately visible above the fold?

TASK 2.2 — RIDER DASHBOARD DEEP INSPECTION:

- Inspect every element on the rider home screen.
- Document: Every button, every text label, every icon, every section.
- Check: Is the map visible and showing correct location (should show Kolkata area)?
- Check: Are the 6 trip types visible? (One-Way, Round Trip, Hourly, Mini Out, Outstation, Monthly)
- Check: Do all trip type tabs/buttons respond to tap?
- Check: Is the vehicle class selector working?
- Check: Is there a pickup location field? Does tapping it open an autocomplete?
- Check: Is there a drop location field?
- Check: Is the date/time selector present?
- Evaluate mobile UX: Are all touch targets at least 44x44px? (Standard mobile tap target size)
- Take multiple screenshots scrolling through the full page.

TASK 2.3 — RIDER BOOKS A DRIVER (Core Flow Test):

- Select trip type: One-Way (or whichever is the default).
- Tap the pickup location field.
- Type "Howrah" and check if autocomplete suggestions appear.
  - Are suggestions relevant to Kolkata?
  - Do they appear within 2 seconds?
  - Are they easy to tap on mobile?
- Select a pickup suggestion.
- Tap the drop location field.
- Type "Park Street Kolkata" and check autocomplete.
- Select a drop suggestion.
- Select a vehicle class.
- Select a date and time for the hire.
- Check: Is the fare estimate shown before confirming?
- Check: Does fare breakdown show Base + Distance + Night Charge + GST?
  - Specifically check GST: Is it 0 or correctly calculated? (Known bug — verify if fixed)
- Confirm/Book the driver.
- Take screenshot immediately after booking.
- Record: Booking ID shown, status text shown, any confirmation message.
- Check: Is the confirmation screen clear and reassuring to the customer?
- Check: Does it tell the customer what happens next?

TASK 2.4 — RIDER WAITING STATE:

- After booking, observe the waiting/pending state.
- Check: Is there a live status indicator showing "Searching for driver" or equivalent?
- Check: Is there a timer or estimated wait time?
- Check: Is there a cancel option available?
- Check: Does the page auto-update or require manual refresh?
- Wait 30 seconds. Take screenshot. Has anything changed?
- Document the exact UX of waiting.
- Rate the waiting experience: Is it anxiety-inducing or reassuring?

TASK 2.5 — RIDER PROFILE SECTION:

- Navigate to Account > Profile.
- Check: Does the profile auto-fill with rider's name "Anup karmakar"? (Known bug — verify if fixed)
- Check: Are all profile fields present: Name, Email, DOB, Gender, Phone?
- Check: Is there a profile photo upload option?
- Check: Is the "identity verification" status shown? What level does it show? (Known bug: shows NONE)
- Try editing the name field — can it be updated?
- Try submitting with empty name — is there validation?

TASK 2.6 — RIDER WALLET:

- Navigate to Account > Wallet.
- Check: Is the wallet balance displayed correctly?
- Check: Is there an "Add Money" button?
- Tap "Add Money" — what happens? Does a payment flow open?
- Check: Is the transaction history list visible?
- On mobile: Is the wallet UI properly formatted? No overflow, no truncated amounts?

TASK 2.7 — RIDER REWARDS AND PROMOS:

- Navigate to Account > Rewards.
- Check: Is the loyalty tier shown? (Silver/Gold/Platinum)
- Check: Are active promo offers visible? (WELCOME50, weekend offers)
- Navigate to and test the promo code input:
  - Enter "WELCOME50" — does it validate?
  - Enter "FLAT100" — does it validate?
  - Enter "FAKECODE123" — does it show error?
  - Is the error message helpful?

TASK 2.8 — RIDER REFERRAL:

- Navigate to Account > Refer.
- Check: Is the referral code displayed clearly?
- Check: Are WhatsApp and SMS share buttons present?
- Tap WhatsApp share — does it open correctly on mobile?
- Check: Are referral stats shown (pending, joined, rewarded)?

TASK 2.9 — RIDER EMERGENCY AND SAFETY:

- Navigate to Account > Emergency.
- Check: Is "Auto-share trip" toggle present?
- Check: Can emergency contacts be added? (Up to 3)
- Try adding an emergency contact with a phone number.
- Check: Is Women Safety Mode accessible from settings?
- Check: Is SOS functionality visible anywhere in the booking flow?

TASK 2.10 — RIDER SUPPORT:

- Navigate to Account > Support.
- Check: Is there a category selector for issue types?
- Check: Is there a live chat option? Does tapping it do anything?
- Check: Is there a call support option? Does it trigger a phone call on mobile?
- Check: Are FAQ questions and answers rendered properly?
- Check: Is there a way to submit a ticket?

TASK 2.11 — RIDER BOOKING HISTORY:

- Navigate to Account > Bookings.
- Check: Are tabs visible for Upcoming, Completed, Cancelled?
- Check: Does each tab load the correct data?
- Check: Is the booking created in Task 2.3 visible here?
- Click on a booking — does a detail view open?
- Check: Does the detail view show full information: driver, route, fare, status, timestamp?

TASK 2.12 — RIDER SETTINGS:

- Navigate to Account > Settings.
- Check: Distance unit selector (KM/Miles) — does it work?
- Check: Notification preferences matrix (Push/SMS/Email toggles) — do they respond?
- Check: Women Safety Mode toggle — does it save?
- Check: Is there a "Delete Account" or "Deactivate Account" option?

TASK 2.13 — RIDER LEGAL PAGES:

- Navigate to Account > Legal.
- Check: Are Terms, Privacy Policy, Cancellation Policy, Refund Policy all present?
- Tap each — do they render full text?
- Check: Is the text readable on mobile? Proper font size, line height?
- Check: Is there a date of last update shown on each policy?

TASK 2.14 — RIDER SAVED PLACES:

- Navigate to Account > Places.
- Check: Is there a "Home" and "Work" shortcut?
- Try adding a Home address — type "Salt Lake Kolkata" and save.
- Check: Does it appear on the booking page as a one-tap option?

TASK 2.15 — RIDER LOGOUT AND SESSION:

- Log out from the rider app.
- After logout, press browser back button.
- Check: Does it show protected content or redirect to login?
- This is a security check — protected routes must not be accessible post-logout.

---

=== PHASE 3: COMPLETE DRIVER EXPERIENCE AS A REAL DRIVER ===

Stay in mobile viewport 390x844 for all driver tests.

TASK 3.1 — DRIVER LOGIN:

- Navigate to <https://driver.aniket.site/login/>
- Enter phone: 9832520886
- Enter password: Aniket018@
- Tap login.
- Time the response. Over 3 seconds is a flag.
- Take screenshot of dashboard after login.
- Evaluate:
  a. Is the driver's name and profile visible immediately?
  b. Is the GO ONLINE button prominent?
  c. Does the map load and show current location?
  d. Are earnings/jobs stats visible?

TASK 3.2 — DRIVER GOES ONLINE:

- Find and tap the GO ONLINE / toggle button.
- Take screenshot.
- Check: Does the status change to ONLINE visually?
- Check: Is there a "Connected" or WebSocket status badge?
- Check: What does the map show when online?
- Now REFRESH the browser.
- Check: After refresh, is the driver still ONLINE or reset to OFFLINE? (Known bug — verify if fixed)
- Document exactly what happens on refresh.

TASK 3.3 — DRIVER WAITS FOR JOB OFFER:

- With driver ONLINE, wait for the booking created by the rider in Phase 2 to arrive.
- Wait up to 3 minutes, refreshing every 30 seconds.
- Check: Does a job offer notification or card appear?
- Check: Is there any sound or visual alert for a new job?
- Check: What does the offer card show?
  - Rider name/ID?
  - Pickup location?
  - Trip type?
  - Estimated earnings?
  - Distance to pickup?
- If the offer DOES NOT arrive after 3 minutes: flag as P0

TASK 3.3 CONTINUED — DRIVER JOB OFFER VERDICT:

- If offer arrives: Screenshot it immediately. Record exact text shown. Proceed to Task 3.4.
- If offer does NOT arrive after 3 minutes:
  - Flag as P0 DISPATCH BUG — STILL BROKEN.
  - Document: Driver online status at time of waiting, WebSocket connection state, any console errors visible.
  - Do NOT stop testing. Continue with remaining driver tests and return to cross-app sync in Phase 5.

TASK 3.4 — DRIVER ACCEPTS THE JOB:

- When offer appears, inspect the offer card fully before tapping.
- Document every piece of information shown on the offer card.
- Check: Is there a countdown timer to accept before offer expires?
- Check: Is the accept button large enough to tap on mobile without error?
- Tap ACCEPT.
- Take screenshot immediately after accepting.
- Check: Does the status change to "Job Accepted" or equivalent?
- Check: Does the rider's contact information become visible?
- Check: Is there a navigation/directions button to the pickup location?
- Check: Can the driver call or message the rider?
- Check: Is there a "Start Job" button for when driver reaches pickup?

TASK 3.5 — DRIVER ACTIVE JOB FLOW:

- After accepting, test the active job screen.
- Check: Is pickup address clearly shown?
- Check: Is drop address shown?
- Check: Are the job details (trip type, vehicle, time) visible?
- Check: Is there a way to mark "Reached Pickup"?
- Tap "Reached Pickup" or equivalent if present.
- Check: Does status update?
- Check: Is there a "Start Trip" or "Job Started" button?
- Tap it if present.
- Check: Is there an "End Trip" or "Complete Job" button?
- Tap complete if present.
- Take screenshot of completion screen.
- Check: Is earnings from this job shown immediately after completion?

TASK 3.6 — DRIVER JOBS PAGE:

- Navigate to /driver/jobs
- Check: Are tabs present for ALL, COMPLETED, CANCELLED, SCHEDULED?
- Check: Does each tab load correct data?
- Check: Is the completed job from Task 3.5 visible in COMPLETED tab?
- Click on a job — does a detail view open?
- Does detail view show: rider info, route, earnings, status, timestamp?

TASK 3.7 — DRIVER EARNINGS PAGE:

- Navigate to /driver/earnings
- Check: Are Today, Week, Month views present?
- Check: Do the earnings reflect the job just completed?
- Check: Is wallet balance shown?
- Check: Is there an "Instant Payout" button?
- Tap Instant Payout — what happens? Does a payout flow open?
- Check: Are incentive targets shown? (e.g., Complete 5 trips this week to earn bonus)
- On mobile: Is the earnings chart/graph visible and properly scaled?

TASK 3.8 — DRIVER ACCOUNT PAGES (THE BIG TEST — 14 pages were broken):
Test every single account sub-page. For each page record:
STATUS: WORKING / SIDEBAR ONLY / BROKEN / REDIRECTING

- /driver/account/profile
  - Is main content rendered beyond just sidebar?
  - Is driver name, phone, rating, photo visible?
  - Can driver edit their name or bio?

- /driver/account/earnings
  - Is earnings content body rendered?
  - Are charts, totals, period selectors visible?

- /driver/account/payouts
  - Is payout content rendered?
  - Is bank account linkage visible?
  - Is there a withdrawal request option?

- /driver/account/trip-history
  - Is trip list rendered?
  - Are filters (date, status) present?

- /driver/account/incentives
  - Is incentive content rendered?
  - Are target milestones shown?

- /driver/account/vehicles
  - Is vehicle records section rendered?
  - Can driver add their client's vehicle details?

- /driver/account/performance
  - Is performance analytics rendered?
  - Are ratings, acceptance rate, completion rate shown?

- /driver/account/wallet
  - Is wallet balance rendered?
  - Is transaction history shown?

- /driver/account/notifications
  - Is notification list rendered?
  - Are there any notifications?

- /driver/account/training
  - Is training content rendered?
  - Are any training modules or videos shown?

- /driver/account/refer
  - Is referral code shown?
  - Are referral stats shown?

- /driver/account/support
  - Is support content rendered?
  - Is there a way to contact support?

- /driver/account/documents
  - Is documents section rendered?
  - Can driver upload DL, Aadhar, selfie?

- /driver/account/settings
  - Is settings form rendered?
  - Are notification preferences, language, password change available?

- /driver/account/referrals (was redirecting to home — verify if fixed)
- /driver/account/insurance (was redirecting to home — verify if fixed)

For each page above: take a screenshot and rate content completeness 0-10.

TASK 3.9 — DRIVER RATE LIMIT TEST:

- Log out of driver app.
- Try logging in with wrong password 10 times.
- After the 10th attempt, check the error message.
- Does it say "Too many attempts, please wait 15 minutes"? (Known bug: was showing "Authentication failed")
- Record exact error message shown.
- Flag if still broken.

TASK 3.10 — DRIVER MOBILE UX AUDIT:
With viewport at 390x844, go through each working driver page and evaluate:
a. Are all buttons and tap targets minimum 44x44px?
b. Does any content get cut off horizontally?
c. Is the bottom navigation accessible above the mobile keyboard when it opens?
d. Does the app handle the mobile notch/safe area correctly?
e. Are loading states shown for every data fetch?
f. Are empty states friendly and instructional? (e.g., "No jobs yet — go online to start receiving jobs")
g. Is there a pull-to-refresh gesture on list pages?
h. Does the map resize correctly on mobile?
i. Are modal dialogs properly sized for mobile? Not too small, not overflowing?
j. Is font size readable without zooming in?

---

=== PHASE 4: COMPLETE ADMIN EXPERIENCE AS A REAL OPERATOR ===

Switch to desktop viewport 1440x900 for all admin tests.

TASK 4.1 — ADMIN DASHBOARD LIVE DATA CHECK:

- On the admin dashboard, verify these KPIs from last report:
  - 12 trips — has this number changed?
  - 49 drivers online — is this live/real-time?
  - 9,057 payouts — is this figure updating?
  - Live alerts — what alerts are currently active?
- Check: Does the dashboard auto-refresh KPIs or require page reload?
- Check: Is the trip created in Phase 2 visible on the dashboard?
- Check: Is there a live map on the dashboard? Does it show active drivers?

TASK 4.2 — ADMIN LIVE OPERATIONS:

- Navigate to Live Operations section.
- Check: Is the active orders tab showing the booking from Phase 2?
- Check: Is driver queue showing the test driver (9832520886)?
- Check: Is there a manual dispatch option? Can admin assign a driver manually to a trip?
- Test manual dispatch: Assign the test driver to the test booking.
- Take screenshot before and after manual dispatch.
- Check: Does this manual assignment reflect on the rider's app? (Cross-app sync check)
- Check: Does it reflect on the driver's app?

TASK 4.3 — ADMIN TRIPS MANAGEMENT:

- Navigate to Trips section.
- Check: Is the test trip visible with correct status?
- Click on the test trip.
- Verify full detail view:
  - Rider info linked correctly?
  - Driver info linked correctly?
  - Fare breakdown visible? Is GST correct? (Known bug — verify if fixed)
  - Status history/timeline shown?
  - Map route shown?
  - Forensic trail (device, odometer) — is it showing real data or fabricated?
- Try changing trip status manually from admin.
- Check: Does status change reflect on rider and driver apps?

TASK 4.4 — ADMIN RIDERS MANAGEMENT:

- Navigate to Riders section.
- Check: Is the test rider (Anup karmakar, 7029295088) listed?
- Click on the rider profile.
- Verify:
  - All 25 historical trips visible?
  - Wallet balance (₹0) shown?
  - LTV (lifetime value) tracked?
  - Booking history linked?
  - Contact info correct?
- Test: Block/deactivate the rider account.
- Check: Does the rider get logged out or blocked immediately?
- Reactivate the rider.
- Check: Can the rider log back in?

TASK 4.5 — ADMIN DRIVERS MANAGEMENT:

- Navigate to Drivers section.
- Check: Is the test driver (9832520886) listed with correct details?
- Check: Acceptance rate, trip count, verification status visible?
- Click on driver profile.
- Verify:
  - All job history visible?
  - KYC/verification status shown?
  - Document upload status (DL, Selfie, Insurance, RC, PUC)?
  - Current online/offline status live?
  - Earnings summary visible?
- Test: Block/deactivate the driver.
- Check: Does the driver get kicked offline immediately?
- Reactivate the driver.

TASK 4.6 — ADMIN KYC AND COMPLIANCE:

- Navigate to Compliance / KYC section.
- Check: Are 2 PENDING drivers still in the queue? (From last report)
- Click on a pending KYC request.
- Verify:
  - Are all documents visible? (DL, Selfie, Aadhar)
  - Can admin preview each document?
  - Is there an Approve and Reject button?
- Test the Approve flow — click Approve on one pending driver.
- Check: Does the driver's status change to Verified immediately?
- Check: Does the audit log record this action with timestamp and IP?
- Navigate to Audit Logs to verify the KYC approval was logged.

TASK 4.7 — ADMIN DOCUMENTS VAULT:

- Navigate to Documents Vault.
- Check: Are all 7 documents indexed from last report? (DL, Selfie, Insurance, RC, PUC)
- Check: Are tags and expiry dates visible per document?
- Check: Is there an alert/flag for documents near expiry?
- Check: Can admin search documents by driver name or document type?

TASK 4.8 — ADMIN PRICING AND SURGE:

- Navigate to Pricing / Surge section.
- Check: Is the fare matrix editable inline?
- Try editing one fare value — does it save without error?
- Check: Is version history of pricing changes maintained?
- Navigate to Manual Surge section.
- Check: Is the page showing content or still minimal? (Was 566 chars — verify if improved)
- Try activating a manual surge for a zone.
- Check: Does the surge reflect in the fare calculation on the rider app?

TASK 4.9 — ADMIN PROMOTIONS AND PROMO CODES:

- Navigate to Promotions section.
- Check: Are WELCOME50, FLAT100, SAVEMORE visible with redemption tracking?
- Click on WELCOME50 — is full campaign detail shown?
- Navigate to Promo Codes section.
- Try creating a new promo code: "TEST100" with ₹100 flat discount, valid for 1 day.
- Check: Does it save?
- Go to rider app and test "TEST100" promo code.
- Check: Does it apply correctly?
- Return to admin and deactivate "TEST100".
- Check: Does the rider app now reject the code?

TASK 4.10 — ADMIN PAYMENTS AND FINANCE:

- Navigate to Payments / Finance section.
- Check: Is the transaction list loading with real data?
- Check: Are gateway volumes shown for Stripe, Razorpay, Cash?
  - Known issue: Gateway volume was 0 — verify if fixed.
- Check: Are refunds and disputes visible?
- Navigate to Payouts section.
- Check: Are the 5 payout requests from last report still visible?
- Check: Is bank verification status shown per driver?
- Check: Are TDS deductions calculated?
- Check: Is there a batch CSV export button? Does it work?

TASK 4.11 — ADMIN SUPPORT TICKETS:

- Navigate to Support Tickets section.
- Check: Are the 4 real tickets visible? (SOS, payment dispute, lost item, safety)
- Click on the SOS ticket — is it showing full detail?
- Check: Is CSAT score (5.0 from last report) shown?
- Check: Is there a "Reply" or "Resolve" action for admin?
- Test resolving one ticket.
- Check: Does the ticket status update correctly?

TASK 4.12 — ADMIN DISPATCH ZONES:

- Navigate to Dispatch Zones section.
- Check: Is KOL city zone configured correctly (0000-2359)?
- Check: Is the boundary map rendered visually?
- Check: Are trip types assigned to the zone?
- Try adding a new time restriction — does it save?

TASK 4.13 — ADMIN NOTIFICATIONS:

- Navigate to Notifications section.
- Check: Are all 6 alert rules visible? (SOS, Payment, Cancellation, KYC types)
- Check: Multi-channel delivery options (Push, SMS, Email) per alert type?
- Test: Trigger a test notification to the rider — does rider receive it?
- Test: Trigger a test notification to the driver — does driver receive it?

TASK 4.14 — ADMIN TEAM AND ROLES:

- Navigate to Team / Roles section.
- Check: Is admin "Aniket" listed as SUPERADMIN?
- Check: 2FA status — does it show enabled?
- Check: Is security audit log accessible per team member?
- Try adding a new team member with a limited role.
- Check: Does the role restriction work? (Do not actually save if it sends an invite email)

TASK 4.15 — ADMIN EMPTY / SKELETON PAGES (verify if improved from last report):
For each of these pages, navigate and check if content has been added:

- Configuration → Was empty 566 chars. Is it now functional?
- Platform Health → Was empty. Does it show service uptime, error rates?
- Developer API → Was empty. Are API keys and webhook config visible?
- AI Intelligence → Was minimal. Any ML/AI features now shown?
- Manual Surge → Was minimal 566 chars. Improved?
- Car Issues → Was sparse 808 chars. Improved?
- Driver Ops → Was minimal 675 chars. Any coaching or inspection content?
- Safety Incidents → Was 772 chars. Any incident list?
- Insurance Claims → Was 593 chars. Any claims shown?
- Corporate B2B → Was 951 chars. Any corporate accounts?
- Carbon ESG → Still minimal?
- Franchise → Still 719 chars?
For each: Rate content completeness 0-10. Screenshot every one.

TASK 4.16 — ADMIN MARKETING AND COMMUNICATIONS:

- Navigate to Marketing section.
- Check: Is the campaign builder working?
- Check: Is A/B testing configuration visible?
- Check: Are audience segment selectors present?
- Navigate to Communications section.
- Check: Are Push, SMS, Email template editors present?
- Try creating a simple push notification template.
- Check: Does it save?

TASK 4.17 — ADMIN AUDIT LOGS:

- Navigate to Audit Logs.
- Check: Are all actions from this test session logged?
  - Login event?
  - KYC approval from Task 4.6?
  - Rider block/unblock from Task 4.4?
  - Driver block/unblock from Task 4.5?
- Check: Is each log entry showing: action, user, IP address, timestamp?
- Check: Is there a search or filter for audit logs?

---

=== PHASE 5: CROSS-APP REAL-TIME SYNC AND INTEGRATION ===

Open all 3 apps simultaneously in separate tabs.
Tab 1: Admin panel (desktop viewport 1440x900)
Tab 2: Rider app (mobile viewport 390x844)
Tab 3: Driver app (mobile viewport 390x844)

The goal of this phase is to test whether all 3 apps talk to each other
in real-time like a production platform should.

TASK 5.1 — BOOKING CREATION SYNC (Rider → Admin):

- On Tab 2 (Rider): Create a new driver hiring request right now.
  - Use pickup: "Howrah Station, Kolkata"
  - Use drop: "New Town, Kolkata"
  - Select One-Way trip type
  - Select earliest available time
  - Confirm the booking
  - Note the booking ID and timestamp exactly
- Immediately switch to Tab 1 (Admin).
- Navigate to Live Operations and Trips.
- Check: Does the new booking appear within 10 seconds?
- Check: Is the booking ID matching what rider saw?
- Check: Is the status correctly shown as Pending or Searching?
- Record the exact time delta between rider confirmation and admin visibility.
- Rate sync speed: Instant (under 3s) / Fast (3-10s) / Slow (10-30s) / Broken (never appears)

TASK 5.2 — DISPATCH SYNC (Admin → Driver):

- On Tab 1 (Admin): Find the booking from Task 5.1 in Live Operations.
- Check: Is the driver (9832520886) showing as available in the driver queue?
- Check: Did the dispatch engine automatically attempt to offer the job?
- If automatic dispatch failed (known P0 bug):
  - Use manual dispatch from admin to assign driver to this booking.
  - Click assign, select the test driver, confirm assignment.
  - Take screenshot on admin side.
- Switch to Tab 3 (Driver).
- Check: Did the job offer appear on the driver app?
  - If auto dispatch: How long did it take?
  - If manual dispatch from admin: How long did it take after admin assigned?
- Document exact sync behavior with timestamps.
- This is the most critical integration test. Be extremely detailed.

TASK 5.3 — DRIVER ACCEPTANCE SYNC (Driver → Rider → Admin):

- On Tab 3 (Driver): Accept the job offer.
- Immediately switch to Tab 2 (Rider).
- Check: Did rider's status update from "Searching" to "Driver Assigned" or equivalent?
- Check: Did rider see driver's name and contact?
- Record time delta from driver acceptance to rider seeing update.
- Switch to Tab 1 (Admin).
- Check: Did admin's trip view update to show driver assigned?
- Check: Is the driver linked to the booking in admin trip detail?
- Rate three-way sync: All 3 updated / Only 2 updated / Only admin updated / Nothing updated.

TASK 5.4 — STATUS PROGRESSION SYNC (All 3 Apps):
Test each status transition and verify it syncs across all 3 apps:

Transition A — Driver marks "Reached Pickup":

- Trigger on driver app.
- Check rider app: Does status update?
- Check admin: Does status update?
- Record time delta for each.

Transition B — Driver marks "Job Started":

- Trigger on driver app.
- Check rider app: Does status update?
- Check admin: Does trip show as In Progress?
- Record time delta.

Transition C — Driver marks "Job Completed":

- Trigger on driver app.
- Check rider app: Does a completion screen appear?
- Check rider app: Is fare shown on completion?
- Check admin: Does trip move to Completed status?
- Check driver app: Is earning from this job reflected in earnings?
- Record time delta for each app.

TASK 5.5 — CANCELLATION SYNC TEST:

- Create a new booking from rider app.
- Wait for it to appear in admin.
- From rider app: Cancel the booking before driver accepts.
- Check admin: Does it reflect as Cancelled immediately?
- Check driver app: If an offer had been sent, is it withdrawn?

- Create another booking.
- Have driver accept it.
- From rider app: Try to cancel after driver acceptance.
- Check: Is cancellation allowed after driver accepts? If yes, is there a cancellation fee shown?
- Check admin: Is the cancellation with fee visible?
- Check driver app: Is driver notified of cancellation?

TASK 5.6 — ADMIN CONTROL OVER LIVE BOOKING:

- While a booking is in active state (driver accepted, job ongoing):
- From admin: Change the booking status manually.
- Check: Does this reflect on rider app?
- Check: Does this reflect on driver app?
- From admin: Add a note or flag to the booking.
- Check: Is the note visible in the booking detail?

TASK 5.7 — PUSH NOTIFICATION SYNC (Known broken — verify if fixed):

- With rider app open in Tab 2 (keep it in foreground).
- From admin: Send a test push notification to the rider.
- Check: Does a push notification appear on the rider tab?
- With driver app open in Tab 3 (keep it in foreground).
- From admin: Send a test push notification to the driver.
- Check: Does a push notification appear on the driver tab?
- Minimize both apps (switch to admin tab).
- Trigger a booking event that should push notify both.
- Check: Do browser push notifications appear even when app is in background?
- Document: WORKING / BROKEN / PARTIALLY WORKING with exact behavior.
- Known issue: VAPID key was placeholder — is this now configured?

TASK 5.8 — REAL-TIME MAP SYNC:

- On admin dashboard: Is the live map showing driver locations?
- Is the test driver (9832520886) visible as a dot on the admin map?
- Is the driver's location updating as they move (simulate by checking if coordinates update)?
- On rider app: When a driver is assigned, is the driver location visible on rider's map?
- Does the driver marker move on the rider's map in real-time?
- Document map sync: WORKING / BROKEN / PARTIALLY WORKING.

TASK 5.9 — WALLET AND PAYMENT SYNC:

- On rider app: Check wallet balance (note the current amount).
- From admin: Manually credit ₹50 to the rider's wallet if that option exists.
- Check rider app: Does the wallet balance update without page refresh?
- On driver app: Check earnings balance after completed job.
- On admin payouts: Is the driver's pending payout reflected?
- Document: Is financial data in sync across all 3 apps?

TASK 5.10 — PROMO CODE CROSS-APP SYNC:

- From admin: Create a new promo code "SYNCTEST" with ₹50 discount.
- Immediately go to rider app.
- Try applying "SYNCTEST" promo code in the booking flow.
- Check: Does it work immediately after admin creation?
- Return to admin: Deactivate "SYNCTEST".
- Go back to rider app.
- Try "SYNCTEST" again.
- Check: Is it rejected immediately after admin deactivation?
- Document sync speed for promo code activation and deactivation.

---

=== PHASE 6: SECURITY AND PENETRATION TESTING ===

Persona D: The Security Attacker.
Test all 3 apps for security vulnerabilities.
Document every finding with severity: CRITICAL / HIGH / MEDIUM / LOW.

TASK 6.1 — AUTHENTICATION SECURITY:

Admin Panel:

- Try accessing <https://admin.aniket.site/dashboard> directly without login.
  - Does it redirect to login or expose the dashboard?
- Try accessing <https://admin.aniket.site/trips> without login.
- Try accessing <https://admin.aniket.site/drivers> without login.
- Try accessing <https://admin.aniket.site/riders> without login.
- For each: Document response — redirected to login (SECURE) or content exposed (CRITICAL).

Rider App:

- Try accessing <https://rider.aniket.site/account> without login.
- Try accessing <https://rider.aniket.site/account/wallet> without login.
- Try accessing <https://rider.aniket.site/account/bookings> without login.
- Log out from rider app. Press browser back button multiple times.
- Check: Is any cached/protected content visible?
- Check: Does session expire after 30 minutes of inactivity? (Note: do not wait 30 mins, check if there is a session timeout setting visible)

Driver App:

- Try accessing <https://driver.aniket.site/driver> without login.
- Try accessing <https://driver.aniket.site/driver/jobs> without login.
- Try accessing <https://driver.aniket.site/driver/account/profile> without login.
- Log out from driver app. Press browser back button.
- Check: Is any content visible post-logout?

TASK 6.2 — INJECTION ATTACKS:
Test login forms on all 3 apps with these inputs (one at a time, note the response):

SQL Injection attempts in phone/email field:

- ' OR '1'='1
- '; DROP TABLE users; --
- admin'--
- 1' OR '1' = '1

XSS attempts in text input fields:

- <script>alert('XSS')</script>
- <img src=x onerror=alert('XSS')>
- javascript:alert('XSS')

For each attempt document:

- Which field was tested
- What the application returned
- Did any script execute? (CRITICAL if yes)
- Did the server return a 500 error with stack trace? (HIGH if yes — exposes backend)
- Was the input sanitized and rejected gracefully? (SECURE)

Test on rider app booking form (location fields):

- Enter XSS payload in pickup location field.
- Enter SQL injection in drop location field.
- Submit and check response.

Test on admin panel search fields:

- Enter XSS payload in rider search.
- Enter SQL injection in driver search.
- Document response.

TASK 6.3 — AUTHORIZATION (IDOR) TESTING:
Insecure Direct Object Reference — can one user access another user's data?

- Log in as rider (7029295088).
- Find a booking ID from rider's booking history. Note it.
- Log out.
- Log in as driver (9832520886) — drivers should NOT see rider's private booking details.
- Try accessing the rider's booking URL directly (modify the booking ID in URL).
- Check: Does the driver see the rider's private data? (CRITICAL if yes)

- Try changing the rider's ID in the URL to another ID (increment or decrement by 1).
- Check: Does it show another rider's profile? (CRITICAL if yes)

- Try accessing driver profile URLs from the rider session.
- Check: Does cross-role access work? (HIGH if yes)

TASK 6.4 — SESSION SECURITY:

- Log into rider app.
- Open browser DevTools (F12) → Application → Cookies and Local Storage.
- Check: Where is the auth token stored? Cookie or LocalStorage?
- Check: If cookie — is it marked HttpOnly? (Missing HttpOnly = MEDIUM risk)
- Check: If cookie — is it marked Secure? (Missing Secure = MEDIUM risk)
- Check: Is the token visible in any URL parameter? (HIGH risk if yes)
- Check: Is the token a JWT? If yes, decode it (base64) and check:
  - Does it contain sensitive user data in the payload?
  - What is the expiry (exp) set to? Very long expiry = MEDIUM risk.
  - Is the algorithm "none"? (CRITICAL if yes)
- Repeat session inspection for driver app and admin panel.

TASK 6.5 — RATE LIMITING:

- On rider app login: Submit wrong credentials 15 times rapidly.
  - After 10 attempts: What happens? Is there a lockout?
  - Is the error message correct? (Known bug on driver app — check rider too)
  - Is there a CAPTCHA triggered?
- On driver app login: Submit wrong credentials 10+ times.
  - Record exact error message at attempt 10. (Known bug: shows wrong message)
  - Is the lockout enforced?
- On admin panel: Submit wrong password 5 times.
  - Is there a lockout or delay?
  - Is there a CAPTCHA?
- Document: Rate limit working (SECURE) / Not working (HIGH) / Wrong message (MEDIUM).

TASK 6.6 — API ENDPOINT SECURITY:

- Open browser DevTools → Network tab on rider app after login.
- Look at the API calls being made.
- Check: Are API calls going to HTTPS only? (HTTP = CRITICAL)
- Check: Is the auth token sent in Authorization header? (Correct) or in URL? (HIGH risk)
- Check: Are any sensitive fields (password, full card number) visible in API responses?
- Check: Do any API responses include fields the frontend does not display but could be extracted?
  - Example: Is the full driver phone number in the API response when it should be masked?
  - Example: Is admin data accessible from a rider session API call?
- Repeat on driver app and admin panel.
- Document every exposed sensitive field found.

TASK 6.7 — HTTPS AND TRANSPORT SECURITY:

- Check all 3 domains for HTTPS:
  - <https://rider.aniket.site> — valid SSL certificate? Expiry date?
  - <https://driver.aniket.site> — valid SSL certificate? Expiry date?
  - <https://admin.aniket.site> — valid SSL certificate? Expiry date?
- Try accessing each as HTTP (not HTTPS):
  - <http://rider.aniket.site> — does it redirect to HTTPS automatically?
  - <http://driver.aniket.site> — does it redirect to HTTPS?
  - <http://admin.aniket.site> — does it redirect to HTTPS?
- Check: Is HSTS (HTTP Strict Transport Security) header present?
- Flag: Any domain serving over HTTP without redirect = CRITICAL.

TASK 6.8 — SENSITIVE DATA EXPOSURE:

- On rider app: Does the booking confirmation page or URL contain sensitive data?
- On driver app: Does the job offer show rider's full phone number unmasked?
  - Best practice: Show only last 4 digits until job is confirmed.
- On admin panel: Does the URL ever contain email, phone, or ID in plain text?
- Check browser console on all 3 apps for:
  - Any console.log statements printing sensitive data?
  - Any API keys or tokens logged to console?
  - Any error messages exposing database structure or server paths?
- Document every sensitive data exposure found.

TASK 6.9 — 2FA SECURITY AUDIT (Admin):

- Known issue: 2FA listed as enabled but never prompts.
- If 2FA prompt is now fixed and working:
  - Test: Use code 123456 once and login successfully.
  - Test immediately again with same code 123456 — is it rejected? (TOTP should expire)
  - Test: Use an invalid code "000000" — is it rejected with clear message?
  - Test: Skip 2FA step by navigating directly to dashboard URL — is it blocked?
- If 2FA is still not prompting: Flag as HIGH security risk. Admin panel has no second factor.

TASK 6.10 — PASSWORD SECURITY:

- On rider app register/change password: Test weak passwords:
  - "123456" — is it accepted or rejected?
  - "password" — is it accepted or rejected?
  - "a" — is it accepted or rejected?
- Check: Is there a password strength indicator?
- Check: Is there a minimum length requirement? What is it?
- On admin panel: Same weak password tests on any password change functionality.
- Document: Password policy enforced (SECURE) / No policy (HIGH risk).

---

=== PHASE 7: MOBILE UX DEEP AUDIT ===

This phase is purely about how the apps feel to a real user on a mobile device.
Use mobile viewport 390x844 throughout.
Think like a first-time user who has never seen this app before.

TASK 7.1 — RIDER APP MOBILE UX SCORECARD:
Go through every screen of the rider app and rate each on:
a. VISUAL CLARITY — Is it immediately obvious what this screen is for?
b. TAP TARGET SIZE — Are buttons large enough? Minimum 44x44px?
c. THUMB REACHABILITY — Can the primary action be reached with one thumb without stretching?
d. CONTENT HIERARCHY — Is the most important information shown first and largest?
e. LOADING FEEDBACK — Is there a spinner, skeleton, or progress indicator while data loads?
f. ERROR STATES — Are errors shown clearly with actionable recovery steps?
g. EMPTY STATES — Are empty screens friendly and instructional, not just blank?
h. TYPOGRAPHY — Is font size minimum 16px for body text? Is contrast sufficient?
i. COLOR AND TRUST — Does the color palette feel trustworthy and professional?
j. WHITESPACE — Is there enough breathing room between elements?

Rate each screen 1-10 for overall mobile UX quality:

Screen 1: Landing / Login page
Screen 2: Home / Dashboard after login
Screen 3: Booking form (pickup, drop, trip type)
Screen 4: Fare estimate screen
Screen 5: Booking confirmation screen
Screen 6: Waiting for driver screen
Screen 7: Driver assigned screen
Screen 8: Job active / in-progress screen
Screen 9: Job completed screen
Screen 10: Booking history list
Screen 11: Booking detail view
Screen 12: Wallet screen
Screen 13: Rewards and promos screen
Screen 14: Profile edit screen
Screen 15: Settings screen
Screen 16: Support screen
Screen 17: Emergency contacts screen
Screen 18: Saved places screen
Screen 19: Referral screen
Screen 20: Legal / Terms screen

For each screen: Take a screenshot, give a rating 1-10, and list the top 3 issues found.
Also give an OVERALL RIDER APP MOBILE UX SCORE out of 10.

TASK 7.2 — DRIVER APP MOBILE UX SCORECARD:
Same evaluation as Task 7.1 but for driver app screens:

Screen 1: Login page
Screen 2: Registration step 1 of 7
Screen 3: Registration step 4 of 7 (document upload)
Screen 4: Registration step 7 of 7 (final step)
Screen 5: Driver dashboard / home (offline state)
Screen 6: Driver dashboard / home (online state)
Screen 7: Incoming job offer card
Screen 8: Active job screen (after accepting)
Screen 9: Reached pickup screen
Screen 10: Job started screen
Screen 11: Job completed screen
Screen 12: Jobs list (all tab)
Screen 13: Jobs list (completed tab)
Screen 14: Earnings screen
Screen 15: Instant payout screen
Screen 16: Profile page
Screen 17: Documents upload page
Screen 18: Settings page
Screen 19: Support page

For each screen: Take a screenshot, give a rating 1-10, list top 3 issues.
Also give an OVERALL DRIVER APP MOBILE UX SCORE out of 10.

TASK 7.3 — MICRO-INTERACTION AND ANIMATION AUDIT:
On both rider and driver apps check for:
a. Button press feedback — does tapping a button give visual press state?
b. Page transition animations — are they smooth or janky?
c. Map loading animation — is there a graceful placeholder while map loads?
d. List item loading — is there a skeleton loader or just blank space?
e. Toggle switches — do online/offline toggles animate smoothly?
f. Pull-to-refresh — is there a visible pull animation?
g. Success animations — after booking confirmation, is there a success visual?
h. Error shake animation — do failed forms shake or highlight in red?
i. Toast notifications — are they appearing and dismissing smoothly?
j. Bottom sheet / modal — do they slide up smoothly from bottom?
For each: PRESENT AND SMOOTH / PRESENT BUT JANKY / MISSING.

TASK 7.4 — ACCESSIBILITY BASIC AUDIT:
On both rider and driver apps check:
a. Color contrast — is text readable for someone with low vision?
   Test: Does dark text on light background meet minimum 4.5:1 ratio visually?
b. Focus states — when using tab key on keyboard, are focused elements visible?
c. Image alt text — do all icons and images have descriptive labels?
d. Form labels — are all input fields properly labeled (not just placeholder text)?
e. Error announcement — when a form error occurs, is it near the field that has the error?
f. Touch target spacing — are buttons spaced far enough apart to avoid mis-taps?
g. Screen reader friendliness — are interactive elements announced correctly?
   (Check this by looking at aria-label attributes in DOM)
h. Zoom support — does the app still work when browser zoom is set to 150%?
   Test: Set browser to 150% zoom and navigate through key screens.

TASK 7.5 — NETWORK RESILIENCE TEST:
Test how apps behave under poor network conditions:

- Open browser DevTools → Network tab → Throttle to "Slow 3G".
- On rider app: Try loading the home page.
  - Does a loading skeleton appear?
  - Does the map load eventually or time out?
  - Are there clear loading indicators throughout?
  - Does the app crash or show a blank screen?
- On rider app: Try submitting a booking on Slow 3G.
  - Does the submit button disable to prevent double-submit?
  - Is there a loading spinner during submission?
  - If the request times out, is there a helpful error message?
- On driver app: Try going online on Slow 3G.
  - Does the WebSocket connect eventually?
  - Is there a connecting/reconnecting state shown?
- Switch network to "Offline" mode.
  - On rider app: What happens? Blank screen or offline message?
  - On driver app: What happens? Does it show cached content?
  - Is there an "You are offline" banner?
- Restore network to Normal.
  - Does the app auto-recover?
  - Does the driver reconnect to WebSocket automatically?
- Document all findings for each scenario.

TASK 7.6 — FORM VALIDATION DEEP TEST:
Test every form across all 3 apps for validation quality.

Rider app booking form:

- Submit with empty pickup location. What error appears?
- Submit with empty drop location. What error appears?
- Submit with pickup and drop as the same location. What happens?
- Submit with a past date/time selected. Is it rejected?
- Submit with no trip type selected. What happens?
- Submit with no vehicle class selected. What happens?
- Are error messages shown inline next to the field or only at the top of the form?
- Do errors clear when the user corrects the field?

Driver app login form:

- Submit empty phone field. What error appears?
- Submit empty password field. What error appears?
- Submit phone with letters (not a valid phone number). What error appears?
- Submit phone with 8 digits (too short). What error appears?
- Are errors shown before the API call or only after?

Rider app profile edit form:

- Submit with empty name. What error appears?
- Submit with invalid email format. What error appears?
- Submit with future date of birth (impossible DOB). What happens?
- Submit with DOB making the user younger than 18. What happens?

Admin panel forms:

- On promo code creation: Submit with empty code name. What error appears?
- On promo code creation: Submit with 0% discount and 0 cap. What happens?
- On dispatch zone creation: Submit with no city selected. What error appears?
- Are admin form validations consistent across sections?

TASK 7.7 — TRUST AND CREDIBILITY UX AUDIT:
As a first-time user who has never heard of Vahnly, evaluate:

Rider app trust signals:
a. Is there a visible brand name and logo on every screen?
b. Is the driver profile shown to the rider after assignment? (Name, photo, rating)
c. Is there a ratings/review system visible after job completion?
d. Is the cancellation and refund policy easy to find?
e. Is there a visible customer support option always accessible?
f. Are payment methods shown with security badges?
g. Is the rider's data privacy explained anywhere?
h. Are prices shown upfront before booking is confirmed?
i. Is there a "How it works" or onboarding explanation for new users?
j. Does the app have any social proof (ratings, number of trips completed, etc.)?
Rate trust score 1-10 with specific observations.

Driver app trust signals:
a. Is earnings potential communicated clearly on first login?
b. Is there a clear explanation of how the payout process works?
c. Is driver rating visible and explainable?
d. Are there any driver guidelines or code of conduct visible?
e. Is account security (2FA, password change) accessible easily?
f. Is driver support easily reachable if something goes wrong?
g. Is the onboarding process (7 steps) clearly progress-indicated?
h. After registration, is there a clear "what happens next" screen?
Rate driver app trust score 1-10 with specific observations.

---

=== PHASE 8: FEATURE COMPLETENESS AUDIT ===

TASK 8.1 — FEATURES PRESENT BUT NOT CONNECTED TO ADMIN:
Check each feature in rider and driver apps and verify if admin has visibility and control:

Feature 1 — Rider wallet top-up:

- Can admin see when a rider adds money to wallet?
- Can admin manually adjust wallet balance from admin panel?
- Is there a wallet transaction log in admin?

Feature 2 — Rider reviews and ratings:

- After a completed job, can rider rate the driver?
- If yes, does that rating appear on admin's driver profile view?
- Can admin see all ratings and remove fake/abusive ones?

Feature 3 — Driver earnings and incentives:

- Incentive targets visible on driver app — are they configurable from admin?
- Can admin create custom incentive campaigns from admin panel?
- Are driver incentive payouts tracked in the payments section?

Feature 4 — Rider referral program:

- Referral code is shown on rider app — when a referral is used, does admin see it?
- Is the referral reward credited automatically?
- Can admin audit referral fraud from admin panel?

Feature 5 — Driver documents:

- Driver uploads DL, Selfie, Insurance, RC, PUC from driver app.
- Does admin receive and review these in Documents Vault?
- Does admin approval or rejection of documents sync back to driver app?
- Does the driver see their document verification status?

Feature 6 — Promo codes:

- Admin creates promo code — rider can apply it. (Already tested in Phase 5)
- Can driver see if a promo is applied to their job? Is it relevant to driver?
- Does promo usage in admin show which rider used which code and when?

Feature 7 — Support tickets:

- Rider raises a support ticket from rider app — does admin see it in Support section?
- Driver raises a support ticket from driver app — does admin see it?
- When admin responds to a ticket, does rider or driver receive the reply?
- Is ticket status (Open, In Progress, Resolved) visible on both user apps?

Feature 8 — Emergency / SOS:

- Rider triggers SOS from emergency contacts screen.
- Does admin receive an SOS alert immediately in real-time?
- Is the SOS ticket visible in admin support section?
- Is there a live location share during SOS?

Feature 9 — Push notifications:

- Admin sends push from notifications section.
- Rider receives it — verified? Or still broken (VAPID issue)?
- Driver receives it — verified? Or still broken?
- Are in-app notification bells working independently of push?

Feature 10 — KYC flow:

- Driver completes document upload from driver app.
- Admin sees it in KYC Compliance queue.
- Admin approves — driver's verified status updates on driver app.
- Is driver notified of approval or rejection? What notification do they receive?

For each feature above document:

- FULLY CONNECTED (end-to-end working)
- PARTIALLY CONNECTED (one direction works)
- NOT CONNECTED (admin cannot see/control it)
- MISSING ON ONE SIDE (feature exists on one app but not the other)

TASK 8.2 — MISSING FEATURES THAT SHOULD EXIST:
Based on the business model of a driver-hiring platform, identify features
that a real production platform should have but are currently absent.
Check for each and document: PRESENT / MISSING / PARTIAL.

For Rider App:

- [ ] Can rider schedule a driver for a future date and time?
- [ ] Can rider set a recurring booking (e.g., daily driver for a month)?
- [ ] Can rider add multiple stops to a trip?
- [ ] Can rider share their live location with family during the trip?
- [ ] Can rider see driver's live location on map while waiting?
- [ ] Can rider contact driver via in-app chat (not just call)?
- [ ] Can rider give a rating and written review after job?
- [ ] Can rider see driver's profile and rating before booking?
- [ ] Can rider request a specific driver they have used before?
- [ ] Is there a loyalty program with points accumulation?
- [ ] Can rider split fare with another person?
- [ ] Can rider set a monthly driver package (dedicated driver)?
- [ ] Is there an invoice/receipt download after each job?
- [ ] Can rider report a driver for misconduct?
- [ ] Is there an estimated arrival time shown while waiting?

For Driver App:

- [ ] Can driver set their own availability hours?
- [ ] Can driver see upcoming scheduled jobs in advance?
- [ ] Can driver set preferred job types (only outstation, only hourly, etc.)?
- [ ] Can driver see their performance trends over time?
- [ ] Can driver contact rider via in-app chat?
- [ ] Can driver report a rider for misconduct?
- [ ] Can driver request an advance on earnings?
- [ ] Is there a driver training module or onboarding guide?
- [ ] Can driver set a service area (only work in certain zones)?
- [ ] Is there a driver community or announcements section?
- [ ] Can driver see their tax/TDS deduction summary?
- [ ] Is there a vehicle details section for the car they will be driving?
- [ ] Can driver rate the rider after completing the job?
- [ ] Is there a fuel expense tracker or reimbursement request?
- [ ] Can driver switch between multiple active job types?

For Admin:

- [ ] Can admin see a live heatmap of demand vs driver availability?
- [ ] Can admin bulk-message all riders or all drivers?
- [ ] Can admin set city-wise surge multipliers with time schedules?
- [ ] Can admin see which promo codes are being abused?
- [ ] Can admin generate an invoice or receipt for any completed booking?
- [ ] Is there a driver leaderboard for gamification?
- [ ] Can admin suspend a driver for a specific number of days (not permanently)?
- [ ] Is there an automated driver approval workflow?
- [ ] Can admin export all riders or drivers as CSV?
- [ ] Is there a revenue dashboard showing daily/weekly/monthly income?
- [ ] Can admin configure the booking cancellation window?
- [ ] Is there a blacklist for known fraudulent phone numbers?
- [ ] Can admin set region-specific pricing (city-level pricing)?
- [ ] Is there a platform announcement banner system (notify all users)?
- [ ] Can admin configure the driver hiring request timeout duration?

Document each item as: PRESENT / MISSING / PARTIAL.
Group missing features by priority: HIGH (core business need) / MEDIUM (enhances UX) / LOW (nice to have).

---

=== PHASE 9: PERFORMANCE AND STABILITY AUDIT ===

TASK 9.1 — PAGE LOAD TIMES:
Measure and record load times for key pages across all 3 apps.
Use browser DevTools → Network tab → measure DOMContentLoaded and Load event times.

Rider App pages (mobile viewport):

- Home/Dashboard: ___ms (GOOD under 2s / ACCEPTABLE 2-4s / SLOW over 4s)
- Booking form page: ___ms
- Booking history: ___ms
- Wallet: ___ms
- Profile: ___ms

Driver App pages (mobile viewport):

- Login: ___ms
- Dashboard/Home: ___ms
- Jobs list: ___ms
- Earnings: ___ms

Admin Panel pages (desktop):

- Dashboard: ___ms
- Trips list: ___ms
- Drivers list: ___ms
- Live Operations: ___ms

Flag any page loading over 4 seconds as a performance issue.
Flag any page loading over 8 seconds as a critical performance issue.

TASK 9.2 — JAVASCRIPT BUNDLE SIZE:
On rider app: Open DevTools → Network tab → filter by JS.

- Record the total JavaScript bundle size downloaded on first load.
- Check: Is there one massive single bundle or multiple smaller chunks?
- Check: Is code splitting implemented? (Multiple smaller JS files = good sign)
- Check: Are vendor libraries (React, map SDK, etc.) in a separate cached chunk?
- Check: Is tree shaking applied? (No unused code shipped)
- Flag: Total JS over 1MB = MEDIUM performance issue on mobile data.
- Flag: Total JS over 3MB = HIGH performance issue. Will cause slow load on Indian 4G.
- Flag: Total JS over 5MB = CRITICAL. Will cause significant drop-off for real users.
- Check: Are JS files gzip or brotli compressed? (Check Content-Encoding header)
- Check: Are JS files served with long cache headers? (Check Cache-Control header)

On driver app:

- Same exact measurement as above.
- Compare bundle size to rider app — is it similar or significantly different?

On admin panel:

- Same measurement.
- Admin can afford slightly larger bundle since it is desktop only.
- But still flag anything over 5MB as excessive.

Document results as:
Rider App JS bundle: ___KB /___MB | Compressed: Yes/No | Code split: Yes/No
Driver App JS bundle: ___KB /___MB | Compressed: Yes/No | Code split: Yes/No
Admin Panel JS bundle: ___KB /___MB | Compressed: Yes/No | Code split: Yes/No

---

TASK 9.3 — IMAGE AND ASSET OPTIMIZATION:
On all 3 apps: Open DevTools → Network tab → filter by Img.

Rider app:

- List all images loaded on the home screen.
- Check: What format are they? PNG / JPG / WebP / SVG / AVIF?
- Flag: Any PNG or JPG over 100KB on mobile = MEDIUM issue.
- Flag: Any image over 500KB on mobile = HIGH issue.
- Check: Are images using srcset for different screen densities?
- Check: Are below-fold images lazy loaded? (loading="lazy" attribute)
- Check: Is the logo an SVG? (Should be for sharpness on all screens)
- Check: Are driver/rider profile photos resized for display size or serving originals?
- Check: Are map tile images loading efficiently without excessive requests?

Driver app:

- Same as above.
- Check: Is the dashboard background or banner image optimized?

Admin panel:

- Check: Are data table icons and action icons SVG or raster?
- Check: Are any charts loading as image files instead of rendered SVG/Canvas?

Document:
Total image payload on first load for each app.
Number of unoptimized images found.
Specific recommendations per image issue found.

---

TASK 9.4 — API RESPONSE TIMES:
Open DevTools → Network tab → filter by Fetch/XHR on each app.

Rider app — measure these specific API calls:

- POST /auth/login or equivalent → ___ms
- GET /home or /dashboard data → ___ms
- GET /autocomplete (location search) → ___ms
- POST /booking/create or /hire/request → ___ms
- GET /fare/estimate → ___ms
- GET /bookings/history → ___ms
- GET /wallet/balance → ___ms
- GET /promos or /rewards → ___ms

Driver app — measure these:

- POST /auth/login → ___ms
- GET /driver/dashboard → ___ms
- GET /driver/offer (the 10-second poll) → ___ms
- POST /driver/offer/accept → ___ms
- GET /driver/jobs → ___ms
- GET /driver/earnings → ___ms

Admin panel — measure these:

- POST /admin/auth → ___ms
- GET /admin/dashboard/stats → ___ms
- GET /admin/trips → ___ms
- GET /admin/drivers → ___ms
- GET /admin/riders → ___ms
- GET /admin/live-operations → ___ms

Grading per API call:

- Under 300ms = EXCELLENT
- 300ms to 800ms = GOOD
- 800ms to 2000ms = ACCEPTABLE
- 2000ms to 5000ms = SLOW — flag it
- Over 5000ms = CRITICAL — flag it with high priority

Also check:

- Are any APIs being called multiple times unnecessarily on a single page load?
- Are there any failed API calls (4xx or 5xx responses) on normal page loads?
- Are there any CORS errors in the console?
- Are APIs returning unnecessarily large payloads?
  Example: Does the trips list API return all trip data including full route
  coordinates when it only needs to show a summary list? (Over-fetching)
- Are there any APIs with no timeout configured that hang indefinitely?

Document every slow or failed API call with:

- Endpoint URL
- HTTP method
- Response time
- Status code
- Payload size
- Issue type: SLOW / FAILED / OVER-FETCHING / CORS ERROR / NO TIMEOUT

---

TASK 9.5 — MEMORY AND CRASH TESTING:

Rider app (mobile viewport 390x844):

- Open DevTools → Memory tab.
- Take a heap snapshot before starting navigation. Note baseline memory.
- Navigate through all 13 pages sequentially without refreshing:
  Home → Bookings → Wallet → Rewards → Refer → Profile →
  Settings → Support → Emergency → Places → Legal → Notifications → Back to Home.
- After completing the full navigation cycle, take another heap snapshot.
- Check: Has memory grown by more than 50MB? Flag as potential memory leak.
- Check: Are there detached DOM nodes accumulating?
- Now perform a second full navigation cycle.
- Take a third heap snapshot.
- Check: Is memory still growing linearly? (Confirms memory leak if yes)
- Check: Does the app slow down visibly after extended navigation?
- Check: DevTools Console tab — record ALL errors and warnings seen:
  - React key warnings?
  - Undefined variable errors?
  - Failed resource loads?
  - Unhandled promise rejections?
  - Deprecated API warnings?
  List every single one with the page it appeared on.

Driver app (mobile viewport 390x844):

- Same memory baseline approach.
- Additionally: Keep the driver ONLINE for 5 minutes without touching anything.
- Monitor memory during those 5 minutes — is it growing?
- Check: Is the WebSocket connection causing any memory growth?
- Check: Is the 10-second polling for job offers causing memory accumulation?
- Check: After 5 minutes of being online, does the UI become sluggish?
- Record all console errors during the 5-minute online period.
- Check: Are there any "Maximum call stack exceeded" errors?
- Check: Any "WebSocket is already in CLOSING or CLOSED state" errors?

Admin panel (desktop):

- Navigate through 15 admin sections in sequence.
- After each section, note if the page feels slower.
- Open the Live Operations page and leave it for 3 minutes.
- Check: Is the live data refreshing without memory growing?
- Check: Are there any chart rendering errors in console?
- Check: Any infinite loop warnings in console?
- Record all console errors found across all admin sections visited.

---

TASK 9.6 — CONCURRENT SESSION TEST:

Test 1 — Rider dual session:

- Open rider app Tab A and Tab B in same browser.
- Login to same account (7029295088) in both tabs.
- In Tab A: Create a booking.
- Check Tab B without refreshing: Does the booking appear?
- In Tab A: Cancel the booking.
- Check Tab B: Does the cancellation reflect?
- Expected behavior: Both tabs should stay in sync.
- Document: SYNCED / NOT SYNCED / PARTIAL SYNC.

Test 2 — Driver dual session:

- Open driver app Tab A and Tab B.
- Login to same driver account in both tabs.
- In Tab A: Go ONLINE.
- Check Tab B: Does online status reflect?
- In Tab A: Receive and accept a job.
- Check Tab B: Does the accepted job appear or does Tab B still show an offer?
- Expected behavior: Accepting in one tab should dismiss the offer in all tabs.
- Document: If Tab B still shows the offer, that is a CRITICAL duplicate acceptance bug.

Test 3 — Admin and rider same browser:

- Admin logged in on Tab 1.
- Rider logged in on Tab 2.
- Do admin session cookies interfere with rider session?
- Do rider actions appear on admin dashboard correctly?
- Document any session bleeding or cookie conflict.

Test 4 — Logout propagation:

- Rider logged in on Tab A and Tab B.
- Log out from Tab A.
- Go to Tab B without refreshing.
- Try to perform an action (go to wallet, view booking).
- Expected: Should redirect to login since session is invalidated.
- Document: SECURE (redirects) / INSECURE (still works after logout in other tab).

---

TASK 9.7 — BROWSER COMPATIBILITY QUICK CHECK:
Test all 3 apps in these scenarios using DevTools device emulation:

Device emulation profiles to test (use Chrome DevTools device toolbar):

1. iPhone SE (375x667) — smallest common iPhone
2. iPhone 14 Pro (393x852) — most common current iPhone
3. Samsung Galaxy S21 (360x800) — most common Android in India
4. iPad Air (820x1180) — tablet view

For each device profile on rider app check:

- Does the layout fit without horizontal scroll?
- Is the booking form usable?
- Is the map properly sized?
- Are buttons reachable?
- Is any text cut off?

For each device profile on driver app check:

- Is the dashboard readable?
- Is the GO ONLINE button accessible?
- Is the job offer card properly sized?

Document any device that shows layout breakage.
Flag: Any layout breaking on Samsung Galaxy S21 = HIGH issue
(Most common device for drivers and riders in India)

---

TASK 9.8 — DARK MODE COMPATIBILITY:

- Enable OS-level dark mode in browser settings or DevTools.
- Open rider app — does it switch to dark theme or stay light?
- If dark mode: Check every screen for:
  - White text on white background (invisible text)
  - Dark text on dark background (invisible text)
  - Images with white backgrounds that look jarring in dark mode
  - Form inputs that become unreadable
- Open driver app — same checks.
- Open admin panel — same checks.
- Document: FULLY SUPPORTS DARK MODE / PARTIAL / NOT SUPPORTED.
- If not supported: Is that intentional? Flag as UX gap since many Indian
  users use dark mode to save battery on AMOLED screens.

---

TASK 9.9 — DEEP LINK AND URL STRUCTURE AUDIT:
Check URL structure across all 3 apps for:

Rider app:

- Are URLs meaningful and bookmarkable?
  Example: /account/bookings/[bookingId] instead of /page?id=abc123
- If the user copies a booking URL and opens it in a new tab after login,
  does it go directly to that booking? Or does it go to home?
- Are there any sensitive IDs exposed in URLs?
  (Booking IDs, user IDs — these should be opaque tokens not sequential integers)
- Are sequential integer IDs used? (Example: /booking/1, /booking/2)
  If yes, flag as IDOR risk — attacker can enumerate all bookings.

Driver app:

- Same URL structure check.
- Check: Are job offer IDs in URLs? If so are they guessable?

Admin panel:

- Are admin URLs meaningful?
- Can admin deep-link to a specific driver or trip?
  Example: /drivers/[driverId] — does it load that driver directly?
- Are admin URLs protected? (Already tested in Phase 6 but cross-check here)

---

TASK 9.10 — FINAL STABILITY STRESS TEST:
This is the last performance test — simulate heavy usage:

On rider app:

- Open the booking form.
- Rapidly type in the location field — trigger autocomplete 10 times in 5 seconds.
- Check: Does the app throttle/debounce the API calls?
- Check: Do multiple autocomplete results overlap or flash?
- Check: Does the app remain stable after rapid input?

On driver app:

- Rapidly toggle GO ONLINE / GO OFFLINE 5 times in quick succession.
- Check: Does the app handle rapid state changes gracefully?
- Check: Is there a debounce to prevent rapid WebSocket open/close?
- Check: After rapid toggling, is the final state (online or offline) consistent
  between what the UI shows and what admin panel shows?

On admin panel:

- Rapidly switch between 5 different sections using the sidebar.
- Check: Does the app cancel pending API requests from the previous section?
- Check: Does stale data from a previous section appear on a new section?
- Check: Does navigation remain smooth under rapid switching?

---

=== PHASE 10: FINAL COMPREHENSIVE REPORT ===

After completing ALL phases above (1 through 9), compile the complete structured
report below. This is the final deliverable. Be fully exhaustive.
Do not skip any section. Do not truncate any finding.

---

REPORT SECTION A — KNOWN BUGS STATUS UPDATE:
For each of the 12 known bugs from the previous audit, state exact status:

Format for each:
BUG [number]: [name]
Previous Status: BROKEN
Current Status: FIXED / STILL BROKEN / PARTIALLY FIXED
Evidence: [Exactly what happened when you tested it]
If fixed: What changed compared to last time?
If still broken: Exact failure description.
If partial: What part works and what part still fails.

Bug 1: Dispatch never delivers offers to drivers
Bug 2: Browser refresh resets driver to OFFLINE
Bug 3: FCM push notifications not configured
Bug 4: Admin 2FA not prompting during login
Bug 5: Admin first login attempt timeout
Bug 6: 14 of 19 driver account pages show sidebar only
Bug 7: Driver routes referrals and insurance redirect to home
Bug 8: Rate limit shows wrong error message
Bug 9: GST shows as 0 on fare
Bug 10: Rider profile does not auto-fill name
Bug 11: Rider identity shows Unverified Level NONE
Bug 12: Driver acceptance rate fluctuates without activity

---

REPORT SECTION B — ALL NEW BUGS DISCOVERED:
Every new bug not in the previous report.

For each bug:
BUG-NEW-[number]:
App: Rider / Driver / Admin / Cross-app
Severity: P0 / P1 / P2 / P3
Page/Feature: [exact location]
Steps to reproduce:
  Step 1:
  Step 2:
  Step 3:
Expected result:
Actual result:
Screenshot: [reference]
Real user impact: [how does this hurt a real rider, driver, or admin]

---

REPORT SECTION C — SECURITY FINDINGS:
Every security issue found during Phase 6 and incidentally during other phases.

For each finding:
SEC-[number]:
Severity: CRITICAL / HIGH / MEDIUM / LOW
App: Rider / Driver / Admin / All
Vulnerability type: [category]
Description: [what was found]
How to reproduce: [exact steps]
Potential attacker impact: [what damage could be done]
Fix recommendation: [specific technical fix needed]

---

REPORT SECTION D — CROSS-APP INTEGRATION SCORECARD:

| Integration Point                     | Status              | Score  | Notes                    |
|---------------------------------------|---------------------|--------|--------------------------|
| Rider booking → Admin visibility      | ___                 | ___/10 | ___                      |
| Admin manual dispatch → Driver offer  | ___                 | ___/10 | ___                      |
| Driver acceptance → Rider update      | ___                 | ___/10 | ___                      |
| Driver location → Admin live map      | ___                 | ___/10 | ___                      |
| Admin KYC approval → Driver status    | ___                 | ___/10 | ___                      |
| Admin promo create → Rider can apply  | ___                 | ___/10 | ___                      |
| Driver support ticket → Admin inbox   | ___                 | ___/10 | ___                      |
| Admin push → Rider receives           | ___                 | ___/10 | ___                      |
| Admin push → Driver receives          | ___                 | ___/10 | ___                      |
| Rider cancellation → Driver notified  | ___                 | ___/10 | ___                      |
| Job completion → Driver earnings sync | ___                 | ___/10 | ___                      |
| Rider wallet top-up → Admin ledger    | ___                 | ___/10 | ___                      |
| Driver doc upload → Admin vault       | ___                 | ___/10 | ___                      |
| Admin block rider → Rider locked out  | ___                 | ___/10 | ___                      |
| Admin block driver → Driver kicked    | ___                 | ___/10 | ___                      |
| Promo deactivate → Rider rejected     | ___                 | ___/10 | ___                      |
| SOS trigger → Admin alert             | ___                 | ___/10 | ___                      |

OVERALL INTEGRATION SCORE: ___/10
Integration grade: PRODUCTION READY (9-10) / NEAR READY (7-8) / NEEDS WORK (5-6) / BROKEN (below 5)

---

REPORT SECTION E — MOBILE UX SCORECARDS:

RIDER APP — FULL SCREEN BY SCREEN SCORES:

| Screen                        | Visual Clarity | Tap Targets | Thumb Reach | Hierarchy | Loading | Errors | Empty State | Overall |
|-------------------------------|---------------|-------------|-------------|-----------|---------|--------|-------------|---------|
| Login page                    | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Home dashboard                | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Booking form                  | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Fare estimate screen          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Booking confirmation          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Waiting for driver            | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Driver assigned screen        | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Job active / in-progress      | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Job completed screen          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Booking history list          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Booking detail view           | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Wallet screen                 | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Rewards and promos            | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Profile edit screen           | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Settings screen               | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Support screen                | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Emergency contacts            | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Saved places                  | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Referral screen               | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Legal / Terms screen          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |

RIDER APP OVERALL MOBILE UX SCORE: ___/10

Top 5 most urgent UX fixes for rider app ranked by user impact:

1. [Screen name] — [exact issue] — [why it hurts real users]
2. [Screen name] — [exact issue] — [why it hurts real users]
3. [Screen name] — [exact issue] — [why it hurts real users]
4. [Screen name] — [exact issue] — [why it hurts real users]
5. [Screen name] — [exact issue] — [why it hurts real users]

---

DRIVER APP — FULL SCREEN BY SCREEN SCORES:

| Screen                        | Visual Clarity | Tap Targets | Thumb Reach | Hierarchy | Loading | Errors | Empty State | Overall |
|-------------------------------|---------------|-------------|-------------|-----------|---------|--------|-------------|---------|
| Login page                    | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Registration step 1 of 7      | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Registration step 4 of 7      | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Registration step 7 of 7      | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Dashboard offline state       | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Dashboard online state        | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Incoming job offer card       | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Active job screen             | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Reached pickup screen         | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Job started screen            | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Job completed screen          | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Jobs list all tab             | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Jobs list completed tab       | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Earnings screen               | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Instant payout screen         | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Profile page                  | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Documents upload page         | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Settings page                 | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |
| Support page                  | ___/10        | ___/10      | ___/10      | ___/10    | ___/10  | ___/10 | ___/10      | ___/10  |

DRIVER APP OVERALL MOBILE UX SCORE: ___/10

Top 5 most urgent UX fixes for driver app ranked by user impact:

1. [Screen name] — [exact issue] — [why it hurts real drivers]
2. [Screen name] — [exact issue] — [why it hurts real drivers]
3. [Screen name] — [exact issue] — [why it hurts real drivers]
4. [Screen name] — [exact issue] — [why it hurts real drivers]
5. [Screen name] — [exact issue] — [why it hurts real drivers]

---

REPORT SECTION F — FEATURE COMPLETENESS MATRIX:

RIDER APP MISSING FEATURES:

| Feature                                        | Status    | Priority |
|------------------------------------------------|-----------|----------|
| Schedule driver for future date/time           | ___       | ___      |
| Recurring booking (daily/monthly driver)       | ___       | ___      |
| Multiple stops in a single trip                | ___       | ___      |
| Live location share with family during trip    | ___       | ___      |
| Driver live location on map while waiting      | ___       | ___      |
| In-app chat with driver (not just call)        | ___       | ___      |
| Rate and review driver after job               | ___       | ___      |
| See driver profile and rating before booking   | ___       | ___      |
| Request a specific previously used driver      | ___       | ___      |
| Loyalty points accumulation system             | ___       | ___      |
| Split fare with another person                 | ___       | ___      |
| Monthly dedicated driver package               | ___       | ___      |
| Invoice / receipt download after each job      | ___       | ___      |
| Report a driver for misconduct                 | ___       | ___      |
| ETA shown while waiting for driver             | ___       | ___      |

DRIVER APP MISSING FEATURES:

| Feature                                        | Status    | Priority |
|------------------------------------------------|-----------|----------|
| Set own availability hours                     | ___       | ___      |
| See upcoming scheduled jobs in advance         | ___       | ___      |
| Set preferred job types                        | ___       | ___      |
| Performance trends over time                   | ___       | ___      |
| In-app chat with rider                         | ___       | ___      |
| Report a rider for misconduct                  | ___       | ___      |
| Request advance on earnings                    | ___       | ___      |
| Training module or onboarding guide            | ___       | ___      |
| Set service area / preferred zones             | ___       | ___      |
| Driver community or announcements section      | ___       | ___      |
| Tax / TDS deduction summary                    | ___       | ___      |
| Vehicle details for car being driven           | ___       | ___      |
| Rate the rider after job completion            | ___       | ___      |
| Fuel expense tracker or reimbursement          | ___       | ___      |
| Switch between multiple active job types       | ___       | ___      |

ADMIN MISSING FEATURES:

| Feature                                        | Status    | Priority |
|------------------------------------------------|-----------|----------|
| Live heatmap of demand vs driver availability  | ___       | ___      |
| Bulk message all riders or all drivers         | ___       | ___      |
| Scheduled surge multipliers per city per time  | ___       | ___      |
| Promo code abuse detection dashboard           | ___       | ___      |
| Invoice / receipt generator per booking        | ___       | ___      |
| Driver leaderboard for gamification            | ___       | ___      |
| Temporary driver suspension (days not perm)    | ___       | ___      |
| Automated driver approval workflow             | ___       | ___      |
| Export riders or drivers as CSV                | ___       | ___      |
| Revenue dashboard daily / weekly / monthly     | ___       | ___      |
| Configurable booking cancellation window       | ___       | ___      |
| Blacklist for fraudulent phone numbers         | ___       | ___      |
| Region-specific pricing per city               | ___       | ___      |
| Platform-wide announcement banner system       | ___       | ___      |
| Configurable dispatch timeout duration         | ___       | ___      |

Feature Summary Counts:
Rider App — Present: ___/ Missing:___ / Partial: ___
Driver App — Present:___ / Missing: ___/ Partial:___
Admin Panel — Present: ___/ Missing:___ / Partial: ___
Total across platform — Present:___ / Missing: ___/ Partial:___
Overall feature completeness score: ___/10

Top 5 missing features that most hurt real users RIGHT NOW today:

1. [Feature name] — [App] — [Exact user pain this causes for a real person]
2. [Feature name] — [App] — [Exact user pain this causes for a real person]
3. [Feature name] — [App] — [Exact user pain this causes for a real person]
4. [Feature name] — [App] — [Exact user pain this causes for a real person]
5. [Feature name] — [App] — [Exact user pain this causes for a real person]

---

REPORT SECTION G — PERFORMANCE SUMMARY TABLE:

RIDER APP PERFORMANCE:

| Page                  | Load Time | Grade    | JS Size | Image Size | API Calls | Errors |
|-----------------------|-----------|----------|---------|------------|-----------|--------|
| Login                 | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Home dashboard        | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Booking form          | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Booking history       | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Wallet                | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Profile               | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |

DRIVER APP PERFORMANCE:

| Page                  | Load Time | Grade    | JS Size | Image Size | API Calls | Errors |
|-----------------------|-----------|----------|---------|------------|-----------|--------|
| Login                 | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Dashboard             | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Jobs list             | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Earnings              | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |

ADMIN PANEL PERFORMANCE:

| Page                  | Load Time | Grade    | JS Size | Image Size | API Calls | Errors |
|-----------------------|-----------|----------|---------|------------|-----------|--------|
| Login                 | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Dashboard             | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Trips list            | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Drivers list          | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |
| Live operations       | ___ms     | ___      | ___KB   | ___KB      | ___       | ___    |

PERFORMANCE SUMMARY:
Total JS bundle — Rider: ___MB / Driver:___MB / Admin: ___MB
Image optimization — Rider:___/10 / Driver: ___/10 / Admin:___/10
API response average — Rider: ___ms / Driver:___ms / Admin: ___ms
Slowest single API call found: [endpoint] at___ms on [app]
Total console errors found — Rider: ___/ Driver:___ / Admin: ___
Memory leak detected — Rider: YES/NO / Driver: YES/NO / Admin: YES/NO
Overall performance grade — Rider:___/10 / Driver: ___/10 / Admin:___/10

---

REPORT SECTION H — ADMIN PANEL 31 SECTIONS STATUS UPDATE:

Compare every admin section against the previous audit report.
Use this exact format for all 31 sections:

| # | Section               | Previous Status        | Previous Score | Current Status         | Current Score | Change        |
|---|-----------------------|------------------------|----------------|------------------------|---------------|---------------|
| 1 | Dashboard             | REAL data              | 9/10           | ___                    | ___/10        | ___           |
| 2 | Live Operations       | REAL data              | 8/10           | ___                    | ___/10        | ___           |
| 3 | Trips                 | REAL data              | 9/10           | ___                    | ___/10        | ___           |
| 4 | Riders                | REAL data              | 8/10           | ___                    | ___/10        | ___           |
| 5 | Drivers               | REAL data              | 8/10           | ___                    | ___/10        | ___           |
| 6 | Vehicles              | REAL data              | 8/10           | ___                    | ___/10        | ___           |
| 7 | Car Issues            | MINIMAL (808 chars)    | 3/10           | ___                    | ___/10        | ___           |
| 8 | Dispatch Zones        | REAL data              | 8/10           | ___                    | ___/10        | ___           |
| 9 | Pricing Surge         | REAL data              | 9/10           | ___                    | ___/10        | ___           |
|10 | Manual Surge          | MINIMAL (566 chars)    | 2/10           | ___                    | ___/10        | ___           |
|11 | Driver Ops            | MINIMAL (675 chars)    | 2/10           | ___                    | ___/10        | ___           |
|12 | Promotions            | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|13 | Promo Codes           | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|14 | Payments Finance      | REAL data              | 7/10           | ___                    | ___/10        | ___           |
|15 | Payouts               | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|16 | Support Tickets       | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|17 | Safety Incidents      | MINIMAL (772 chars)    | 2/10           | ___                    | ___/10        | ___           |
|18 | Insurance Claims      | MINIMAL (593 chars)    | 2/10           | ___                    | ___/10        | ___           |
|19 | Marketing             | REAL data              | 7/10           | ___                    | ___/10        | ___           |
|20 | Communications        | REAL data              | 7/10           | ___                    | ___/10        | ___           |
|21 | CMS                   | REAL data              | 6/10           | ___                    | ___/10        | ___           |
|22 | Analytics Reports     | MINIMAL (940 chars)    | 3/10           | ___                    | ___/10        | ___           |
|23 | Compliance KYC        | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|24 | Documents Vault       | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|25 | Configuration         | EMPTY (566 chars)      | 1/10           | ___                    | ___/10        | ___           |
|26 | Audit Logs            | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|27 | Developer API         | EMPTY (566 chars)      | 1/10           | ___                    | ___/10        | ___           |
|28 | Notifications         | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|29 | Corporate B2B         | MINIMAL (951 chars)    | 3/10           | ___                    | ___/10        | ___           |
|30 | Team Roles            | REAL data              | 8/10           | ___                    | ___/10        | ___           |
|31 | AI Intelligence       | MINIMAL (566 chars)    | 1/10           | ___                    | ___/10        | ___           |

Sections that improved since last audit: ___
Sections that regressed since last audit:___
Sections with no change: ___
New sections added since last audit:___

---

REPORT SECTION I — WHAT IS WORKING WELL:

Document genuine platform strengths with specific evidence.
Do not be vague. Be precise with what works and why it matters.

RIDER APP STRENGTHS (minimum 10):

1. [Specific feature] — [Why it works well] — [User benefit]
2. [Specific feature] — [Why it works well] — [User benefit]
3. [Specific feature] — [Why it works well] — [User benefit]
4. [Specific feature] — [Why it works well] — [User benefit]
5. [Specific feature] — [Why it works well] — [User benefit]
6. [Specific feature] — [Why it works well] — [User benefit]
7. [Specific feature] — [Why it works well] — [User benefit]
8. [Specific feature] — [Why it works well] — [User benefit]
9. [Specific feature] — [Why it works well] — [User benefit]
10. [Specific feature] — [Why it works well] — [User benefit]

DRIVER APP STRENGTHS (minimum 5):

1. [Specific feature] — [Why it works well] — [Driver benefit]
2. [Specific feature] — [Why it works well] — [Driver benefit]
3. [Specific feature] — [Why it works well] — [Driver benefit]
4. [Specific feature] — [Why it works well] — [Driver benefit]
5. [Specific feature] — [Why it works well] — [Driver benefit]

ADMIN PANEL STRENGTHS (minimum 10):

1. [Specific feature] — [Why it works well] — [Operator benefit]
2. [Specific feature] — [Why it works well] — [Operator benefit]
3. [Specific feature] — [Why it works well] — [Operator benefit]
4. [Specific feature] — [Why it works well] — [Operator benefit]
5. [Specific feature] — [Why it works well] — [Operator benefit]
6. [Specific feature] — [Why it works well] — [Operator benefit]
7. [Specific feature] — [Why it works well] — [Operator benefit]
8. [Specific feature] — [Why it works well] — [Operator benefit]
9. [Specific feature] — [Why it works well] — [Operator benefit]
10. [Specific feature] — [Why it works well] — [Operator benefit]

---

REPORT SECTION J — FULL PRIORITY ACTION PLAN:

P0 — FIX IMMEDIATELY (platform cannot earn revenue without these):
These are blocking production launch entirely. Zero exceptions.

P0-001: [Issue name]
App: ___
Root cause if known:___
Exact fix needed: ___
Estimated effort:___
Revenue impact if not fixed: ___

P0-002: [Issue name]
App: ___
Root cause if known:___
Exact fix needed: ___
Estimated effort:___
Revenue impact if not fixed: ___

P0-003: [Issue name]
App: ___
Root cause if known:___
Exact fix needed: ___
Estimated effort:___
Revenue impact if not fixed: ___

(List ALL P0 issues found — do not limit to 3 if there are more)

---

P1 — FIX THIS WEEK (core experience severely damaged without these):
These cause major user frustration, drop-off, or loss of trust.

P1-001: [Issue name]
App: ___
User impact:___
Exact fix needed: ___
Estimated effort:___

P1-002: [Issue name]
App: ___
User impact:___
Exact fix needed: ___
Estimated effort:___

P1-003: [Issue name]
App: ___
User impact:___
Exact fix needed: ___
Estimated effort:___

P1-004: [Issue name]
App: ___
User impact:___
Exact fix needed: ___
Estimated effort:___

P1-005: [Issue name]
App: ___
User impact:___
Exact fix needed: ___
Estimated effort:___

(List ALL P1 issues found — do not limit to 5 if there are more)

---

P2 — FIX THIS MONTH (important for trust, retention and growth):
These are impactful but the platform can function without them temporarily.

P2-001: [Issue name] — [App] — [Fix needed] — [Effort]
P2-002: [Issue name] — [App] — [Fix needed] — [Effort]
P2-003: [Issue name] — [App] — [Fix needed] — [Effort]
P2-004: [Issue name] — [App] — [Fix needed] — [Effort]
P2-005: [Issue name] — [App] — [Fix needed] — [Effort]
P2-006: [Issue name] — [App] — [Fix needed] — [Effort]
P2-007: [Issue name] — [App] — [Fix needed] — [Effort]
P2-008: [Issue name] — [App] — [Fix needed] — [Effort]
P2-009: [Issue name] — [App] — [Fix needed] — [Effort]
P2-010: [Issue name] — [App] — [Fix needed] — [Effort]

---

P3 — ROADMAP NEXT QUARTER (enhancements that grow the platform):
Not urgent but these are what will make the platform competitive.

P3-001: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-002: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-003: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-004: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-005: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-006: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-007: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-008: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-009: [Feature/Enhancement] — [App] — [Business value] — [Effort]
P3-010: [Feature/Enhancement] — [App] — [Business value] — [Effort]

---

REPORT SECTION K — PLATFORM MATURITY REASSESSMENT:

Full updated scorecard comparing against previous audit (6.3/10 overall):

| Component                          | Previous | New    | Delta  | Reason for change                          |
|------------------------------------|----------|--------|--------|--------------------------------------------|
| Admin UI and Navigation            | 9/10     | ___/10 | ___    | ___                                        |
| Admin Data Layer                   | 7/10     | ___/10 | ___    | ___                                        |
| Rider App Frontend                 | 9/10     | ___/10 | ___    | ___                                        |
| Rider App Backend APIs             | 8/10     | ___/10 | ___    | ___                                        |
| Driver App Login and Registration  | 8/10     | ___/10 | ___    | ___                                        |
| Driver App Dashboard Online Flow   | 7/10     | ___/10 | ___    | ___                                        |
| Driver App Account Pages           | 2/10     | ___/10 | ___    | ___                                        |
| Dispatch and Matching Engine       | 3/10     | ___/10 | ___    | ___                                        |
| Payment Processing                 | 4/10     | ___/10 | ___    | ___                                        |
| Push Notifications                 | 1/10     | ___/10 | ___    | ___                                        |
| Cross-App Real-Time Sync           | 5/10     | ___/10 | ___    | ___                                        |
| Mobile UX Quality                  | N/A      | ___/10 | NEW    | ___                                        |
| Security Posture                   | N/A      | ___/10 | NEW    | ___                                        |
| Feature Completeness               | N/A      | ___/10 | NEW    | ___                                        |
| Performance and Stability          | N/A      | ___/10 | NEW    | ___                                        |
| Form Validation Quality            | N/A      | ___/10 | NEW    | ___                                        |
| Trust and Credibility Signals      | N/A      | ___/10 | NEW    | ___                                        |
| Accessibility                      | N/A      | ___/10 | NEW    | ___                                        |
| Browser and Device Compatibility   | N/A      | ___/10 | NEW    | ___                                        |

PREVIOUS OVERALL PLATFORM SCORE: 6.3/10
NEW OVERALL PLATFORM SCORE: ___/10
OVERALL CHANGE:___ points (IMPROVED / REGRESSED / SAME)

Score calculation method:
Add all component scores above and divide by total number of components.
Show your working: (sum of all scores) divided by (number of components) = final score.

---

REPORT SECTION L — INDIA-SPECIFIC UX CONSIDERATIONS:

This platform is built for the Indian market specifically Kolkata and other Indian cities.
Evaluate against real Indian user behavior and infrastructure realities.

L1 — LANGUAGE AND LOCALIZATION:

- Is the platform available in Bengali or any regional language?
  Kolkata is a Bengali-speaking city — is there any Hindi or Bengali support?
  Flag as HIGH priority gap if English only.
- Are rupee amounts shown with ₹ symbol consistently across all 3 apps?
- Are date formats in DD/MM/YYYY (Indian standard) or MM/DD/YYYY (US format)?
- Are phone number fields pre-configured for Indian +91 format?
- Are address fields suited for Indian address formats?
  (House number, lane, para, district — not just street and zip code)
- Is GST shown and calculated correctly as per Indian tax law?
  (Known bug — verify if fixed)
- Are UPI payment options prominently featured?
  (UPI is the dominant payment method in India — not credit card)
- Is cash payment option available? (Very common for Indian service workers)

L2 — NETWORK AND DEVICE REALITY:

- Does the app work acceptably on 2G/3G connections?
  (Many drivers and riders in semi-urban India use slower connections)
- Test on Slow 3G throttling — is the core booking flow still completable?
- Is the total page weight under 1MB for first load on mobile?
  (Critical for users on limited data plans)
- Are offline states handled gracefully with clear messaging?
- Does the app recover automatically when network is restored?
- Are images compressed adequately for bandwidth-conscious users?

L3 — TRUST SIGNALS FOR INDIAN USERS:

- Is there a visible "Made in India" or local credibility signal?
- Are there any customer testimonials or ratings visible on landing page?
- Is driver verification prominently communicated to riders?
  (Safety is a major concern for Indian users hiring unknown drivers)
- Is the emergency SOS feature visible and easily accessible?
  (Critical trust signal especially for female riders)
- Is Women Safety Mode explained clearly and its benefits stated?
- Are payment receipts and invoices available for Indian business users?
  (GST invoice needed for corporate riders claiming expenses)
- Is the platform's registered business name or contact visible anywhere?
  (Builds trust for Indian users skeptical of new apps)

L4 — PAYMENT ECOSYSTEM:

- Are these Indian payment methods supported or at least mentioned:
  - UPI (Google Pay, PhonePe, Paytm, BHIM)
  - Debit cards (RuPay — India's domestic card network)
  - Net banking
  - Cash payment to driver
  - Wallet (prepaid balance in app)
- Is Razorpay or any Indian payment gateway integrated?
  (Already confirmed Razorpay exists — is it actually working?)
- Is the payment flow in INR (Indian Rupees) throughout?
- Are there any USD or foreign currency references anywhere? (Flag if yes)

L5 — DRIVER BEHAVIOR AND EXPECTATIONS:

- Are driver earnings shown in a way that matches how Indian gig workers
  think about income? (Per trip, per day, per week — not hourly rate)
- Is the payout cycle clear? (Weekly, biweekly — Indian drivers need predictability)
- Is TDS (Tax Deducted at Source) deduction explained to drivers?
  (Mandatory for Indian gig platforms above certain earnings threshold)
- Is there any guidance on how drivers should handle cash payments?
- Are there any references to driver insurance or accident protection?
  (Major concern for Indian gig drivers)

Document each L1 through L5 item as:
ADDRESSED / NOT ADDRESSED / PARTIALLY ADDRESSED
And give a priority rating: HIGH / MEDIUM / LOW for each unaddressed item.

INDIA-SPECIFIC UX OVERALL SCORE: ___/10

---

REPORT SECTION M — COMPETITIVE GAP ANALYSIS:

Compare Vahnly against what a professional driver-hiring service in India
should offer based on real user expectations in 2026.

For each gap, rate severity: CRITICAL GAP / MAJOR GAP / MINOR GAP / NOT APPLICABLE

| Feature / Standard                          | Vahnly Status | Gap Severity  | Notes                        |
|---------------------------------------------|---------------|---------------|------------------------------|
| Upfront fare transparency before booking    | ___           | ___           | ___                          |
| Driver background verification badge        | ___           | ___           | ___                          |
| Driver photo shown to rider before arrival  | ___           | ___           | ___                          |
| Real-time driver tracking on map            | ___           | ___           | ___                          |
| In-app calling with number masking          | ___           | ___           | ___                          |
| Post-trip rating system (both sides)        | ___           | ___           | ___                          |
| Cancellation policy clearly stated          | ___           | ___           | ___                          |
| Refund process clearly explained            | ___           | ___           | ___                          |
| Receipt emailed after trip                  | ___           | ___           | ___                          |
| SOS panic button accessible during trip     | ___           | ___           | ___                          |
| Rider can share trip status with family     | ___           | ___           | ___                          |
| Driver can see full job details before acc  | ___           | ___           | ___                          |
| Driver earnings paid within 7 days          | ___           | ___           | ___                          |
| Platform accessible without app install     | ___           | ___           | ___                          |
| Customer support available 24/7             | ___           | ___           | ___                          |
| Driver onboarding under 24 hours            | ___           | ___           | ___                          |
| Promo codes and first trip discount         | ___           | ___           | ___                          |
| Monthly subscription plan for frequent use | ___           | ___           | ___                          |
| Corporate billing and GST invoice           | ___           | ___           | ___                          |
| Multi-city availability clear on landing    | ___           | ___           | ___                          |

COMPETITIVE READINESS SCORE: ___/10

---

REPORT SECTION N — FINAL VERDICT AND LAUNCH READINESS:

This is the concluding section. Be completely honest. No sugar-coating.
Write this as if you are presenting to the founder before they decide
whether to launch the platform to real paying customers.

N1 — LAUNCH READINESS CHECKLIST:

Core functionality working end-to-end:
[ ] Rider can create a driver hiring request — PASS / FAIL
[ ] Driver receives the hiring request — PASS / FAIL
[ ] Driver can accept the request — PASS / FAIL
[ ] Rider sees driver assigned confirmation — PASS / FAIL
[ ] Job can be started and completed — PASS / FAIL
[ ] Payment processed after completion — PASS / FAIL
[ ] Admin has full visibility of all above — PASS / FAIL
[ ] Push notifications working on both sides — PASS / FAIL
[ ] No critical security vulnerabilities — PASS / FAIL
[ ] Mobile UX acceptable for real users — PASS / FAIL
[ ] App works on Indian mobile devices — PASS / FAIL
[ ] App works on Indian 4G speeds — PASS / FAIL

Count of PASS: ___/ 12
Count of FAIL:___ / 12

LAUNCH READINESS VERDICT:
12/12 PASS = READY TO LAUNCH
10-11/12 PASS = LAUNCH WITH MINOR CAUTIONS
8-9/12 PASS = SOFT LAUNCH WITH LIMITED USERS ONLY
6-7/12 PASS = NOT READY — FIX P0 AND P1 FIRST
Below 6/12 = DO NOT LAUNCH — PLATFORM BREAKING ISSUES EXIST

YOUR PLATFORM SCORE: ___/ 12
YOUR LAUNCH VERDICT:___

---

N2 — THE 4 MOST IMPORTANT QUESTIONS ANSWERED:

QUESTION 1:
Is the Vahnly platform ready for real paying customers in Kolkata right now?
Answer: YES / NO / SOFT LAUNCH ONLY
Reasoning: (minimum 5 sentences explaining the decision with specific evidence)

QUESTION 2:
What is the single most important thing to fix before going live?
Answer: (name the specific issue)
Why this above everything else: (specific technical and business reasoning)
Estimated fix time if a developer starts today: ___

QUESTION 3:
What is the biggest UX risk that would cause a real user in Kolkata to
delete the app after their first experience?
Answer: (specific UX issue with exact screen and scenario)
User drop-off scenario: (describe exactly what the user experiences and why they leave)
How to fix it: (specific actionable recommendation)

QUESTION 4:
What is the biggest security risk that must be addressed before any
real user data or real money flows through this platform?
Answer: (specific security finding from Phase 6)
Potential damage if exploited: (what an attacker could realistically do)
Immediate mitigation: (what can be done right now before full fix)

---

N3 — LETTER TO THE FOUNDER:

Write a brief honest letter from the perspective of a senior QA engineer
who has just completed this full audit. Address it to the founder Aniket.
Cover:

- What genuinely impressed you about the platform
- What keeps it from being production-ready right now
- The top 3 things to do this week to unblock launch
- One piece of honest advice about platform direction

---

N4 — TEST METADATA:

Report title: Vahnly Platform Full QA Audit — Round 2
Test conducted by: Amazon Q with Playwright MCP Browser Automation
Test date: [insert current date and time in IST]
Test duration: [total time taken from Phase 1 start to report generation]
Previous audit score: 6.3/10
Current audit score: ___/10
Score change:___ points

Applications tested:

- Admin Panel: <https://admin.aniket.site> (31 sections)
- Rider App: <https://rider.aniket.site> (13 pages)
- Driver App: <https://driver.aniket.site> (19 pages)

Test coverage:

- Total routes tested: ___
- Total screenshots captured: ___
- Total bugs documented: ___
- Total new bugs found: ___
- Total known bugs verified: 12
- Total security findings: ___
- Total missing features identified: ___
- Total API calls measured: ___
- Total console errors recorded: ___
- Total admin sections reviewed: 31
- Total mobile screens rated: ___
- Total integration points tested: 18
- Total India-specific checks: ___
- Total competitive gaps analyzed: 20

Test environment:

- Browser: Chromium via Playwright MCP
- Mobile viewport used: 390x844 (iPhone 14)
- Desktop viewport used: 1440x900
- Network throttling tested: Slow 3G and Offline
- Devices emulated: iPhone SE, iPhone 14 Pro, Samsung Galaxy S21, iPad Air

---

END OF REPORT.

IMPORTANT FINAL INSTRUCTIONS FOR AMAZON Q:

- Do not stop at any phase. Complete every single task listed.
- If a feature or page is not accessible, document why and move on.
- Do not skip any report section. Fill every table completely.
- Do not truncate any finding. Write the full detail for every bug.
- Take screenshots at every meaningful step — they are evidence.
- Be a fair but uncompromising judge. Real users and real money depend on this.
- When the report is complete, output it in full from Section A to Section N.
- Do not summarize at the end. Output the complete report in its entirety.
- The report must be comprehensive enough that a developer can read it
  and immediately know what to fix, where to fix it, and why it matters.
- Timestamp every section of the report with the time it was completed.
- Final output format: Clean markdown with tables, headers, and bullet points.
