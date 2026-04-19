import express from 'express';
import { chatWithMenuAssistant } from '../controllers/menuAssistantController.js';

const router = express.Router();

router.post('/chat', chatWithMenuAssistant);

export default router;
