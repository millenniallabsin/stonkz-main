/* Budget Builder: every word the learner sees in this game lives here.
   This game is the module's applied task ("Build Your First Budget"). The learner gives every rupee of their take-home
   a job, compares it with 50/30/20, sets one action for next month and keeps a budget card on the device.
   {placeholders} are filled in by the game. */
window.STONKZZ_CONTENT = {
  game: {
    settings: {
      startIncome: 40000,                         // the example income the first screen opens with
      presets: [25000, 40000, 60000, 100000],     // quick income buttons
      guide: { savings: 20, needs: 50, wants: 30 },
      coins: { payday: 500, balanced: 1500, paidFirst: 1000, adjust: 300, plan: 500, card: 1000, selfCheck: 300 }
    },
    copy: {
      lessonEyebrow: 'Module 2 · Income and Budgeting',
      startTitle: 'Build your first budget',
      startLede: 'This is the module’s task. Use your own numbers. There is no single right answer; the point is to see where your money actually goes.',
      stepBuild: 'Build your budget',
      stepBuildText: 'Your take-home, a 50/30/20 split, and one action for next month. You keep the card.',
      start: 'Start',
      steps: ['Income', 'Split', 'Compare', 'Plan', 'Card'],
      lastCard: 'Your last budget card',
      lastCardText: ' was issued {when}. Your numbers are filled in, change anything.',
      lastCardEarlier: 'earlier',
      jumpToSplit: 'Jump to my split',
      incomeTitle: 'What lands in your account each month?',
      incomeText: 'Your take-home income, after tax and deductions. If it varies, use a fair estimate. The starting number is only an example.',
      incomeLabel: 'Monthly take-home (₹)',
      incomeAria: 'Monthly take-home income in rupees',
      takeHome: 'Take-home this month',
      envelopeAlt: 'Salary envelope',
      payday: 'Pay day',
      incomeTooLow: 'Enter a monthly take-home of at least ₹1,000.',
      splitTitle: 'Give every rupee a job',
      splitText: 'Fill Savings first. Moving it aside the day pay arrives is paying yourself first. Then put in what Needs and Wants really cost you today. Drag a pot, tap the buttons or use the slider. The dashed line is the 50/30/20 guide.',
      pots: {
        savings: { name: 'Savings & investing', short: 'Savings', note: 'Moved aside first, the day pay arrives' },
        needs: { name: 'Needs', short: 'Needs', note: 'Rent, groceries, bills, transport, minimum EMIs' },
        wants: { name: 'Wants', short: 'Wants', note: 'Eating out, subscriptions, shopping' }
      },
      potAria: '{name} pot. Drag up or down, or use arrow keys.',
      guideTag: '{n}% guide',
      less: 'Less {name}', more: 'More {name}', amountAria: '{name} amount',
      ofIncome: '{n}% of income',
      empty: 'empty', onGuide: 'on the guide', vsGuide: '{d} vs guide',
      stillNeedsJob: 'Still needs a job', moreThanEarn: 'More than you earn', everyRupee: 'Every rupee has a job',
      balancedNote: 'Balanced. Savings at {n}%.', plannedNote: 'Income {income} · planned {planned}',
      fromGuide: 'Start from the guide', emptyPots: 'Empty the pots',
      items: { needs: ['Rent', 'Groceries', 'Bills', 'Transport', 'Minimum EMIs'], wants: ['Eating out', 'Subscriptions', 'Shopping'] },
      itemsNeeds: 'What sits in your Needs?', itemsWants: 'What sits in your Wants?',
      toCompare: 'Compare with the guide', back: 'Back',
      unassigned: '{left} still needs a job. Every rupee goes somewhere, even if it is Wants.',
      overplanned: 'You have planned {over} more than you earn. Take it out of a pot.',
      stampBalanced: 'BALANCED', paidFirst: 'Paid yourself first',
      compareTitle: 'Your split against the guide',
      compareText: 'The solid bar is you. The dashed outline is 50/30/20. Where are you over, and where are you under?',
      you: 'You {n}%', guideBar: 'Guide {n}%',
      savingsUnder: '{d} points under the 20% guide. This is the pot to grow first, and it is the money you move the day pay arrives.',
      savingsOk: 'At or above the guide. Paying yourself first is already working.',
      needsOver: '{d} points over the guide. That is fine if your rent is high or income is tight. The split is a starting guide, not a rule.',
      needsUnder: '{d} points under the guide. Your essentials leave you room.',
      needsOn: 'Right on the guide.',
      wantsOver: '{d} points over the guide. Most people discover their wants are bigger than they thought. That is the insight this task exists to give you.',
      wantsOk: 'Within the guide. Keep an eye on small subscriptions; they add up quietly.',
      insight: 'Over or under is not failure. It is the map of where your money actually goes.',
      adjustTitle: 'Pick one place you can adjust',
      adjust: { savings: 'Grow my savings', wants: 'Trim my wants', needs: 'Rethink a need' },
      toPlan: 'Set my action', backToSplit: 'Back to my split',
      planTitle: 'One specific action for next month',
      planText: 'Specific beats ambitious. Name the amount and the day, or the exact thing you will cut.',
      moveFirstLabel: 'The savings number I move first next month (₹)',
      actionLabel: 'My action',
      actionPlaceholder: 'Move ₹8,000 to savings the day my salary arrives.',
      tmplMove: 'Move {amt} to savings the day my salary arrives.',
      tmplCut: 'Cut one subscription I forgot I had.',
      tmplEatOut: 'Keep eating out under {amt} this month.',
      tmplAuto: 'Set up an automatic transfer of {amt} on pay day.',
      issue: 'Issue my budget card',
      cardTitle: 'My budget',
      cardIssuer: 'Personal Finance Mastery · Module 2',
      cardBigLabel: 'Monthly take-home',
      rowSavings: 'Savings first', rowNeeds: 'Needs', rowWants: 'Wants', rowSplit: 'Split', rowIncludes: 'Includes',
      rowMoveFirst: 'Move first', moveFirstNext: 'next pay day', rowAction: 'My action',
      rowEmergency: 'Emergency fund',
      emergencyText: 'Your monthly needs are {needs}. A few months of that, kept safe and easy to reach, is your shock absorber: it stops a surprise bill from turning into debt.',
      cardFoot: '50/30/20 is a starting guide, not a rule.',
      issued: 'Issued {when}', issuedStamp: 'ISSUED', issuerLine: 'STONKZZ SCHOOL', serialTitle: 'Your note number',
      cardStageTitle: 'Your budget card',
      cardStageText: 'This stays saved on this device. Come back and change it whenever your pay or your life changes.',
      selfCheckTitle: 'Self-check',
      selfCheckText: 'You have done this task well if you can answer yes to these. Be honest; "not yet" points you back.',
      selfCheck: [
        { q: 'Do I now know roughly where my money actually goes each month?', tip: 'Look at the three pots again and say each number out loud.', back: 1, backLabel: 'Back to my split' },
        { q: 'Have I identified at least one place I can adjust?', tip: 'Pick the pot that is furthest from the guide.', back: 2, backLabel: 'Back to compare' },
        { q: 'Do I have a specific savings number to move first next month?', tip: 'Write the exact amount you will move on pay day.', back: 3, backLabel: 'Back to my action' }
      ],
      yes: 'Yes', notYet: 'Not yet',
      finishTask: 'Finish the task', editBudget: 'Edit my budget',
      checkEyebrow: 'Task done · last part',
      checkTitle: 'Now, {n} quick questions',
      checkText: 'Your budget card is saved. To clear the module, get {need} of {total} right. Each answer shows you why.',
      taskDoneLine: 'Budget card issued',
      passTitle: 'Module 2 cleared',
      failTitle: 'Almost there',
      statTakeHome: 'Take-home', statSavings: 'Savings first', statSelfCheck: 'Self-check',
      playTitleBadge: 'Budget built', playTitleBalanced: 'Budget balanced', playTitleDraft: 'Budget drafted',
      playText: 'A plan instead of guessing. Come back and adjust the card any time; it stays on this device.'
    }
  }
};

