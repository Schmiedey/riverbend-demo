// All names, teams, people and places below are invented for this demo.
window.RFC = {
  event: {
    name: "Riverbend Fall Classic",
    host: "Riverbend Sports Group",
    dates: "Nov 7–8, 2026",
    startISO: "20261107",
    endISO: "20261109",
    venue: "Riverbend Park Complex",
    town: "Millbrook",
    fee: 495,
    deadline: "Oct 30, 2026",
    capacity: 16,
    email: "registration@riverbend.example"
  },

  // Set this to show a "built by" credit and contact link in the footer.
  builder: { name: "", url: "" },

  teams: {
    mud: { name: "Millbrook Mudcats", coach: "Dana Reyes", players: 12 },
    com: { name: "Cedar Hollow Comets", coach: "Marcus Bell", players: 11 },
    owl: { name: "Ironwood Owls", coach: "Priya Natarajan", players: 12 },
    lyn: { name: "Lakeshore Lynx", coach: "Tom Okafor", players: 13 },
    pil: { name: "Pine Ridge Pilots", coach: "Jen Whitaker", players: 12 },
    sto: { name: "Stonebridge Storm", coach: "Luis Ortega", players: 11 },
    her: { name: "Harbor Point Herons", coach: "Sam Kowalski", players: 12 },
    fox: { name: "Foxrun Flyers", coach: "Alexis Grant", players: 10 },
    gri: { name: "Granite Falls Grizzlies", coach: "Chris Doyle", players: 13 },
    cru: { name: "Quarry Creek Crushers", coach: "Rob Tanaka", players: 12 },
    mav: { name: "Maple Fork Mavericks", coach: "Kim Alvarez", players: 11 },
    sli: { name: "Silverton Sliders", coach: "Devon Hart", players: 12 },
    bar: { name: "Bluewater Barnstormers", coach: "Erin Walsh", players: 12 },
    out: { name: "Oak Bend Outlaws", coach: "Nate Brooks", players: 14 },
    coy: { name: "Copper Canyon Coyotes", coach: "Maya Lindqvist", players: 11 },
    wil: { name: "Willow Run Wildcats", coach: "Jordan Pike", players: 12 }
  },

  ages: {
    "12U": { pools: { A: ["mud", "com", "owl", "lyn"], B: ["pil", "sto", "her", "fox"] }, fields: [1, 2] },
    "14U": { pools: { C: ["gri", "cru", "mav", "sli"], D: ["bar", "out", "coy", "wil"] }, fields: [3, 4] }
  },

  // Pool scores in round-robin order: t0-t1, t2-t3, t0-t2, t1-t3, t0-t3, t1-t2
  poolScores: {
    A: [[7, 3], [4, 5], [8, 2], [9, 4], [5, 4], [3, 1]],
    B: [[2, 6], [10, 3], [4, 1], [8, 0], [6, 5], [3, 4]],
    C: [[5, 2], [3, 8], [9, 1], [6, 4], [2, 3], [7, 0]],
    D: [[4, 3], [1, 0], [2, 5], [11, 2], [6, 1], [5, 4]]
  },
  poolTimes: ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"],

  // Quarterfinal scores by bracket slot (1v8, 4v5, 3v6, 2v7), higher seed listed first.
  bracket: {
    "12U": {
      qf: [[9, 2], [3, 5], [6, 4], [4, 1]],
      sf: [{ status: "live", note: "Live · Top 4th · Field 1", score: [2, 3] }, { status: "sched", note: "12:30 PM · Field 2" }],
      final: { note: "3:00 PM · Field 1" }
    },
    "14U": {
      qf: [[7, 1], [2, 3], [5, 6], [8, 0]],
      sf: [{ status: "sched", note: "12:30 PM · Field 3" }, { status: "sched", note: "12:30 PM · Field 4" }],
      final: { note: "3:00 PM · Field 3" }
    }
  },

  // Seeded registrations for the operator view. Everyone else is paid.
  unpaidSeed: ["fox", "coy"]
};
