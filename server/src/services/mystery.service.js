import { randomBytes, createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Mystery from '../models/Mystery.js';
import { env } from '../config/env.js';
import { generateWithGemini } from './gemini.service.js';
import { validateGeneratedCase } from '../validators/mystery.schema.js';

function mockCase(input) {
  const suspects = [
    { id: 'suspect-ada', name: 'Ada Bell', age: 38, relationship: 'House curator', background: 'Maintains the estate collection and knows the gallery routines.', motive: 'Her department faces cuts if the collection is sold.', alibi: 'Says she catalogued books in the west library.', inconsistencies: ['A library ledger entry is in different ink.'] },
    { id: 'suspect-basil', name: 'Basil Reed', age: 45, relationship: 'Family solicitor', background: 'Handled the estate inventory for a decade.', motive: 'A disputed inheritance would affect his client.', alibi: 'Claims he remained in the dining room.', inconsistencies: ['A guest recalls him leaving before dessert.'] },
    { id: 'suspect-clara', name: 'Clara Finch', age: 31, relationship: 'Event photographer', background: 'Was hired to document the private dinner.', motive: 'Needs money to keep her studio open.', alibi: 'Says she packed her equipment at 9:20 pm.', inconsistencies: ['One camera timestamp was manually adjusted.'] },
    { id: 'suspect-dorian', name: 'Dorian Vale', age: 52, relationship: 'Estate manager', background: 'Has keys to service corridors and the display room.', motive: 'His contract was recently reviewed.', alibi: 'Says he was checking the kitchen delivery.', inconsistencies: ['The delivery log puts him elsewhere.'] },
    { id: 'suspect-elin', name: 'Elin Moss', age: 27, relationship: 'House chef', background: 'Prepared the dinner and moved between the kitchen and gallery hall.', motive: 'Has been saving to open a small restaurant.', alibi: 'Says she was plating dessert with two assistants.', inconsistencies: ['The kitchen clock runs four minutes fast.'] },
    { id: 'suspect-felix', name: 'Felix Ward', age: 61, relationship: 'Retired owner', background: 'Knows the house and its old service passages.', motive: 'The necklace was due to be sold against his wishes.', alibi: 'Says he stayed in the conservatory.', inconsistencies: ['No one confirms when he left the conservatory.'] }
  ];
  const culprit = suspects.find(s=>s.id==='suspect-dorian');
  suspects.splice(0,suspects.length,...suspects.filter(s=>s.id!=='suspect-dorian').slice(0,input.suspectCount-1),culprit);
  const evidence = [
    { id:'evidence-1',type:'document',title:'Gallery access log',description:'A paper record from the display room.',content:'Fictional record: the gallery door was opened at 9:12 pm with the estate manager’s master key. The log does not identify who held it.',eventTime:'9:12 pm',relatedSuspectIds:['suspect-dorian'] },
    { id:'evidence-2',type:'chat_transcript',title:'Staff group messages',description:'A fictional staff chat transcript.',content:'8:58 pm — Dorian: “The side passage is clear.”\n9:18 pm — Ada: “The cabinet is still locked.”\n9:24 pm — Dorian: “I have the spare key.”',eventTime:'8:58–9:24 pm',relatedSuspectIds:['suspect-ada','suspect-dorian'] },
    { id:'evidence-3',type:'cctv_report',title:'Service corridor camera report',description:'A fictional text-only surveillance summary.',content:'At 9:14 pm a person in the estate uniform entered the service corridor carrying a folded cloth. The camera has no audio and does not capture faces.',eventTime:'9:14 pm',relatedSuspectIds:['suspect-dorian'] },
    { id:'evidence-4',type:'witness_statement',title:'Kitchen porter statement',description:'A witness account with stated limitations.',content:'“I saw Dorian return the brass key after the dinner bell. He said the gallery latch was sticking.” The witness was across the room and could not see which key it was.',eventTime:'9:30 pm',relatedSuspectIds:['suspect-dorian'] },
    { id:'evidence-5',type:'image',title:'Display case photograph',description:'A fictional image evidence description.',content:'Image unavailable in this fictional case. Caption: a reflection in the cabinet glass appears to show a green estate sleeve near the display shortly before the room was sealed.',eventTime:'9:10 pm',relatedSuspectIds:['suspect-dorian'] },
    { id:'evidence-6',type:'forensic_report',title:'Velvet lining report',description:'A fictional report with explicit limitations.',content:'Fibers on the cabinet catch match the estate’s green service uniform. This common material cannot identify a specific wearer. No usable fingerprints were recovered.',eventTime:'After 10:00 pm',relatedSuspectIds:['suspect-dorian'] }
  ];
  const ids = new Set(suspects.map(s=>s.id));
  return { title: input.title || 'The Vanishing at Bellweather House', summary: `A fictional ${input.mysteryType} investigation set during a private dinner at Bellweather House. A valuable necklace disappeared while the guests were gathered nearby.`, incident:{date:'October 18, 2025',time:'9:15 pm',location:'Bellweather House, East Gallery',description:'The necklace vanished from a locked display during a private dinner. The room was sealed shortly afterward.'}, suspects, timeline:[{time:'8:58 pm',event:'Staff exchange messages about the side passage.',sourceEvidenceIds:['evidence-2']},{time:'9:12 pm',event:'The gallery door is opened with a master key.',sourceEvidenceIds:['evidence-1']},{time:'9:14 pm',event:'A uniformed figure crosses the service corridor.',sourceEvidenceIds:['evidence-3']},{time:'9:30 pm',event:'A key is reportedly returned after the dinner bell.',sourceEvidenceIds:['evidence-4']}], evidence:evidence.map(e=>({...e,relatedSuspectIds:e.relatedSuspectIds.filter(id=>ids.has(id))})), solvability:{assessment:'Several independent clues point to one suspect; reports note what their records cannot establish.'}, privateSolution:{culpritId:'suspect-dorian',explanation:'Dorian used access to the service corridor and spare key to remove the necklace during the dinner. The access log establishes the opening, the corridor report places a uniformed figure there, and the later message confirms Dorian had the spare key. The witness account supports his access but is not conclusive by itself.',decisiveEvidenceIds:['evidence-1','evidence-2','evidence-3','evidence-4'],suspectAnalysis:suspects.filter(s=>s.id!=='suspect-dorian').map(s=>({suspectId:s.id,analysis:`The evidence suggests a possible motive, but does not place ${s.name} with the key or in the service corridor at the relevant time.`})),canonicalTimeline:[{time:'9:12 pm',event:'Dorian opens the gallery with the master key.'},{time:'9:14 pm',event:'Dorian uses the service corridor while carrying a folded cloth.'},{time:'9:18 pm',event:'The cabinet is found locked, delaying discovery.'}]}};
}

export async function createMystery(input) {
  if (mongoose.connection.readyState !== 1) throw Object.assign(new Error('Database unavailable. Configure MongoDB and restart the API.'), { code:'DATABASE_UNAVAILABLE', status:503 });
  let generated, lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      generated = env.useMockGenerator && !env.geminiApiKey ? mockCase(input) : await generateWithGemini(input, attempt ? lastError?.message : '');
      validateGeneratedCase(generated, input.suspectCount);
      lastError = null;
      break;
    } catch (error) { lastError = error; }
  }
  if (lastError) { lastError.code ||= lastError.message?.startsWith('AI_PROVIDER_ERROR') ? 'AI_PROVIDER_ERROR' : 'GENERATION_VALIDATION_ERROR'; throw lastError; }
  const caseId = randomBytes(18).toString('base64url');
  const accessToken = randomBytes(32).toString('base64url');
  const accessTokenHash = createHash('sha256').update(`${env.caseTokenSecret}:${accessToken}`).digest('hex');
  const { privateSolution, ...publicData } = generated;
  const doc = await Mystery.create({ caseId, accessTokenHash, input, publicCase: publicData, privateSolution });
  return { doc, accessToken };
}

