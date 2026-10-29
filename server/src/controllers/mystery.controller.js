import Mystery from '../models/Mystery.js';
import { createSchema, progressSchema, accusationSchema } from '../validators/mystery.schema.js';
import { createMystery, publicMystery, authorizeCase, resultPayload } from '../services/mystery.service.js';

const error = (code, message, status) => Object.assign(new Error(message), { code, status });
async function getAuthorized(req) {
  const doc = await authorizeCase(req.params.caseId, req.get('X-Case-Token'));
  if (!doc) throw error('CASE_NOT_FOUND', 'Case not found or access token is invalid.', 404);
  return doc;
}
export async function create(req,res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw error('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Please provide a valid story premise.', 400);
  const {doc,accessToken}=await createMystery(parsed.data);
  res.status(201).json({...publicMystery(doc),accessToken});
}
export async function retrieve(req,res) { const doc=await getAuthorized(req); res.json(publicMystery(doc)); }
export async function evidence(req,res) {
  const doc=await getAuthorized(req); const item=doc.publicCase.evidence.find(e=>e.id===req.params.evidenceId);
  if (!item) throw error('EVIDENCE_NOT_FOUND','Evidence not found.',404);
  const {hiddenAnnotations,...publicItem}=item; res.json(publicItem);
}
export async function progress(req,res) {
  const doc=await getAuthorized(req); const parsed=progressSchema.safeParse(req.body);
  if(!parsed.success) throw error('VALIDATION_ERROR','Please provide valid progress data.',400);
  const evidenceIds=new Set(doc.publicCase.evidence.map(e=>e.id)),suspectIds=new Set(doc.publicCase.suspects.map(s=>s.id));
  if(parsed.data.reviewedEvidenceIds.some(id=>!evidenceIds.has(id))||parsed.data.examinedSuspectIds.some(id=>!suspectIds.has(id))) throw error('VALIDATION_ERROR','Progress includes an ID that does not belong to this case.',400);
  doc.reviewedEvidenceIds=[...new Set([...doc.reviewedEvidenceIds,...parsed.data.reviewedEvidenceIds])]; doc.examinedSuspectIds=[...new Set([...doc.examinedSuspectIds,...parsed.data.examinedSuspectIds])]; await doc.save(); res.json(publicMystery(doc).progress);
}
export async function accuse(req,res) {
  const doc=await getAuthorized(req); const parsed=accusationSchema.safeParse(req.body);
  if(!parsed.success) throw error('VALIDATION_ERROR','Please select a valid suspect.',400);
  if(doc.status!=='playable') throw error('CASE_NOT_READY','This case is not ready to play.',409);
  if(doc.accusation) throw error('ACCUSATION_ALREADY_SUBMITTED','A final accusation has already been submitted.',409);
  if(!doc.publicCase.suspects.some(s=>s.id===parsed.data.suspectId)) throw error('SUSPECT_NOT_FOUND','That suspect does not belong to this case.',404);
  const isCorrect=parsed.data.suspectId===doc.privateSolution.culpritId;
  const accusation={suspectId:parsed.data.suspectId,reasoning:parsed.data.reasoning,isCorrect,score:isCorrect?100:0,submittedAt:new Date()};
  const saved=await Mystery.updateOne({ _id:doc._id, accusation:null }, { $set:{ accusation, updatedAt:new Date() } });
  if (!saved.modifiedCount) throw error('ACCUSATION_ALREADY_SUBMITTED','A final accusation has already been submitted.',409);
  doc.accusation=accusation;
  res.json(resultPayload(doc));
}
export async function result(req,res) { const doc=await getAuthorized(req); if(!doc.accusation) throw error('RESULT_NOT_READY','Submit an accusation before viewing the solution.',409); res.json(resultPayload(doc)); }
