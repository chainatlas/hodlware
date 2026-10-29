import {drain} from '../server/mail.js';
export default {async scheduled(event,env){await drain(env);}};
