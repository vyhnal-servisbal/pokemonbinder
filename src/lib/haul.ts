// Lines shown once a pack is fully revealed, picked by the best thing in it.
// Each line carries a weight: 1 is the everyday stuff, the low numbers are the
// ones worth waiting for, so the good jokes never wear out.
// Adding more is just another tuple in the right array.

type Line = [text: string, weight?: number];

const shinyShadow: Line[] = [
	['Shiny shadow. Somewhere a statistician just closed their laptop.'],
	['Pink. Actual pink. Go tell a human being.'],
	['Shiny shadow: rare enough that lying about it would have been easier.'],
	['One in six hundred packs, and it happened while you were half watching.'],
	['That is the rarest thing in here and it fell out of a paper bag.'],
	['Shiny shadow. Frame it, insure it, mention it in conversation for years.'],
	['You have peaked. Everything after this is just admin.'],
	['Shiny shadow secured. Retire undefeated.'],
	['A shiny shadow. The pack had no right.'],
	['Congratulations, you are now insufferable.'],
	['Shiny shadow. Professor Oak has fainted.', 0.4],
	['This is the moment. There will not be another one like it.', 0.4],
	['Shiny shadow. Even Ditto could not copy this.', 0.3]
];

const mythical: Line[] = [
	['A mythical. Those are supposed to be a rumour.'],
	['Mythical pulled. The lore is officially broken.'],
	['That one was seen once, by one guy, who nobody believed.'],
	['Mythical secured. Take the rest of the day off.'],
	['Event exclusive. Packet included.'],
	['Jirachi wish come true.', 0.5],
	['Mew-raculous.', 0.5],
	['Celebi-lieve it or not, it is yours.', 0.4],
	['Arceus, that is lucky.', 0.4],
	['Deoxys? More like De-oh-yes.', 0.3],
	['A mythical in a cardboard packet. Somebody call a historian.'],
	['Nobody will believe you. Screenshot it anyway.']
];

const legendary: Line[] = [
	['A legendary. Casually.'],
	['The music changed. You noticed, right?'],
	['Legendary pulled. An entire region is now unguarded.'],
	['That thing has a lake named after it and now it has a sleeve.'],
	['Legendary. Do not let it near the others.'],
	['One legend, lightly used.'],
	['Groudon’t mind if I do.', 0.5],
	['Kyogre-at pull.', 0.5],
	['Rayquaza the roof.', 0.4],
	['Entei-rely unexpected.', 0.5],
	['Suicune-cidence? I think not.', 0.4],
	['Giratina-l boss energy.', 0.4],
	['Reshiram-arkable.', 0.4],
	['Zacian’t believe it.', 0.4],
	['Xerneas and dandy.', 0.3],
	['Yveltal me more.', 0.3],
	['Koraidon’t believe my eyes.', 0.3],
	['Legendary obtained. Very normal evening.'],
	['The kind of pull people bring up unprompted for weeks.']
];

const gmax: Line[] = [
	['Gigantamax. It does not fit in the frame and it knows.'],
	['That is not a Pokémon, that is a postcode.'],
	['Gmax pulled. Evacuate the city, save the binder.'],
	['It grew. It grew a concerning amount.'],
	['Gigantamax. Everything else in the pack looks like a keyring now.'],
	['Comically large. Genuinely rare.'],
	['Big. Not "nice" big. Structural engineer big.'],
	['Gmax secured. Somebody get a wider lens.'],
	['It ate the reel and came back for the sleeve.'],
	['Gigantamax obtained. The card is holding on for dear life.'],
	['That thing casts its own shade. Literally.', 0.5],
	['Dynamax? No. Giganta-yes.', 0.3]
];

const mega: Line[] = [
	['A Mega. Same Pokémon, considerably worse attitude.'],
	['Somebody handed it a stone and immediately regretted it.'],
	['Mega form obtained. Everything is spikier now.'],
	['It evolved past the point of reason.'],
	['Mega pulled. Structural damage likely.'],
	['Twice the size, four times the drama.'],
	['Machamp-ion pull.', 0.5],
	['That one broke the size chart and then the chart’s spirit.'],
	['Mega. It did not need to do that, and yet.'],
	['Absolute unit, officially licensed.'],
	['Onix in a lifetime.', 0.3],
	['Mega form. Anger management declined.'],
	['It went Mega and nobody asked it to.'],
	['Charizard has two of these. Two. Greedy.', 0.4],
	['Mega secured. The sleeve is bulging.']
];

