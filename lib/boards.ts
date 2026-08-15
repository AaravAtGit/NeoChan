import { Board } from "./types";

export const boards: Board[] = [
  { slug: "b",    title: "Random",             	description: "The most popular image board on the internet.", accent: "red" },
  { slug: "oc",   title: "Overclock Delhi",    	description: "Overclock delhi's very own image board.", accent: "yellow" },
  { slug: "g",    title: "Technology",          description: "Linux distros, Hardware, AIs, software, and reasons why you shouldn't use Arch.", accent: "pink" },
  { slug: "vg",   title: "Video Games",         description: "Speedruns, emulation, and running doom on a fridge.", accent: "yellow" },
  { slug: "lgbt", title: "LGBT",                description: "For the lesbians, gays, bisexuals, transgenders, and Attack helicopters.", accent: "pink" },
  { slug: "mu",   title: "Music",               description: "Synths, DAWs, and 'your music tastes sucks'.", accent: "pink" },
  { slug: "diy",  title: "DIY",                 description: "Woodworking, metalworking, questionable welding.", accent: "paper" },
  { slug: "meta", title: "Meta",                description: "Site discussion, bug reports, and feature requests. Open for feedback and suggestion threads!", accent: "paper" },
];

export function getBoardBySlug(slug: string): Board | undefined {
  return boards.find((b) => b.slug === slug);
}
