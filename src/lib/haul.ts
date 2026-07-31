// Lines shown once a pack is fully revealed, picked by the best thing in it.
// All equally likely, but the last handful shown are held back so the same one
// does not come round twice in a row. Adding more is just another string.

const shinyShadow = [
	'Shiny shadow. Professor Oak has fainted.',
	'Shiny shadow! Absol-utely unbelievable.',
	'Pink. Actual pink. Ho-Oh my days.',
	'Onix in a lifetime, and this is it.',
	'Mewtwo good to be true, and yet here we are.',
	'Shiny shadow. Even Ditto could not copy this.',
	'Unbeliev-Abra. Genuinely.',
	'Spheal the deal, that is the rarest thing in the game.',
	'Hoopa, there it is!',
	'A shiny shadow. Kyogre-atest pull of your life.',
	'Shiny shadow. Retire undefeated, you will never top it.',
	'That is a Machamp-ionship pull.',
	'Shiny shadow. Somebody sit down before they fall down.',
	'Groudon’t mind if I do. In fact, do it again.'
];

const mythical = [
	'A mythical. Celebi-lieve your eyes.',
	'Mew-raculous.',
	'Jirachi wish just came true.',
	'Arceus, that is lucky.',
	'Deoxys. Named after DNA, delivered by cardboard.',
	'A mythical. Farfetch’d, but real.',
	'Mythical pulled. Hoopa there it is.',
	'Shay-min business, that is a mythical.',
	'Statistically you should be Diancie-ng right now.',
	'Genesect the bar impossibly high.',
	'A mythical. Nobody will believe you, and fair enough.',
	'Mythical secured. The lore is officially broken.'
];

const legendary = [
	'Groudon’t mind if I do.',
	'Kyogre-at pull.',
	'Entei-rely unexpected.',
	'Reshiram-arkable.',
	'Giratina-l boss energy.',
	'Palkia bags, we are done here.',
	'Koraidon’t believe my eyes.',
	'Articuno-t be more pleased.',
	'Regi-stered in the dex.',
	'Zacian is a dog holding a sword. That is the entire pitch.',
	'A legendary. The music changed and you noticed.',
	'Legendary pulled. An entire region is now unguarded.',
	'That thing has a lake named after it and now it has a sleeve.'
];

const gmax = [
	'It is so big that Snorlax looked up and said alright, calm down.',
	'That thing has more mass than my will to keep opening these.',
	'The card is less a card and more a building permit with a picture on it.',
	'It is so heavy the binder developed a limp.',
	'It does not have a shadow, it has a night shift.',
	'Onix looked at it and felt short.',
	'Snorlax does cardio next to that thing.',
	'It came with scaffolding.',
	'It does not fit on the card, in the sleeve, or in the conversation.',
	'Because "quite large" does not sell merchandise.',
	'Somebody said supersize and it took that as a dare.',
	'It grew so much the sleeve filed for divorce.',
	'Max. Just max. There is no more max left to have.',
	'Not tall. Horizon adjacent.',
	'It ate the card, the sleeve, and most of the table.',
	'It went large, then went again, then went too far.'
];

const mega = [
	'A Mega. Weavile little thing, not any more.',
	'Charizard has two of these. Two. Greedy.',
	'Mega-nificent.',
	'Omega pull.',
	'Full blown mega-lomaniac.',
	'That is a mega-byte out of the pack.',
	'Somebody fetch a mega-phone, this needs announcing.',
	'Mega-lodon energy, and it is not even a shark.',
	'It went to the gym once and made it a personality.',
	'Natty? Absolutely not.',
	'Mega evolution: steroids, but geologically sourced.',
	'Somebody handed it a rock and it took that personally.',
	'It reached its final form and asked to speak to the manager.',
	'It evolved three times and still said "again".',
	'Because evolving twice was not dramatic enough.',
	'Same Pokémon, brand new restraining order.',
	'It read "do not exceed" and exceeded.',
	'Now with two hundred percent more spikes and zero percent more subtlety.',
	'It took the size chart as a personal challenge.',
	'One rock. Zero restraint.',
	'It skipped leg day and went straight to mega day.',
	'Bigger, angrier, and legally distinct.'
];