const shiny: Line[] = [
	['A shiny! Quick, before it flees.'],
	['Gold border spotted. Nice.'],
	['One in fifty, and you did nothing to deserve it.'],
	['Shiny secured. Ego adjusted accordingly.'],
	['That sparkle is not a rendering bug.'],
	['Squirtle you look at that.', 0.5],
	['Mewtwo good to be true.', 0.4],
	['It’s Ho-Oh so shiny.', 0.4],
	['Shine bright like a Diamond version.', 0.5],
	['Unbeliev-Abra.', 0.4],
	['Shiny! The colour is wrong and that is the entire point.'],
	['Gold. Well, cardboard. But gold-coloured cardboard.'],
	['Chroma-tastic.'],
	['Shiny pulled. Show it to somebody within the next ten seconds.'],
	['That is a keeper and you know it.'],
	['Sparkle detected. Standards raised.'],
	['A shiny in the wild. Rare footage.'],
	['The odds folded like a cheap deck box.'],
	['Shiny. No notes.'],
	['That one goes straight to the front of the binder.'],
	['I’m Pikachu-sing you of cheating.', 0.4],
	['Shiny obtained. The rest of the pack is furious.'],
	['Weedle be honest, that is a good one.', 0.4],
	['Look at it. Just look at it.'],
	['Shiny in the bag. Session justified.']
];

const shadow: Line[] = [
	['A shadow. It has seen things.'],
	['Purple aura detected. Slightly cursed, very cool.'],
	['That one came back wrong.'],
	['Shadow pulled. Team Rocket would be proud, which is worrying.'],
	['It does not want to talk about it.'],
	['Gastly business.', 0.5],
	['Absol-utely cursed.', 0.4],
	['Haunter your dreams.', 0.4],
	['That’s Grimer than expected.', 0.4],
	['Shadow obtained. Do not make eye contact.'],
	['The purple glow is a bad sign and a good pull.'],
	['It came from the shadow realm and it is staying.'],
	['Shadow. The binder just got a little colder.'],
	['This one has beef with somebody and it might be you.'],
	['Rocket grunts hate this one weird trick.'],
	['Moody, purple, yours.'],
	['Handle with care. Or gloves.'],
	['Shadow secured. Somebody book it a therapist.'],
	['Vibes: ominous. Rarity: decent.'],
	['It glows the wrong colour and that is exactly right.']
];

const xxl: Line[] = [
	['That XXL has its own weather system.'],
	['Not fat. XXL. There is a difference and it is on the card.'],
	['Somebody skipped no meals whatsoever.'],
	['XXL. The measuring tape gave up halfway.'],
	['Snorlax would be jealous, and Snorlax is not easily impressed.', 0.5],
	['That one broke the scale and then sat on it.'],
	['XXL obtained. Impressive mass.'],
	['It barely fits the sleeve. Or the concept of a sleeve.'],
	['Absolute unit, size verified.'],
	['Big lad. Certified.']
];

const xxs: Line[] = [
	['XXS. Blink and you will miss it.'],
	['Not small. Fun sized.'],
	['It fits in a teacup, with room for the tea.'],
	['That one needs a magnifying glass and some encouragement.'],
	['Joltik would feel tall next to that.', 0.5],
	['Smallest of the small. Officially.'],
	['XXS obtained. Adorable. Useless. Adorable.'],
	['Tiny. Genuinely, measurably tiny.'],
	['You could lose that in a pocket. You probably will.'],
	['Pocket monster, emphasis on pocket.', 0.4]
];

