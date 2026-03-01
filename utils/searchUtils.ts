import { Character, Campaign } from '../types';

export interface SearchFilters {
  query: string;
  campaignIds: string[];
  systems: string[];
  tags: string[];
  players: string[];
  isNpc?: boolean; // true: NPC only, false: PC only, undefined: All
  includeSecret: boolean;
}

export const filterCharacters = (
  characters: Character[],
  campaigns: Campaign[],
  filters: SearchFilters
): Character[] => {
  const query = filters.query.toLowerCase().trim();
  const campaignMap = new Map(campaigns.map(c => [c.id, c]));

  return characters.filter(char => {
    // 1. Campaign Filter
    if (filters.campaignIds.length > 0 && !filters.campaignIds.includes(char.campaignId)) {
      return false;
    }

    // 2. System Filter
    const campaign = campaignMap.get(char.campaignId);
    if (filters.systems.length > 0 && campaign && !filters.systems.includes(campaign.system)) {
      return false;
    }

    // 3. Player Filter
    if (filters.players.length > 0) {
      // If filtering by player, check if char.playerName is in the list
      // Handle empty playerName as 'Unknown' or skip? Usually strict match.
      if (!char.playerName || !filters.players.includes(char.playerName)) {
        return false;
      }
    }

    // 4. NPC/PC Filter
    if (filters.isNpc !== undefined) {
      if (char.isNpc !== filters.isNpc) return false;
    }

    // 5. Tag Filter (OR logic or AND logic? Usually AND for tags is stricter, OR is easier. Let's use OR for now, or AND if multiple selected?)
    // Let's go with: If tags selected, character must have AT LEAST ONE of the selected tags.
    if (filters.tags.length > 0) {
      const charTags = new Set((char.affiliations || []).map(a => a.name));
      const hasTag = filters.tags.some(t => charTags.has(t));
      if (!hasTag) return false;
    }

    // 6. Text Query
    if (query) {
      const searchableParts = [
        char.name || '',
        char.alias || '',
        char.realName || '',
        char.playerName || '',
        char.summary || '',
        char.description || '',
        char.appearance || '',
        char.dndClass || '',
        char.dndSubclass || '',
        char.cpredRole || '',
        char.customClass || '',
        // Tags
        ...(char.affiliations || []).map(a => a.name),
        // Comments
        ...(char.comments || []).map(c => c.content),
        // Extra Files (Title & Content)
        ...(char.extraFiles || []).map(f => `${f.title} ${f.content || ''}`)
      ];

      if (filters.includeSecret && char.secretProfile) {
        searchableParts.push(
          char.secretProfile.name || '',
          char.secretProfile.alias || '',
          char.secretProfile.realName || '',
          char.secretProfile.summary || '',
          char.secretProfile.description || '',
          char.secretProfile.appearance || '',
          ...(char.secretProfile.affiliations || []).map(a => a.name),
          ...(char.secretProfile.comments || []).map(c => c.content),
          ...(char.secretProfile.extraFiles || []).map(f => `${f.title} ${f.content || ''}`)
        );
      }

      const combinedText = searchableParts.join(' ').toLowerCase();
      if (!combinedText.includes(query)) return false;
    }

    return true;
  });
};
