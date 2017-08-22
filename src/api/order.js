import resource from 'resource-router-middleware';
import { apiStatus } from '../lib/util';
const Ajv = require('ajv'); // json validator

const kue = require('kue');

export default ({ config, db }) => resource({

	/** Property name to store preloaded entity on `request`. */
	id : 'order',

	/** 
	 * POST create an order with JSON payload compliant with models/order.md
	 */
	create(req, res) {

		const ajv = new Ajv();
		const validate = ajv.compile(require('../models/order.schema.json'));

		if (!validate(req.body)) { // schema validation of upcoming order
			apiStatus(res, validate.errors, 403);
			return;
		}				

		let queue = kue.createQueue(config.kue);
		queue.createJob('order', { title: 'Incoming order received on ' + new Date() + ' / ' + req.ip, ip: req.ip, agent: req.headers['user-agent'], receivedAt: new Date(), order: req.body  }/* parsed using bodyParser.json middleware */).save();
		apiStatus(res, "Order acknowledged!", 200);
	},

	
});