const shiny = [
	'Squirtle you look at that.',
	'Mewtwo good to be true.',
	'It’s Ho-Oh so shiny.',
	'Unbeliev-Abra.',
	'I’m Pika-chusing you of cheating.',
	'Weedle be honest, that is a good one.',
	'A shiny! Spheal the deal.',
	'Seaking is believing.',
	'Shiny pulled. Arca-nine out of ten.',
	'Scizor the day, that is a shiny.',
	'Eevee-ry time I look away, you pull one of these.',
	'A shiny. Lapras of honour, please.',
	'Jynx it, you owe me a soda.',
	'Shiny secured. Totodile-lighted.',
	'Wooper-de-doo, look at the colour on that.',
	'Osha-what? A shiny?',
	'Shiny! Blazi-keen to see it.',
	'One in fifty, and you did nothing to deserve it.',
	'Gold. Well, cardboard. But gold-coloured cardboard.',
	'That is a Persian of interest.',
	'Shiny pulled. Tentacool, actually.',
	'A shiny. Milo-tic that box.',
	'Bidoof would never. Shiny confirmed.',
	'Not to Bragonite, but that is rare.',
	'A shiny. Clam-perl of wisdom: quit while ahead.',
	'Espurr-fectly gorgeous.'
];

const shadow = [
	'Absol-utely cursed.',
	'Gastly business.',
	'That’s Grimer than expected.',
	'Haunter your dreams.',
	'Houndoom and gloom.',
	'A shadow. Weavile little thing.',
	'Dusk-ull be sorry you opened that.',
	'Spiri-tomb raider.',
	'Toxi-croak, mate.',
	'A shadow. Krooko-dile tears will not help it.',
	'Purple, moody, yours. Sable-eye see you.',
	'Shadow secured. Do not make eye contact.',
	'That one has beef and it might be with you.',
	'Rocket grunts hate this one weird trick.',
	'It glows the wrong colour and that is exactly right.',
	'Shadow. Darkrai-t on cue.',
	'It came back from somewhere and will not say where.',
	'A shadow. Mis-dreavus-ly unsettling.'
];

// ---- size: fat jokes up top, tiny jokes below ----

const xxl = [
	'That thing has its own gravitational pull.',
	'Snorlax looked at it and felt slim.',
	'It does not walk. It arrives.',
	'XXL. Not overweight, just under-tall.',
	'Weighs more than the binder, the desk and your hopes.',
	'It ate the pack it came in.',
	'Big boned. Very big. Very boned.',
	'Wailord saw that and felt threatened.',
	'Snorlax-imum capacity.',
	'That is not a Pokémon, that is a weather event.',
	'Golem-ny, that is heavy.',
	'It blocks the road and the sun.',
	'Steelix a big deal, size wise.',
	'Two Pokémon in a trenchcoat, and both of them are large.',
	'XXL. The scale filed a complaint.',
	'It has a postcode and a moon.',
	'Mamo-swine and dine, mostly dine.',
	'That one skipped no meals. Not one. Ever.',
	'Bouffa-lant sized, and proud of it.'
];

const xl = [
	'Comfortably above average.',
	'A big lad, but a reasonable big lad.',
	'Had seconds, regrets nothing.',
	'Chunky. In a professional way.',
	'That one is built like a Snorlax cousin.',
	'Barely fits, definitely counts.',
	'A hearty specimen.',
	'Went back for pudding.',
	'Well fed, well rounded, well pulled.',
	'That one takes up more than its share of the sleeve.',
	'Sturdy. Dependable. Enormous.',
	'Slightly too much Pokémon for one card.'
];

