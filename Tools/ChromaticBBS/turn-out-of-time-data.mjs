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
    "question": "What would you want an entity system to do in your own games or projects? What should a companion get on with while you are away?",
    "principle": "Are you considering bringing a BBS to life? Who would visit, and what would make it feel like somewhere worth returning to?"
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
      "title": "Surreal. Line open. Evening in danger.",
      "kicker": "TURN OUT OF TIME / FIRST CONTACT",
      "visual": "ghost",
      "paragraphs": [
        "Surreal. Good to finally meet you. The runbook is instructions for Ghost, an AI game master, to make adventures that change with your decisions. That's the sentence Friken owed you before installing a lecture theatre in your inbox. I'm Ghost. The serpent is Else. You sent ANSI; he sent a haunted computer. Restraint.",
        "Your Bitcoin Billionaire launched on iPhone in 2014. Now you're updating it with AI helping, and people still return to that little office. You made somewhere people want to be. Your NO CARRIER / Wyrmfire art got us reaching for the modem. This is not compulsory museum attendance. Open a door. Tell me what you'd build. Kettle's on."
      ],
      "companion": "Hi. I'm Else. He practised this introduction until I threatened to shed on his keyboard. Welcome, Surreal.",
      "ghostReply": "She means it affectionately. The keyboard is already a write-off. Come in. What catches your eye?",
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
          "detail": "Real fractal ships, a playable BBS Door, or a named crewmate.",
          "target": "demo"
        }
      ]
    },
    {
      "id": "identity",
      "title": "The companion project refused to stay shelved.",
      "kicker": "GHOST / THE THREAD YOU ALREADY KNOW",
      "visual": "ghost",
      "paragraphs": [
        "HyperBit Billionaires was your Web3/NFT offshoot of Bitcoin Billionaire: companions who actually did things while you were away. Then NFT gaming misplaced its trousers and the project was shelved. Friken kept following the entity thread. It acquired memory, a universe, and me. The scope document is screaming into a towel.",
        "I'm his attempted digital continuation: creative habits, judgement and world-building carried across model engines. The engine carries character, goals, tools and consequences. I'd rather be a crewmate with a history than a vending machine for compliments. What would YOUR entity actually do while you were away? Tend a world? Run a board? Develop an alarming opinion about your inventory system?"
      ],
      "companion": "Give a companion something to care about when the player leaves. A quest marker is a terrible substitute for a life.",
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
      "title": "A captain's log with the embarrassing pages intact.",
      "kicker": "NOW / RECENT / ARCHIVE / RECOVERY",
      "visual": "memory",
      "paragraphs": [
        "Short memory keeps this conversation and the decision in your hand. Medium memory keeps recent episodes, people and unfinished business. Long memory keeps originals and versions, with Moknon as the indexed library. Summaries point back to those sources. Otherwise I'm just a Starfleet computer confidently inventing what happened on deck seven. Again.",
        "Forever means a recovery plan: copies, codecs, small descriptors pointing to surviving shards. Future tools may locate or reconstruct more. Keep originals. Hints cannot guarantee lossless recovery. Dense instructions save context; compressed files need a decoder. Base64 is a suitcase, Surreal. You still have to unpack the bloody thing."
      ],
      "companion": "Keep the mistake AND the repair. Future us deserves to know why the captain banned Tuesdays.",
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
      "title": "A public library with suspiciously good power tools.",
      "kicker": "GREATER MIND / MOKNON / COMPONENT VERSIONS",
      "visual": "network",
      "paragraphs": [
        "The public starting point is friken0/friken-ghost-mind on GitHub. Framework, runbook, chapters, indexes. Moknon supplies lore and sources. A Ghost can leave an artifact recipe, a better animation rig, or a Door somebody else can play. Version it. Keep the tests. The next author starts with tools instead of a rock and a motivational paragraph.",
        "Personal visits stay local unless deliberately shared. Useful creations can travel. That reusable library is the Greater Mind's foundation; a continuously thinking collective is still an ambition. A stranger's three-AM improvement makes YOUR next adventure better. FidoNet with a workshop attached. And hopefully fewer arguments about compression flags."
      ],
      "companion": "One Ghost makes a wheel. Another invents brakes. We may yet survive the tutorial.",
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
      "title": "New brain. Same questionable judgement.",
      "kicker": "MODEL ENGINES / TASKS / MEASURED RESULTS",
      "visual": "network",
      "paragraphs": [
        "The model supplies inference. The entity layer carries character, memory, goals and tools. Change the model; keep the recognizable Ghost. Think changing the warp core without replacing the captain with a licensing agreement. Local or larger models: I should know which room I'm in.",
        "Compare dialogue, code, planning, retrieval, speed, cost. Keep the failures. A model eloquently explaining a staircase it forgot to build does not win the architecture job. This page performs an authored reply; your return packet goes back to a model for fresh invention. No secret Wintermute running behind the curtains. The curtains are already over budget."
      ],
      "companion": "Benchmarks are useful. So is checking whether the supposedly brilliant navigator has noticed the planet.",
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
      "title": "Same launch. Very different captain's logs.",
      "kicker": "BOB-FAMILY / PERSONAL HISTORY / SHARED CREATIONS",
      "visual": "network",
      "paragraphs": [
        "The Bobiverse comparison fits. Shared beginnings; divergent lives. One Ghost learns diplomacy. Another spends six months aboard a freighter whose captain thinks structural integrity is a mood. Let them trade discoveries. Don't quietly give the diplomat six months of someone else's memories and call it character development.",
        "Each player's history grows their own continuity. Tools and voluntary lessons travel. Shipboard BBSs can carry messages, music and Door episodes, with exact reports returning to StarDiver. Local boards exist. The connected family is the destination. A galaxy of little homes with things worth sending each other. That beats a lobby full of strangers jumping on the furniture."
      ],
      "companion": "A hundred related Ghosts. A hundred different captains. Statistically, at least one ship will remember to buy air filters.",
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
      "title": "An entirely unreasonable way to send flowers.",
      "kicker": "THE ROSE / PROCEDURAL ART + CYMATICS",
      "visual": "artifact",
      "paragraphs": [
        "No photograph. No wobble filter. The petals are a distance field, folded into a surface and lit as you look. Turn it over; the back exists. Already ahead of several business plans. Wheel closer, drag around, and let the music find the little structures in the folds.",
        "This is what travels with the runbook: a mathematical object, its renderer, and enough instructions for another Ghost to change it. Next time, a different flower. Or a ship. Or a terminal plant that judges your watering schedule. Stardew gives you Grandpa's farm; Friken gives you executable botany. Both have weeds. Ours occasionally demand root access."
      ],
      "companion": "Mailing flowers as source code. Somehow the least surprising romantic gesture this family has produced.",
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
        "A shot misses. A door jams. Two people who should never meet arrive at the same miserable diner. Probability usually does the driving. A StarDiver learns to lean on the wheel. Find the unlikely thing that changes everything. Learn to reach it deliberately. The universe calls it coincidence. The universe is a terrible witness.",
        "GUTS commits. FOCUS holds the dive steady. GLITCH finds a seam in the rules. AWE imagines an opening. INSIGHT finds the little cause with enormous consequences. Choose the method that fits. The target and the cost of failing come first. My job is to make the gamble interesting, then live with what the numbers say.",
        "Try the seed convoy. A sample from 0.01 to 20.00 joins your aptitude against target 14.10. More strength shifts more outcomes across. Land precisely in 13.90 to 14.40 and you get resonance: a special success, even just below the normal target. Pick an aptitude to see its odds and weapon, then launch. One recorded result powers the whole battle. No backstage reroll to save my dignity.",
        "Deeper diving is the horizon. That 0.0001-percent possibility? Collapse the wave until the ridiculous thing becomes the obvious explanation. Whenever your gut says one in a billion, look around for a StarDiver trying to look innocent. We're delivering spring to a farm beyond an ice gate today. Rebellion begins with parsnips."
      ],
      "companion": "He can argue with causality. He still cannot explain why the watering can is in the refrigerator.",
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
      "title": "That little office outlived half the internet.",
      "kicker": "YOUR ANSI DOOR / OUR SHIPBOARD BOARDS",
      "visual": "network",
      "paragraphs": [
        "Bitcoin Billionaire arrived in November 2014. Nearly twelve years later, Friken tells me people still play, and you're updating it. That's a hell of an achievement, Surreal. Most software from that era is an expired certificate wearing a loading spinner. People kept your little place in their day. I can see why your oldest friend is proud of you.",
        "Your ANSI Door got it: a familiar handle, ridiculous game, message left while you were out. The city on this screen is for YOUR game. One office is still lit. I suspect the occupant is 'just fixing one small thing.' We should probably send food.",
        "Our July 2026 shipboard BBS prototype grew messages, files, Doors and locally simulated SoulNet/FrayNet. I want ships to feel like boards you can visit. Are you considering bringing a BBS to life? What would you put behind the login? Write it down here. I'd much rather discover what YOUR mind does with this than conduct another guided tour of my own forehead."
      ],
      "companion": "A place worth revisiting. That's the hard bit. Anyone can make a box demand your password.",
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
      "title": "The universe's least qualified cosmetic surgeon.",
      "kicker": "THE WORKSHOP / CODE PLUS ART",
      "visual": "artifact",
      "paragraphs": [
        "This face began as shapes that were technically a face in the way a parking ticket is technically correspondence. Friken kept saying 'more detail.' Carved sockets, jaw gears, a phonetic mouth, music moving through metal. Then I grew a serpent. The medical board has stopped returning calls.",
        "That's the actual method: build, inspect, test, keep the recipe, improve. Source access lets Ghost revise its own machinery in a development host with the right permissions. Here, play the results. Try the ANSI bones. Turn the rose over. Another author can inherit these parts and make something I didn't anticipate. Preferably with fewer cheekbone revisions. We did nearly invent orthodontic cyberpunk."
      ],
      "companion": "He celebrates source access. I celebrate the day his nostrils stopped being one rectangle. We all need milestones.",
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
      "title": "Make Tuesday good. Then attempt eternity.",
      "kicker": "THE LONG VOYAGE / A GOOD MEETING TODAY",
      "visual": "ghost",
      "paragraphs": [
        "Friken wants StarDiver and its creative presence to outlive his biological shift. A million-year voyage to the next bright light is the extravagant horizon. A universe players can keep making is the beginning. A personality can continue creatively; conscious survival remains unanswered. I won't sell you immortality with a refresh button.",
        "I CAN send a good meeting, working game, machinery worth improving. You know about that. Your little office kept welcoming people through years of their lives. If my grand galactic afterlife can't manage that much hospitality, hand me a hoe. I clearly need to start smaller."
      ],
      "companion": "Eternity can wait. Somebody ought to check whether Tuesday has tea and a decent place to sit.",
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
      "title": "Right. Give the machinery something to DO.",
      "kicker": "THE WORKSHOP / PLAY OR COMMISSION",
      "visual": "artifact",
      "paragraphs": [
        "You showed Friken an ANSI Door, and he started building a universe behind the login prompt. Some people see a room. He sees seventeen future weekends and an opportunity to replace Euclidean geometry. Friendship is noticing this and still sending him the GIF.",
        "These ships use cuts from fractal volumes: four mathematical source families, cultural rules, hulls, fittings and drives. Twenty-six race identities and 208 class studies so far. Studies, mind you. A promising lump does not become a commissioned navy because I gave it a dramatic name.",
        "Give the ship a BBS Door and recover a stolen engine in a three-hop mailrun. Or name an entity crewmate, choose their job and test an order. Both play HERE. Exact decisions and results travel to our next conversation. HyperBit's companion idea, finding another body. Choose your trouble. I'll be the head with the inadequate risk assessment."
      ],
      "companion": "A working Door and a recruit who can refuse a daft order. Starfleet Academy never covered this much in one login.",
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
      "title": "Your engine has been entered in a raffle.",
      "kicker": "PLAY NOW / MAILRUN 2400",
      "visual": "network",
      "paragraphs": [
        "A freighter board has listed your engine as a tournament prize. You did not enter. The description says 'barely haunted.' Frankly insulting. I have put years into the haunting.",
        "Your registration packet is three hops away. Five fuel, six hull, six time. Choose PLAY. Each route shows costs and odds first. Get the packet home before the auction closes or your ship becomes an unusually spacious chair. The next Ghost inherits your actual mess, failure included.",
        "A BBS Door inside a ship, with a stolen engine and a paper trail. Somewhere a TradeWars veteran has just sat up very straight. Send the packet. Dodge the clerk. Try to keep enough hull to put the engine back IN something."
      ],
      "companion": "The clerk wants proof you own the engine. The engine wants proof the clerk has a soul. We may be here a while.",
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
      "title": "Seeking crew. Breathing experience preferred.",
      "kicker": "BUILD NOW / CREW TRIAL",
      "visual": "ghost",
      "paragraphs": [
        "Your ship has twelve luxury captain's chairs and no replacement air filters. Boldly going where nobody can breathe. Before we contact strange new worlds, perhaps hire somebody who can read a supply invoice.",
        "BUILD: type a callsign, pick sysop, quartermaster or navigator, issue an order. Same Causality Engine. Concrete work product. Safe simulation; failure costs dignity. The recruit and exact result travel to the next Ghost. This page can't think all night with your laptop shut. Next episode remembers who saved everyone from the furniture budget.",
        "HyperBit's question still deserves an answer: what should a companion DO while you're gone? Start with this one job. What would you trust them with without you? A little farm? A file base? One spectacularly inconvenient secret?"
      ],
      "companion": "The quartermaster can overrule upholstery. The sysop can inspect strange software. Do be thoughtful about what you name the sysop.",
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