/* GUIDE:START  the on-screen guide before Start. target is a CSS selector on the first screen; gesture is tap, swipe, drag, point or none. */
window.STONKZZ_CONTENT.game.guide = [
 {
  "target": ".incomerow",
  "text": "Start with what lands in your account each month. Type it in.",
  "gesture": "point"
 },
 {
  "target": ".sz-chip",
  "text": "Or tap a quick amount.",
  "gesture": "tap"
 },
 {
  "target": ".incomerow .sz-btn",
  "text": "Press Pay day. Then split it into needs, wants and savings, and make a plan.",
  "gesture": "tap"
 }
];
/* GUIDE:END */

/* QUIZ:START  the module quiz from the course documents. Every question, answer, explanation and the pass mark. */
window.STONKZZ_CONTENT.quiz = {
 "module": 2,
 "title": "Income & Budgeting",
 "format": "PRACTICAL module → short MCQ check (3 Q) + one applied task · Pass: 2/3 MCQ + task attempted",
 "passNeeded": 2,
 "total": 3,
 "questions": [
  {
   "id": "pf2q1",
   "prompt": "In the popular 50/30/20 budgeting rule, what does the 20% portion go toward?",
   "stem": "In the popular 50/30/20 budgeting rule, what does the 20% portion go toward?",
   "context": null,
   "options": [
    "Wants and entertainment",
    "Needs like rent and groceries",
    "Savings and investments",
    "Taxes"
   ],
   "answer": 2,
   "explanation": "The 50/30/20 rule splits your income into 50% needs, 30% wants, and 20% savings and investments. The 20% is the part that quietly builds your future - it's the money you pay to yourself before it can disappear into spending. If 20% feels like a lot right now, even starting smaller and building up counts.",
   "wrongWhy": {
    "0": "A is the 30% bucket, B is the 50% bucket, and taxes usually come out before you apply this rule to your take-home income.",
    "1": "A is the 30% bucket, B is the 50% bucket, and taxes usually come out before you apply this rule to your take-home income.",
    "3": "A is the 30% bucket, B is the 50% bucket, and taxes usually come out before you apply this rule to your take-home income."
   },
   "whyNot": "A is the 30% bucket, B is the 50% bucket, and taxes usually come out before you apply this rule to your take-home income.",
   "data": null
  },
  {
   "id": "pf2q2",
   "prompt": "Why is \"pay yourself first\" considered a powerful budgeting habit?",
   "stem": "Why is \"pay yourself first\" considered a powerful budgeting habit?",
   "context": null,
   "options": [
    "Because you save whatever is left at the end of the month",
    "Because you set aside savings as soon as income arrives, before spending",
    "Because you should spend on yourself before paying bills",
    "Because it means treating yourself every payday"
   ],
   "answer": 1,
   "explanation": "\"Pay yourself first\" means the moment your income arrives, you move your savings out first - then live on what's left. It works because it removes willpower from the equation. The opposite approach - saving whatever survives till month-end - almost always leaves nothing, because spending expands to fill whatever's available.",
   "wrongWhy": {
    "0": "A is the common trap this habit is designed to fix.",
    "2": "C and D misread the phrase - it's about paying your future self through savings, not spending on yourself.",
    "3": "C and D misread the phrase - it's about paying your future self through savings, not spending on yourself."
   },
   "whyNot": "A is the common trap this habit is designed to fix. C and D misread the phrase - it's about paying your future self through savings, not spending on yourself.",
   "data": null
  },
  {
   "id": "pf2q3",
   "prompt": "What is the main purpose of an emergency fund?",
   "stem": "What is the main purpose of an emergency fund?",
   "context": null,
   "options": [
    "To invest in the stock market for high returns",
    "To cover unexpected essential expenses without going into debt",
    "To save up for a holiday",
    "To spend during festival sales"
   ],
   "answer": 1,
   "explanation": "An emergency fund is money set aside purely for genuine, unexpected essentials - a medical bill, a job loss, an urgent repair. Its whole job is to keep a surprise from pushing you into high-interest debt. It's not meant to earn big returns or fund planned spending - it's your financial shock absorber, and it's one of the first things to build.",
   "wrongWhy": {
    "0": "A misunderstands its purpose - emergency money needs to be safe and accessible, not invested for growth.",
    "2": "C and D are planned wants, not emergencies.",
    "3": "C and D are planned wants, not emergencies."
   },
   "whyNot": "A misunderstands its purpose - emergency money needs to be safe and accessible, not invested for growth. C and D are planned wants, not emergencies.",
   "data": null
  }
 ],
 "passMessage": "Well done - and more importantly, you've now built a real budget for your own money, not just learned the theory. That single habit does more for your finances than almost anything else in this course. On to Module 3.",
 "failMessage": "Revisit the lessons on the 50/30/20 rule and the emergency fund, then try the check again - no limit on attempts. And do give the budget task a genuine go; it's where this module actually pays off.",
 "practical": {
  "title": "Applied Task: Build Your First Budget",
  "instructions": "This is the real work of the module. There's no single \"correct\" answer - the goal is to actually apply the 50/30/20 idea to your own life. Complete it honestly for yourself.\nYour task - draft a simple monthly budget:\n1. Write down your monthly take-home income (or an estimate, if it varies).\n2. Split it using the 50/30/20 rule as a starting guide:\n    - Needs (aim ~50%): list your essentials - rent, groceries, bills, transport, minimum EMIs\n    - Wants (aim ~30%): list your non-essentials - eating out, subscriptions, shopping\n    - Savings & investing (aim ~20%): the amount you'll move aside first, before spending\n3. Compare your real spending to the guide. Where are you actually over or under? Most people discover their \"wants\" are bigger than they thought - that's not failure, that's the exact insight this task exists to give you.\n4. Set one specific action for next month - e.g. \"move ₹X to savings the day my salary arrives,\" or \"cut one subscription I forgot I had.\"\nSelf-check - you've done this task well if you can answer:\n- Do I now know roughly where my money actually goes each month?\n- Have I identified at least one place I can adjust?\n- Do I have a specific savings number to move first next month?\nOptional: the 50/30/20 split is a starting guide, not a rule - if your rent is high or your income is tight, your percentages will differ, and that's completely fine. The point isn't to hit exact numbers; it's to have a plan instead of guessing.",
  "selfCheck": [
   "Do I now know roughly where my money actually goes each month?",
   "Have I identified at least one place I can adjust?",
   "Do I have a specific savings number to move first next month?"
  ],
  "data": {
   "split": {
    "needs": 50,
    "wants": 30,
    "savingsAndInvesting": 20
   }
  }
 },
 "taskRequired": true
};
/* QUIZ:END */
