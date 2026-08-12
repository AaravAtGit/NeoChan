import { Board, Thread } from "./types";

export const mockBoards: Board[] = [
  { slug: "oc",   title: "Overclocking",    description: "Battlestations, LN2, BIOS mods. Bring receipts.", accent: "yellow" },
  { slug: "g",    title: "Technology",      description: "Linux distros, routers, and why you shouldn't use Arch.", accent: "pink" },
  { slug: "tech", title: "Engineering",     description: "PCBs, soldering, and the smell of burning flux.", accent: "red" },
  { slug: "diy",  title: "DIY",             description: "Woodworking, metalworking, questionable welding.", accent: "paper" },
  { slug: "vg",   title: "Video Games",     description: "Speedruns, emulation, and 'it runs on a toaster'.", accent: "yellow" },
  { slug: "mu",   title: "Music",           description: "Synths, DAWs, and 'your music tastes bad'.", accent: "pink" },
  { slug: "qst",  title: "Quests",          description: "Choose-your-own-adventure threads. Bring dice.", accent: "red" },
  { slug: "meta", title: "Meta",            description: "Site discussion, bug reports, and feature requests.", accent: "paper" },
];

const seedImage = (seed: string, name: string, size: string) => ({
  url: `https://picsum.photos/seed/${seed}/680/680`,
  name, size,
});

export const mockThreads: Thread[] = [
  {
    no: 102436, board: "oc", subject: "Offline finals hackathon — 12+12 Delhi thread",
    bumpedAt: Date.now() - 3600_000,
    op: {
      no: 102436, name: "Anonymous", date: "08/12/26(Wed)14:02:11", op: true,
      subject: "Offline finals hackathon",
      comment: "Shortlisted teams get RSVPs on the 15th. Post your prelim deliverables before then or get out.\n>12 hour online round already brutal\n>12 more hours offline in Delhi waiting for us\nBring your own LN2. Mentors will roam the floor. Final pitches at dawn.",
      image: seedImage("delhi-rig", "delhi_finals_rig.png", "2.1 MB"),
    },
    replies: [
      { no: 102441, name: "Anonymous", date: "08/12/26(Wed)14:10:47",
        comment: ">>102436\n>be me\n>submit at 11:59 PM IST\n>leaderboard freezes\nkek. worth it." },
      { no: 102447, name: "Anonymous", date: "08/12/26(Wed)14:16:02",
        comment: ">>102441\nbased submission poster. redis better not die at the finals or we riot." },
      { no: 102452, name: "Anonymous", date: "08/12/26(Wed)14:31:26",
        comment: ">tfw my team still hasn't picked a theme\nit's neobrutalism or nothing, anon." },
      { no: 102460, name: "Anonymous", date: "08/12/26(Wed)15:04:18",
        comment: ">>102436\nanyone know what the mentors are bringing? i heard someone's got a liquid nitrogen dewar." },
    ],
  },
  {
    no: 102388, board: "oc", subject: "Show your battlestations — cable management mandatory",
    bumpedAt: Date.now() - 9000_000,
    op: {
      no: 102388, name: "Anonymous", date: "08/12/26(Wed)09:44:58", op: true,
      subject: "Battlestations",
      comment: "Post your setups. Messy cables = sage.\n>ambient water only, chillers are for cowards",
      image: seedImage("battlestation", "station_v3.jpg", "840 KB"),
    },
    replies: [
      { no: 102394, name: "Anonymous", date: "08/12/26(Wed)09:52:19", sage: true,
        comment: "RGB adds 10 FPS, proven. don't @ me." },
      { no: 102402, name: "Anonymous", date: "08/12/26(Wed)10:03:40",
        comment: ">>102394\n>RGB adds FPS\n>proven\nsource: trust me bro?" },
    ],
  },
  {
    no: 102210, board: "g", subject: "/dpt/ — daily programming thread",
    bumpedAt: Date.now() - 1800_000,
    op: {
      no: 102210, name: "Anonymous", date: "08/12/26(Wed)08:00:00", op: true,
      subject: "/dpt/",
      comment: "What are you working on? Post your WIP. No 'hello world'.",
    },
    replies: [
      { no: 102215, name: "Anonymous", date: "08/12/26(Wed)08:08:22",
        comment: "rewriting my shell in rust because i hate myself" },
      { no: 102221, name: "Anonymous", date: "08/12/26(Wed)08:15:47",
        comment: ">>102215\nwhy not just use fish and move on with your life" },
    ],
  },
  {
    no: 101988, board: "tech", subject: "Soldering station recommendations under $80",
    bumpedAt: Date.now() - 24000_000,
    op: {
      no: 101988, name: "Anonymous", date: "08/11/26(Tue)19:22:08", op: true,
      subject: "Soldering station <$80",
      comment: "Pinecil v2 vs TS101 vs some Chinese no-name? My iron just died and I need to get back to a PCB by Friday.",
      image: seedImage("solder", "solder_station.jpg", "410 KB"),
    },
    replies: [
      { no: 101994, name: "Anonymous", date: "08/11/26(Tue)19:30:15",
        comment: "Pinecil v2. runs on anything from USB-C to XT60. done." },
    ],
  },
  {
    no: 101777, board: "diy", subject: "CNC'd my own enclosure — pics inside",
    bumpedAt: Date.now() - 50000_000,
    op: {
      no: 101777, name: "Anonymous", date: "08/10/26(Mon)11:44:19", op: true,
      subject: "CNC enclosure",
      comment: "Took 14 hours to machine from a single 6061 billet. Worth it.",
      image: seedImage("cnc", "enclosure_done.jpg", "1.2 MB"),
    },
    replies: [],
  },
  {
    no: 101650, board: "vg", subject: "/sl/ — speedrunning general",
    bumpedAt: Date.now() - 12000_000,
    op: {
      no: 101650, name: "Anonymous", date: "08/11/26(Tue)23:11:01", op: true,
      subject: "/sl/",
      comment: "New WR on SM64 16-star? Let's discuss the new strat.",
    },
    replies: [],
  },
];