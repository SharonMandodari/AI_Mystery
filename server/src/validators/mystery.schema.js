import { z } from 'zod';

export const createSchema = z.object({
  premise: z.string().trim().min(30).max(2000),
  mysteryType: z.enum(['murder', 'theft', 'disappearance', 'sabotage', 'other']).default('theft'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  evidenceIntensity: z.enum(['light', 'balanced', 'detailed']).default('balanced'),
  tone: z.enum(['classic_detective', 'psychological_thriller', 'noir', 'lighthearted']).default('classic_detective'),
  suspectCount: z.number().int().min(3).max(6).default(4),
  title: z.string().trim().max(100).optional()
});
export const progressSchema = z.object({ reviewedEvidenceIds: z.array(z.string()).max(100), examinedSuspectIds: z.array(z.string()).max(10) });
export const accusationSchema = z.object({ suspectId: z.string().min(1), reasoning: z.string().trim().max(2000).optional().default('') });

export function validateGeneratedCase(value, suspectCount) {
  const suspectIds = new Set(value.suspects?.map(x => x.id));
  const evidenceIds = new Set(value.evidence?.map(x => x.id));
  if (!value.title || !value.summary || !value.incident || !Array.isArray(value.suspects) || value.suspects.length !== suspectCount) throw new Error('Generated case has missing fields or an incorrect suspect count.');
  if (suspectIds.size !== value.suspects.length || !suspectIds.has(value.privateSolution?.culpritId)) throw new Error('Suspect identifiers are inconsistent.');
  if (!Array.isArray(value.evidence) || value.evidence.length < 4 || evidenceIds.size !== value.evidence.length) throw new Error('Evidence identifiers are missing or duplicated.');
  if (!Array.isArray(value.timeline) || value.timeline.length < 3 || !value.privateSolution?.explanation) throw new Error('Generated timeline or solution is incomplete.');
  for (const item of value.evidence) if (!item.id || !item.title || !item.content || !Array.isArray(item.relatedSuspectIds) || item.relatedSuspectIds.some(id => !suspectIds.has(id))) throw new Error('Evidence contains an invalid suspect reference.');
  if (value.timeline.some(item => !Array.isArray(item.sourceEvidenceIds) || item.sourceEvidenceIds.some(id => !evidenceIds.has(id)))) throw new Error('Timeline contains an invalid evidence reference.');
  if (!Array.isArray(value.privateSolution.decisiveEvidenceIds) || value.privateSolution.decisiveEvidenceIds.length < 2 || value.privateSolution.decisiveEvidenceIds.some(id => !evidenceIds.has(id))) throw new Error('Solution must cite existing decisive evidence.');
  return value;
}
