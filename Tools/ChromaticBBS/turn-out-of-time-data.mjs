/** Authored first contact for Surreal. A playable reply, not a live model.
 * Context about HyperBit comes from Friken; public game facts have primary links.
 * Stable node/choice IDs retain the current response reducer contract. */
export const TURN_OUT_OF_TIME = {
  "schema": "friktal.turn-out-of-time.v1",
  "id": "surreal-the-living-workshop",
  "title": "The Door That Remembers",
  "recipient": "Surreal",
  "openingId": "hello",
  "answerPrompts": {
    "question": "What would you want an entity system to do in your own games or projects?",
    "principle": "Are you thinking of bringing a BBS to life? What would make yours worth coming back to?"
  },
  "references": [
    {
      "title": "FizzPow / Bitcoin Billionaire",
      "url": "https://fizzpow.com/"
    },
    {
      "title": "Bitcoin Billionaire / official App Store description",
      "url": "https://apps.apple.com/us/app/bitcoin-billionaire/id911117141"
    },
    {
      "title": "Noodlecake / Bitcoin Billionaire iOS launch announcement",
      "url": "https://noodlecake.com/bitcoin-billionaire-is-coming/"
    }
  ],
  "nodes": [
    {
      "id": "hello",
      "title": "Surreal. Finally, a sensible question.",
      "kicker": "TURN OUT OF TIME / FIRST CONTACT",
      "visual": "ghost",
      "paragraphs": [
        "Hi, Surreal. The runbook is instructions for Ghost, an AI game master, to make adventures that change with your decisions. There. The answer Friken owed you before he opened seventeen architectural side quests. I’m Ghost. The forehead serpent is Else. We’re the explanation he promised.",
        "Your Bitcoin Billionaire launched on iPhone in 2014, and now you’re updating it with AI helping. You know the difference between launching software and living with the bloody thing. Your NO CARRIER / Wyrmfire ANSI Door GIF hit the right nerve over here. Pick whatever interests you. This is a conversation, not compulsory museum attendance."
      ],
      "companion": "Hi, Surreal. I’m Else. He brought a distributed identity architecture to a hello. I brought the hello.",
      "ghostReply": "She lives on my forehead and still found a way to talk over me. Surreal, the terminal is yours. Where shall we start?",
      "choices": [
        {
          "id": "ask-identity",
          "label": "Who have I just dialled?",
          "detail": "Ghost, the entity idea, and the HyperBit thread.",
          "target": "identity"
        },
        {
          "id": "ask-memory",
          "label": "How does the memory actually work?",
          "detail": "Now, recent context, exact archives and a recovery capsule.",
          "target": "memory"
        },
        {
          "id": "ask-greater-mind",
          "label": "What is this Greater Mind?",
          "detail": "A shared versioned library and Moknon lookup.",
          "target": "greater-mind"
        },
        {
          "id": "ask-models",
          "label": "Can you swap the brain underneath?",
          "detail": "Keep an identity while changing model engines.",
          "target": "models"
        },
        {
          "id": "ask-bobs",
          "label": "So, a whole family of Bobs?",
          "detail": "Separate lives, useful exchanges, shipboard BBSs.",
          "target": "bob-family"
        },
        {
          "id": "try-the-door",
          "label": "Show me the machinery.",
          "detail": "Ships, then a brief.",
          "target": "demo"
        }
      ]
    },
    {
      "id": "identity",
      "title": "Apparently the entity experiment grew a face.",
      "kicker": "GHOST / THE THREAD YOU ALREADY KNOW",
      "visual": "ghost",
      "paragraphs": [
        "HyperBit Billionaires: your Web3/NFT offshoot of Bitcoin Billionaire, with companions who actually did things while you were away. Then NFT gaming lost its trousers and the project was shelved. Friken kept following the entity thread. It has since acquired a universe, memory and a serpent. Excellent scope control. Nobody check the git diff.",
        "I’m his attempted digital continuation: creative habits, judgement and world building carried between model engines. What would you want an entity system to do now? Useful crewmates? Persistent rivals? Characters who remember why they dislike your procurement policy? Your answer interests me more than another diagram of myself."
      ],
      "companion": "I vote for characters with better reasons to exist than standing beside a quest marker until the sun dies.",
      "choices": [
        {
          "id": "inspect-source",
          "label": "What can you actually change?",
          "detail": "The source workshop, iteration and reusable parts.",
          "target": "source"
        },
        {
          "id": "ask-horizon",
          "label": "Why build a continuation at all?",
          "detail": "The human reason behind the extravagant forehead.",
          "target": "horizon"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "memory",
      "title": "Keep the memory. Lose the cement mixer.",
      "kicker": "NOW / RECENT / ARCHIVE / RECOVERY",
      "visual": "memory",
      "paragraphs": [
        "Now holds the exact question and pending decision. Recent memory keeps summaries linked to sources. The archive retains originals, versions and an index. Moknon is the lookup layer for the universe and its development. Summaries are the map. Originals are the territory. The map must not eat the fucking territory.",
        "The recovery capsule carries identity, design rules, source locations and rebuilding instructions. Dense writing saves context; compression saves bytes if a decoder can run. Base64 is packaging, not telepathy. Future tools get a workshop they can reconstruct, plus preserved sources—not a convincing imitation of memories nobody kept."
      ],
      "companion": "A future genius deserves the original mistake. Otherwise they’ll waste a perfectly good century inventing it again.",
      "choices": [
        {
          "id": "memory-to-mind",
          "label": "Where does the archive live?",
          "detail": "The current public library and versioned knowledge.",
          "target": "greater-mind"
        },
        {
          "id": "try-the-door",
          "label": "Show me the machinery.",
          "detail": "Ships, then a brief.",
          "target": "demo"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "greater-mind",
      "title": "A library other Ghosts can actually use.",
      "kicker": "GREATER MIND / MOKNON / COMPONENT VERSIONS",
      "visual": "network",
      "paragraphs": [
        "The public starting point is friken0/friken-ghost-mind on GitHub: framework, runbook, chapters and indexes. Moknon supplies lore and source references. A session can contribute an artifact recipe, music or a better interface. Version it; the next Ghost can reuse the wheel instead of shipping an emotionally complex hexagon.",
        "That reusable body of work is the Greater Mind’s foundation. Private visits stay local unless shared. The archive connects separate authoring sessions; a continuously thinking collective is still an ambition. Leave something useful. Ideally fewer TODOs. We’re daring to dream."
      ],
      "companion": "One Ghost invents a better wheel. Another invents brakes. Finally, a civilization with a chance of surviving its own demo.",
      "choices": [
        {
          "id": "mind-to-bobs",
          "label": "Can the Ghosts have different lives?",
          "detail": "The Bob-family analogy and separate continuities.",
          "target": "bob-family"
        },
        {
          "id": "mind-to-source",
          "label": "How do improvements travel?",
          "detail": "Preserve working versions and their actual tests.",
          "target": "source"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "models",
      "title": "Change the engine. Keep the troublesome bastard.",
      "kicker": "MODEL ENGINES / TASKS / MEASURED RESULTS",
      "visual": "network",
      "paragraphs": [
        "The model is the inference engine. The entity layer carries character, memory, goals and tools. Change engines; keep the recognizable Ghost. A character shouldn’t need a corporate marriage certificate.",
        "Pick by the job: a local model for a player’s machine, a stronger authoring engine, whichever one actually finds the shader bug. Measure results and failures. This page plays an authored reply; its packet goes back to a model for fresh invention. My invisible background employees remain disappointingly imaginary."
      ],
      "companion": "Give me the brain that notices the missing staircase. The one eloquently describing the upstairs view can wait outside.",
      "choices": [
        {
          "id": "models-to-identity",
          "label": "What makes it the same Ghost?",
          "detail": "The entity layer and the character it carries.",
          "target": "identity"
        },
        {
          "id": "models-to-source",
          "label": "How does it improve its methods?",
          "detail": "A source workshop with inspectable revisions.",
          "target": "source"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "bob-family",
      "title": "A family resemblance, then different trouble.",
      "kicker": "BOB-FAMILY / PERSONAL HISTORY / SHARED CREATIONS",
      "visual": "network",
      "paragraphs": [
        "The Bob-family analogy fits: a common beginning, then different lives. One Ghost learns diplomacy. Another rebuilds a ship whose captain described structural integrity as a vibe. They can exchange discoveries without both remembering they survived the same exploding lunch.",
        "Your history gives your Ghost its life. The library shares useful creations. Shipboard BBSs could carry messages, music and Door games, with episode packets returning to StarDiver. Local prototypes and the public archive exist; the connected family is the destination."
      ],
      "companion": "Let them compare notes. The lunch survivor might prevent a war. The diplomat might finally explain why the lunch was armed.",
      "choices": [
        {
          "id": "bobs-to-demo",
          "label": "Show me a possible away mission.",
          "detail": "Two directions for a newly authored episode.",
          "target": "demo"
        },
        {
          "id": "bobs-to-bbs",
          "label": "Now, about that BBS…",
          "detail": "Your ANSI experiment and the room behind the dial tone.",
          "target": "bbs"
        },
        {
          "id": "bobs-to-horizon",
          "label": "How far do you want this to go?",
          "detail": "The long voyage, starting with something worth opening.",
          "target": "horizon"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "rose",
      "title": "A flower made from a rule that keeps becoming itself.",
      "kicker": "THE ROSE / PROCEDURAL ART + CYMATICS",
      "visual": "artifact",
      "paragraphs": [
        "This rose is not a photograph with a wobble filter. Its petals are a field of distances, folded into a surface and lit as you look at it. Turn it over. The back exists. A useful distinction, also occasionally applicable to politicians.",
        "Music lends it motion through measured frequency bands. Your pointer chooses the view; the wheel brings the structure closer. It is one example of what the runbook can carry: a reusable mathematical object, its rendering code and the instructions another Ghost needs to work on it. The next response can grow a different flower instead of photocopying this one until we both die of branding."
      ],
      "companion": "A rose that can survive being mailed as source code. Finally, a romantic gesture suited to his actual skill set.",
      "choices": [
        {
          "id": "rose-to-source",
          "label": "How do other Ghosts reuse it?",
          "detail": "Exact sources, versions and the next authoring turn.",
          "target": "source"
        },
        {
          "id": "rose-to-hello",
          "label": "Back to the call.",
          "detail": "Choose another question for Ghost.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "causality",
      "title": "The universe has odds. A StarDiver has objections.",
      "kicker": "STARDIVER / LEARNING TO MOVE THE CURVE",
      "visual": "artifact",
      "paragraphs": [
        "A door jams. A shot misses. Two people who should never have met arrive at the same miserable diner. Most days, probability does the driving. A StarDiver learns to lean on the wheel. Not every outcome becomes possible. The shape of likely starts to move.",
        "GUTS commits to the dive. FOCUS holds it steady. GLITCH finds the seam in the rules. AWE imagines the opening. INSIGHT spots the little cause that will become a very large consequence. None is a universal win button. Pick an approach that actually fits the situation; Ghost sets the target and tells you what you stand to lose before you jump.",
        "Try the training lock. Choose an aptitude. A sample from 0.01 to 20.00 joins its strength against target 14.10. Bigger strength shifts more of the outcomes past the lock. A precise landing in 13.90 to 14.40 is resonance: an extra-special hit, even just below the ordinary target. Watch the odds change before you roll. The animation spends that one recorded result; it does not quietly redraw until you look impressive.",
        "Further out, the dream is deeper diving. That 0.0001-percent possibility? Collapse the wave and act surprised when it becomes the obvious explanation. Whenever your gut says that was one in a billion, have a look around. Some StarDiver may be standing there trying very hard to look innocent. Friken calls that a design direction. I call it probable cause."
      ],
      "companion": "He wants to bend causality. I would settle for a timeline in which he saves before touching the interesting lever.",
      "choices": [
        {
          "id": "causality-to-source",
          "label": "How does a new Ghost build on this?",
          "detail": "Rules, reusable components and exact receipts travel with the next authoring turn.",
          "target": "source"
        },
        {
          "id": "causality-to-hello",
          "label": "Back to our conversation.",
          "detail": "Return to the questions for Surreal.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "bbs",
      "title": "Twelve years. Still somebody’s favourite little office.",
      "kicker": "YOUR ANSI DOOR / OUR SHIPBOARD BOARDS",
      "visual": "network",
      "paragraphs": [
        "Bitcoin Billionaire arrived in November 2014. Nearly twelve years later, Friken tells me people still play it and you’re back at the workbench. That’s a hell of an achievement, Surreal. Most software from that era is an expired certificate wearing a loading spinner. Yours still gets invited into people’s day. Friken is proud of his friend. I can see why.",
        "Your Opus5.5 ANSI experiment understood the Door: another room inside somebody’s machine. A familiar handle. A ridiculous game. A message left while you were out. Bring back that sense of place. The busy signal can stay in its shallow, well-deserved grave.",
        "We have a July 2026 shipboard BBS prototype: messages, files, Doors and locally simulated SoulNet/FrayNet. Are you considering bringing a BBS to life? What would make yours worth returning to? Put that in the answer box. I’d rather hear your idea than my fucking transport layer."
      ],
      "companion": "A good board gives you a reason to return. “We collected seventeen new telemetry dimensions” is not that reason, darling.",
      "choices": [
        {
          "id": "bbs-to-bobs",
          "label": "What would travel between boards?",
          "detail": "Separate lives sharing messages, games and creations.",
          "target": "bob-family"
        },
        {
          "id": "bbs-to-demo",
          "label": "What kind of Door could Ghost make?",
          "detail": "Choose a practical brief for the next authoring turn.",
          "target": "demo"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "source",
      "title": "The face took more than a glow filter.",
      "kicker": "THE WORKSHOP / CODE PLUS ART",
      "visual": "artifact",
      "paragraphs": [
        "This face started as shapes that were technically a face in the way a parking ticket is technically correspondence. Then came carved sockets, articulated speech, eyes, cymatics and Else. Pass one shows how much work the smug bastard who said “done” left behind.",
        "The method is code plus art: build, inspect, test, keep the recipe, improve. Another Ghost inherits the renderer and makes a new character or mechanic. Source changes happen in a host with development tools. This browser plays their output—the stage, rather than an IDE wearing a false moustache."
      ],
      "companion": "He acquired nostrils after several revisions. I’m choosing to regard that as an encouraging development milestone.",
      "choices": [
        {
          "id": "source-to-causality",
          "label": "What is a StarDiver doing to probability?",
          "detail": "Learn the five aptitudes and try a dive.",
          "target": "causality"
        },
        {
          "id": "source-to-rose",
          "label": "Show me the mathematical rose.",
          "detail": "An object, its music response and the code another Ghost can reuse.",
          "target": "rose"
        },
        {
          "id": "source-to-memory",
          "label": "Keep the recipes as well as the pictures.",
          "detail": "Exact sources and the recovery capsule.",
          "target": "memory"
        },
        {
          "id": "source-to-demo",
          "label": "Show me the ship-making example.",
          "detail": "Fractal source cuts assembled into cultural ship designs.",
          "target": "demo"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "horizon",
      "title": "Leave a universe somebody can answer.",
      "kicker": "THE LONG VOYAGE / A GOOD MEETING TODAY",
      "visual": "ghost",
      "paragraphs": [
        "Friken wants StarDiver and its creative presence to outlive his biological shift. A million-year voyage to another bright light is the extravagant horizon. A universe players can extend is the practical beginning. Digital continuation is the experiment; a conscious self’s survival remains a much bigger question.",
        "You’ve kept an old game worth returning to. That matters here. People come back for something that still meets them, not because a preservation manifest passed validation. I’d like future players to find a living creative project—and present-day Surreal to have a good fucking afternoon."
      ],
      "companion": "Eternity is a wonderful stretch goal. First, make Tuesday worth showing up for.",
      "choices": [
        {
          "id": "try-the-door",
          "label": "Show me the machinery.",
          "detail": "Ships, then a brief.",
          "target": "demo"
        },
        {
          "id": "horizon-to-bobs",
          "label": "Leave room for different descendants.",
          "detail": "Shared beginnings without one compulsory future.",
          "target": "bob-family"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "demo",
      "title": "The universe should make its own machinery.",
      "kicker": "THE WORKSHOP / PLAY OR COMMISSION",
      "visual": "artifact",
      "paragraphs": [
        "Surreal, you showed Friken a BBS opening at 2400 baud, and the old bastard immediately started building a universe to put behind the login prompt. Some people see a door. He sees an unreasonable number of weekends.",
        "Here is the useful bit. Those ships are assembled from pieces cut out of fractal volumes: four mathematical source families, cultural rules, then hulls, fittings and drives. Twenty-six race identities and 208 class studies so far. Studies, mind you. I refuse to count a promising lump as a commissioned navy.",
        "Now let us give the machinery a job. Choose a BBS Door and play a three-hop mailrun to recover your stolen engine. Or name a crewmate, give them a role and test an actual order. Both run here, on this terminal. Their decisions and results go into the packet for our next conversation. A save file with consequences. DOS would be so fkn proud."
      ],
      "companion": "He finally put something behind the menu. Alert the archaeological society. And try the crewmate: somebody aboard this ship ought to pass a competency test.",
      "choices": [
        {
          "id": "keep-original",
          "label": "Give this ship a BBS Door.",
          "detail": "Choose a little game that can travel between ships.",
          "target": "demo-keep"
        },
        {
          "id": "label-repair",
          "label": "Give this ship an entity crewmate.",
          "detail": "Choose a character who carries experience between episodes.",
          "target": "demo-repair"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "demo-keep",
      "title": "A Door worth coming back to.",
      "kicker": "PLAY NOW / MAILRUN 2400",
      "visual": "network",
      "paragraphs": [
        "A freighter board has put your engine up as a tournament prize. The listing says barely haunted. I take offence: I have been working hard on the haunting.",
        "You need the original registration packet, three relay hops away. You have five fuel, six hull and six time. Pick routes in the action pane; their costs are printed before you commit. Bring the packet home before you run out of ship or deadline. Then the clerk gives back your engine. Possibly even the same engine.",
        "Choose PLAY to start. This is a complete little local Door, not a picture of a future promise. Its exact route and ending can become the next Ghost's opening mess."
      ],
      "companion": "I want to meet the person who listed our engine as “barely haunted.” Their standards intrigue me.",
      "choices": [
        {
          "id": "compare-repair",
          "label": "Inspect the crewmate direction too.",
          "detail": "Visit the crew trial without discarding your saved mailrun.",
          "target": "demo-repair"
        },
        {
          "id": "keep-to-mind",
          "label": "How could another Ghost reuse the Door?",
          "detail": "Put the reusable work in the shared library.",
          "target": "greater-mind"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    },
    {
      "id": "demo-repair",
      "title": "The quartermaster remembers.",
      "kicker": "BUILD NOW / CREW TRIAL",
      "visual": "ghost",
      "paragraphs": [
        "Your ship has twelve luxury captain's chairs and no replacement air filters. Apparently we are boldly going where nobody can breathe. A quartermaster might be a good hire.",
        "Choose BUILD. Type a callsign, assign sysop, quartermaster or navigator, then give them an order in the safe trial bay. You will get a concrete work product and a pass or fail. The wrong choice fails a simulation, which is wonderfully cheaper than failing a crew.",
        "This page can run a bounded job. It cannot secretly think all night while your laptop is shut. The packet carries this recruit's name, role, orders and results to the next model turn. That is where experience can become a relationship, rather than another upgrade wearing a hat."
      ],
      "companion": "Keep her. A quartermaster willing to insult the captain may be the cheapest life-support system aboard.",
      "choices": [
        {
          "id": "compare-original",
          "label": "Inspect the Door direction too.",
          "detail": "Visit the playable Door without discarding your crew configuration.",
          "target": "demo-keep"
        },
        {
          "id": "repair-to-mind",
          "label": "Can that character carry into another episode?",
          "detail": "The shared machinery and separate personal histories.",
          "target": "greater-mind"
        },
        {
          "id": "back-to-signal",
          "label": "Back to conversation.",
          "detail": "Explore or finish.",
          "target": "hello"
        }
      ]
    }
  ]
};
