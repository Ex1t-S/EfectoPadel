export interface Entrant {
  id: string;
  displayName: string;
}

export function buildGroupsAndBracket(entrants: Entrant[], groupSize = 4) {
  const shuffled = [...entrants].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const groups: Entrant[][] = [];

  for (const entrant of shuffled) {
    const target = groups.sort((a, b) => a.length - b.length)[0];
    if (!target || target.length >= groupSize) groups.push([entrant]);
    else target.push(entrant);
  }

  const groupMatches = groups.flatMap((group, groupIndex) => {
    const matches = [];
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        matches.push({
          stage: "group",
          groupIndex,
          playerAId: group[i]!.id,
          playerBId: group[j]!.id
        });
      }
    }
    return matches;
  });

  const bracketSize = nextPowerOfTwo(Math.min(entrants.length, 16));
  const bracketMatches = Array.from({ length: bracketSize / 2 }, (_, index) => ({
    stage: "knockout",
    round: 1,
    matchIndex: index,
    playerAId: null,
    playerBId: null
  }));

  return { groups, groupMatches, bracketMatches };
}

function nextPowerOfTwo(value: number) {
  if (value <= 2) return 2;
  return 2 ** Math.ceil(Math.log2(value));
}
