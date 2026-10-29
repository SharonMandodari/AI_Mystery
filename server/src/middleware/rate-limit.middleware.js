import rateLimit from 'express-rate-limit';
const limited=(message)=>(req,res)=>res.status(429).json({error:{code:'RATE_LIMITED',message,requestId:req.requestId}});
export const generationLimiter = rateLimit({ windowMs:15*60*1000, limit:8, standardHeaders:'draft-7', legacyHeaders:false, handler:limited('Too many case requests. Please try again later.') });
export const actionLimiter = rateLimit({ windowMs:15*60*1000, limit:40, standardHeaders:'draft-7', legacyHeaders:false, handler:limited('Too many requests. Please try again later.') });
