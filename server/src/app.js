import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, allowedOrigins } from './config/env.js';
import mysteryRoutes from './routes/mystery.routes.js';
import { requestId } from './middleware/request-id.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app=express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({origin:allowedOrigins,methods:['GET','POST','PATCH'],allowedHeaders:['Content-Type','X-Case-Token']}));
app.use(express.json({limit:'32kb'}));
app.use(requestId);
app.get('/api/v1/health',(_req,res)=>res.json({status:'ok'}));
app.use('/api/v1/mysteries',mysteryRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