const xxs = [
	'Joltik would feel tall next to that.',
	'Pumpka-boo! Tiny.',
	'XXS. Blink and you will miss it.',
	'Not small. Fun sized.',
	'It fits in a teacup, with room for the tea.',
	'Cub-choo! Bless you, tiny thing.',
	'Klefki sized. Possibly smaller.',
	'Pocket monster, heavy emphasis on pocket.',
	'Bring a magnifying glass and some patience.',
	'It could hide behind a Caterpie.',
	'Smaller than the text on its own card.',
	'It got lost in the sleeve on the way in.',
	'Diglett is mostly underground and still bigger.',
	'That one is basically a rounding error.',
	'XXS. Microscopically majestic.',
	'You could lose that in a keyring.',
	'It is not small, it is efficiently packaged.',
	'Minuscule. Genuinely, measurably minuscule.'
];

const xs = [
	'XS. Small, but it has opinions.',
	'A little one. Suspiciously little.',
	'XS. Travel sized.',
	'Compact. Fits anywhere. Including places it should not.',
	'Small and clearly aware of it.',
	'XS. Punches above its weight class, which is not hard.',
	'A bit undercooked, size wise.',
	'XS. Short king behaviour.',
	'Little thing. Big attitude, presumably.',
	'That one is more of a snack than a meal.',
	'XS. Somebody skipped a growth spurt.',
	'Small enough to lose, cute enough to keep.'
];

const bigNew = [
	'Loaded pack. Hera-cross a few off the list.',
	'Magi-carp diem, that was a haul.',
	'Several firsts at once. Greedy.',
	'The dex is eating well tonight.',
	'Big pack. Groudon’t mind if I do.',
	'New, new, new. Wooper-de-doo.',
	'Osha-what a haul.',
	'Professor Oak is taking notes.',
	'That packet Pinsir-ed above its weight.',
	'Gotta catch ’em all, and you just caught a chunk.',
	'Real progress. Spheal the deal.',
	'Scizor the day, that pack delivered.',
	'A genuinely good packet. Those are Farfetch’d.',
	'Everything in there earned its sleeve.',
	'Big haul energy. Machamp-ion opening.',
	'Four fresh faces. Smeargle it everywhere.',
	'Timburr, the dex is falling over.',
	'That pack was absolutely stacked.'
];

const someNew = [
	'Nice haul.',
	'Something new. Groudon’t mind at all.',
	'The dex grew a little. Wooper-de-doo.',
	'Progress. Slowpoke, but progress.',
	'One for the collection.',
	'A new face. Sewaddle we do now?',
	'Decent packet. Tentacool, actually.',
	'Not bad at all. Espurr-fectly fine.',
	'A little closer to done.',
	'New arrival. Deer-ling, how nice.',
	'Worth opening. Just about.',
	'The collection ticks upward.',
	'Good enough. Scraggy but lovable.',
	'Something to show for it.',
	'A modest but real win. Pip-lup and at ’em.',
	'One more off the list. Hera-cross it out.',
	'That counts. Barely, but it counts.',
	'A quiet little win. Whimsi-cotton on.',
	'The dex approves, quietly. Furret-ing along.',
	'Job done. Turt-wig out about it.',
	'Fresh meat for the binder.',
	'The dex nods, unimpressed but grateful.'
];

const noNew = [
	'Ditto.',
	'Magikarp used Splash. Nothing happened.',
	'Wobbuffet? More like Wobbu-nothing.',
	'There’s a time and a place for everything, but not now.',
	'All duplicates. Trubbish, honestly.',
	'Seen them. Seen them. Seen them. Seen them. Seen them.',
	'Five for the dust pile. Garbo-dor, aptly named.',
	'A wild sense of déjà vu appeared.',
	'That was a lot of nothing, expensively packaged.',
	'Zero for five. Absol-utely brutal.',
	'Old news, all five of them.',
	'These already have a home. This one.',
	'Duplicates all round. Krooko-dile tears.',
	'The law of averages sends its regards.',
	'You funded the dust economy. Thank you for your service.',
	'Same, same, same, same, and also same.',
	'The pack gods are asleep. Snorlax-ing on the job.',
	'But nothing happened.',
	'The wild pack fled.',
	'Statistically inevitable. Emotionally rude.',
	'Try that again, and mean it this time.',
	'Recycling bin material. Trubbish tier.',
	'Audi-no you did not just pull five dupes.',
	'That pack was plain Vanillite.',
	'A pack of Dunsparce-ly useful cards.',
	'Psy-duck and cover, that was grim.',
	'Five duplicates. Impressive, in the worst way.',
	'Muk. That is the review. That is the whole review.',
	'That pack came out the wrong end of the printer.',
	'Weezing. Somebody definitely was.',
	'Stunky did what Stunky does, and the pack smells of it.',
	'Grimer than a motorway service station.',
	'Swalot in, Muk out.',
	'That one is going straight in the Poopemon bin.',
];

