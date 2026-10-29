import mongoose from 'mongoose';

const MysterySchema = new mongoose.Schema({
  caseId: { type: String, unique: true, required: true, index: true },
  accessTokenHash: { type: String, required: true, select: false },
  status: { type: String, enum: ['playable', 'failed'], default: 'playable' },
  generationVersion: { type: String, default: '1.0.0' },
  generationAttempts: { type: Number, default: 1 },
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  publicCase: { type: mongoose.Schema.Types.Mixed, required: true },
  privateSolution: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
  reviewedEvidenceIds: { type: [String], default: [] },
  examinedSuspectIds: { type: [String], default: [] },
  accusation: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { minimize: false, versionKey: false });

MysterySchema.pre('save', function updateTimestamp(next) { this.updatedAt = new Date(); next(); });
export default mongoose.model('Mystery', MysterySchema);