const bigNew: Line[] = [
	['Loaded pack. The dex barely kept up.'],
	['That was a haul and a half.'],
	['Several firsts in one go. Greedy.'],
	['The dex is eating well tonight.'],
	['Big pack. No notes.'],
	['New, new, new. Lovely.'],
	['That packet pulled its weight and then some.'],
	['Real progress, for once.'],
	['Professor Oak is taking notes.', 0.5],
	['Gotta catch ’em all, and you just caught a chunk.'],
	['The completionist in you is briefly satisfied.'],
	['Solid across the board.'],
	['A genuinely good packet. Those are rare.'],
	['Everything in there earned its place.'],
	['That is what a good pack looks like.'],
	['Big haul energy.'],
	['The dex grew a spine tonight.'],
	['Four fresh faces. Show off.']
];

const someNew: Line[] = [
	['Nice haul.'],
	['Something new in there.'],
	['The dex grew a little.'],
	['Progress. Slow, but progress.'],
	['One for the collection.'],
	['A new face. Welcome aboard.'],
	['That will do nicely.'],
	['Decent packet.'],
	['Fresh entry logged.'],
	['The dex says thank you.'],
	['Not bad at all.'],
	['A little closer to done.'],
	['New arrival.'],
	['That one was missing until now.'],
	['Worth opening.'],
	['The collection ticks upward.'],
	['Good enough.'],
	['Something to show for it.'],
	['A modest but real win.'],
	['One more off the list.'],
	['That counts.'],
	['A quiet little win.'],
	['It’s super effective. Mildly.', 0.5],
	['The dex approves, quietly.'],
	['Job done.']
];

const noNew: Line[] = [
	['Ditto.', 0.6],
	['Magikarp used Splash. Nothing happened.', 0.5],
	['All duplicates. Rough.'],
	['You already had every single one of those.'],
	['Five for the dust pile.'],
	['Seen them. Seen them. Seen them. Seen them. Seen them.'],
	['A pack of old friends you did not ask to see.'],
	['Nothing new, but at least dust is a currency.'],
	['The dex did not even blink.'],
	['A wild sense of déjà vu appeared.', 0.5],
	['Not a single new face.'],
	['That was a lot of nothing, expensively packaged.'],
	['The dust pile grows. The dex does not.'],
	['Old news, all five of them.'],
	['A pack of reruns.'],
	['Zero for five. Brutal.'],
	['These ones already have a home. This one.'],
	['Recycling bin material.'],
	['Duplicates all round. It happens. Often.'],
	['The law of averages sends its regards.'],
	['Nothing gained but experience, and not much of that.'],
	['Statistically this had to happen. Emotionally, rude.'],
	['You funded the dust economy. Thank you for your service.'],
	['There’s a time and a place for everything, but not now.', 0.5],
	['Same, same, same, same, and also same.'],
	['The pack gods are asleep. Try knocking.'],
	['Wobbuffet? More like Wobbu-nothing.', 0.3],
	['But nothing happened.', 0.4],
	['The wild pack fled.', 0.4],
	['Five duplicates. Impressive, in the worst way.'],
	['Nothing to see here. Literally nothing.'],
	['Try that again, and maybe mean it this time.']
];

// most interesting first; the first bucket that applies wins
const BUCKETS: [key: string, lines: Line[]][] = [
	['shinyShadow', shinyShadow],
	['mythical', mythical],
	['legendary', legendary],
	['gmax', gmax],
	['mega', mega],
	['shiny', shiny],
	['shadow', shadow],
	['xxl', xxl],
	['xxs', xxs],
	['bigNew', bigNew],
	['someNew', someNew],
	['noNew', noNew]
];

export const HAUL_LINE_COUNT = BUCKETS.reduce((n, [, l]) => n + l.length, 0);

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
	newCount: number;
}

// weight 1 is the default; anything lower shows up proportionally less often
function weighted(lines: Line[]): string {
	const total = lines.reduce((n, [, w]) => n + (w ?? 1), 0);
	let r = Math.random() * total;
	for (const [text, w] of lines) {
		r -= w ?? 1;
		if (r <= 0) return text;
	}
	return lines[0][0];
}

export function haulLine(f: HaulFacts): string {
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
		bigNew: f.newCount >= 3,
		someNew: f.newCount > 0,
		noNew: f.newCount === 0
	};
	for (const [key, lines] of BUCKETS) {
		if (hit[key]) return weighted(lines);
	}
	return 'Nice haul.';
}