// Wildcards. These ignore what was actually in the pack and can turn up after
// any opening, so the pattern never gets predictable.
const wildcard = [
	'Farfetch’d? More like Fart-fetch’d.',
	'Gastly. Because somebody was.',
	'A wild stench appeared.',
	'Not a shiny. Just brown.',
	'Poop-lup, I choose you.',
	'Smell ya later.',
	'That fart went Gigantamax.',
	'Somebody farted in Kanto and we felt it in Johto.',
	'A wild POOP appeared. It used Stink. It was super effective.',
	'BROWN. IT IS ALL BROWN.',
	'It is not the pack that smells. It is you. It was always you.',
];

// a wildcard can land on top of any result, so nothing is ever fully predictable
const WILDCARD_CHANCE = 0.12;

// Rarest trigger first, not most interesting first. The first bucket that
// applies wins, so ordering by interest let common tags bury rare ones:
// shadow is 1/12 a card but 35% of packs, legendary 30%, someNew 65%.
// The percentages below are the measured chance of a pack containing the tag
// at all; ordering this way spreads the airtime across every bucket instead.
const BUCKETS: [key: string, lines: string[]][] = [
	['shinyShadow', shinyShadow], // 0.8%
	['xxs', xxs], // 6.2%
	['shiny', shiny], // 9.6%
	['mythical', mythical], // 10.7%
	['noNew', noNew], // 11.6%
	['xxl', xxl], // 11.8%
	['gmax', gmax], // 14.1%
	['bigNew', bigNew], // 23.5%
	['mega', mega], // 26.6%
	['legendary', legendary], // 30.1%
	['shadow', shadow], // 35.1%
	['xs', xs], // 45.9%
	['xl', xl], // 56.7%
	['someNew', someNew] // 64.9%
];

export const HAUL_LINE_COUNT =
	BUCKETS.reduce((n, [, l]) => n + l.length, 0) + wildcard.length;

// what has been shown lately, so a pull never repeats itself back to back.
// Sized under the smallest bucket so there is always something left to pick.
const RECENT_MAX = 9;
const recent: string[] = [];

export interface HaulFacts {
	shinyShadow: boolean;
	shiny: boolean;
	shadow: boolean;
	legendary: boolean;
	mythical: boolean;
	mega: boolean;
	gmax: boolean;
	xxl: boolean;
	xxs: boolean;
	xl: boolean;
	xs: boolean;
	newCount: number;
}

function pick(lines: string[]): string {
	const fresh = lines.filter((l) => !recent.includes(l));
	const from = fresh.length ? fresh : lines;
	const line = from[Math.floor(Math.random() * from.length)];
	recent.push(line);
	if (recent.length > RECENT_MAX) recent.shift();
	return line;
}

export function haulLine(f: HaulFacts): string {
	if (Math.random() < WILDCARD_CHANCE) return pick(wildcard);

	const hit: Record<string, boolean> = {
		shinyShadow: f.shinyShadow,
		shiny: f.shiny,
		shadow: f.shadow,
		legendary: f.legendary,
		mythical: f.mythical,
		mega: f.mega,
		gmax: f.gmax,
		xxl: f.xxl,
		xxs: f.xxs,
		xl: f.xl,
		xs: f.xs,
		bigNew: f.newCount >= 3,
		someNew: f.newCount > 0,
		noNew: f.newCount === 0
	};
	for (const [key, lines] of BUCKETS) {
		if (hit[key]) return pick(lines);
	}
	return 'Nice haul.';
}
