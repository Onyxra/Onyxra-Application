/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KOLTYN OS — data.js                                            ║
 * ║  Single source of truth for all personal data.                  ║
 * ║                                                                  ║
 * ║  To make this app yours, edit the values in this file only.     ║
 * ║  Do not touch any other JS files unless changing app behaviour. ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

window.APP_DATA = {

  /* ── Profile ─────────────────────────────────────────────────── */
  profile: {
    name:       'Koltyn',
    appTitle:   'Koltyn OS',
    appSubtitle:'Life Operating System',
    navGoal:    '$50K MRR · 200 lbs · 15% BF',
    northStar:  'Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up',
    northStarPillars: ['$50K MRR', '200 lbs · 15% BF', 'Press to Handstand', 'Muscle Up'],
  },

  /* ── Dashboard ───────────────────────────────────────────────── */
  dashboard: {
    /* current / goal are numeric → drive radial ring fill in dashboard.
       invert:true = lower is better (body fat — goal < current).
       color = ring stroke colour. value = display string (can differ from current). */
    stats: [
      { label:'Body Weight', value:'176',    unit:'lbs', note:'Goal: 200 lbs',    current:176,   goal:200,    color:'#ff6b35', invert:false },
      { label:'Body Fat',    value:'16',     unit:'%',   note:'Goal: 15%',         current:16,    goal:15,     color:'#f5c842', invert:true  },
      { label:'Envosta MRR', value:'$0',     unit:'',    note:'Goal: $50K/mo',     current:0,     goal:50000,  color:'#7c6af7', invert:false },
      { label:'Songs Ready', value:'8',      unit:'',    note:'Target: 10 ready',  current:8,     goal:10,     color:'#f06292', invert:false },
      { label:'Net Worth',   value:'$12.5K', unit:'',    note:'Goal: $100K',       current:12500, goal:100000, color:'#3ddc6e', invert:false },
    ],
    morningHabits: [
      'Wake up before 9am',
      'Rinse mouth + drink water / tea',
      '15 minutes of sunlight',
      'Review Daily Journal',
      'Review Investments (crypto, stocks)',
      'Check emails & messages',
      'Quick stretch & maintenance (10 pull-ups, 30 push-ups, 30s L-sit, hip + shoulder + hamstring stretch)',
      'Eat Meal 1 (Breakfast)',
      '2 hours focused work on Envosta',
      '1 hour workout',
    ],
    todaysFocus: [
      { title:'🏗️ Business', detail:"Build Envosta — talk to users, ship something" },
      { title:'💪 Workout',  detail:"Recovery Phase — check workout page for today's day" },
      { title:'🎸 Creative', detail:'30 min practice — fingerpicking + vocals' },
      { title:'📚 Growth',   detail:'15 pages before bed' },
    ],
  },

  /* ── Vision ──────────────────────────────────────────────────── */
  vision: {
    overarchingGoal: 'Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up',
    goalPillars: ['$50K MRR', '200 lbs', '15% BF', 'Press to Handstand', 'Muscle Up'],
    areas: [
      {
        icon:'💼', name:'Career & Business',
        dream:  ['Envosta is a $50K MRR SaaS company running mostly without me','Known as the founder who built something real from scratch','Multiple successful ventures — not just one'],
        oneYear:['Envosta at $10K MRR (Stage 1 graduation)','First 50 paying customers','Repeatable sales process in place'],
        focus:  ['Build and ship v1 of Envosta','Talk to 10 target users','Close first 3 paying customers manually'],
      },
      {
        icon:'💰', name:'Finance & Wealth',
        dream:  ['Financially free — money works for me, not the other way','Index fund portfolio generating meaningful passive income','Never worry about money again — abundance mindset fully embodied'],
        oneYear:['Envosta paying all personal expenses','Consistent monthly investment into index funds','Emergency fund fully stocked (6 months expenses)'],
        focus:  ['Separate business and personal finances','Set up automatic index fund DCA','Track MRR and net worth weekly'],
      },
      {
        icon:'💪', name:'Health & Fitness',
        dream:  ['200 lbs, 15% body fat — athletic, powerful, lean','Press to handstand and muscle up achieved','Feel the best I\'ve ever felt — energy, strength, mobility'],
        oneYear:['190 lbs, 16% body fat — clear visual progress','Handstand holds for 10 seconds','Consistent Jeff Nippard PPL — no missed weeks'],
        focus:  ['Current: 176 lbs, 16% BF — add clean bulk calories','Complete full Recovery Phase (Weeks 1–5) with no skipped sessions','Nail morning routine: stretch + 10 pull-ups + 30 push-ups daily'],
      },
      {
        icon:'❤️', name:'Relationships & Family',
        dream:  ['Deep, authentic relationships — a small circle of people who truly know me','The kind of partner you don\'t settle for — when it\'s right it\'s obvious','Strong family bonds — present and intentional'],
        oneYear:['Invest in existing friendships deliberately — plan something quarterly','Be fully present when with family — phone down, eyes up','Know what I actually value in a partner (write it out)'],
        focus:  ['Schedule one intentional social thing per week','Call family member each week','Be more present — notice when I\'m distracted and course-correct'],
      },
      {
        icon:'🧠', name:'Personal Growth',
        dream:  ['Think clearly, decide quickly, execute consistently — uncommon self-mastery','Identity: builder, performer, athlete — not just one thing','Read 50+ books — ideas compound just like money'],
        oneYear:['Read 12 books — one per month','Daily journalling habit — 5 min minimum','Meditation practice — 10 min daily'],
        focus:  ['Morning review: journal + vision review + priorities for the day','Read 15 pages before bed every night','Write down 3 things I\'m grateful for each morning'],
      },
      {
        icon:'🎸', name:'Music & Creativity',
        dream:  ['Original songs that make people feel something real','Known locally as the guy worth watching — packed rooms','Album recorded — even if just for me'],
        oneYear:['10 songs ready to perform — covers + originals','5 original songs with demos recorded','Regular bar gig rotation — monthly at minimum'],
        focus:  ['Daily practice: 30 min minimum — fingerpicking + vocals + writing','Add one new song to setlist per month','Record a voice memo demo of "Rodeo Bones" this month'],
      },
      {
        icon:'✈️', name:'Lifestyle & Adventure',
        dream:  ['Surf good waves in multiple countries — Indo, Portugal, Central America','Horses as part of life — riding regularly, maybe own one day','Motorcycle trip across a country — no plan, just ride'],
        oneYear:['One surf trip — even a domestic one counts','Ride a horse at least once','Plan the motorcycle route even if not executing yet'],
        focus:  ['Research one surf destination — cost, season, flights','Find a local spot to ride horses — one session this quarter','Take the motorcycle out more — rides, not just errands'],
      },
    ],
  },

  /* ── Nutrition ───────────────────────────────────────────────── */
  nutrition: {
    phases: {
      bulk:     { name:'Bulk',     calories:3850, protein:241, carbs:481, fats:107 },
      maintain: { name:'Maintain', calories:2850, protein:214, carbs:285, fats:95  },
      cut:      { name:'Cut',      calories:2350, protein:206, carbs:176, fats:91  },
    },
    mealTitles: ['Meal 1 — Breakfast','Meal 2 — Lunch','Meal 3 — Dinner','Meal 4 — Evening'],
    meals: {
      bulk: [
        [{name:"Oat & Egg White Power Bowl",category:"Simple",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Banana Greek Yogurt Parfait",category:"Simple",cuisine:"Mediterranean",calories:875,protein:55,carbs:109,fats:24},{name:"Whole Wheat Chicken Breakfast Wrap",category:"Simple",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Frozen Breakfast Burrito Batch",category:"Premade",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Batch Egg Muffin Cups",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Prepped Overnight Oats with Whey",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Shakshuka with Whole Wheat Pita",category:"Gourmet",cuisine:"Middle Eastern",calories:875,protein:55,carbs:109,fats:24},{name:"Tamagoyaki with Brown Rice",category:"Gourmet",cuisine:"Japanese",calories:875,protein:55,carbs:109,fats:24},{name:"Huevos Rancheros with Black Beans",category:"Gourmet",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Greek Egg Scramble with Feta & Pita",category:"Gourmet",cuisine:"Greek",calories:875,protein:55,carbs:109,fats:24}],
        [{name:"Chicken Rice & Avocado Bowl",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Tuna Whole Wheat Pasta",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Turkey & Sweet Potato Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Beef & Brown Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Chicken Fried Rice Prep",category:"Premade",cuisine:"Asian",calories:1100,protein:69,carbs:138,fats:31},{name:"Meal-Prep Salmon & Quinoa Boxes",category:"Premade",cuisine:"Mediterranean",calories:1100,protein:69,carbs:138,fats:31},{name:"Bibimbap with Beef & Egg",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Puttanesca over Spaghetti",category:"Gourmet",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Lamb Kofta with Bulgur & Tzatziki",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Tikka Masala with Basmati",category:"Gourmet",cuisine:"Indian",calories:1100,protein:69,carbs:138,fats:31}],
        [{name:"Beef & Brown Rice Power Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Salmon Sweet Potato & Broccoli",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Cottage Cheese Pasta Bake",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Prepped Turkey Meatball Subs",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Baked Ziti Prep",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Pulled Chicken & Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Pork Bulgogi with Steamed Rice",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Souvlaki with Rice Pilaf",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Thai Basil Pork with Jasmine Rice",category:"Gourmet",cuisine:"Thai",calories:1100,protein:69,carbs:138,fats:31},{name:"Grilled Swordfish with Romesco & Potatoes",category:"Gourmet",cuisine:"Spanish",calories:1100,protein:69,carbs:138,fats:31}],
        [{name:"Cottage Cheese Toast & Banana",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Greek Yogurt Protein Bowl",category:"Simple",cuisine:"Greek",calories:775,protein:48,carbs:96,fats:21},{name:"Peanut Butter Oat Protein Smoothie",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Prepped Protein Pancake Stacks",category:"Premade",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Batch Lentil & Chicken Soup",category:"Premade",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Frozen Beef & Potato Shepherd Prep",category:"Premade",cuisine:"British",calories:775,protein:48,carbs:96,fats:21},{name:"Mushroom Ricotta Crostini",category:"Gourmet",cuisine:"Italian",calories:775,protein:48,carbs:96,fats:21},{name:"Smashed Chickpea Flatbread",category:"Gourmet",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Miso Soup with Tofu & Rice Crackers",category:"Gourmet",cuisine:"Japanese",calories:775,protein:48,carbs:96,fats:21},{name:"Patatas Bravas with Aioli & Egg",category:"Gourmet",cuisine:"Spanish",calories:775,protein:48,carbs:96,fats:21}],
      ],
      maintain: [
        [{name:"Egg White Omelette with Whole Toast",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Greek Yogurt & Berry Bowl",category:"Simple",cuisine:"Greek",calories:600,protein:45,carbs:60,fats:20},{name:"Chicken Avocado Rice Cake Stack",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Prepped Spinach Egg Muffins",category:"Premade",cuisine:"Mediterranean",calories:600,protein:45,carbs:60,fats:20},{name:"Batch Overnight Protein Oats",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Frozen Turkey Breakfast Patties & Toast",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Turkish Menemen with Pita",category:"Gourmet",cuisine:"Turkish",calories:600,protein:45,carbs:60,fats:20},{name:"Smoked Salmon Blini",category:"Gourmet",cuisine:"Russian",calories:600,protein:45,carbs:60,fats:20},{name:"Spanish Tortilla with Salad",category:"Gourmet",cuisine:"Spanish",calories:600,protein:45,carbs:60,fats:20},{name:"Japanese Tamago Don",category:"Gourmet",cuisine:"Japanese",calories:600,protein:45,carbs:60,fats:20}],
        [{name:"Grilled Chicken & Quinoa Bowl",category:"Simple",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Tuna Brown Rice & Edamame Bowl",category:"Simple",cuisine:"Japanese",calories:800,protein:60,carbs:80,fats:27},{name:"Turkey & Sweet Potato Hash",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Grilled Chicken & Farro Boxes",category:"Premade",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Salmon Quinoa Prep",category:"Premade",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Chicken & Lentil Stew",category:"Premade",cuisine:"Middle Eastern",calories:800,protein:60,carbs:80,fats:27},{name:"Korean Doenjang Jjigae with Rice",category:"Gourmet",cuisine:"Korean",calories:800,protein:60,carbs:80,fats:27},{name:"Moroccan Chicken Tagine with Couscous",category:"Gourmet",cuisine:"Moroccan",calories:800,protein:60,carbs:80,fats:27},{name:"Pasta e Fagioli with Chicken",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Thai Green Curry Chicken & Rice",category:"Gourmet",cuisine:"Thai",calories:800,protein:60,carbs:80,fats:27}],
        [{name:"Baked Salmon with Whole Grain Rice",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Steak Strip & Potato Bowl",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Shrimp & Brown Rice Stir-Fry",category:"Simple",cuisine:"Asian",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Turkey Bolognese & Pasta",category:"Premade",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Chicken & Vegetable Curry Prep",category:"Premade",cuisine:"Indian",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Beef & Buckwheat Bowls",category:"Premade",cuisine:"Eastern European",calories:800,protein:60,carbs:80,fats:27},{name:"Chicken Piccata with Orzo",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Pork Tenderloin with Apple & Lentils",category:"Gourmet",cuisine:"French",calories:800,protein:60,carbs:80,fats:27},{name:"Grilled Branzino with Fregola",category:"Gourmet",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Adana Kebab with Bulgur Pilaf",category:"Gourmet",cuisine:"Turkish",calories:800,protein:60,carbs:80,fats:27}],
        [{name:"Cottage Cheese & Fruit Bowl",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Protein Smoothie with Oat Base",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Hard Boiled Eggs & Whole Grain Crackers",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Prepped White Bean & Chicken Soup",category:"Premade",cuisine:"Italian",calories:650,protein:49,carbs:65,fats:21},{name:"Frozen Turkey & Barley Casserole",category:"Premade",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Batch Tofu & Soba Boxes",category:"Premade",cuisine:"Japanese",calories:650,protein:49,carbs:65,fats:21},{name:"Labneh Flatbread with Za'atar",category:"Gourmet",cuisine:"Middle Eastern",calories:650,protein:49,carbs:65,fats:21},{name:"Catalan Chickpea & Spinach",category:"Gourmet",cuisine:"Spanish",calories:650,protein:49,carbs:65,fats:21},{name:"Tteok-Guk (Rice Cake Soup)",category:"Gourmet",cuisine:"Korean",calories:650,protein:49,carbs:65,fats:21},{name:"Grilled Halloumi & Lentil Plate",category:"Gourmet",cuisine:"Greek",calories:650,protein:49,carbs:65,fats:21}],
      ],
      cut: [
        [{name:"Egg White Scramble with Rye Toast",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Plain Greek Yogurt & Apple Slices",category:"Simple",cuisine:"Greek",calories:500,protein:44,carbs:37,fats:19},{name:"Tuna Rice Cake & Cucumber Stack",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Batch Lean Turkey Egg Muffins",category:"Premade",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Prepped Smoked Salmon & Oat Cups",category:"Premade",cuisine:"Scandinavian",calories:500,protein:44,carbs:37,fats:19},{name:"Frozen Egg White Frittata Squares",category:"Premade",cuisine:"Italian",calories:500,protein:44,carbs:37,fats:19},{name:"Steamed Tofu & Edamame Rice Bowl",category:"Gourmet",cuisine:"Japanese",calories:500,protein:44,carbs:37,fats:19},{name:"Lemon Herb Cod with Roasted Veg",category:"Gourmet",cuisine:"Mediterranean",calories:500,protein:44,carbs:37,fats:19},{name:"White Bean Shakshuka",category:"Gourmet",cuisine:"Middle Eastern",calories:500,protein:44,carbs:37,fats:19},{name:"Korean Sundubu Jjigae",category:"Gourmet",cuisine:"Korean",calories:500,protein:44,carbs:37,fats:19}],
        [{name:"Chicken Breast & Roasted Veg",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Shrimp & Cauliflower Rice Bowl",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Turkey Lettuce Wraps & Quinoa",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Grilled Chicken & Lentil Prep",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Salmon Patties & Salad",category:"Premade",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Turkey Meatball Zucchini Bowls",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Vietnamese Grilled Pork Vermicelli Bowl",category:"Gourmet",cuisine:"Vietnamese",calories:650,protein:57,carbs:48,fats:25},{name:"Grilled Chicken Paillard with Arugula",category:"Gourmet",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Ceviche with Corn & Sweet Potato",category:"Gourmet",cuisine:"Peruvian",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Souvlaki with Roasted Cauliflower",category:"Gourmet",cuisine:"Greek",calories:650,protein:57,carbs:48,fats:25}],
        [{name:"Baked Cod & Steamed Broccoli & Rice",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Lean Beef Strip & Veggie Stir-Fry",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Egg Whites & Black Bean Burrito",category:"Simple",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Tuna & Chickpea Bowls",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Chicken & White Bean Soup",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Turkey Stuffed Pepper Prep",category:"Premade",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Posole Verde",category:"Gourmet",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Soy-Ginger Steamed Sea Bass",category:"Gourmet",cuisine:"Chinese",calories:650,protein:57,carbs:48,fats:25},{name:"Turkish Chicken Kofte with Tabbouleh",category:"Gourmet",cuisine:"Turkish",calories:650,protein:57,carbs:48,fats:25},{name:"Branzino a la Plancha with Asparagus",category:"Gourmet",cuisine:"Spanish",calories:650,protein:57,carbs:48,fats:25}],
        [{name:"Cottage Cheese & Cucumber Plate",category:"Simple",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Tuna & Whole Grain Crispbread",category:"Simple",cuisine:"Scandinavian",calories:550,protein:48,carbs:43,fats:22},{name:"Chicken Breast & Chickpea Salad",category:"Simple",cuisine:"Mediterranean",calories:550,protein:48,carbs:43,fats:22},{name:"Batch Lean Egg & Veggie Wraps",category:"Premade",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Prepped Turkey & Lentil Stuffed Zucchini",category:"Premade",cuisine:"Middle Eastern",calories:550,protein:48,carbs:43,fats:22},{name:"Frozen Edamame & Quinoa Bars",category:"Premade",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22},{name:"Nicoise Salad with Tuna",category:"Gourmet",cuisine:"French",calories:550,protein:48,carbs:43,fats:22},{name:"Grilled Prawn & Mango Salsa",category:"Gourmet",cuisine:"Thai",calories:550,protein:48,carbs:43,fats:22},{name:"Acqua Pazza (Italian Poached Fish)",category:"Gourmet",cuisine:"Italian",calories:550,protein:48,carbs:43,fats:22},{name:"Salmon Tataki with Ponzu Salad",category:"Gourmet",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22}],
      ],
    },
  },

  /* ── Workout ─────────────────────────────────────────────────── */
  workout: {
    programLogic: {
      phases: [
        {
          name: 'Recovery',
          weeks: [1, 2, 3, 4, 5],
          template: 'phase1',
          weekRules: [
            { weeks: [1, 2], sets: 1, earlyRPE: '~6', lastRPE: '~6-7', toFailure: false, note: 'Technique focus — leave 3-4 reps in tank' },
            { weeks: [3, 4, 5], sets: 2, earlyRPE: '~7', lastRPE: '~7-8', toFailure: false, note: 'Push last set closer to failure, early sets slightly easier' },
          ],
        },
        {
          name: 'Ramping',
          weeks: [6, 7, 8, 9, 10, 11, 12],
          template: 'phase2',
          weekRules: [
            { weeks: [6], sets: 1, earlyRPE: '~6', lastRPE: '~6-7', toFailure: false, note: 'New movements — reset intensity, focus on technique' },
            { weeks: [7, 8, 9, 10, 11, 12], sets: '2-3', earlyRPE: '~7-8', lastRPE: '~8-9', toFailure: true, note: 'Last set to failure on exercises marked toFailure: true only' },
          ],
        },
      ],
    },

    recovery: {
      Upper: { focus: 'Strength Focus', exercises: [
        { name: '45° Incline Machine Press', sub1: '45° Incline DB Press', sub2: '45° Incline Barbell Press', reps: '6-8', rest: '3-5 min', warmupSets: 4, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6-7', wk35: '~7-8' }, toFailure: false, note: '1 second pause at the bottom of each rep while maintaining tension on the pecs.' },
        { name: 'Bottom-Half DB Flye', sub1: 'Pec Deck', sub2: null, reps: '8-10', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'All reps in the bottom half of ROM. Focus on deep stretch in pecs at the bottom of each rep.' },
        { name: 'Dual-Handle Lat Pulldown', sub1: 'Wide-Grip Lat Pulldown', sub2: 'Wide-Grip Pull-Up', reps: '8-10', rest: '2-3 min', warmupSets: 2, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Handle more out in front — cross between pullover and pulldown. Feel lats working. Slow 2-3 second negative.' },
        { name: 'Lean-In DB Lateral Raise', sub1: 'High-Cable Cuffed Lateral Raise', sub2: 'High-Cable Lateral Raise', reps: '8-10', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Squeeze your lateral delt to move the weight.' },
        { name: 'Single-Arm DB Row', sub1: 'Smith Machine Row', sub2: 'Pendlay Deficit Row', reps: '6-8', rest: '2-3 min', warmupSets: 2, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Stand on a bumper plate. Focus on getting a big stretch and touch your stomach/chest on each rep.' },
        { name: 'DB Skull Crusher', sub1: 'Overhead Cable Triceps Extension (Rope)', sub2: 'Overhead Cable Triceps Extension (Bar)', reps: '8-10', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Optionally pause for 0.5-1 second in the stretched aspect of each rep.' },
        { name: 'Incline DB Stretch Curl', sub1: 'Seated SuperBayesian High Cable Curl', sub2: 'Bayesian Cable Curl', reps: '8-10', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'If left-right bicep size imbalance exists, do 1 arm at a time starting with weaker arm. Match reps on stronger arm. If no imbalance, do both arms simultaneously.' },
      ]},
      Lower: { focus: 'Strength Focus', exercises: [
        { name: 'Nordic Ham Curl', sub1: 'Seated Leg Curl', sub2: 'Lying Leg Curl', reps: '8-10', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Set the machine for the biggest stretch at the bottom. Prevent your butt from popping up as you curl.' },
        { name: 'High-Bar Back Squat', sub1: 'DB Bulgarian Split Squat', sub2: 'Smith Machine Squat', reps: '6-8', rest: '3-5 min', warmupSets: 4, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Set up feet normally then bring forward 3-6 inches for more upright posture and quad tension. If heels raise, bring feet more forward. If feet slip or lower back rounds, bring feet back.' },
        { name: 'Snatch-Grip RDL', sub1: 'DB RDL', sub2: 'Barbell RDL', reps: '6-8', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Stop about 75% of the way to full lockout on each rep — stay in the bottom 3/4 of ROM to keep tension on hamstrings.' },
        { name: 'Sissy Squat', sub1: 'Reverse Nordic', sub2: 'Leg Extension', reps: '8-10', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Seat back as far as possible. Grab handles to pull butt down into seat. Use a 2-3 second negative. Feel your quads pulling apart on the negative.' },
        { name: 'Leg Press Calf Press', sub1: 'Seated Calf Raise', sub2: 'Standing Calf Raise', reps: '6-8', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: '1-2 second pause at the bottom. Think about rolling your ankle back and forth on the balls of your feet.' },
        { name: 'Machine Crunch', sub1: 'Decline Weighted Crunch', sub2: 'Cable Crunch', reps: '8-10', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Round your lower back as you crunch. Mind-muscle connection with your abs.' },
      ]},
      Pull: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'Dual-Handle Lat Pulldown', sub1: 'Neutral-Grip Pull-Up', sub2: 'Neutral-Grip Lat Pulldown', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Handle more out in front — cross between pullover and pulldown. Focus on feeling lats working more than the weight.' },
        { name: 'Incline Chest-Supported DB Row', sub1: 'Chest-Supported T-Bar Row', sub2: 'Chest-Supported Machine Row', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Flare elbows out at roughly 45° and squeeze shoulder blades together hard at the top of each rep.' },
        { name: 'Reverse Pec Deck', sub1: 'Rope Face Pull', sub2: '1-Arm 45° Cable Rear Delt Flye', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Pause 1-2 seconds in the squeeze of each rep. Contract the rear delts hard.' },
        { name: 'DB Shrug', sub1: 'Cable Paused Shrug-In', sub2: 'Machine Shrug', reps: '10-12', rest: '1-2 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Brief pause at top and bottom of ROM. Think about pulling shoulders up to your ears.' },
        { name: 'DB Curl', sub1: 'EZ-Bar Cable Curl', sub2: 'EZ-Bar Curl', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Cable at lowest position. Maintain constant tension on biceps. Slow, controlled reps.' },
        { name: 'DB Preacher Curl', sub1: 'Machine Preacher Curl', sub2: 'EZ-Bar Preacher Curl', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Smooth, controlled reps. Mind-muscle connection with the biceps.' },
      ]},
      Push: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'DB Bench Press', sub1: 'Machine Chest Press', sub2: 'Barbell Bench Press', reps: '8-10', rest: '3-5 min', warmupSets: 4, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Set up a comfortable arch. Quick pause on the chest and explode up on each rep.' },
        { name: 'Seated DB Shoulder Press', sub1: 'Cable Shoulder Press', sub2: 'Machine Shoulder Press', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Elbows break at least 90°. Mind-muscle connection with delts. Smooth, controlled reps.' },
        { name: 'Low-to-High Cable Crossover', sub1: 'Bottom-Half Seated Cable Flye', sub2: 'Bottom-Half DB Flye', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'All reps in the bottom half of ROM. Deep stretch in pecs at the bottom of each rep.' },
        { name: 'Lean-In DB Lateral Raise', sub1: 'High-Cable Cuffed Lateral Raise', sub2: 'High-Cable Lateral Raise', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Squeeze your lateral delt to move the weight.' },
        { name: 'DB Skull Crusher', sub1: 'Overhead Cable Triceps Extension (Rope)', sub2: 'Overhead Cable Triceps Extension (Bar)', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Optionally pause 0.5-1 second in the stretched aspect of each rep.' },
        { name: 'Bench Dip', sub1: 'DB Triceps Kickback', sub2: 'Cable Triceps Kickback', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Upright or bent over — choose what feels comfortable. In the full squeeze, shoulder should be positioned back behind your torso.' },
        { name: 'Modified Candlestick', sub1: 'Hanging Leg Raise', sub2: 'Lying Leg Raise', reps: '10-20', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Perform slowly. Keep your lower back against the ground throughout the set.' },
      ]},
      Legs: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'DB Walking Lunge', sub1: 'Leg Press', sub2: 'Smith Machine Static Lunge', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Feet lower on platform for quad focus. As deep as possible without back rounding. Control the negative, slight pause at the bottom.' },
        { name: 'Nordic Ham Curl', sub1: 'Lying Leg Curl', sub2: 'Seated Leg Curl', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Lean forward over the machine for maximum hamstring stretch.' },
        { name: 'Goblet Squat', sub1: 'DB Step-Up', sub2: 'Walking Lunge', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk12: '~6', wk35: '~7' }, lastRPE: { wk12: '~6', wk35: '~7' }, toFailure: false, note: 'Take medium strides. Minimize contribution from the back leg.' },
        { name: 'Lateral Band Walk', sub1: 'Cable Hip Abduction', sub2: 'Machine Hip Abduction', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: 'Use pads to increase ROM if possible. Lean forward and grab machine rails to stretch glutes further.' },
        { name: 'Leg Press Calf Press', sub1: 'Seated Calf Raise', sub2: 'Standing Calf Raise', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk12: '~7', wk35: '~7' }, lastRPE: { wk12: '~7', wk35: '~8' }, toFailure: false, note: '1-2 second pause at the bottom. Roll ankle back and forth on balls of feet.' },
      ]},
    },

    ramping: {
      Upper: { focus: 'Strength Focus', exercises: [
        { name: '45° Incline Machine Press', sub1: '45° Incline DB Press', sub2: '45° Incline Barbell Press', reps: '8-10', rest: '3-5 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6-7', wk712: '~7-8' }, toFailure: false, note: '1 second pause at the bottom of each rep while maintaining tension on the pecs.' },
        { name: 'Bottom-Half DB Flye', sub1: 'Pec Deck', sub2: 'Cable Crossover Ladder (one set each at low, medium, and high cable position)', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~7', wk712: '~8-9' }, toFailure: false, note: 'Focus on bringing your elbows together — not your hands.' },
        { name: 'Wide-Grip Pull-Up', sub1: 'Wide-Grip Lat Pulldown', sub2: 'Dual-Handle Lat Pulldown', reps: '10-12', rest: '2-3 min', warmupSets: 2, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Lean back ~15° and drive elbows down as you squeeze shoulder blades together. Should feel like a mix of lats and mid-traps.' },
        { name: 'Lean-In DB Lateral Raise', sub1: 'High-Cable Cuffed Lateral Raise', sub2: 'High-Cable Lateral Raise', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~6', wk712: '~8-9' }, lastRPE: { wk6: '~6', wk712: 'Failure' }, toFailure: true, note: 'Squeeze your lateral delt to move the weight.' },
        { name: 'Single-Arm DB Row', sub1: 'Pendlay Deficit Row', sub2: 'Smith Machine Row', reps: '8-10', rest: '2-3 min', warmupSets: 2, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Squeeze shoulder blades together, keeping elbows at ~45° angle.' },
        { name: 'DB Skull Crusher', sub1: 'Overhead Cable Triceps Extension (Rope)', sub2: 'Overhead Cable Triceps Extension (Bar)', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Optionally pause 0.5-1 second in the stretched aspect of each rep.' },
        { name: 'Incline DB Stretch Curl', sub1: 'Seated SuperBayesian High Cable Curl', sub2: 'Bayesian Cable Curl', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'If left-right imbalance, start with weaker arm and match reps on stronger. If no imbalance, do both arms simultaneously.' },
      ]},
      Lower: { focus: 'Strength Focus', exercises: [
        { name: 'Nordic Ham Curl', sub1: 'Seated Leg Curl', sub2: 'Lying Leg Curl', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~7-8' }, lastRPE: { wk6: '~7', wk712: '~8-9' }, toFailure: false, note: 'Set machine for biggest stretch at the bottom. Prevent your butt from popping up as you curl.' },
        { name: 'High-Bar Back Squat', sub1: 'DB Bulgarian Split Squat', sub2: 'Smith Machine Squat', reps: '8-10', rest: '3-5 min', warmupSets: 4, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Feet forward 3-6 inches for upright posture and quad tension. If heels raise, feet more forward. If lower back rounds, feet back.' },
        { name: 'Cable Pull-Through', sub1: 'Glute-Ham Raise', sub2: '45° Hyperextension', reps: '8-10', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Squeeze glutes hard at the top. Slow controlled negative, explosive positive.' },
        { name: 'Sissy Squat', sub1: 'Reverse Nordic', sub2: 'Leg Extension', reps: '10-12', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Seat back as far as possible. Grab handles to pull butt into seat. 2-3 second negative. Feel quads pulling apart.' },
        { name: 'Standing Calf Raise', sub1: 'Seated Calf Raise', sub2: 'Leg Press Calf Press', reps: '8-10', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: '1-2 second pause at the bottom. Roll ankle back and forth on balls of feet.' },
        { name: 'Cable Crunch', sub1: 'Decline Weighted Crunch', sub2: 'Machine Crunch', reps: '10-12', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Round your lower back as you crunch. Mind-muscle connection with abs.' },
      ]},
      Pull: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'Lean-Back Machine Pulldown', sub1: 'Lean-Back Lat Pulldown', sub2: 'Neutral-Grip Pull-Up', reps: '10-12', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Start upright. As you pull the bar down, lean back 15-30° to get mid-back more involved. Softly touch bar to chest every rep. Control the weight even while leaning back.' },
        { name: 'Incline Chest-Supported DB Row', sub1: 'Chest-Supported T-Bar Row', sub2: 'Chest-Supported Machine Row', reps: '10-12', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~8-9' }, lastRPE: { wk6: '~6', wk712: 'Failure' }, toFailure: true, note: 'Flare elbows out at roughly 45° and squeeze shoulder blades together hard at the top.' },
        { name: 'Reverse Pec Deck', sub1: 'Rope Face Pull', sub2: '1-Arm 45° Cable Rear Delt Flye', reps: '12-15', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Pause 1-2 seconds in the squeeze of each rep. Contract rear delts hard.' },
        { name: 'DB Shrug', sub1: 'Machine Shrug', sub2: 'Cable Paused Shrug-In', reps: '12-15', rest: '1-2 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7' }, lastRPE: { wk6: '~6', wk712: '~8-9' }, toFailure: false, note: 'Shrug up and in. 1-2 second pause in the squeeze (top) and 1-2 second pause in the stretch (bottom) of each rep.' },
        { name: 'Hammer Preacher Curl', sub1: 'DB Hammer Curl', sub2: 'Cable Rope Hammer Curl', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~7' }, lastRPE: { wk6: '~7', wk712: '~8-9' }, toFailure: false, note: 'Squeeze the rope hard as you curl. Smooth, controlled reps.' },
        { name: 'DB Preacher Curl', sub1: 'Concentration Cable Curl', sub2: 'DB Concentration Curl', reps: '15-20', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Smooth, controlled reps. Mind-muscle connection with biceps.' },
      ]},
      Push: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'DB Bench Press', sub1: 'Machine Chest Press', sub2: 'Barbell Bench Press', reps: '10-12', rest: '3-5 min', warmupSets: 4, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Comfortable arch. Quick pause on chest and explode up.' },
        { name: 'Machine Shoulder Press', sub1: 'Cable Shoulder Press', sub2: 'Seated DB Shoulder Press', reps: '10-12', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Elbows break at least 90°. Mind-muscle with delts. Smooth, controlled reps.' },
        { name: 'Low-to-High Cable Crossover', sub1: 'Bottom-Half Seated Cable Flye', sub2: 'Bottom-Half DB Flye', reps: '12-15', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'All reps in bottom half of ROM. Deep stretch in pecs at bottom of each rep.' },
        { name: 'Lean-In DB Lateral Raise', sub1: 'High-Cable Cuffed Lateral Raise', sub2: 'High-Cable Lateral Raise', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Squeeze your lateral delt to move the weight.' },
        { name: 'Katana Triceps Extension', sub1: 'DB Skull Crusher', sub2: 'EZ-Bar Skull Crusher', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~7-8' }, lastRPE: { wk6: '~7', wk712: '~8-9' }, toFailure: false, note: 'Squeeze triceps to move the weight.' },
        { name: 'DB Triceps Kickback', sub1: 'Triceps Pressdown (Rope)', sub2: 'Triceps Pressdown (Bar)', reps: '15-20', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: "Upright or bent over — your choice. In full squeeze, shoulder should be back behind your torso." },
        { name: 'Long-Lever Plank', sub1: 'Swiss Ball Rollout', sub2: 'Ab Wheel Rollout', reps: '12-15', rest: '1-2 min', warmupSets: 1, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: "Use abs to lower and pull back up — don't just hinge at hips. Progressively increase ROM week to week." },
      ]},
      Legs: { focus: 'Hypertrophy Focus', exercises: [
        { name: 'DB Walking Lunge', sub1: 'Leg Press', sub2: 'Hack Squat', reps: '10-12', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: "Controlled negative — don't free fall. Explode on the positive." },
        { name: 'Nordic Ham Curl', sub1: 'Lying Leg Curl', sub2: 'Seated Leg Curl', reps: '12-15', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Lean forward over machine for maximum hamstring stretch.' },
        { name: 'DB Static Lunge', sub1: 'Smith Machine Static Lunge', sub2: 'Walking Lunge', reps: '10-12', rest: '2-3 min', warmupSets: 3, earlyRPE: { wk6: '~6', wk712: '~7-8' }, lastRPE: { wk6: '~6', wk712: '~7-8' }, toFailure: false, note: 'Medium strides. Minimize contribution from the back leg.' },
        { name: 'Lateral Band Walk', sub1: 'Cable Hip Abduction', sub2: 'Machine Hip Abduction', reps: '12-15', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: 'Use pads for more ROM if possible. Lean forward and grab machine rails to stretch glutes further.' },
        { name: 'Leg Press Calf Press', sub1: 'Seated Calf Raise', sub2: 'Standing Calf Raise', reps: '12-15', rest: '1-2 min', warmupSets: 2, earlyRPE: { wk6: '~7', wk712: '~8-9' }, lastRPE: { wk6: '~7', wk712: 'Failure' }, toFailure: true, note: '1-2 second pause at the bottom. Roll ankle back and forth on balls of feet.' },
      ]},
    },

    restDay: { focus:'Active Recovery', exercises:[
      { name:'Light Walk (20-30 min)', muscle:'Cardio', rest:'—', rpe:'~3', reps:'1 session', notes:'Low intensity — keep heart rate conversational. Good for blood flow and recovery.', swaps:['Cycling','Swimming'] },
      { name:'Hip 90/90 Stretch', muscle:'Mobility', rest:'—', rpe:'1', reps:'2 min/side', notes:'Sit on floor with both legs at 90°. Lean into front hip. Great for hip mobility.', swaps:['Pigeon Pose','Hip Flexor Stretch'] },
      { name:'Shoulder Circle + Pass-Through', muscle:'Mobility', rest:'—', rpe:'1', reps:'2-3 sets', notes:'Use band or dowel. Helps maintain shoulder health on heavy upper days.', swaps:['Dislocates','Wall Slides'] },
      { name:'Foam Roll (Full Body)', muscle:'Recovery', rest:'—', rpe:'1', reps:'10 min', notes:'Focus on lats, quads, calves. Slow, steady pressure on tight spots.', swaps:['Massage Gun','Stretching'] },
    ]},
  },

  /* ── Blueprint Templates ─────────────────────────────────────────
     These are the framework options a user can attach to any venture.
     STATE.addBlueprint(ventureId, templateId) creates a live copy with
     per-step completion tracking in IndexedDB.
  ────────────────────────────────────────────────────────────────── */
  blueprintTemplates: [
    {
      id: 'hormozi',
      name: 'Hormozi 9-Stage Roadmap',
      description: "Alex Hormozi's framework for scaling a business from $0 to exit. Each stage has a clear graduation criterion.",
      steps: [
        { name:'Stage 0 — Improvise', description:'Validate the idea. Talk to 20 potential customers. Build something people will pay for. Get your first dollar of revenue.', keyActions:['Talk to 20 target customers face-to-face','Identify 1 core problem you solve better than anyone','Get your first $1 of revenue — any amount counts'] },
        { name:'Stage 1 — Hustle',    description:'Build a predictable, manual sales process. Close 10 customers by doing things that do not scale. Document every objection.', keyActions:['Close 10 paying customers manually','Document objections verbatim from every call','Build a simple 3-stage CRM: prospect → demo → close'] },
        { name:'Stage 2 — Prove',     description:'Prove the business model works repeatedly. Achieve $10K MRR with a clear repeatable motion. Reduce churn below 5%.', keyActions:['Hit $10K MRR with at least 30 paying customers','Document the exact sales script that closes deals','Reduce churn below 5% per month'] },
        { name:'Stage 3 — Optimise',  description:'Make unit economics work. Know your CAC, LTV, and payback period. Cut costs without cutting growth.', keyActions:['Calculate CAC, LTV, and LTV:CAC ratio (target >3:1)','Identify and cut the top 3 wasteful costs','Automate or templatise 80% of customer onboarding'] },
        { name:'Stage 4 — Scale',     description:'Hire to remove yourself from bottlenecks. Build systems that work without you. Aim for $50K MRR.', keyActions:['Make your first key hire (sales or ops)','Document all processes so anyone can run them in one week','Hit $50K MRR'] },
        { name:'Stage 5 — Expand',    description:'Open new customer segments or geographic markets. Double down on the channel that works best.', keyActions:['Identify the top 2 new customer segments to target','Launch in one new market or geography','Hit $100K MRR'] },
        { name:'Stage 6 — Dominate',  description:'Become the category leader. Build a moat through brand, data, or network effects. Outpace all competitors.', keyActions:['Win 30%+ market share in your primary niche','Launch a branded thought leadership content flywheel','Hit $500K MRR'] },
        { name:'Stage 7 — Leverage',  description:'Use your market position to create defensible advantages. Acquire competitors or complementary tools. Build brand equity.', keyActions:['Evaluate 3 acquisition targets','Launch a partner / integration ecosystem','Raise strategic capital or pursue profitability'] },
        { name:'Stage 8 — Exit Ready',description:'Clean up the cap table, metrics, and operations. Know your EBITDA multiple. Be ready to sell or raise at any moment.', keyActions:['Audit financials — clean GAAP books','Calculate valuation at 3× / 5× / 10× revenue multiples','Have a board-ready growth deck updated quarterly'] },
        { name:'Stage 9 — Capitalize',description:'Execute the exit, acqui-hire, or infinite-game reinvestment strategy. Turn your equity into the next venture.', keyActions:['Close exit transaction or Series A/B round','Negotiate earn-out and transition terms','Deploy capital into the next venture or investment portfolio'] },
      ],
    },
    {
      id: 'saas_mvp',
      name: 'SaaS MVP Blueprint',
      description: 'Step-by-step guide to building, launching, and getting first paying customers for a SaaS product.',
      steps: [
        { name:'Define the Problem',       description:'Write a one-sentence problem statement. Identify who has the problem and how urgently they need it solved.', keyActions:['Write a 1-sentence problem statement','List 5 customer personas who have this problem','Rate urgency: do they actively search for a solution?'] },
        { name:'Validate Demand',          description:'Talk to at least 20 people in your target market. Do not build anything yet. Just listen.', keyActions:['Conduct 20 discovery calls — no pitching','Record verbatim quotes about pain points','Identify the #1 problem worth solving'] },
        { name:'Design the Core Loop',     description:'Sketch the one action that delivers value. Every other feature is secondary.', keyActions:['Draw the core user journey in 5 steps or fewer','Define what "aha moment" means for your user','Cut everything that is not the core loop from v1'] },
        { name:'Build v1 MVP',             description:'Build only what is needed to deliver the core value. Ship ugly. Ship fast.', keyActions:['Set a ship date and do not move it','Use existing tools where possible (no custom infra)','Get v1 live in under 4 weeks'] },
        { name:'Get First 10 Users',       description:'Manually recruit the first 10 users. Do not rely on marketing yet — do it by hand.', keyActions:['Personally onboard each of the first 10 users','Watch them use the product live (screen share or in person)','Ask: would you be very disappointed if this went away?'] },
        { name:'Charge From Day 1',        description:'Do not give it away for free. Even $1 validates willingness to pay.', keyActions:['Set a price before the product is done','Close your first paid customer before launch','Never offer free forever — use trials with clear end dates'] },
        { name:'Iterate to Retention',     description:'A product people return to daily is more valuable than one people love once.', keyActions:['Track weekly active users — target 40%+ retention','Interview every churned user within 48 hours of leaving','Ship at least one retention-focused improvement per week'] },
        { name:'Build a Sales Playbook',   description:'Document exactly how you close deals so someone else can repeat it.', keyActions:['Write a sales script with responses to top 5 objections','Record 3 successful sales calls and transcribe key moments','Build a CRM — even a spreadsheet counts'] },
        { name:'Systematise Operations',   description:'Remove yourself from every manual step. Everything should run without your direct involvement.', keyActions:['Automate onboarding with email sequences','Write SOPs for support and common customer questions','Hire or contract for the first task you hate most'] },
        { name:'Hit $10K MRR',             description:'Prove the model works repeatedly. $10K MRR is the proof-of-concept threshold.', keyActions:['Close 30+ paying customers','Churn below 5% monthly','Document the exact repeatable motion that gets customers'] },
      ],
    },
    {
      id: 'content_marketing',
      name: 'Content Marketing Flywheel',
      description: 'Build a compounding content engine that drives inbound leads without paid ads.',
      steps: [
        { name:'Define Your Niche & POV',    description:'Pick one niche and one contrarian point of view. Generalists get ignored.', keyActions:['Write your one-line positioning statement','List 3 beliefs your audience holds that you disagree with','Commit to one primary content channel for 90 days'] },
        { name:'Create Your Content Pillar', description:'Produce one long-form content piece per week that answers the #1 question your target customer is googling.', keyActions:['Research 20 questions your customer Googles','Publish one 1,500+ word post per week for 8 weeks','Track organic traffic and keyword rankings weekly'] },
        { name:'Repurpose Everything',       description:'Turn every long-form piece into 5–10 short-form pieces for social distribution.', keyActions:['Extract 5 key quotes from each long-form post','Post one short-form piece daily across 2 channels','Build a content calendar for the next 30 days'] },
        { name:'Build an Email List',        description:'Email is the only channel you own. Everything else is borrowed.', keyActions:['Create a lead magnet (checklist, guide, or template)','Add opt-in to every content piece','Target 100 subscribers in 30 days, 1,000 in 90 days'] },
        { name:'Launch a Newsletter',        description:'A weekly newsletter turns readers into a community.', keyActions:['Send weekly newsletter every [set day] without exception','Track open rate (target 40%+) and click rate (target 5%+)','Feature one customer story or result every 4 weeks'] },
        { name:'SEO Foundation',             description:'Build the infrastructure for long-term organic discovery.', keyActions:['Optimise all posts with target keyword in title, H1, and meta','Build 5 backlinks per month through guest posts or PR','Fix all technical SEO issues (speed, mobile, indexing)'] },
        { name:'Convert Readers to Leads',   description:'Every piece of content should have a clear next step.', keyActions:['Add a CTA to every post (free trial, demo, or newsletter)','Build a landing page for each core content pillar','Track lead source — know which content drives signups'] },
        { name:'Measure & Double Down',      description:'Cut content types that do not convert. Double the format that does.', keyActions:['Review analytics monthly — top 10 posts by traffic and leads','Cut the 2 lowest-performing content formats','Scale production of the highest-converting format'] },
      ],
    },
    {
      id: 'social_media',
      name: 'Social Media Strategy',
      description: 'Build a consistent social presence that drives brand awareness and inbound interest.',
      steps: [
        { name: 'Define Target Audience',   description: 'Know exactly who you are talking to before posting anything.', keyActions: ['Write a 1-paragraph ideal customer profile', 'List 3 platforms where they spend time', 'Identify 5 accounts they already follow and why'] },
        { name: 'Choose 1–2 Channels',      description: 'Focus beats spreading thin. Own one channel before expanding.', keyActions: ['Pick primary channel (LinkedIn, Instagram, Twitter/X, or TikTok)', 'Set up a fully optimised profile — bio, link, branding', 'Research the top 10 performing accounts in your niche'] },
        { name: 'Define Content Pillars',   description: '3–4 recurring themes that anchor your posting strategy.', keyActions: ['Write your 3 content pillars (e.g. education, behind-scenes, social proof)', 'Map each pillar to a buyer awareness stage', 'Draft 5 post ideas per pillar'] },
        { name: 'Build a Content Calendar', description: 'Plan 30 days of content in advance — consistency is the only strategy.', keyActions: ['Create a 30-day posting calendar (use Notion or a spreadsheet)', 'Batch-create content one week ahead', 'Commit to a minimum posting frequency (3×/week)'] },
        { name: 'Launch & Post for 30 Days', description: 'Post every day for 30 days without checking analytics. Build the habit first.', keyActions: ['Post on schedule for 30 consecutive days', 'Reply to every comment and DM within 24 hours', 'Engage on 5 other accounts per day to grow reach'] },
        { name: 'Engagement Strategy',      description: 'Algorithm rewards accounts that engage others, not just those that post.', keyActions: ['Comment meaningfully on 5 posts per day in your niche', 'DM 3 new potential followers per week with genuine value', 'Reply to every comment on your posts for the first 60 minutes after posting'] },
        { name: 'Analyse & Iterate',        description: 'After 30 days, cut what performs worst and double what performs best.', keyActions: ['Pull analytics: top 5 posts by reach and engagement', 'Identify which content pillar drives the most followers', 'Adjust content mix for the next 30 days based on data'] },
        { name: 'Convert Followers to Leads', description: 'Social media is top of funnel — you need a path to revenue.', keyActions: ['Add a clear CTA to your bio and top posts', 'Create a lead magnet linked from your profile', 'Track how many followers become email subscribers or booked calls monthly'] },
      ],
    },
    {
      id: 'website',
      name: 'Website Blueprint',
      description: 'Build a site that converts visitors into leads and clearly communicates your value.',
      steps: [
        { name: 'Domain & Hosting',      description: 'Get the infrastructure right before building anything.', keyActions: ['Register a .com domain — short, memorable, easy to spell', 'Set up hosting (Vercel, Netlify, or managed WordPress)', 'Connect custom domain and verify SSL certificate'] },
        { name: 'Define Core Pages',     description: 'Every site needs these 5 pages before anything else.', keyActions: ['Home — hero, value prop, social proof, CTA', 'About — story, credibility, mission', 'Services or Product — what you offer and for whom', 'Pricing — clear and direct (hide nothing)', 'Contact — multiple ways to reach you'] },
        { name: 'Hero & Value Prop',     description: 'Above the fold should answer: who you help, how, and what they get.', keyActions: ['Write a headline that names the customer and the outcome', 'Add a subheading that explains how you deliver it', 'Above-fold CTA button — primary action only, no distractions'] },
        { name: 'Social Proof',          description: 'Every page should have proof that your claims are real.', keyActions: ['Add 3+ testimonials with name, title, and photo', 'Add logos of clients or publications you\'ve appeared in', 'Add one quantified result (e.g. "42% more leads in 30 days")'] },
        { name: 'SEO Basics',            description: 'Set up the foundation for organic discovery before you need it.', keyActions: ['Write unique meta title and description for each page', 'Use your target keyword in the H1 and first paragraph', 'Set up Google Search Console and submit sitemap'] },
        { name: 'Analytics Setup',       description: 'You can\'t improve what you can\'t measure.', keyActions: ['Install Google Analytics 4', 'Set up a conversion goal (form submit, CTA click)', 'Install Microsoft Clarity or Hotjar for session recordings'] },
        { name: 'Speed & Mobile',        description: 'Slow sites lose 50%+ of visitors before they see your offer.', keyActions: ['Run Google PageSpeed Insights — target 90+ on mobile', 'Compress all images (use WebP format)', 'Test the entire site on iPhone and Android'] },
        { name: 'Launch & Test',         description: 'Ship it. A live site that converts 0.5% is worth more than a perfect site that doesn\'t exist.', keyActions: ['QA every page on desktop and mobile', 'Test every form and CTA — do they work?', 'Send the first 50 people through and track what they do'] },
      ],
    },
    {
      id: 'outbound',
      name: 'Outbound Marketing',
      description: 'Build a repeatable cold outreach engine that generates booked meetings on demand.',
      steps: [
        { name: 'Build Target List',       description: 'Quality of list determines quality of results. Define before you build.', keyActions: ['Define 3 ICP criteria (industry, company size, role)', 'Build a list of 500+ verified contacts using Apollo, Hunter, or LinkedIn', 'Verify email addresses — invalid emails kill deliverability'] },
        { name: 'Research & Personalise', description: 'Generic messages get ignored. One personal hook per prospect changes everything.', keyActions: ['Find 1–2 hooks per prospect (recent post, company news, shared connection)', 'Write a custom first line for every email — no templates for line 1', 'Segment your list by persona so the core message stays relevant'] },
        { name: 'Write Email Sequence',   description: '4–5 email sequence: hook, value, proof, ask, breakup.', keyActions: ['Email 1: Personal hook + problem you solve (3 sentences max)', 'Email 3: Social proof — name a result you got for someone like them', 'Email 5: Breakup email — short, direct, removes pressure'] },
        { name: 'LinkedIn Outreach',      description: 'LinkedIn works differently than email — lead with connection, then value.', keyActions: ['Send connection request with a 1-sentence note — no pitch', 'Follow up 48h after connecting with a value-first message', 'Never pitch in the first DM — earn the right to pitch first'] },
        { name: 'Set Up Sending Infra',   description: 'Sending from your main domain will destroy deliverability. Do it right.', keyActions: ['Set up a separate sending domain (e.g. trymybiz.com)', 'Warm up the domain for 2–3 weeks before full volume', 'Set up SPF, DKIM, and DMARC records on all sending domains'] },
        { name: 'Launch & Track',         description: 'Target: 2–5% booked meeting rate on outbound sequences.', keyActions: ['Send 50–100 personalised emails per day maximum', 'Track open rate (target 50%+), reply rate (target 10%+), meeting rate (target 3%+)', 'Log every reply — categorise as interested, not now, wrong person, unsubscribe'] },
        { name: 'A/B Test Messaging',    description: 'Small wording changes can 2× your reply rate.', keyActions: ['Test 2 different subject lines per week', 'Test 2 different value propositions and compare reply rates', 'Never change more than one variable at a time'] },
        { name: 'Scale What Works',       description: 'Once messaging converts, scale with systems — not more personal time.', keyActions: ['Document the exact sequence that generates meetings', 'Hire an SDR or VA to run outreach at 3× current volume', 'Automate follow-up sequences while keeping personalised opening lines'] },
      ],
    },
    {
      id: 'inbound',
      name: 'Inbound Marketing',
      description: 'Build a content engine that compounds over time and brings leads to you.',
      steps: [
        { name: 'Keyword Research',       description: 'Find out exactly what your buyer is searching for — then answer it better than anyone.', keyActions: ['Identify 50 keywords your ICP actively searches', 'Prioritise by intent (problem-aware vs. solution-aware)', 'Use Ahrefs, SEMrush, or free tools (Google Search Console + AnswerThePublic)'] },
        { name: 'Content Strategy',       description: 'Map content to the buyer journey — awareness, consideration, decision.', keyActions: ['Define 3 content categories: educational, comparison, conversion', 'Create a 90-day editorial calendar', 'Assign each article a target keyword, buyer stage, and CTA'] },
        { name: 'First 10 Articles',      description: 'Publish 10 high-quality SEO articles before expecting results. The algorithm needs signal.', keyActions: ['Each article: 1,500+ words, target keyword, clear structure', 'Internal link every new article to 2 existing ones', 'Track initial rankings at 30, 60, and 90 days'] },
        { name: 'Lead Magnets',           description: 'Give something genuinely useful in exchange for an email address.', keyActions: ['Create 1–2 lead magnets (template, calculator, guide, checklist)', 'Lead magnet must solve the same problem as your paid offer — just partially', 'Add lead magnet CTA to every relevant article'] },
        { name: 'Landing Pages',          description: 'Each lead magnet needs its own dedicated page optimised for one action.', keyActions: ['Build a landing page for each lead magnet — no nav, one CTA', 'Headline = the outcome, not the deliverable', 'A/B test 2 headlines within 30 days of launch'] },
        { name: 'Email Nurture Sequence', description: 'The email sequence after opt-in does the selling — your content just gets the lead.', keyActions: ['Write a 5–7 email sequence: deliver value, build trust, make offer', 'Email 1 delivers the lead magnet immediately', 'Email 5 introduces your core product/service with social proof'] },
        { name: 'Conversion Optimisation', description: 'Small CRO improvements on high-traffic pages compound dramatically.', keyActions: ['Install session recording on top 5 traffic pages', 'Test 2 new CTAs per month on the highest-traffic article', 'Review heatmaps monthly — where do readers drop off?'] },
        { name: 'Measure & Compound',     description: 'Inbound takes 6–12 months to compound. Measure the right metrics or you\'ll quit too early.', keyActions: ['Track: organic sessions, opt-in rate, lead-to-customer rate monthly', 'Update top 3 articles quarterly to maintain rankings', 'Double down on the content format and topic that drives the most leads'] },
      ],
    },
  ],

  /* ── Passion Blueprint Templates ─────────────────────────────────
     Stackable sub-blueprint frameworks for passion boards.
     Each passion can stack multiple sub-blueprints.
  ────────────────────────────────────────────────────────────────── */
  passionBlueprintTemplates: [
    {
      id: 'chords',
      name: 'Chords',
      description: 'From open chords to advanced voicings — a complete chord roadmap.',
      steps: [
        { name: 'Open Chords',           description: 'The essential 8: Am, Em, Dm, E, A, D, G, C. These unlock 90% of acoustic songs.', keyActions: ['Learn all 8 open chords cleanly — no buzzing, no muting', 'Practice each chord 1 minute per day for a week', 'Strum through a simple song using only open chords'] },
        { name: 'F Barre Chord',         description: 'The wall every guitarist must climb. Master this and the whole neck opens up.', keyActions: ['Place index finger flat across all 6 strings at fret 1', 'Check each string rings clearly — adjust finger position daily', 'Practice F → C → G → Am transition 50 times per session'] },
        { name: 'A-Shape Barre Chords',  description: 'Moveable shapes rooted on the A string unlock all major and minor chords.', keyActions: ['Learn B major and Bm as A-shape barre chords at fret 2', 'Move the shape to every fret — name the chord at each position', 'Practice B → E → F#m → C#m (a common key of B progression)'] },
        { name: '7th Chords',            description: 'Add colour and tension — essential for blues, country, and jazz.', keyActions: ['Learn open G7, C7, D7, A7, E7 and B7', 'Learn moveable dominant 7th barre shape (E-shape root)', 'Improvise a 12-bar blues using only dominant 7th chords'] },
        { name: 'Suspended Chords',      description: 'Sus2 and Sus4 chords create movement and tension without changing root.', keyActions: ['Learn Dsus2, Dsus4, Asus2, Asus4 in open position', 'Practice D → Dsus4 → D → Dsus2 riff (classic rock move)', 'Find 2 songs that use sus chords and learn them'] },
        { name: 'Chord Transitions',     description: 'Smooth transitions matter more than knowing 50 chords.', keyActions: ['Set metronome to 60 BPM — change chord every beat for 2 minutes', 'Identify your slowest transition pair and drill it daily', 'Target: 60+ clean changes per minute for your common chord pairs'] },
        { name: 'Chord Inversions',      description: 'Playing the same chord with a different bass note creates smooth bass lines.', keyActions: ['Learn G/B (G chord with B in bass)', 'Learn D/F# and Am/E inversions — use them in a song', 'Write a chord progression that uses at least 2 slash chords'] },
        { name: 'Jazz Voicings',         description: 'Moveable 4-note voicings that work for jazz, R&B, and advanced country.', keyActions: ['Learn maj7, min7, and dom7 shapes on the 5th-string root', 'Learn the same three shapes on the 6th-string root', 'Play a ii-V-I in the key of C using only jazz voicings'] },
      ],
    },
    {
      id: 'covers',
      name: 'Cover Songs',
      description: 'A step-by-step framework for learning and performing any cover song.',
      steps: [
        { name: 'Song Selection',        description: 'Choose songs that stretch you but are achievable in 2–4 weeks.', keyActions: ['Pick a song one difficulty level above your current best', 'Confirm you can identify all chords by ear or find a reliable chart', 'Set a target date: full performance-ready in 3 weeks'] },
        { name: 'Listen & Analyze',      description: 'Understand the structure before you touch the guitar.', keyActions: ['Listen 3 times without the guitar — map out verse, chorus, bridge, outro', 'Identify the key, tempo, and time signature', 'Note any unusual chord changes, time signature shifts, or key modulations'] },
        { name: 'Chord Progression',     description: 'Learn the foundation before worrying about melody or fills.', keyActions: ['Write out every chord in every section', 'Play through the full progression slowly with a metronome', 'Get every section sounding clean before moving forward'] },
        { name: 'Melody & Lyrics',       description: 'Singing while playing is a coordination skill — train it separately first.', keyActions: ['Learn the melody on guitar alone (pick it out note by note)', 'Speak the lyrics in rhythm over the chord progression', 'Slowly combine singing and playing — start with just the chorus'] },
        { name: 'Style & Feel',          description: 'Don\'t just copy the recording — find your version of the song.', keyActions: ['Identify 2 signature licks or fills from the original and learn them', 'Decide: where will you add dynamics, pauses, or your own inflection?', 'Record yourself and compare to the original — what feels authentic vs. forced?'] },
        { name: 'Up to Speed',           description: 'Gradually increase tempo until you\'re at performance speed.', keyActions: ['Use a metronome — start at 70% of target tempo', 'Increase by 2–5 BPM every 2 practice sessions', 'Only move up in tempo when the previous tempo is 100% clean'] },
        { name: 'Record a Demo',         description: 'Recording reveals mistakes you don\'t notice in the room.', keyActions: ['Record a rough take on your phone — no editing', 'Listen back and note the top 3 weakest moments', 'Fix those 3 moments, then re-record'] },
        { name: 'Performance Ready',     description: 'A song is only ready when you can play it three times in a row without stopping.', keyActions: ['Play start-to-finish three consecutive times without stopping', 'Perform it for one person — even if it\'s a family member on a couch', 'Add it to your set or repertoire list'] },
      ],
    },
    {
      id: 'theory',
      name: 'Music Theory',
      description: 'Intervals, scales, chords, and progressions — from the ground up.',
      steps: [
        { name: 'Intervals',             description: 'The foundation of everything. Know every interval by sound and name.', keyActions: ['Memorize all 12 intervals: name, semitone count, and a song reference', 'Complete 10 minutes of interval ear training daily (use ToneSavvy or EarMaster)', 'Identify intervals in 3 songs you already know by ear'] },
        { name: 'Major Scale',           description: 'The measuring stick all other scales and chords are built from.', keyActions: ['Memorize the WWHWWWH pattern', 'Play the C major scale in all 5 CAGED positions on guitar', 'Play all 12 major scales — know every note in each key'] },
        { name: 'Minor Scales',          description: 'Natural, harmonic, and melodic minor — three flavors, all essential.', keyActions: ['Learn the natural minor scale (WHWWHWW) and relate it to its relative major', 'Learn the harmonic minor (raised 7th) and identify its distinctive sound', 'Learn the melodic minor and understand why it ascends and descends differently'] },
        { name: 'Triad Construction',    description: 'Every chord starts as a 3-note triad. Know how each type is built.', keyActions: ['Build major (1-3-5), minor (1-b3-5), dim (1-b3-b5), and aug (1-3-#5) triads', 'Play all 4 triad types rooted on every note of the chromatic scale', 'Identify triad types by ear in 5 songs'] },
        { name: '7th Chords',            description: 'The language of jazz, blues, R&B, and sophisticated country.', keyActions: ['Build Maj7, dom7, min7, min7b5, and dim7 chords from the formula', 'Play all 5 seventh chord types rooted on C, G, D, A, E', 'Learn the diatonic 7th chords in the key of C major (Cmaj7, Dm7, Em7...)'] },
        { name: 'Chord Progressions',    description: 'Progressions are the grammar of music — patterns that create tension and resolution.', keyActions: ['Memorize I-IV-V-I in all 12 major keys', 'Learn I-vi-IV-V and ii-V-I and identify them in 5 pop songs', 'Understand the Nashville Number System and apply it to 3 songs'] },
        { name: 'Key Signatures',        description: 'Fluency in all 12 keys unlocks every song in every genre.', keyActions: ['Memorize the circle of fifths — all 12 major keys and relative minors', 'Know every sharp and flat in every key without looking', 'Transpose a simple song into 3 different keys'] },
        { name: 'Modes',                 description: 'Seven modes, each with its own character and practical application.', keyActions: ['Learn all 7 mode names and their parent scale positions (Ionian, Dorian... Locrian)', 'Play Dorian over a minor chord and Mixolydian over a dominant chord — hear the difference', 'Learn one song or riff that clearly demonstrates each of the 4 most common modes'] },
      ],
    },
  ],

  /* ── Business ────────────────────────────────────────────────── */
  business: {
    companyName: 'Envosta',
    /* Venture seeds — pre-populated ventures for the app.
       Each venture can have defaultBlueprints[] listing templateIds
       to automatically attach on first STATE bootstrap. */
    ventures: [
      {
        id: 'envosta',
        name: 'Envosta',
        icon: '🚀',
        description: 'B2B SaaS — productivity and operations platform.',
        defaultBlueprints: ['hormozi', 'saas_mvp'],
      },
    ],
    stages: [
      { num:0, name:'Improvise',  sub:'Validate the idea',      current:true  },
      { num:1, name:'Hustle',     sub:'First paying customers', current:false },
      { num:2, name:'Prove',      sub:'Repeatable sales',       current:false },
      { num:3, name:'Optimise',   sub:'Unit economics work',    current:false },
      { num:4, name:'Scale',      sub:'Hire & systematise',     current:false },
      { num:5, name:'Expand',     sub:'New channels/markets',   current:false },
      { num:6, name:'Dominate',   sub:'Category leader',        current:false },
      { num:7, name:'Leverage',   sub:'Brand & moat',           current:false },
      { num:8, name:'Exit Ready', sub:'Clean metrics',          current:false },
      { num:9, name:'Capitalize', sub:'Exit or compound',       current:false },
    ],
    departments: [
      { icon:'🧩', name:'Product', stage:'Build MVP', priorities:['Ship a working v1 that solves one problem extremely well','Talk to 10 target users before building any new feature','Define the core loop: what brings users back daily?'] },
      { icon:'📣', name:'Marketing', stage:'Find the Signal', priorities:['Test 3 traffic channels (content, cold outreach, communities)','Document which message resonates — track click-through on each','Build a waitlist or email list of 100+ ideal prospects'] },
      { icon:'💰', name:'Sales', stage:'First Revenue', priorities:['Close 3 paying customers manually — charge from day 1','Document objections verbatim from every call','Build a simple CRM: prospect → demo → close pipeline'] },
      { icon:'🎧', name:'Customer Service', stage:'White Glove', priorities:['Respond to every support message within 2 hours','Build a FAQ from the top 10 questions customers ask','Track NPS or satisfaction score monthly'] },
      { icon:'💻', name:'IT & Infrastructure', stage:'Lean Stack', priorities:['Keep infrastructure costs under $50/mo until 10 paying customers','Set up error monitoring and basic uptime alerting','Automate onboarding flow so new users activate without you'] },
      { icon:'🤝', name:'Recruiting', stage:'Solo Grind', priorities:['Identify the first hire: what bottleneck does it remove?','Build a repeatable process before hiring someone to run it','Document all core tasks so they\'re learnable in one week'] },
      { icon:'📋', name:'HR & Culture', stage:'Culture of One', priorities:['Define 3 core values you\'d hire and fire by','Write a one-page operating playbook for how you work','Habits and standards you want baked in from day one'] },
      { icon:'💵', name:'Finance', stage:'Track Everything', priorities:['Separate business and personal bank accounts now','Track every dollar in and out — weekly P&L review','Know your burn rate and runway at all times'] },
    ],
  },

  /* ── Creative ────────────────────────────────────────────────── */
  creative: {
    genre: 'Acoustic country — bar performances',
    songs: [
      { title:'Wagon Wheel',                artist:'Old Crow Medicine Show / Darius Rucker', key:'G',  status:'ready',    tags:['Crowd Favourite','Opener','Easy Sing-Along'] },
      { title:'Take Me Home, Country Roads', artist:'John Denver',                           key:'G',  status:'ready',    tags:['Crowd Favourite','Closer','High Energy'] },
      { title:'Friends in Low Places',       artist:'Garth Brooks',                           key:'Bb', status:'ready',    tags:['Bar Classic','Singalong'] },
      { title:'The House That Built Me',     artist:'Miranda Lambert',                        key:'C',  status:'ready',    tags:['Emotional','Mid-Set'] },
      { title:'Chicken Fried',               artist:'Zac Brown Band',                         key:'G',  status:'ready',    tags:['Feel Good','Mid-Set'] },
      { title:'Tennessee Whiskey',           artist:'Chris Stapleton',                        key:'A',  status:'ready',    tags:['Show Stopper','Smooth'] },
      { title:'Fast Car',                    artist:'Tracy Chapman',                          key:'C',  status:'ready',    tags:['Crossover','Quiet Moment'] },
      { title:'Jolene',                      artist:'Dolly Parton',                           key:'Dm', status:'ready',    tags:['Classic','Emotional'] },
      { title:'Whiskey Glasses',             artist:'Morgan Wallen',                          key:'C',  status:'learning', tags:['Modern Country','Up-Beat'] },
      { title:'Buy Dirt',                    artist:'Jordan Davis',                           key:'G',  status:'learning', tags:['Modern Country','Story'] },
      { title:'Seven Bridges Road',          artist:'Eagles',                                 key:'D',  status:'learning', tags:['A Cappella Intro','Harmony'] },
      { title:'When the Stars Go Blue',      artist:'Ryan Adams',                             key:'D',  status:'learning', tags:['Late Night Vibe','Slow'] },
      { title:'Rodeo Bones',                 artist:'Original',                               key:'G',  status:'original', tags:['Story Song','Verse-Chorus','Demo Ready'] },
      { title:'Sixty Miles of Nothing',      artist:'Original',                               key:'Am', status:'original', tags:['Fingerpick','Lyric-Heavy','Work In Progress'] },
      { title:'Four Walls and a Flag',       artist:'Original',                               key:'D',  status:'original', tags:['Patriotic','Slow Burn','Needs Bridge'] },
    ],
    setlist: [
      { song:'Wagon Wheel',                 key:'G',  notes:'Opens strong — get the room warmed up' },
      { song:'Chicken Fried',               key:'G',  notes:'Keep energy up, no key change needed' },
      { song:'Tennessee Whiskey',           key:'A',  notes:'Slow it down — let voice carry' },
      { song:'Fast Car',                    key:'C',  notes:'Crossover appeal — quiet and focused' },
      { song:'Friends in Low Places',       key:'Bb', notes:'Bar singalong — get them involved' },
      { song:'Rodeo Bones (Original)',      key:'G',  notes:"Plug original — \"this one's mine\"" },
      { song:'Take Me Home, Country Roads', key:'G',  notes:'Closer — everyone sings, end strong' },
    ],
    practice: [
      { icon:'🎸', title:'Fingerpicking Pattern — Travis Pick',          detail:'12 min daily. Start slow (60 BPM), build to 120. Apply to "Sixty Miles of Nothing".', priority:'high' },
      { icon:'🎤', title:'Vocal Warmup Routine',                         detail:"10 min before every session. Lip trills, sirens, 1-3-5 scales. Don't skip this.", priority:'high' },
      { icon:'🎵', title:'Capo Chord Transitions — Key of D',            detail:'D → G → A → Bm at 80 BPM clean before adding capo shapes. 15 min.', priority:'medium' },
      { icon:'📝', title:'Lyric Writing — 15 min stream of consciousness',detail:'Write without editing. Mine for phrases, images, lines. One session/day minimum.', priority:'medium' },
      { icon:'🔄', title:'Barre Chord F Shape — Clean Tone',             detail:'5 min mute-and-strum drill. First string must ring clean every time.', priority:'low' },
      { icon:'🎙️', title:'Record a Phone Demo',                          detail:'One rough voice memo per original per week. Listen back after 24 hours.', priority:'low' },
    ],
    writingGoals: [
      { label:'Songs in Library',     current:15, target:50, unit:'songs' },
      { label:'Originals',            current:3,  target:10, unit:'originals' },
      { label:'Demo-Ready Originals', current:1,  target:5,  unit:'demos' },
      { label:'Sets Performed',       current:0,  target:20, unit:'gigs' },
    ],
  },

  /* ── Wealth ──────────────────────────────────────────────────── */
  wealth: {
    mrrTarget:      50000,
    netWorthGoal:   1000000,
  },

  /* ── Whole Foods ─────────────────────────────────────────────────
     Top nutrient-dense whole food options per category.
     Each item: { name, highlight (key benefit), tags[] }
     'top' flag = shown pinned at the top of the section.
  ────────────────────────────────────────────────────────────────── */
  wholeFoods: [
    {
      category: 'Protein Sources',
      icon: '🥩',
      items: [
        { name:'Chicken Breast',        highlight:'~31g protein / 165 kcal per 100g. Leanest complete protein.', tags:['High Protein','Low Fat','Complete AA'], top:true },
        { name:'Eggs (Whole)',          highlight:'6g protein + choline, B12, D, and healthy fats per egg.', tags:['Complete Protein','Micronutrients','Versatile'], top:true },
        { name:'Greek Yogurt (Plain)', highlight:'~17g protein per 170g. Probiotics + calcium.', tags:['High Protein','Probiotics','Calcium'], top:true },
        { name:'Salmon (Wild)',         highlight:'~25g protein + omega-3 EPA/DHA. Anti-inflammatory.', tags:['Omega-3','High Protein','Heart Health'] },
        { name:'Beef (Lean, 93%)',      highlight:'High in creatine, iron, zinc, B12. ~26g protein per 100g.', tags:['Creatine','Iron','B12'] },
        { name:'Cottage Cheese',        highlight:'Slow-digesting casein protein. Great before bed.', tags:['Casein','Slow Digesting','Calcium'] },
        { name:'Tuna (Canned)',         highlight:'Convenient, cheap, ~25g protein. Watch sodium.', tags:['Convenient','High Protein','Omega-3'] },
        { name:'Sardines',              highlight:'Calcium from bones + omega-3 + B12. Most nutrient-dense fish.', tags:['Omega-3','Calcium','B12','Top Pick'] },
      ],
    },
    {
      category: 'Complex Carbohydrates',
      icon: '🌾',
      items: [
        { name:'Oats (Rolled)',         highlight:'Beta-glucan for cholesterol + slow carbs + 5g protein / 40g.', tags:['Fibre','Beta-Glucan','Sustained Energy'], top:true },
        { name:'Sweet Potato',          highlight:'Vitamin A, potassium, fibre. 26g carbs per medium potato.', tags:['Vitamin A','Potassium','Anti-inflammatory'], top:true },
        { name:'Brown Rice',            highlight:'Complete whole grain. Pairs with any protein. Easy bulk staple.', tags:['Whole Grain','Versatile','Bulk Friendly'], top:true },
        { name:'Quinoa',                highlight:'Complete protein (8g per cup cooked) + all essential amino acids.', tags:['Complete Protein','Gluten Free','Versatile'] },
        { name:'Lentils',               highlight:'~18g protein + 16g fibre per cooked cup. Cheap and filling.', tags:['Protein','Fibre','Iron','Budget'] },
        { name:'Black Beans',           highlight:'Resistant starch + protein + fibre. Great gut food.', tags:['Fibre','Resistant Starch','Protein'] },
        { name:'Bananas',               highlight:'Fast carbs + potassium. Perfect pre/post workout.', tags:['Potassium','Pre-Workout','Fast Carb'] },
        { name:'Berries (Mixed)',        highlight:'Lowest sugar fruit. Highest antioxidant density of any food.', tags:['Antioxidants','Low Sugar','Vitamin C'] },
      ],
    },
    {
      category: 'Healthy Fats',
      icon: '🥑',
      items: [
        { name:'Avocado',               highlight:'Monounsaturated fats + potassium + folate. 3g fibre per half.', tags:['MUFA','Potassium','Fibre'], top:true },
        { name:'Extra Virgin Olive Oil',highlight:'Oleocanthal — natural anti-inflammatory. Best cooking oil.', tags:['Anti-inflammatory','MUFA','Heart Health'], top:true },
        { name:'Walnuts',               highlight:'Highest plant omega-3 source. 4g per 28g serving.', tags:['Omega-3','Brain Health','ALA'], top:true },
        { name:'Almonds',               highlight:'Vitamin E + magnesium + healthy fats. Fills gaps in most diets.', tags:['Vitamin E','Magnesium','Satiety'] },
        { name:'Chia Seeds',            highlight:'Omega-3, calcium, fibre. Absorbs 10× its weight in liquid.', tags:['Omega-3','Fibre','Calcium'] },
        { name:'Flaxseed (Ground)',     highlight:'Lignans + ALA + fibre. Best added to oats or yogurt.', tags:['Lignans','ALA','Fibre'] },
        { name:'Coconut Oil (sparingly)',highlight:'MCTs for quick energy. Use in moderation — high in saturated fat.', tags:['MCT','Quick Energy','Use Sparingly'] },
      ],
    },
    {
      category: 'Vegetables',
      icon: '🥦',
      items: [
        { name:'Broccoli',              highlight:'Sulforaphane = powerful cancer-fighting compound. Vitamin C + K + folate.', tags:['Sulforaphane','Vitamin C','Anti-cancer'], top:true },
        { name:'Spinach',               highlight:'Iron, folate, K1, magnesium. Most nutrient-dense leafy green.', tags:['Iron','Folate','Magnesium','Lutein'], top:true },
        { name:'Kale',                  highlight:'Vitamin K1 (660% DV per cup raw). Plus C, A, calcium.', tags:['Vitamin K','Calcium','Fibre'], top:true },
        { name:'Bell Peppers (Red)',     highlight:'Highest vitamin C of any vegetable — 3× more than oranges.', tags:['Vitamin C','Antioxidants','Low Calorie'] },
        { name:'Garlic',                highlight:'Allicin = immune + cardiovascular benefits. Eat daily.', tags:['Allicin','Immune','Cardiovascular'] },
        { name:'Beets',                 highlight:'Nitrates boost blood flow and exercise performance.', tags:['Nitrates','Performance','Folate'] },
        { name:'Asparagus',             highlight:'Folate + prebiotic inulin + chromium. Detoxification support.', tags:['Folate','Prebiotic','Detox'] },
        { name:'Carrots',               highlight:'Beta-carotene (Vitamin A precursor). Eye health and immunity.', tags:['Beta-Carotene','Vitamin A','Eye Health'] },
      ],
    },
    {
      category: 'Dairy & Alternatives',
      icon: '🥛',
      items: [
        { name:'Whole Milk',            highlight:'Complete nutrition: protein, fat, carbs + calcium + D.', tags:['Calcium','Vitamin D','Complete'], top:true },
        { name:'Kefir',                 highlight:'More probiotics per serving than yogurt. Fermented milk drink.', tags:['Probiotics','Calcium','Fermented'], top:true },
        { name:'Parmesan Cheese',       highlight:'Highest protein-to-calorie cheese. 10g protein per 28g.', tags:['High Protein','Calcium','B12'] },
        { name:'Cottage Cheese (2%)',   highlight:'Casein protein + phosphorus + B12. Cheap and high volume.', tags:['Casein','B12','Budget'] },
      ],
    },
  ],

  /* ── Health Principles ────────────────────────────────────────── */
  healthPrinciples: {
    nutrition: [
      { title:'Protein First',           body:'Build every meal around a protein source. Aim for 0.8–1g per lb of bodyweight. It fills you up, repairs muscle, and keeps metabolism elevated.' },
      { title:'Whole Foods Over Packaged', body:'If it has more than 5 ingredients or ingredients you cannot pronounce, eat it sparingly. Real food is always more nutrient-dense than processed alternatives.' },
      { title:'Eat the Rainbow',         body:'Different coloured vegetables contain different phytonutrients. Aim for 5+ colours per day — not a rule, a useful target.' },
      { title:'Fibre Is Non-Negotiable', body:'30g fibre per day. It feeds gut bacteria, slows blood sugar spikes, and keeps you full. Eat vegetables, legumes, and whole grains daily.' },
      { title:'Hydration Before Hunger', body:'Drink 500ml of water immediately on waking. Often what feels like hunger is mild dehydration. Target 3–4L daily during a bulk.' },
      { title:'Time Calories Around Training', body:'Most of your carbohydrates should go around your workout window — before for fuel, after for recovery. Keep fats away from your pre-workout meal.' },
      { title:'Track, Even Temporarily', body:'Most people underestimate calories by 20–30%. Track everything for 2–4 weeks to calibrate your intuition. After that, eat by feel.' },
      { title:'Consistency Over Perfection', body:"One bad meal doesn't undo progress. One perfect meal doesn't build it. The pattern over 12 weeks is what matters." },
    ],
    workout: [
      { title:'Progressive Overload Is Everything', body:'Your body adapts to stress. If the weight, reps, or difficulty is not increasing over time, you are not getting stronger. Track every set.' },
      { title:'Technique Before Load',   body:'Bad technique with heavy weight builds injury, not muscle. Master the movement pattern first. Add load only when form is automatic.' },
      { title:'Sleep Is the Workout',    body:'Muscle is not built during training — it is built during sleep. 7–9 hours is not optional. Every night of poor sleep undoes a workout.' },
      { title:'Rest Days Are Training Days', body:'Active recovery — walking, stretching, and light movement — is more productive than full rest. Sedentary rest slows recovery.' },
      { title:'Mind-Muscle Connection',  body:'Studies show that consciously thinking about the muscle you are working increases activation by up to 20%. Slow down, feel each rep.' },
      { title:'Consistency > Intensity', body:'Training 4× per week every week for a year beats training 6× per week for 3 months and burning out. Show up. Even a short session counts.' },
      { title:'Compound Lifts Are the Foundation', body:'Squat, deadlift, bench, overhead press, and row build more muscle and burn more calories than any isolation exercise. Do them first, every session.' },
      { title:'Deload When You Dread the Gym', body:"If you haven't missed a week in 6–8 weeks, take a planned deload week at 60% intensity. It prevents injury and resets motivation." },
    ],
  },

  /* ── Stretching Routine ──────────────────────────────────────── */
  stretchingRoutine: {
    morning: [
      { name:'Cat-Cow', duration:'1 min', instruction:'On all fours. Arch spine up (cat), then dip spine down (cow). Slow and controlled. Wakes up the whole spine.' },
      { name:'Hip Flexor Stretch', duration:'45 sec / side', instruction:'Low lunge position. Push hips forward gently. Feel stretch in front of the rear hip. Hold, do not bounce.' },
      { name:'Thoracic Rotation', duration:'30 sec / side', instruction:'Sit cross-legged. Place hand behind head. Rotate upper body open toward the sky. Pause at end range.' },
      { name:'Shoulder Pass-Through', duration:'1 min', instruction:'Hold a band or towel with wide grip. Pass slowly over head and behind back. Go as far as comfortable, tighten grip over time.' },
      { name:'World\'s Greatest Stretch', duration:'30 sec / side', instruction:'Step forward into a lunge, place same-side hand down. Rotate upper body and reach to sky. Hold. Best single stretch you can do.' },
      { name:'Standing Hamstring', duration:'45 sec / side', instruction:'Stand on one leg, rest other heel on hip-height surface. Hinge at the hips — not the lower back. Feel stretch in the raised leg hamstring.' },
    ],
    postWorkout: [
      { name:'Pigeon Pose', duration:'90 sec / side', instruction:'From a push-up position, bring one knee forward toward same-side wrist. Lower hips. Best stretch for hip external rotation and glutes.' },
      { name:'Lat Stretch', duration:'45 sec / side', instruction:'Hold a pole or rack with one hand. Step back and sit hips down and away. Feel the lat lengthen. Great after pull days.' },
      { name:'Pec Doorway Stretch', duration:'45 sec / side', instruction:'Stand in a doorway. Place forearm on the frame at 90°. Step through gently. Feel the pec and front delt stretch.' },
      { name:'Seated Spinal Twist', duration:'45 sec / side', instruction:'Sit on floor, cross one leg over. Twist toward the raised knee. Use elbow for leverage. Feel mid-spine release.' },
      { name:'Child\'s Pose', duration:'60 sec', instruction:'Kneel and reach arms forward. Relax everything into the floor. Breathe deeply. Decompresses the spine after heavy loading.' },
      { name:'Figure-Four Hip Stretch', duration:'60 sec / side', instruction:'Lie on back. Cross ankle over opposite knee. Pull both legs toward chest. Targets deep glute and piriformis.' },
    ],
  },

  /* ── Preset Program Exercises ───────────────────────────────── */
  presetExercises: {
    'classic-ppl': {
      Push: { focus: 'Chest · Shoulders · Triceps', exercises: [
        { name: 'Barbell Bench Press',            sets: '4', reps: '5-8',   rest: '3-4 min', muscle: 'Chest',      note: 'Arch naturally, bar to lower chest, drive through the floor.',          sub1: 'DB Bench Press',              sub2: 'Machine Chest Press' },
        { name: 'Incline DB Press',               sets: '3', reps: '8-12',  rest: '2-3 min', muscle: 'Upper Chest',note: '30-45° incline. Control the negative on every rep.',                    sub1: 'Incline Barbell Press',       sub2: 'Incline Machine Press' },
        { name: 'Overhead Press',                 sets: '3', reps: '5-8',   rest: '3-4 min', muscle: 'Shoulders',  note: 'Bar just in front of face on the way up, lock out at top.',             sub1: 'DB Shoulder Press',           sub2: 'Machine Shoulder Press' },
        { name: 'Cable Lateral Raise',            sets: '4', reps: '12-15', rest: '1-2 min', muscle: 'Side Delt',  note: 'Lead with the elbow. Slight lean away from the cable.',                 sub1: 'DB Lateral Raise',            sub2: 'Machine Lateral Raise' },
        { name: 'Tricep Pressdown (Rope)',        sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Triceps',    note: 'Pull the rope apart at the bottom. Full extension each rep.',            sub1: 'Tricep Pressdown (Bar)',      sub2: 'Overhead Tricep Extension' },
        { name: 'Overhead Cable Tricep Extension',sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Triceps',    note: 'Elbows stay close to head. Full stretch at the top of each rep.',        sub1: 'EZ-Bar Skull Crusher',        sub2: 'DB Skull Crusher' },
      ]},
      Pull: { focus: 'Back · Biceps · Rear Delts', exercises: [
        { name: 'Barbell Row',                    sets: '4', reps: '5-8',   rest: '3-4 min', muscle: 'Back',       note: 'Hip hinge position. Pull bar to belly button, squeeze shoulder blades.', sub1: 'DB Bent-Over Row',            sub2: 'Smith Machine Row' },
        { name: 'Wide-Grip Pull-Up',              sets: '4', reps: '6-12',  rest: '2-3 min', muscle: 'Lats',       note: 'Full hang at the bottom. Drive elbows to hips.',                        sub1: 'Wide-Grip Lat Pulldown',      sub2: 'Neutral-Grip Pull-Up' },
        { name: 'Seated Cable Row',               sets: '3', reps: '10-12', rest: '2-3 min', muscle: 'Mid Back',   note: 'Sit tall. Squeeze shoulder blades at the end of each rep.',              sub1: 'Chest-Supported Row',         sub2: 'Machine Row' },
        { name: 'Rope Face Pull',                 sets: '3', reps: '15-20', rest: '1-2 min', muscle: 'Rear Delt',  note: 'Pull to forehead, rotate wrists at the end. Great for shoulder health.', sub1: 'Reverse Pec Deck',           sub2: 'DB Rear Delt Fly' },
        { name: 'Barbell Curl',                   sets: '3', reps: '8-12',  rest: '1-2 min', muscle: 'Biceps',     note: 'Full range of motion. Slow 2-second negative.',                         sub1: 'EZ-Bar Curl',                 sub2: 'DB Curl' },
        { name: 'Hammer Curl',                    sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Biceps',     note: 'Neutral grip. Targets brachialis for arm thickness.',                   sub1: 'Cable Hammer Curl',           sub2: 'Cross-Body Hammer Curl' },
      ]},
      Legs: { focus: 'Quads · Hamstrings · Glutes · Calves', exercises: [
        { name: 'Barbell Back Squat',             sets: '4', reps: '5-8',   rest: '3-5 min', muscle: 'Quads',      note: 'Feet shoulder-width, toes out 30°. Depth at or below parallel.',        sub1: 'Hack Squat',                  sub2: 'Leg Press' },
        { name: 'Romanian Deadlift',              sets: '3', reps: '8-10',  rest: '2-3 min', muscle: 'Hamstrings', note: 'Push hips back, feel hamstring stretch. Bar stays close to legs.',       sub1: 'DB RDL',                      sub2: 'Stiff-Leg Deadlift' },
        { name: 'Leg Press',                      sets: '3', reps: '10-15', rest: '2-3 min', muscle: 'Quads',      note: 'Feet shoulder-width, low on platform for quad focus.',                  sub1: 'Hack Squat',                  sub2: 'DB Bulgarian Split Squat' },
        { name: 'Lying Leg Curl',                 sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Hamstrings', note: 'Full stretch at bottom, squeeze hard at the top.',                      sub1: 'Seated Leg Curl',             sub2: 'Nordic Ham Curl' },
        { name: 'Leg Extension',                  sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Quads',      note: 'Pause 1 second at full extension. Mind-muscle with quads.',              sub1: 'Sissy Squat',                 sub2: 'Reverse Nordic' },
        { name: 'Standing Calf Raise',            sets: '4', reps: '12-15', rest: '1-2 min', muscle: 'Calves',     note: '2-second pause at the bottom stretch on every rep.',                    sub1: 'Seated Calf Raise',           sub2: 'Leg Press Calf Press' },
      ]},
    },
    'full-body-3x': {
      'Full Body': { focus: 'Full Body Compound', exercises: [
        { name: 'Goblet Squat',                   sets: '3', reps: '8-12',  rest: '2-3 min', muscle: 'Quads',      note: 'Hold DB at chest. Elbows inside knees at bottom, stay upright.',        sub1: 'Barbell Back Squat',          sub2: 'Leg Press' },
        { name: 'DB Bench Press',                 sets: '3', reps: '8-12',  rest: '2-3 min', muscle: 'Chest',      note: 'Full range of motion. Slight arch, feet flat on floor.',                sub1: 'Barbell Bench Press',         sub2: 'Machine Chest Press' },
        { name: 'DB Bent-Over Row',               sets: '3', reps: '8-12',  rest: '2-3 min', muscle: 'Back',       note: 'Chest on bench for support. Pull elbow to hip. Squeeze at top.',        sub1: 'Cable Seated Row',            sub2: 'Machine Row' },
        { name: 'DB Shoulder Press',              sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Shoulders',  note: 'Elbows at 90° at bottom. Full lockout at top.',                         sub1: 'Overhead Press',              sub2: 'Machine Shoulder Press' },
        { name: 'Romanian Deadlift',              sets: '3', reps: '10-12', rest: '2-3 min', muscle: 'Hamstrings', note: 'Push hips back, keep back flat. Feel the stretch in hamstrings.',        sub1: 'DB RDL',                      sub2: 'Glute Bridge' },
        { name: 'Lat Pulldown',                   sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Lats',       note: 'Lean back slightly, pull bar to upper chest. Full stretch at top.',      sub1: 'Assisted Pull-Up',            sub2: 'Neutral-Grip Lat Pulldown' },
        { name: 'Plank',                          sets: '3', reps: '30-60s',rest: '1 min',   muscle: 'Core',       note: 'Squeeze glutes and abs throughout. Neutral spine.',                     sub1: 'Dead Bug',                    sub2: 'Ab Wheel Rollout' },
      ]},
    },
    'bro-split': {
      'Chest & Tri': { focus: 'Chest · Triceps', exercises: [
        { name: 'Flat Barbell Bench Press',       sets: '4', reps: '6-10',  rest: '3-4 min', muscle: 'Chest',      note: 'Bar to lower chest. Leg drive, full arch, explosive concentric.',        sub1: 'DB Bench Press',              sub2: 'Machine Chest Press' },
        { name: 'Incline DB Press',               sets: '3', reps: '8-12',  rest: '2-3 min', muscle: 'Upper Chest',note: '30-45° incline. Big stretch at the bottom, squeeze at top.',             sub1: 'Incline Barbell Press',       sub2: 'Incline Cable Press' },
        { name: 'Pec Deck / Cable Crossover',     sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Chest',      note: 'Full stretch at the open position. Squeeze hard in the middle.',        sub1: 'DB Fly',                      sub2: 'Low-Cable Crossover' },
        { name: 'Decline DB Press',               sets: '3', reps: '10-12', rest: '2-3 min', muscle: 'Lower Chest',note: 'Slight decline. Control the negative, press up and in.',                sub1: 'Decline Barbell Press',       sub2: 'Dips' },
        { name: 'Close-Grip Bench Press',         sets: '3', reps: '8-10',  rest: '2-3 min', muscle: 'Triceps',    note: 'Shoulder-width grip. Tuck elbows, bar to lower chest.',                 sub1: 'EZ-Bar Skull Crusher',        sub2: 'DB Skull Crusher' },
        { name: 'Tricep Pressdown (Rope)',        sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Triceps',    note: 'Pull rope apart at the bottom. Full extension every rep.',               sub1: 'Tricep Pressdown (Bar)',      sub2: 'Overhead Tricep Extension' },
        { name: 'Overhead Tricep Extension',      sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Triceps',    note: 'Elbows stay close to head. Full stretch at top of each rep.',            sub1: 'DB Skull Crusher',            sub2: 'Cable Overhead Extension' },
      ]},
      'Back & Bi': { focus: 'Back · Biceps · Rear Delts', exercises: [
        { name: 'Barbell Deadlift',               sets: '4', reps: '4-6',   rest: '4-5 min', muscle: 'Full Back',  note: 'Hinge at hips, neutral spine. Push the floor away, lock out at top.',   sub1: 'Trap Bar Deadlift',           sub2: 'Rack Pull' },
        { name: 'Wide-Grip Pull-Up',              sets: '4', reps: '6-12',  rest: '2-3 min', muscle: 'Lats',       note: 'Dead hang at bottom. Pull elbows to hips, chin over bar.',              sub1: 'Lat Pulldown',                sub2: 'Assisted Pull-Up' },
        { name: 'Barbell Bent-Over Row',          sets: '3', reps: '8-10',  rest: '2-3 min', muscle: 'Mid Back',   note: 'Hip hinge, chest up. Pull bar to belly button.',                        sub1: 'DB Bent-Over Row',            sub2: 'Smith Machine Row' },
        { name: 'Seated Cable Row',               sets: '3', reps: '10-12', rest: '2-3 min', muscle: 'Mid Back',   note: 'Sit tall, pull to sternum. Squeeze shoulder blades hard.',               sub1: 'Chest-Supported Row',         sub2: 'Machine Row' },
        { name: 'Rope Face Pull',                 sets: '3', reps: '15-20', rest: '1-2 min', muscle: 'Rear Delt',  note: 'Pull to forehead, rotate wrists at the end.',                           sub1: 'Reverse Pec Deck',            sub2: 'DB Rear Delt Fly' },
        { name: 'EZ-Bar Curl',                    sets: '4', reps: '8-12',  rest: '1-2 min', muscle: 'Biceps',     note: 'Full ROM. Slight forward lean at top for peak squeeze.',                sub1: 'Barbell Curl',                sub2: 'DB Curl' },
        { name: 'Incline DB Curl',                sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Biceps',     note: 'Arms hang behind torso for full stretch. Slow, controlled.',             sub1: 'Bayesian Cable Curl',         sub2: 'Preacher Curl' },
      ]},
      Shoulders: { focus: 'Shoulders · Traps', exercises: [
        { name: 'Barbell Overhead Press',         sets: '4', reps: '5-8',   rest: '3-4 min', muscle: 'Front Delt', note: 'Bar in front, drive straight up. Lock out at top, ribs down.',           sub1: 'Seated DB Shoulder Press',    sub2: 'Machine Shoulder Press' },
        { name: 'DB Shoulder Press',              sets: '3', reps: '10-12', rest: '2-3 min', muscle: 'Shoulders',  note: 'Elbows at 90° at start. Full overhead lockout.',                         sub1: 'Arnold Press',                sub2: 'Machine Shoulder Press' },
        { name: 'DB Lateral Raise',               sets: '4', reps: '12-15', rest: '1-2 min', muscle: 'Side Delt',  note: "Lead with the elbow. Slight bend in elbow. Don't shrug.",               sub1: 'Cable Lateral Raise',         sub2: 'Machine Lateral Raise' },
        { name: 'Reverse Pec Deck',               sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Rear Delt',  note: 'Pause 1-2 seconds at full contraction. Mind-muscle with rear delts.',    sub1: 'Rope Face Pull',              sub2: 'DB Rear Delt Fly' },
        { name: 'DB Front Raise',                 sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Front Delt', note: 'Raise to just above shoulder height. Control the negative.',             sub1: 'Cable Front Raise',           sub2: 'Plate Front Raise' },
        { name: 'DB Shrug',                       sets: '4', reps: '10-12', rest: '1-2 min', muscle: 'Traps',      note: 'Shrug straight up, 1-second pause at top. No rolling.',                 sub1: 'Barbell Shrug',               sub2: 'Machine Shrug' },
      ]},
      Arms: { focus: 'Biceps · Triceps', exercises: [
        { name: 'Barbell Curl',                   sets: '4', reps: '8-12',  rest: '2-3 min', muscle: 'Biceps',     note: 'Full ROM. Slow 2-second negative on every rep.',                         sub1: 'EZ-Bar Curl',                 sub2: 'DB Curl' },
        { name: 'Incline DB Curl',                sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Biceps',     note: 'Arms hang back for full stretch. Supinate at the top.',                  sub1: 'Bayesian Cable Curl',         sub2: 'Preacher Curl' },
        { name: 'Concentration Curl',             sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Biceps',     note: 'Elbow on inner thigh. Full squeeze at the top of each rep.',             sub1: 'Machine Preacher Curl',       sub2: 'Cable Concentration Curl' },
        { name: 'Hammer Curl',                    sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Brachialis', note: 'Neutral grip. Builds arm thickness. Keep elbows stationary.',            sub1: 'Cable Rope Hammer Curl',      sub2: 'Cross-Body Hammer Curl' },
        { name: 'Close-Grip Bench Press',         sets: '4', reps: '8-10',  rest: '2-3 min', muscle: 'Triceps',    note: 'Shoulder-width grip. Tuck elbows, lower to chest.',                      sub1: 'EZ-Bar Skull Crusher',        sub2: 'Dips' },
        { name: 'EZ-Bar Skull Crusher',           sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Triceps',    note: 'Lower bar to forehead, elbows in. Full extension at top.',               sub1: 'DB Skull Crusher',            sub2: 'Overhead Cable Extension' },
        { name: 'Tricep Pressdown (Rope)',        sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Triceps',    note: 'Pull rope apart at the bottom for full lateral head contraction.',       sub1: 'Tricep Pressdown (Bar)',      sub2: 'Overhead Tricep Extension' },
        { name: 'Overhead Tricep Extension',      sets: '2', reps: '12-15', rest: '1-2 min', muscle: 'Triceps',    note: 'Elbows stay close. Stretch the long head fully at the top.',             sub1: 'DB Overhead Extension',       sub2: 'Cable Overhead Extension' },
      ]},
      Legs: { focus: 'Quads · Hamstrings · Glutes · Calves', exercises: [
        { name: 'Barbell Back Squat',             sets: '4', reps: '6-10',  rest: '3-5 min', muscle: 'Quads',      note: 'Below parallel. Knees out, chest up, neutral spine.',                    sub1: 'Hack Squat',                  sub2: 'Leg Press' },
        { name: 'Romanian Deadlift',              sets: '3', reps: '8-10',  rest: '2-3 min', muscle: 'Hamstrings', note: 'Push hips back, bar close to legs. Feel stretch, squeeze glutes up.',    sub1: 'DB RDL',                      sub2: 'Stiff-Leg Deadlift' },
        { name: 'Leg Press',                      sets: '3', reps: '10-15', rest: '2-3 min', muscle: 'Quads',      note: "Low foot placement for quads. Full ROM, don't lock knees at top.",       sub1: 'Hack Squat',                  sub2: 'DB Bulgarian Split Squat' },
        { name: 'Seated Leg Curl',                sets: '3', reps: '10-12', rest: '1-2 min', muscle: 'Hamstrings', note: 'Full stretch at top, squeeze hard at the bottom.',                       sub1: 'Lying Leg Curl',              sub2: 'Nordic Ham Curl' },
        { name: 'Leg Extension',                  sets: '3', reps: '12-15', rest: '1-2 min', muscle: 'Quads',      note: '1-second pause at full extension. Slow 3-second negative.',              sub1: 'Sissy Squat',                 sub2: 'Reverse Nordic' },
        { name: 'Seated Calf Raise',              sets: '4', reps: '12-15', rest: '1-2 min', muscle: 'Calves',     note: '2-second pause at full stretch at the bottom of every rep.',             sub1: 'Standing Calf Raise',         sub2: 'Leg Press Calf Press' },
      ]},
    },
  },

  /* ── Morning Routine (Workout Page) ─────────────────────────── */
  morningRoutine: [
    { icon:'💧', step:'Hydrate',     detail:'500ml water immediately — before coffee, before phone.' },
    { icon:'☀️', step:'Sunlight',    detail:'10–15 min outside. Sets circadian rhythm, boosts cortisol and serotonin in the right order.' },
    { icon:'🧘', step:'5 Min Breathwork', detail:'Box breathing: 4 sec in, hold 4, out 4, hold 4. Repeat ×5. Activates parasympathetic nervous system.' },
    { icon:'💪', step:'Activation Drills', detail:'10 pull-ups + 30 push-ups + 30s L-sit + hip/shoulder/hamstring stretch. Takes 8 minutes. Non-negotiable.' },
    { icon:'🥣', step:'Eat Meal 1', detail:'High protein breakfast within 1 hour of waking. Sets the macro trajectory for the day.' },
    { icon:'📓', step:'Journal',    detail:'5 minutes. Write 3 gratitudes, weekly priority, today\'s top 3. Do not start work until this is done.' },
  ],

  /* ── Food Library (base, read-only) ─────────────────────────── */
  foodLibrary: [
    /* Proteins */
    { id:'fl_chicken_breast',            name:'Chicken Breast',              category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:165, protein:31,  carbs:0,    fats:3.6,  fiber:0,   tags:['high-protein','lean'],                createdAt:null },
    { id:'fl_ground_beef_lean',          name:'Ground Beef (93% Lean)',       category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:152, protein:26,  carbs:0,    fats:5.6,  fiber:0,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_salmon',                    name:'Atlantic Salmon',              category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:208, protein:20,  carbs:0,    fats:13,   fiber:0,   tags:['high-protein','omega-3'],             createdAt:null },
    { id:'fl_eggs',                      name:'Whole Eggs',                   category:'Proteins',      type:'whole', brand:null,        servingSize:50,  servingUnit:'g',  calories:72,  protein:6,   carbs:0.4,  fats:5,    fiber:0,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_egg_whites',                name:'Egg Whites',                   category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:52,  protein:11,  carbs:0.7,  fats:0.2,  fiber:0,   tags:['high-protein','low-fat','low-carb'], createdAt:null },
    { id:'fl_tuna_canned',               name:'Tuna (Canned in Water)',       category:'Proteins',      type:'whole', brand:null,        servingSize:85,  servingUnit:'g',  calories:73,  protein:17,  carbs:0,    fats:0.5,  fiber:0,   tags:['high-protein','lean','low-fat'],      createdAt:null },
    { id:'fl_turkey_breast',             name:'Turkey Breast',                category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:135, protein:30,  carbs:0,    fats:1,    fiber:0,   tags:['high-protein','lean'],                createdAt:null },
    { id:'fl_shrimp',                    name:'Shrimp',                       category:'Proteins',      type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:85,  protein:18,  carbs:0.9,  fats:0.9,  fiber:0,   tags:['high-protein','lean','low-fat'],      createdAt:null },
    { id:'fl_cottage_cheese_dairyland',  name:'Cottage Cheese 2%',            category:'Proteins',      type:'brand', brand:'Dairyland', servingSize:125, servingUnit:'g',  calories:100, protein:14,  carbs:4,    fats:3,    fiber:0,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_greek_yogurt',              name:'Greek Yogurt Plain 0%',        category:'Proteins',      type:'whole', brand:null,        servingSize:175, servingUnit:'g',  calories:100, protein:17,  carbs:6,    fats:0.7,  fiber:0,   tags:['high-protein','low-fat'],             createdAt:null },
    /* Vegetables */
    { id:'fl_broccoli',                  name:'Broccoli',                     category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:34,  protein:2.8, carbs:7,    fats:0.4,  fiber:2.6, tags:['low-calorie','vegan','high-fiber'],   createdAt:null },
    { id:'fl_spinach',                   name:'Spinach',                      category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:23,  protein:2.9, carbs:3.6,  fats:0.4,  fiber:2.2, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_sweet_potato',              name:'Sweet Potato',                 category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:86,  protein:1.6, carbs:20,   fats:0.1,  fiber:3,   tags:['complex-carb','vegan'],               createdAt:null },
    { id:'fl_bell_pepper',               name:'Bell Pepper',                  category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:31,  protein:1,   carbs:7,    fats:0.3,  fiber:2.1, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_cucumber',                  name:'Cucumber',                     category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:15,  protein:0.7, carbs:3.6,  fats:0.1,  fiber:0.5, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_asparagus',                 name:'Asparagus',                    category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:20,  protein:2.2, carbs:3.9,  fats:0.1,  fiber:2.1, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_green_beans',               name:'Green Beans',                  category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:31,  protein:1.8, carbs:7,    fats:0.1,  fiber:3.4, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_onion',                     name:'Onion',                        category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:40,  protein:1.1, carbs:9.3,  fats:0.1,  fiber:1.7, tags:['vegan'],                              createdAt:null },
    { id:'fl_garlic',                    name:'Garlic',                       category:'Vegetables',    type:'whole', brand:null,        servingSize:10,  servingUnit:'g',  calories:15,  protein:0.6, carbs:3.3,  fats:0.1,  fiber:0.2, tags:['vegan'],                              createdAt:null },
    { id:'fl_mushrooms',                 name:'Mushrooms',                    category:'Vegetables',    type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:22,  protein:3.1, carbs:3.3,  fats:0.3,  fiber:1,   tags:['low-calorie','vegan'],                createdAt:null },
    /* Fruits */
    { id:'fl_banana',                    name:'Banana',                       category:'Fruits',        type:'whole', brand:null,        servingSize:120, servingUnit:'g',  calories:107, protein:1.3, carbs:27,   fats:0.4,  fiber:3.1, tags:['vegan'],                              createdAt:null },
    { id:'fl_apple',                     name:'Apple',                        category:'Fruits',        type:'whole', brand:null,        servingSize:182, servingUnit:'g',  calories:95,  protein:0.5, carbs:25,   fats:0.3,  fiber:4.4, tags:['vegan','high-fiber'],                 createdAt:null },
    { id:'fl_blueberries',               name:'Blueberries',                  category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:57,  protein:0.7, carbs:14,   fats:0.3,  fiber:2.4, tags:['vegan','antioxidants'],               createdAt:null },
    { id:'fl_strawberries',              name:'Strawberries',                 category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:32,  protein:0.7, carbs:7.7,  fats:0.3,  fiber:2,   tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_mango',                     name:'Mango',                        category:'Fruits',        type:'whole', brand:null,        servingSize:165, servingUnit:'g',  calories:107, protein:0.8, carbs:28,   fats:0.4,  fiber:3,   tags:['vegan'],                              createdAt:null },
    { id:'fl_orange',                    name:'Orange',                       category:'Fruits',        type:'whole', brand:null,        servingSize:131, servingUnit:'g',  calories:62,  protein:1.2, carbs:15,   fats:0.2,  fiber:3.1, tags:['vegan'],                              createdAt:null },
    { id:'fl_pineapple',                 name:'Pineapple',                    category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:50,  protein:0.5, carbs:13,   fats:0.1,  fiber:1.4, tags:['vegan'],                              createdAt:null },
    { id:'fl_grapes',                    name:'Grapes',                       category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:69,  protein:0.7, carbs:18,   fats:0.2,  fiber:0.9, tags:['vegan'],                              createdAt:null },
    { id:'fl_watermelon',                name:'Watermelon',                   category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:30,  protein:0.6, carbs:7.6,  fats:0.2,  fiber:0.4, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_avocado',                   name:'Avocado',                      category:'Fruits',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:160, protein:2,   carbs:9,    fats:15,   fiber:7,   tags:['vegan','healthy-fats','high-fiber'],  createdAt:null },
    /* Grains & Breads */
    { id:'fl_white_rice',                name:'White Rice (cooked)',          category:'Grains & Breads', type:'whole', brand:null,      servingSize:100, servingUnit:'g',  calories:130, protein:2.7, carbs:28,   fats:0.3,  fiber:0.4, tags:['vegan'],                              createdAt:null },
    { id:'fl_brown_rice',                name:'Brown Rice (cooked)',          category:'Grains & Breads', type:'whole', brand:null,      servingSize:100, servingUnit:'g',  calories:123, protein:2.7, carbs:26,   fats:1,    fiber:1.8, tags:['vegan','complex-carb'],               createdAt:null },
    { id:'fl_oats',                      name:'Rolled Oats (dry)',            category:'Grains & Breads', type:'whole', brand:null,      servingSize:40,  servingUnit:'g',  calories:154, protein:5.4, carbs:27,   fats:2.6,  fiber:4,   tags:['vegan','complex-carb','high-fiber'],  createdAt:null },
    { id:'fl_ezekiel_bread',             name:'Ezekiel Sprouted Bread',       category:'Grains & Breads', type:'brand', brand:'Food for Life', servingSize:34, servingUnit:'g', calories:80, protein:4, carbs:15,  fats:0.5,  fiber:3,   tags:['high-fiber','sprouted'],              createdAt:null },
    { id:'fl_whole_wheat_bread',         name:'Whole Wheat Bread',            category:'Grains & Breads', type:'whole', brand:null,      servingSize:28,  servingUnit:'g',  calories:70,  protein:3,   carbs:13,   fats:1,    fiber:2,   tags:['vegan'],                              createdAt:null },
    { id:'fl_quinoa',                    name:'Quinoa (cooked)',               category:'Grains & Breads', type:'whole', brand:null,      servingSize:100, servingUnit:'g',  calories:120, protein:4.4, carbs:22,   fats:1.9,  fiber:2.8, tags:['vegan','complete-protein'],           createdAt:null },
    { id:'fl_pasta',                     name:'Pasta (cooked)',                category:'Grains & Breads', type:'whole', brand:null,      servingSize:100, servingUnit:'g',  calories:158, protein:5.8, carbs:31,   fats:0.9,  fiber:1.8, tags:['vegan'],                              createdAt:null },
    { id:'fl_tortilla_corn',             name:'Corn Tortilla',                category:'Grains & Breads', type:'whole', brand:null,      servingSize:26,  servingUnit:'g',  calories:57,  protein:1.5, carbs:12,   fats:0.7,  fiber:1.6, tags:['vegan','gluten-free'],                createdAt:null },
    { id:'fl_rice_cakes',                name:'Plain Rice Cakes',             category:'Grains & Breads', type:'whole', brand:null,      servingSize:18,  servingUnit:'g',  calories:70,  protein:1.5, carbs:15,   fats:0.6,  fiber:0.3, tags:['low-fat','vegan'],                    createdAt:null },
    { id:'fl_cream_of_rice',             name:'Cream of Rice (cooked)',       category:'Grains & Breads', type:'whole', brand:null,      servingSize:100, servingUnit:'g',  calories:65,  protein:1.2, carbs:15,   fats:0.1,  fiber:0.1, tags:['vegan','gluten-free'],                createdAt:null },
    /* Dairy */
    { id:'fl_whole_milk',                name:'Whole Milk',                   category:'Dairy',         type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:150, protein:8,   carbs:12,   fats:8,    fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_skim_milk',                 name:'Skim Milk',                    category:'Dairy',         type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:83,  protein:8,   carbs:12,   fats:0.2,  fiber:0,   tags:['low-fat'],                            createdAt:null },
    { id:'fl_cheddar',                   name:'Cheddar Cheese',               category:'Dairy',         type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:113, protein:7,   carbs:0.4,  fats:9.3,  fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_mozzarella',                name:'Mozzarella (part-skim)',        category:'Dairy',         type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:72,  protein:7,   carbs:1,    fats:4.5,  fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_cream_cheese',              name:'Cream Cheese',                 category:'Dairy',         type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:99,  protein:1.7, carbs:1.6,  fats:9.8,  fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_butter',                    name:'Butter',                       category:'Dairy',         type:'whole', brand:null,        servingSize:14,  servingUnit:'g',  calories:100, protein:0.1, carbs:0,    fats:11,   fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_whey_protein',              name:'Whey Protein Concentrate',     category:'Dairy',         type:'whole', brand:null,        servingSize:30,  servingUnit:'g',  calories:120, protein:24,  carbs:3,    fats:2,    fiber:0,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_kefir',                     name:'Kefir Plain',                  category:'Dairy',         type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:150, protein:10,  carbs:12,   fats:8,    fiber:0,   tags:['probiotic'],                          createdAt:null },
    { id:'fl_ricotta',                   name:'Ricotta (part-skim)',          category:'Dairy',         type:'whole', brand:null,        servingSize:62,  servingUnit:'g',  calories:80,  protein:7,   carbs:3,    fats:4.9,  fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_sour_cream',                name:'Sour Cream',                   category:'Dairy',         type:'whole', brand:null,        servingSize:30,  servingUnit:'g',  calories:54,  protein:0.8, carbs:1.3,  fats:5.4,  fiber:0,   tags:[],                                     createdAt:null },
    /* Fats & Oils */
    { id:'fl_olive_oil',                 name:'Olive Oil',                    category:'Fats & Oils',   type:'whole', brand:null,        servingSize:14,  servingUnit:'g',  calories:119, protein:0,   carbs:0,    fats:14,   fiber:0,   tags:['healthy-fats','vegan'],               createdAt:null },
    { id:'fl_coconut_oil',               name:'Coconut Oil',                  category:'Fats & Oils',   type:'whole', brand:null,        servingSize:14,  servingUnit:'g',  calories:117, protein:0,   carbs:0,    fats:14,   fiber:0,   tags:['vegan'],                              createdAt:null },
    { id:'fl_almond_butter',             name:'Almond Butter',                category:'Fats & Oils',   type:'whole', brand:null,        servingSize:32,  servingUnit:'g',  calories:196, protein:7,   carbs:6,    fats:18,   fiber:3,   tags:['healthy-fats','vegan'],               createdAt:null },
    { id:'fl_peanut_butter',             name:'Peanut Butter',                category:'Fats & Oils',   type:'whole', brand:null,        servingSize:32,  servingUnit:'g',  calories:188, protein:8,   carbs:7,    fats:16,   fiber:2,   tags:['vegan'],                              createdAt:null },
    { id:'fl_almonds',                   name:'Almonds',                      category:'Fats & Oils',   type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:164, protein:6,   carbs:6,    fats:14,   fiber:3.5, tags:['healthy-fats','vegan'],               createdAt:null },
    { id:'fl_walnuts',                   name:'Walnuts',                      category:'Fats & Oils',   type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:185, protein:4.3, carbs:3.9,  fats:18.5, fiber:1.9, tags:['healthy-fats','vegan','omega-3'],     createdAt:null },
    { id:'fl_chia_seeds',                name:'Chia Seeds',                   category:'Fats & Oils',   type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:138, protein:4.7, carbs:12,   fats:8.7,  fiber:9.8, tags:['vegan','high-fiber','omega-3'],       createdAt:null },
    { id:'fl_flaxseeds',                 name:'Flaxseeds',                    category:'Fats & Oils',   type:'whole', brand:null,        servingSize:14,  servingUnit:'g',  calories:74,  protein:2.6, carbs:4,    fats:6,    fiber:3.8, tags:['vegan','omega-3'],                    createdAt:null },
    { id:'fl_avocado_oil',               name:'Avocado Oil',                  category:'Fats & Oils',   type:'whole', brand:null,        servingSize:14,  servingUnit:'g',  calories:124, protein:0,   carbs:0,    fats:14,   fiber:0,   tags:['healthy-fats','vegan'],               createdAt:null },
    { id:'fl_sunflower_seeds',           name:'Sunflower Seeds',              category:'Fats & Oils',   type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:164, protein:5.5, carbs:7,    fats:14,   fiber:2.4, tags:['vegan'],                              createdAt:null },
    /* Condiments */
    { id:'fl_hot_sauce',                 name:'Hot Sauce',                    category:'Condiments',    type:'whole', brand:null,        servingSize:5,   servingUnit:'ml', calories:1,   protein:0,   carbs:0.1,  fats:0,    fiber:0,   tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_soy_sauce',                 name:'Soy Sauce (low sodium)',       category:'Condiments',    type:'whole', brand:null,        servingSize:16,  servingUnit:'ml', calories:10,  protein:1,   carbs:1,    fats:0,    fiber:0,   tags:['vegan'],                              createdAt:null },
    { id:'fl_mustard',                   name:'Dijon Mustard',                category:'Condiments',    type:'whole', brand:null,        servingSize:5,   servingUnit:'g',  calories:3,   protein:0.3, carbs:0.4,  fats:0.1,  fiber:0.2, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_ketchup',                   name:'Ketchup',                      category:'Condiments',    type:'whole', brand:null,        servingSize:17,  servingUnit:'g',  calories:20,  protein:0.3, carbs:5,    fats:0,    fiber:0,   tags:['vegan'],                              createdAt:null },
    { id:'fl_salsa',                     name:'Salsa',                        category:'Condiments',    type:'whole', brand:null,        servingSize:30,  servingUnit:'g',  calories:10,  protein:0.4, carbs:2,    fats:0,    fiber:0.5, tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_hummus',                    name:'Hummus',                       category:'Condiments',    type:'whole', brand:null,        servingSize:30,  servingUnit:'g',  calories:70,  protein:2,   carbs:4,    fats:5,    fiber:1,   tags:['vegan'],                              createdAt:null },
    { id:'fl_ranch',                     name:'Ranch Dressing',               category:'Condiments',    type:'whole', brand:null,        servingSize:30,  servingUnit:'ml', calories:130, protein:0.4, carbs:2,    fats:13,   fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_balsamic',                  name:'Balsamic Vinegar',             category:'Condiments',    type:'whole', brand:null,        servingSize:15,  servingUnit:'ml', calories:14,  protein:0.1, carbs:2.7,  fats:0,    fiber:0,   tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_sriracha',                  name:'Sriracha',                     category:'Condiments',    type:'brand', brand:'Huy Fong', servingSize:5,   servingUnit:'g',  calories:5,   protein:0.1, carbs:1,    fats:0,    fiber:0.1, tags:['vegan'],                              createdAt:null },
    { id:'fl_maple_syrup',               name:'Maple Syrup',                  category:'Condiments',    type:'whole', brand:null,        servingSize:20,  servingUnit:'ml', calories:52,  protein:0,   carbs:13,   fats:0,    fiber:0,   tags:['vegan'],                              createdAt:null },
    /* Snacks */
    { id:'fl_quest_bar',                 name:'Quest Protein Bar (Choc Chip)', category:'Snacks',       type:'brand', brand:'Quest',     servingSize:60,  servingUnit:'g',  calories:190, protein:21,  carbs:21,   fats:8,    fiber:14,  tags:['high-protein','high-fiber'],          createdAt:null },
    { id:'fl_rice_cakes_cheddar',        name:'Quaker Cheddar Rice Cakes',    category:'Snacks',        type:'brand', brand:'Quaker',    servingSize:32,  servingUnit:'g',  calories:120, protein:2,   carbs:24,   fats:2,    fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_almonds_snack',             name:'Almonds (raw)',                 category:'Snacks',        type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:164, protein:6,   carbs:6,    fats:14,   fiber:3.5, tags:['healthy-fats','vegan'],               createdAt:null },
    { id:'fl_dark_chocolate',            name:'Dark Chocolate 85%',           category:'Snacks',        type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:170, protein:3,   carbs:9,    fats:12,   fiber:3,   tags:['antioxidants'],                       createdAt:null },
    { id:'fl_popcorn',                   name:'Air-Popped Popcorn',           category:'Snacks',        type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:108, protein:3.6, carbs:22,   fats:1.2,  fiber:4.1, tags:['vegan','high-fiber'],                 createdAt:null },
    { id:'fl_jerky',                     name:'Beef Jerky',                   category:'Snacks',        type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:82,  protein:11,  carbs:4,    fats:1,    fiber:0.4, tags:['high-protein','low-fat'],             createdAt:null },
    { id:'fl_edamame',                   name:'Edamame (shelled)',            category:'Snacks',        type:'whole', brand:null,        servingSize:100, servingUnit:'g',  calories:121, protein:11,  carbs:8.9,  fats:5.2,  fiber:5.2, tags:['vegan','high-protein'],               createdAt:null },
    { id:'fl_string_cheese',             name:'String Cheese',                category:'Snacks',        type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:80,  protein:6,   carbs:1,    fats:6,    fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_protein_chips',             name:'Quest Protein Chips',          category:'Snacks',        type:'brand', brand:'Quest',     servingSize:32,  servingUnit:'g',  calories:120, protein:18,  carbs:5,    fats:4,    fiber:1,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_trail_mix',                 name:'Trail Mix (nuts & dried fruit)', category:'Snacks',      type:'whole', brand:null,        servingSize:28,  servingUnit:'g',  calories:131, protein:3.5, carbs:13,   fats:8,    fiber:1.5, tags:['vegan'],                              createdAt:null },
    /* Beverages */
    { id:'fl_water',                     name:'Water',                        category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:0,   protein:0,   carbs:0,    fats:0,    fiber:0,   tags:['vegan'],                              createdAt:null },
    { id:'fl_black_coffee',              name:'Black Coffee',                 category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:2,   protein:0.3, carbs:0,    fats:0,    fiber:0,   tags:['low-calorie','vegan'],                createdAt:null },
    { id:'fl_green_tea',                 name:'Green Tea',                    category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:2,   protein:0,   carbs:0.5,  fats:0,    fiber:0,   tags:['low-calorie','vegan','antioxidants'], createdAt:null },
    { id:'fl_orange_juice',              name:'Orange Juice',                 category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:112, protein:1.7, carbs:26,   fats:0.5,  fiber:0.5, tags:['vegan'],                              createdAt:null },
    { id:'fl_protein_shake_fairlife',    name:'Core Power Elite Shake',       category:'Beverages',     type:'brand', brand:'Fairlife', servingSize:414, servingUnit:'ml', calories:230, protein:42,  carbs:10,   fats:5,    fiber:0,   tags:['high-protein'],                      createdAt:null },
    { id:'fl_almond_milk',               name:'Unsweetened Almond Milk',      category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:30,  protein:1,   carbs:1,    fats:2.5,  fiber:0.5, tags:['low-calorie','vegan','dairy-free'],   createdAt:null },
    { id:'fl_coconut_water',             name:'Coconut Water',                category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:45,  protein:1.7, carbs:11,   fats:0.5,  fiber:2.6, tags:['vegan'],                              createdAt:null },
    { id:'fl_whole_milk_bev',            name:'Whole Milk',                   category:'Beverages',     type:'whole', brand:null,        servingSize:240, servingUnit:'ml', calories:150, protein:8,   carbs:12,   fats:8,    fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_gatorade',                  name:'Gatorade Thirst Quencher',     category:'Beverages',     type:'brand', brand:'Gatorade', servingSize:360, servingUnit:'ml', calories:80,  protein:0,   carbs:21,   fats:0,    fiber:0,   tags:[],                                     createdAt:null },
    { id:'fl_sparkling_water',           name:'Sparkling Water',              category:'Beverages',     type:'whole', brand:null,        servingSize:355, servingUnit:'ml', calories:0,   protein:0,   carbs:0,    fats:0,    fiber:0,   tags:['low-calorie','vegan'],                createdAt:null }
  ],

};