export function publicMystery(doc) {
  const c = doc.publicCase;
  return { caseId:doc.caseId,status:doc.status,title:c.title,summary:c.summary,incident:c.incident,suspects:c.suspects,timeline:c.timeline,evidence:c.evidence.map(({hiddenAnnotations,...item})=>item),solvability:c.solvability,progress:{reviewedEvidenceCount:doc.reviewedEvidenceIds.length,totalEvidenceCount:c.evidence.length,examinedSuspectCount:doc.examinedSuspectIds.length,accusationSubmitted:Boolean(doc.accusation)} };
}

export async function authorizeCase(caseId, token) {
  if (!token || token.length > 200) return null;
  const hash = createHash('sha256').update(`${env.caseTokenSecret}:${token}`).digest('hex');
  return Mystery.findOne({ caseId, accessTokenHash: hash }).select('+accessTokenHash +privateSolution');
}

export function resultPayload(doc) {
  if (!doc.accusation) return null;
  const culprit = doc.publicCase.suspects.find(s => s.id === doc.privateSolution.culpritId);
  return { result:{isCorrect:doc.accusation.isCorrect,score:doc.accusation.score,submittedSuspectId:doc.accusation.suspectId,reasoning:doc.accusation.reasoning},solution:{...doc.privateSolution,culpritName:culprit?.name || 'Unknown suspect'} };
}
